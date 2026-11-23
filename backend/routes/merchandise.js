import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { cachePublic } from '../middleware/cache.js'

const router = express.Router()

// ───────────────────────────────────────────
// MERCHANDISE ITEMS (produk)
// ───────────────────────────────────────────

// GET all merchandise
// Public: only active batch. Admin (or with batch_id / all): filtered accordingly.
router.get('/', cachePublic({ sMaxAge: 300, maxAge: 60, staleWhileRevalidate: 120 }), async (req, res) => {
  try {
    const { available, batch_id, all, admin } = req.query
    let query = supabase
      .from('merchandise')
      .select(`
        *,
        merch_batches (
          id,
          nama,
          slug,
          is_active
        )
      `)
      .order('urutan', { ascending: true })
      .order('created_at', { ascending: false })

    if (available === 'true') {
      query = query.eq('available', true)
    }

    if (batch_id && batch_id !== 'all') {
      // Filter explicit batch
      query = query.eq('batch_id', batch_id)
    } else if (admin === 'true' || all === 'true' || batch_id === 'all') {
      // Admin sees all batches if specified
    } else {
      // Default Public Mode: only active batch
      const { data: activeBatch } = await supabase
        .from('merch_batches')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()

      if (!activeBatch) {
        // No active batch currently open, return empty
        return res.json({ success: true, data: [] })
      }
      query = query.eq('batch_id', activeBatch.id)
    }

    const { data, error } = await query
    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching merchandise:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET single merchandise (public)
router.get('/:id', cachePublic({ sMaxAge: 300, maxAge: 60, staleWhileRevalidate: 120 }), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merchandise')
      .select(`
        *,
        merch_batches (
          id,
          nama,
          slug,
          is_active
        )
      `)
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create merchandise (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nama, deskripsi, harga, stok, gambar_url, available, urutan, sizes, size_chart_urls, batch_id, jumbo_start_size, jumbo_increment_price, images, category, badge } = req.body

    if (!nama || !harga) {
      return res.status(400).json({ error: 'Nama dan harga wajib diisi' })
    }

    // Default to active batch if batch_id is not specified
    let targetBatchId = batch_id || null
    if (!targetBatchId) {
      const { data: activeBatch } = await supabase
        .from('merch_batches')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()
      if (activeBatch) targetBatchId = activeBatch.id
    }

    const { data, error } = await supabase
      .from('merchandise')
      .insert({
        nama,
        deskripsi: deskripsi || null,
        harga: parseInt(harga),
        stok: parseInt(stok) || 0,
        gambar_url: gambar_url || null,
        available: available !== undefined ? available : true,
        urutan: parseInt(urutan) || 0,
        sizes: sizes || null,
        size_chart_urls: size_chart_urls || null,
        batch_id: targetBatchId,
        jumbo_start_size: jumbo_start_size || null,
        jumbo_increment_price: parseInt(jumbo_increment_price) || 0,
        images: Array.isArray(images) && images.length > 0 ? images : (gambar_url ? [gambar_url] : null),
        category: category || (sizes && sizes.length > 0 ? 'apparel' : 'other'),
        badge: badge || null
      })
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating merchandise:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT update merchandise (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nama, deskripsi, harga, stok, gambar_url, available, urutan, sizes, size_chart_urls, batch_id, jumbo_start_size, jumbo_increment_price, images, category, badge } = req.body

    const updateData = {}
    if (nama !== undefined) updateData.nama = nama
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi
    if (harga !== undefined) updateData.harga = parseInt(harga)
    if (stok !== undefined) updateData.stok = parseInt(stok)
    if (gambar_url !== undefined) updateData.gambar_url = gambar_url
    if (available !== undefined) updateData.available = available
    if (urutan !== undefined) updateData.urutan = parseInt(urutan)
    if (sizes !== undefined) updateData.sizes = sizes
    if (size_chart_urls !== undefined) updateData.size_chart_urls = size_chart_urls
    if (batch_id !== undefined) updateData.batch_id = batch_id || null
    if (jumbo_start_size !== undefined) updateData.jumbo_start_size = jumbo_start_size || null
    if (jumbo_increment_price !== undefined) updateData.jumbo_increment_price = parseInt(jumbo_increment_price) || 0
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : null
    if (category !== undefined) updateData.category = category
    if (badge !== undefined) updateData.badge = badge || null

    const { data, error } = await supabase
      .from('merchandise')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating merchandise:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST duplicate merchandise to another batch (admin only)
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const { target_batch_id } = req.body
    if (!target_batch_id) {
      return res.status(400).json({ error: 'Target batch wajib dipilih' })
    }

    const { data: newId, error: rpcError } = await supabase.rpc('duplicate_merch_product', {
      source_id: req.params.id,
      target_batch_id
    })

    if (rpcError) throw rpcError

    const { data: newProduct, error: fetchError } = await supabase
      .from('merchandise')
      .select(`
        *,
        merch_batches (
          id,
          nama,
          slug,
          is_active
        )
      `)
      .eq('id', newId)
      .single()

    if (fetchError) throw fetchError

    res.json({ success: true, data: newProduct, message: 'Produk berhasil diduplikasi ke batch target' })
  } catch (error) {
    console.error('Error duplicating merchandise:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE merchandise (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('merchandise')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true, message: 'Merchandise berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting merchandise:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
