import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { cachePublic } from '../middleware/cache.js'

const router = express.Router()

// GET: Fetch all FAQs (no-cache agar perubahan admin langsung tampil)
router.get('/', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  next()
}, async (req, res) => {
  try {
    const { active_only } = req.query
    let query = supabase
      .from('faqs')
      .select('*')
      .order('urutan', { ascending: true })

    if (active_only === 'true') {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create FAQ (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tanya, jawab, urutan = 0, is_active = true } = req.body

    if (!tanya || !jawab) {
      return res.status(400).json({ error: 'Pertanyaan dan jawaban wajib diisi' })
    }

    const { data, error } = await supabase
      .from('faqs')
      .insert({ 
        tanya: String(tanya).slice(0, 300), 
        jawab: String(jawab).slice(0, 1000), 
        urutan: parseInt(urutan, 10) || 0,
        is_active: Boolean(is_active)
      })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating FAQ:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT: Batch Reorder FAQs (admin only)
router.put('/reorder', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body // array of { id, urutan }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' })
    }

    const promises = items.map(item => 
      supabase
        .from('faqs')
        .update({ urutan: item.urutan })
        .eq('id', item.id)
    )

    await Promise.all(promises)

    res.json({ success: true, message: 'FAQs reordered' })
  } catch (error) {
    console.error('Error reordering FAQs:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update FAQ (admin only)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { tanya, jawab, urutan, is_active } = req.body

    const updates = { updated_at: new Date().toISOString() }
    if (tanya !== undefined) updates.tanya = String(tanya).slice(0, 300)
    if (jawab !== undefined) updates.jawab = String(jawab).slice(0, 1000)
    if (urutan !== undefined) updates.urutan = parseInt(urutan, 10) || 0
    if (is_active !== undefined) updates.is_active = Boolean(is_active)

    const { data, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating FAQ:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Delete FAQ
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'FAQ deleted' })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
