import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import crypto from 'crypto'
import { uploadToSupabaseStorage } from '../config/googleDrive.js'
import { authMiddleware } from '../middleware/auth.js'
import { deletePaymentProofFiles } from '../utils/storageCleaner.js'

const router = express.Router()

// Multer specifically for QRIS (strict max 2MB, png/jpg/webp only)
const uploadQris = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB strict limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Format file tidak didukung. Hanya file PNG, JPG, atau WebP yang diperbolehkan.'))
    }
  }
})

const handleQrisMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'Ukuran file terlalu besar. Maksimal 2MB.' })
    }
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` })
  } else if (err) {
    return res.status(400).json({ success: false, error: err.message })
  }
  next()
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (before compression)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max 50MB allowed.' })
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` })
  } else if (err) {
    return res.status(400).json({ error: err.message })
  }
  next()
}

// Middleware to accept either 'file' or 'payment_proof' field name
const uploadPaymentProof = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next)
    if (req.files && req.files.length > 0) {
      req.file = req.files.find(f => f.fieldname === 'file' || f.fieldname === 'payment_proof') || req.files[0]
    }
    next()
  })
}

// POST: Upload payment proof to Supabase Storage with auto-compression
router.post('/payment-proof', uploadPaymentProof, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select an image file.',
        debug: {
          contentType: req.headers['content-type'],
          bodyKeys: Object.keys(req.body || {})
        }
      })
    }

    console.log('[Upload] Original file:', {
      name: req.file.originalname,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      mimetype: req.file.mimetype
    })

    // Compress image using sharp
    const compressedBuffer = await sharp(req.file.buffer)
      .resize(1920, 1920, { // Max 1920x1920, maintain aspect ratio
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80, progressive: true }) // Convert to JPEG with 80% quality
      .toBuffer()

    console.log('[Upload] Compressed:', {
      originalSize: `${(req.file.size / 1024).toFixed(2)} KB`,
      compressedSize: `${(compressedBuffer.length / 1024).toFixed(2)} KB`,
      reduction: `${(((req.file.size - compressedBuffer.length) / req.file.size) * 100).toFixed(1)}%`
    })

    const fileName = `payment_${Date.now()}_${req.file.originalname.replace(/\.[^/.]+$/, '')}.jpg`
    const result = await uploadToSupabaseStorage(
      compressedBuffer,
      fileName,
      'image/jpeg'
    )

    res.json({
      success: true,
      data: {
        fileId: result.fileId,
        url: result.url,
        originalSize: req.file.size,
        compressedSize: compressedBuffer.length
      }
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// POST: Upload merch image to Supabase Storage with auto-compression
router.post('/merch-image', upload.single('file'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' })
    }

    console.log('[Upload] Merch image upload:', {
      name: req.file.originalname,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      mimetype: req.file.mimetype
    })

    // Compress image to WebP
    const compressedBuffer = await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    console.log('[Upload] Merch image compressed:', {
      originalSize: `${(req.file.size / 1024).toFixed(2)} KB`,
      compressedSize: `${(compressedBuffer.length / 1024).toFixed(2)} KB`,
    })

    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const fileName = `merch_${Date.now()}_${sanitizedName}.webp`
    const result = await uploadToSupabaseStorage(
      compressedBuffer,
      fileName,
      'image/webp',
      'products'
    )

    res.json({
      success: true,
      data: { url: result.url }
    })
  } catch (error) {
    console.error('Error uploading merch image:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST: Upload member avatar or gallery image to Supabase Storage with auto-compression
router.post('/member-image', upload.single('file'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' })
    }

    const validTypes = ['gallery', 'avatars', 'shop', 'banner', 'hero', 'silhouette']
    const type = validTypes.includes(req.query.type) ? req.query.type : 'avatars'

    // Smart auto-crop and conversion to exact target aspect ratios
    let sharpPipeline = sharp(req.file.buffer)

    if (type === 'shop' || type === 'gallery') {
      // 3:4 Vertical portrait auto-crop focused on top/face for Cheki cards & gallery
      sharpPipeline = sharpPipeline.resize(750, 1000, {
        fit: 'cover',
        position: 'top'
      })
    } else if (type === 'hero' || type === 'silhouette') {
      // High-res hero / silhouette portrait optimization (1000x1500 max)
      sharpPipeline = sharpPipeline.resize(1000, 1500, {
        fit: 'inside',
        withoutEnlargement: true
      })
    } else if (type === 'banner') {
      // 16:9 Landscape auto-crop for group cover banner
      sharpPipeline = sharpPipeline.resize(1200, 675, {
        fit: 'cover',
        position: 'center'
      })
    } else {
      // 1:1 Square auto-crop for member profile avatar
      sharpPipeline = sharpPipeline.resize(800, 800, {
        fit: 'cover',
        position: 'top'
      })
    }

    const compressedBuffer = await sharpPipeline
      .webp({ quality: 85 })
      .toBuffer()

    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const fileName = `${type}/${Date.now()}_${sanitizedName}.webp`
    const result = await uploadToSupabaseStorage(
      compressedBuffer,
      fileName,
      'image/webp',
      'members'
    )

    res.json({
      success: true,
      data: { url: result.url }
    })
  } catch (error) {
    console.error('Error uploading member image:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST: Upload QRIS image to Supabase Storage ('payments' bucket)
router.post('/qris', authMiddleware, uploadQris.single('file'), handleQrisMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Tidak ada file yang diunggah.' })
    }

    // Keep QR matrix clear and sharp: resize to max 1200x1200 inside without enlargement, quality 95
    const compressedBuffer = await sharp(req.file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 95 })
      .toBuffer()

    const randomSuffix = crypto.randomBytes(6).toString('hex')
    const fileName = `qris_${Date.now()}_${randomSuffix}.webp`

    const result = await uploadToSupabaseStorage(
      compressedBuffer,
      fileName,
      'image/webp',
      'payments'
    )

    // If an oldUrl was passed (replacing an existing QRIS image), purge the old file from storage
    if (req.body.oldUrl) {
      try {
        await deletePaymentProofFiles([req.body.oldUrl], 'payments')
      } catch (delErr) {
        console.warn('[Upload] Failed to delete old QRIS image:', delErr.message)
      }
    }

    res.json({
      success: true,
      data: { url: result.url }
    })
  } catch (error) {
    console.error('Error uploading QRIS image:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE: Delete QRIS image from Supabase Storage ('payments' bucket)
router.delete('/qris', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body
    if (url) {
      await deletePaymentProofFiles([url], 'payments')
    }
    res.json({ success: true, message: 'Gambar QRIS berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting QRIS image:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router

