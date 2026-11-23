import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { cachePublic } from '../middleware/cache.js'

const router = express.Router()

// GET: Fetch all members
router.get('/', cachePublic({ sMaxAge: 3600, maxAge: 120, staleWhileRevalidate: 300 }), async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('members')
      .select(`
        *,
        member_gallery (
          id,
          image_url,
          created_at
        )
      `)
      .order('order_index', { ascending: true })

    if (error) throw error

    // Pastikan entitas fixed 'group' selalu tersedia
    if (!data.some(m => m.member_id === 'group')) {
      const { data: newGroup, error: groupErr } = await supabase
        .from('members')
        .insert({
          member_id: 'group',
          nama_panggung: 'NOIZE',
          tagline: 'Music Project',
          hadir: true,
          order_index: 0,
          jikoshoukai: 'We will collect your soul, we are NOIZE!',
          color: '#9D26FF'
        })
        .select(`
          *,
          member_gallery (
            id,
            image_url,
            created_at
          )
        `)
        .single()
      if (!groupErr && newGroup) {
        data.unshift(newGroup)
      }
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching members:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Fetch single member by member_id
router.get('/:member_id', cachePublic({ sMaxAge: 3600, maxAge: 120, staleWhileRevalidate: 300 }), async (req, res) => {
  try {
    const { member_id } = req.params

    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        member_gallery (
          id,
          image_url,
          created_at
        )
      `)
      .eq('member_id', member_id)
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching member:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create new member (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      member_id,
      nama_panggung,
      tagline,
      hadir,
      image_url,
      shop_image_url,
      jikoshoukai,
      tanggal_lahir,
      hobi,
      instagram,
      color,
      gradient,
      order_index,
      gallery,
      is_secret,
      silhouette_image_url
    } = req.body

    const { data, error } = await supabase
      .from('members')
      .insert({
        member_id,
        nama_panggung,
        tagline,
        hadir: hadir ?? true,
        image_url,
        shop_image_url,
        jikoshoukai,
        tanggal_lahir,
        hobi,
        instagram,
        color: color || '#9D26FF',
        gradient: gradient || null,
        order_index: order_index !== undefined ? parseInt(order_index) : 0,
        is_secret: Boolean(is_secret),
        silhouette_image_url: silhouette_image_url || null
      })
      .select()
      .single()

    if (error) throw error

    // Insert gallery items if provided
    if (gallery && Array.isArray(gallery) && gallery.length > 0) {
      const validGallery = gallery.filter(url => Boolean(url)).map(url => ({
        member_id: data.id,
        image_url: url
      }))
      if (validGallery.length > 0) {
        await supabase.from('member_gallery').insert(validGallery)
      }
    }

    // Return complete member with gallery
    const { data: completeData } = await supabase
      .from('members')
      .select(`
        *,
        member_gallery (
          id,
          image_url,
          created_at
        )
      `)
      .eq('id', data.id)
      .single()

    res.json({ success: true, data: completeData || data })
  } catch (error) {
    console.error('Error creating member:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update member
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { gallery, ...updates } = req.body

    // Avoid updating non-column fields if present
    delete updates.member_gallery
    delete updates.created_at
    delete updates.updated_at

    if (updates.order_index !== undefined) {
      updates.order_index = parseInt(updates.order_index)
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const query = supabase.from('members').update(updates)
    const { data, error } = await (isUuid ? query.eq('id', id) : query.eq('member_id', id))
      .select()
      .single()

    if (error) throw error

    // Sync gallery items if gallery array was provided
    if (gallery !== undefined && Array.isArray(gallery)) {
      // Remove existing gallery
      await supabase.from('member_gallery').delete().eq('member_id', id)

      // Insert new gallery items
      const validGallery = gallery.filter(url => Boolean(url && url.trim())).map(url => ({
        member_id: id,
        image_url: url.trim()
      }))

      if (validGallery.length > 0) {
        await supabase.from('member_gallery').insert(validGallery)
      }
    }

    // Return updated member with gallery
    const { data: updatedMember } = await supabase
      .from('members')
      .select(`
        *,
        member_gallery (
          id,
          image_url,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    res.json({ success: true, data: updatedMember || data })
  } catch (error) {
    console.error('Error updating member:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Delete member
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    // Cegah penghapusan entitas fixed 'group'
    const { data: target } = await supabase.from('members').select('member_id').eq('id', id).single()
    if (target?.member_id === 'group') {
      return res.status(400).json({ error: 'Entitas profil & banner grup bersifat permanen (fixed) dan tidak dapat dihapus.' })
    }

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Member deleted' })
  } catch (error) {
    console.error('Error deleting member:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
