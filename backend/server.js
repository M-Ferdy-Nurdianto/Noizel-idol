import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import orderRoutes from './routes/orders.js'
import memberRoutes from './routes/members.js'
import eventRoutes from './routes/events.js'
import configRoutes from './routes/config.js'
import faqRoutes from './routes/faqs.js'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import merchandiseRoutes from './routes/merchandise.js'
import merchOrdersRoutes from './routes/merchOrders.js'
import merchBatchRoutes from './routes/merchBatches.js'
import { rateLimiter } from './middleware/rateLimiter.js'

const app = express()
const PORT = process.env.PORT || 5000

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(helmet({ crossOriginResourcePolicy: false }))

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(null, false)
  },
  credentials: true
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use(rateLimiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/config', configRoutes)
app.use('/api/faqs', faqRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/merchandise', merchandiseRoutes)
app.use('/api/merch-orders', merchOrdersRoutes)
app.use('/api/orders/merchandise', merchOrdersRoutes)
app.use('/api/merch-batches', merchBatchRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Noize API Running' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

export default app

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Server] Noize backend running on port ${PORT}`)
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}
