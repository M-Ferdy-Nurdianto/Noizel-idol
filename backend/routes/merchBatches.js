import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// GET all merch batches (Public or Admin, ordered by active first then created_at desc)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merch_batches')
      .select('*')
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching merch batches:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET active merch batch (Public)
router.get('/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merch_batches')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    res.json({ success: true, data: data || null })
  } catch (error) {
    console.error('Error fetching active merch batch:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST create merch batch (Admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nama, slug, open_at, close_at, is_active } = req.body

    if (!nama) {
      return res.status(400).json({ error: 'Nama batch wajib diisi' })
    }

    // Generate slug if empty
    const finalSlug = (slug || nama)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const { data: batch, error } = await supabase
      .from('merch_batches')
      .insert({
        nama,
        slug: finalSlug,
        open_at: open_at || null,
        close_at: close_at || null,
        is_active: false // default false, activate via rpc if requested
      })
      .select()
      .single()

    if (error) throw error

    // If marked active on creation, activate it
    if (is_active && batch?.id) {
      const { error: rpcError } = await supabase.rpc('activate_merch_batch', { target_id: batch.id })
      if (rpcError) throw rpcError
      batch.is_active = true
    }

    res.json({ success: true, data: batch })
  } catch (error) {
    console.error('Error creating merch batch:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT update merch batch (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nama, slug, open_at, close_at } = req.body

    const updateData = {}
    if (nama !== undefined) {
      updateData.nama = nama
      if (slug === undefined) {
        updateData.slug = nama
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      }
    }
    if (slug !== undefined) {
      updateData.slug = (slug || nama || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    }
    if (open_at !== undefined) updateData.open_at = open_at || null
    if (close_at !== undefined) updateData.close_at = close_at || null

    const { data, error } = await supabase
      .from('merch_batches')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating merch batch:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST activate merch batch (Admin only)
router.post('/:id/activate', authMiddleware, async (req, res) => {
  try {
    const batchId = req.params.id
    const { error } = await supabase.rpc('activate_merch_batch', { target_id: batchId })

    if (error) throw error

    const { data: updated, error: fetchError } = await supabase
      .from('merch_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (fetchError) throw fetchError

    res.json({ success: true, data: updated, message: `Batch ${updated.nama} berhasil diaktifkan.` })
  } catch (error) {
    console.error('Error activating merch batch:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST deactivate merch batch (Admin only - Tutup/Hentikan PO)
router.post('/:id/deactivate', authMiddleware, async (req, res) => {
  try {
    const batchId = req.params.id
    const { data: updated, error } = await supabase
      .from('merch_batches')
      .update({ is_active: false })
      .eq('id', batchId)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data: updated, message: `PO untuk batch ${updated.nama} berhasil ditutup.` })
  } catch (error) {
    console.error('Error deactivating merch batch:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE merch batch (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('merch_batches')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true, message: 'Batch berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting merch batch:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
