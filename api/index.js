import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import orderRoutes from '../backend/routes/orders.js'
import memberRoutes from '../backend/routes/members.js'
import eventRoutes from '../backend/routes/events.js'
import configRoutes from '../backend/routes/config.js'
import faqRoutes from '../backend/routes/faqs.js'
import authRoutes from '../backend/routes/auth.js'
import uploadRoutes from '../backend/routes/upload.js'
import merchandiseRoutes from '../backend/routes/merchandise.js'
import merchOrdersRoutes from '../backend/routes/merchOrders.js'
import merchBatchRoutes from '../backend/routes/merchBatches.js'
import { supabase } from '../backend/config/supabase.js'
import { rateLimiter } from '../backend/middleware/rateLimiter.js'
import { cachePublic } from '../backend/middleware/cache.js'

const app = express()

app.set('trust proxy', 1)
app.disable('x-powered-by')

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(helmet({ crossOriginResourcePolicy: false }))

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin)
    }
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, origin)
    }
    return callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.options('*', cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use(rateLimiter)

// If BACKEND_URL binding is provided by Vercel Services, forward requests to internal backend service
if (process.env.BACKEND_URL) {
  console.log(`[API Gateway] Forwarding requests to internal backend service: ${process.env.BACKEND_URL}`)
  app.use(async (req, res, next) => {
    try {
      const targetUrl = new URL(req.originalUrl, process.env.BACKEND_URL)
      
      const headers = {}
      for (const [key, value] of Object.entries(req.headers)) {
        if (key.toLowerCase() !== 'host') {
          headers[key] = value
        }
      }

      const fetchOptions = {
        method: req.method,
        headers
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (req.is('application/json') || typeof req.body === 'object') {
          fetchOptions.body = JSON.stringify(req.body)
          headers['content-type'] = 'application/json'
        } else if (req.body) {
          fetchOptions.body = req.body
        }
      }

      const backendResponse = await fetch(targetUrl, fetchOptions)
      
      res.status(backendResponse.status)
      backendResponse.headers.forEach((val, key) => {
        if (key.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(key, val)
        }
      })

      const buffer = await backendResponse.arrayBuffer()
      return res.send(Buffer.from(buffer))
    } catch (err) {
      console.error('[API Gateway] Proxy forward error:', err)
      return res.status(502).json({
        error: 'Bad Gateway',
        message: 'Failed to communicate with internal backend service',
        details: err.message
      })
    }
  })
} else {
  // Direct local routes fallback (when running standalone or without Vercel service binding)
  app.use('/api/auth', authRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/members', memberRoutes)
  app.use('/api/events', eventRoutes)
  app.use('/api/config', configRoutes)
  app.use('/api/faqs', faqRoutes)
  app.use('/api/upload', uploadRoutes)
  app.use('/api/merchandise', merchandiseRoutes)
  app.use('/api/merch-orders', merchOrdersRoutes)
  app.use('/api/merch-batches', merchBatchRoutes)
}

app.get('/api/health', cachePublic({ sMaxAge: 30, maxAge: 10 }), async (req, res) => {
  let dbStatus = 'disconnected'
  try {
    const { error } = await supabase.from('config').select('id').limit(1)
    if (!error) dbStatus = 'connected'
  } catch (e) {
    dbStatus = 'error'
  }
  
  res.json({ 
    status: 'OK', 
    message: 'Noize API Running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  })
})

app.get('/api/cron/keep-alive', async (req, res) => {
  try {
    const { data, error } = await supabase.from('config').select('id').limit(1)
    if (error) throw error
    res.json({ success: true, message: 'Keep-alive success', data })
  } catch (error) {
    console.error('Cron Keep-alive failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    baseUrl: req.baseUrl,
    method: req.method
  })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

export default app
