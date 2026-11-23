import express from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import ExcelJS from 'exceljs'
import { deletePaymentProofFiles } from '../utils/storageCleaner.js'
import { verifyTurnstileToken } from '../utils/turnstile.js'
import { getChekiUnitPrice } from '../utils/chekiPricing.js'

const router = express.Router()

// GET: Fetch all orders with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, dateFrom, dateTo, search, is_ots, event_id, month } = req.query

    console.log('[Orders] Filter params:', { status, is_ots, event_id, search, dateFrom, dateTo, month })

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_name,
          price,
          quantity,
          member_id,
          event_id
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by OTS
    if (is_ots !== undefined && is_ots !== 'all') {
      query = query.eq('is_ots', is_ots === 'true')
    }

    // Filter by event_id vs month vs date range
    if (event_id && event_id !== 'all') {
      console.log('[Orders] Filtering by event_id:', event_id)
      const { data: matchedItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('event_id', event_id)

      const matchedOrderIds = [...new Set((matchedItems || []).map(i => i.order_id).filter(Boolean))]
      if (matchedOrderIds.length > 0) {
        query = query.or(`event_id.eq.${event_id},id.in.(${matchedOrderIds.join(',')})`)
      } else {
        query = query.eq('event_id', event_id)
      }
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yStr, mStr] = month.split('-')
      const yNum = parseInt(yStr, 10)
      const mNum = parseInt(mStr, 10)

      const startDate = new Date(Date.UTC(yNum, mNum - 1, 1, 0, 0, 0, 0)).toISOString()
      const endDate = new Date(Date.UTC(yNum, mNum, 0, 23, 59, 59, 999)).toISOString()

      const idMonthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember']
      const enMonthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
      const targetId = idMonthNames[mNum - 1]
      const targetEn = enMonthNames[mNum - 1]

      const { data: allEvs } = await supabase.from('events').select('id, nama, bulan, tahun, event_date')
      let targetEventIds = []
      if (allEvs && allEvs.length > 0) {
        targetEventIds = allEvs.filter(e => {
          if (e.event_date && String(e.event_date).startsWith(month)) return true
          const evYear = Number(e.tahun)
          if (evYear === yNum) {
            const evBulan = String(e.bulan || '').toLowerCase().trim()
            if (evBulan === targetId || evBulan === targetEn) return true
            if (targetId && evBulan.startsWith(targetId.slice(0, 3))) return true
          }
          return false
        }).map(e => e.id)
      }

      if (targetEventIds.length > 0) {
        query = query.or(`event_id.in.(${targetEventIds.join(',')}),and(created_at.gte.${startDate},created_at.lte.${endDate})`)
      } else {
        query = query.gte('created_at', startDate).lte('created_at', endDate)
      }
    } else {
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }
    }

    // Search by name or order number
    if (search) {
      query = query.or(`nama_lengkap.ilike.%${search}%,email.ilike.%${search}%,order_number.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    console.log('[Orders] Fetched:', data?.length || 0, 'orders')

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Fetch single order by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_name,
          price,
          quantity,
          member_id,
          event_id
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create new order (from customer)
router.post('/', async (req, res) => {
  try {
    // Check maintenance mode (Admin with valid token can bypass for testing)
    let isAdmin = false
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET)
        isAdmin = true
      } catch {
        isAdmin = false
      }
    }

    if (!isAdmin) {
      const { data: mtConfig } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle()

      if (mtConfig && (mtConfig.value === 'true' || mtConfig.value === true)) {
        return res.status(503).json({ error: 'Sistem sedang dalam pemeliharaan. Transaksi saat ini belum dapat diproses.' })
      }
    }

    const { event_id, nama_lengkap, nama_panggilan, kontak, items, payment_proof_url, catatan } = req.body
    const turnstileToken = req.body['cf-turnstile-response'] || req.body.turnstile_token || req.body.turnstileToken

    const customerName = (nama_lengkap || nama_panggilan || req.body.customerName || '').trim()
    if (!customerName) {
      return res.status(400).json({ error: 'Nama panggilan / pemesan wajib diisi' })
    }
    if (!kontak || !String(kontak).trim()) {
      return res.status(400).json({ error: 'Nomor WhatsApp / IG kontak wajib diisi' })
    }

    // Cloudflare Turnstile Server-side verification (skip for logged-in admin, local development, or if disabled)
    const isTurnstileActive = process.env.TURNSTILE_ENABLED !== 'false' && process.env.NODE_ENV === 'production'
    if (!isAdmin && isTurnstileActive) {
      const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
      const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp)
      if (!turnstileResult.success) {
        return res.status(400).json({ error: turnstileResult.error || 'Verifikasi keamanan gagal' })
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Keranjang tiket cheki kosong' })
    }

    // Determine event_ids from items (event ditentukan per item di keranjang)
    const eventIds = [...new Set(items.map(i => i.event_id || event_id).filter(Boolean))]
    if (eventIds.length === 0) {
      return res.status(400).json({ error: 'Event ID wajib disertakan pada item tiket cheki' })
    }

    // Fetch events from DB for accurate server-side price calculation and lineup validation
    const { data: dbEvents, error: evErr } = await supabase
      .from('events')
      .select(`
        *,
        event_lineup (
          member_id
        )
      `)
      .in('id', eventIds)

    if (evErr) throw evErr
    const eventsMap = new Map((dbEvents || []).map(e => [String(e.id), e]))

    // Fetch config for regular cheki prices
    const { data: dbConfig, error: cfgErr } = await supabase
      .from('config')
      .select('*')

    if (cfgErr) throw cfgErr
    const configMap = {}
    ;(dbConfig || []).forEach(c => {
      configMap[c.key] = c.value
    })

    const monthMap = {
      'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
      'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Validate payment method for online Cheki order
    const rawPaymentMethod = (req.body.payment_method || 'transfer').toLowerCase()
    const paymentMethod = rawPaymentMethod === 'tf' ? 'transfer' : rawPaymentMethod

    if (paymentMethod === 'qris') {
      const isQrisActive = configMap.payment_cheki_qris_active === 'true'
      const qrisImage = configMap.payment_cheki_qris_image
      if (!isQrisActive || !qrisImage) {
        return res.status(400).json({ error: 'Metode pembayaran QRIS tidak aktif untuk Tiket Cheki' })
      }
    } else if (paymentMethod === 'transfer') {
      const isTransferActive = configMap.payment_cheki_transfer_active !== 'false'
      if (!isTransferActive) {
        return res.status(400).json({ error: 'Metode pembayaran Transfer Bank tidak aktif untuk Tiket Cheki' })
      }
    } else {
      return res.status(400).json({ error: 'Metode pembayaran tidak valid' })
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let total_harga = 0
    const calculatedOrderItems = []

    for (const item of items) {
      const itemEvId = item.event_id || event_id || eventIds[0]
      const ev = eventsMap.get(String(itemEvId))
      if (!ev) {
        return res.status(400).json({ error: `Event tidak ditemukan untuk item ${item.name || item.nama || item.member_id}` })
      }

      // Validasi event masih aktif dan belum lewat
      const mIdx = monthMap[String(ev.bulan || '').toLowerCase().trim()] !== undefined 
        ? monthMap[String(ev.bulan || '').toLowerCase().trim()] 
        : 0
      const evDate = new Date(ev.tahun || today.getFullYear(), mIdx, ev.tanggal || 1)
      if (ev.is_past || evDate < today) {
        return res.status(400).json({ error: `Event "${ev.nama}" (${ev.tanggal} ${ev.bulan} ${ev.tahun}) sudah berakhir atau tidak aktif` })
      }

      const isGroup = item.member_id === 'group' || item.type === 'group' || item.id === 'group'
      const tipeCheki = isGroup ? 'group' : 'member'
      const unitPrice = getChekiUnitPrice(ev, tipeCheki, 'po', configMap)
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1)

      total_harga += (unitPrice * qty)

      const memberId = (isGroup || !UUID_REGEX.test(item.member_id))
        ? null
        : item.member_id

      // Validasi kehadiran member pada lineup event terpilih
      if (!isGroup && memberId && Array.isArray(ev.event_lineup) && ev.event_lineup.length > 0) {
        const allowedMemberIds = new Set(ev.event_lineup.map(el => el.member_id).filter(Boolean))
        if (!allowedMemberIds.has(memberId)) {
          return res.status(400).json({ error: `Member ${item.name || item.nama || item.member_id} tidak hadir pada lineup event ${ev.nama}` })
        }
      }

      calculatedOrderItems.push({
        event_id: ev.id,
        member_id: memberId,
        item_name: item.nama || item.name || (isGroup ? `Cheki Group - ${ev.nama}` : `Cheki Member - ${ev.nama}`),
        price: unitPrice,
        quantity: qty
      })
    }

    // Primary event_id stored on orders table
    const primaryEventId = items[0]?.event_id || event_id || eventIds[0]

    // Generate order number
    const orderNumber = `NZ${Date.now()}`

    // Generate auto email from timestamp
    const autoEmail = `order-${Date.now()}@noize.official`

    // Determine if kontak is phone or instagram
    const isPhone = /^[0-9+\-\s()]+$/.test(kontak)
    const whatsapp = isPhone ? kontak : '-'
    const instagram = !isPhone ? kontak : '-'

    // Insert order with recalculated total_harga from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id: primaryEventId,
        nama_lengkap: customerName,
        whatsapp,
        email: autoEmail,
        instagram,
        total_harga,
        payment_proof_url,
        payment_method: paymentMethod,
        status: 'pending',
        created_by: 'customer',
        catatan: catatan || null
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items with snapshot unit price and individual event_id
    const orderItems = calculatedOrderItems.map(item => ({
      order_id: order.id,
      event_id: item.event_id,
      member_id: item.member_id,
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    res.json({ success: true, order, order_id: order.id, order_number: order.order_number })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create OTS (On The Spot) order by admin
router.post('/ots', authMiddleware, async (req, res) => {
  try {
    const { event_id, nama_lengkap, whatsapp, email, instagram, items, payment_method } = req.body

    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Item pesanan OTS kosong' })
    }

    // Fetch event and config for OTS pricing fallback
    const { data: ev } = await supabase.from('events').select('*').eq('id', event_id).maybeSingle()
    const { data: dbConfig } = await supabase.from('config').select('*')
    const configMap = {}
    ;(dbConfig || []).forEach(c => { configMap[c.key] = c.value })

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let total_harga = 0
    const calculatedOrderItems = []

    for (const item of items) {
      const isGroup = item.member_id === 'group' || item.type === 'group' || item.id === 'group'
      const tipeCheki = isGroup ? 'group' : 'member'
      // If admin explicitly specified an override price, honor it; otherwise calculate standard OTS unit price
      const hasCustomPrice = item.price !== undefined && item.price !== null && !isNaN(Number(item.price)) && Number(item.price) >= 0
      const unitPrice = hasCustomPrice ? Number(item.price) : getChekiUnitPrice(ev, tipeCheki, 'ots', configMap)
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1)

      total_harga += (unitPrice * qty)

      const memberId = (isGroup || !UUID_REGEX.test(item.member_id))
        ? null
        : item.member_id

      // Validasi kehadiran member pada lineup event terpilih
      if (!isGroup && memberId && Array.isArray(ev.event_lineup) && ev.event_lineup.length > 0) {
        const allowedMemberIds = new Set(ev.event_lineup.map(el => el.member_id).filter(Boolean))
        if (!allowedMemberIds.has(memberId)) {
          return res.status(400).json({ error: `Member ${item.name || item.member_id} tidak hadir pada lineup event ${ev.nama}` })
        }
      }

      calculatedOrderItems.push({
        event_id,
        member_id: memberId,
        item_name: item.name || (isGroup ? `Cheki Group (OTS) - ${ev?.nama || ''}` : `Cheki Member (OTS) - ${ev?.nama || ''}`),
        price: unitPrice,
        quantity: qty
      })
    }

    const orderNumber = `NZ-OTS${Date.now()}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id,
        nama_lengkap,
        whatsapp: whatsapp || '-',
        email: email || `ots-${Date.now()}@noize.official`,
        instagram: instagram || '-',
        total_harga,
        status: 'checked',
        is_ots: true,
        created_by: 'admin',
        payment_proof_url: payment_method || 'Cash' // Store Cash/QR here
      })
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = calculatedOrderItems.map(item => ({
      order_id: order.id,
      event_id: item.event_id,
      member_id: item.member_id,
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    res.json({ success: true, order })
  } catch (error) {
    console.error('Error creating OTS order:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update order status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'checked', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Export orders to Excel
router.get('/export/excel', authMiddleware, async (req, res) => {
  try {
    const { dateFrom, dateTo, status, is_ots, search, event_id, month } = req.query

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          item_name,
          price,
          quantity,
          event_id
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') query = query.eq('status', status)
    if (is_ots !== undefined && is_ots !== 'all') query = query.eq('is_ots', is_ots === 'true')
    
    // Filter by event_id vs month vs date range
    if (event_id && event_id !== 'all') {
      const { data: matchedItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('event_id', event_id)

      const matchedOrderIds = [...new Set((matchedItems || []).map(i => i.order_id).filter(Boolean))]
      if (matchedOrderIds.length > 0) {
        query = query.or(`event_id.eq.${event_id},id.in.(${matchedOrderIds.join(',')})`)
      } else {
        query = query.eq('event_id', event_id)
      }
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yStr, mStr] = month.split('-')
      const yNum = parseInt(yStr, 10)
      const mNum = parseInt(mStr, 10)

      const startDate = new Date(Date.UTC(yNum, mNum - 1, 1, 0, 0, 0, 0)).toISOString()
      const endDate = new Date(Date.UTC(yNum, mNum, 0, 23, 59, 59, 999)).toISOString()

      const idMonthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember']
      const enMonthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
      const targetId = idMonthNames[mNum - 1]
      const targetEn = enMonthNames[mNum - 1]

      const { data: allEvs } = await supabase.from('events').select('id, nama, bulan, tahun, event_date')
      let targetEventIds = []
      if (allEvs && allEvs.length > 0) {
        targetEventIds = allEvs.filter(e => {
          if (e.event_date && String(e.event_date).startsWith(month)) return true
          const evYear = Number(e.tahun)
          if (evYear === yNum) {
            const evBulan = String(e.bulan || '').toLowerCase().trim()
            if (evBulan === targetId || evBulan === targetEn) return true
            if (targetId && evBulan.startsWith(targetId.slice(0, 3))) return true
          }
          return false
        }).map(e => e.id)
      }

      if (targetEventIds.length > 0) {
        query = query.or(`event_id.in.(${targetEventIds.join(',')}),and(created_at.gte.${startDate},created_at.lte.${endDate})`)
      } else {
        query = query.gte('created_at', startDate).lte('created_at', endDate)
      }
    } else {
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)
    }
    if (search) query = query.or(`nama_lengkap.ilike.%${search}%,email.ilike.%${search}%,order_number.ilike.%${search}%`)

    const { data: orders, error } = await query

    if (error) throw error

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('NOIZE_SALES_REPORT')

    worksheet.columns = [
      { key: 'col1', width: 18 },  // Kode
      { key: 'col2', width: 18 },  // Customer
      { key: 'col3', width: 18 },  // Contact
      { key: 'col4', width: 22 },  // Event
      { key: 'col5', width: 10 },  // Type
      { key: 'col6', width: 35 },  // Items
      { key: 'col7', width: 8 },   // Qty
      { key: 'col8', width: 16 },  // Amount
      { key: 'col9', width: 14 },  // Status
      { key: 'col10', width: 20 }, // Date
      { key: 'col11', width: 25 }, // Catatan
    ]

    const applyBorders = (row) => {
      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      })
    }

    const mergeRow = (rowNumber, startCol, endCol, value, style) => {
      worksheet.mergeCells(`${startCol}${rowNumber}:${endCol}${rowNumber}`)
      const cell = worksheet.getCell(`${startCol}${rowNumber}`)
      cell.value = value
      if (style?.font) cell.font = style.font
      if (style?.fill) cell.fill = style.fill
      if (style?.alignment) cell.alignment = style.alignment
    }

    const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`
    const formatStatus = (status) => {
      if (status === 'pending') return 'BELUM BAYAR'
      if (status === 'checked') return 'DI BAYAR'
      if (status === 'completed') return 'DI AMBIL'
      return String(status || '-').toUpperCase()
    }

    // Ambil master event dari DB untuk memetakan nama event secara akurat
    const { data: allEventsData } = await supabase
      .from('events')
      .select('id, nama, tanggal, bulan, tahun, lokasi, is_past')
    const eventsMap = new Map((allEventsData || []).map(e => [String(e.id), e]))

    // Tempelkan eventObj ke masing-masing order
    orders.forEach(order => {
      const itemEvIds = (order.order_items || [])
        .map(i => i.event_id || order.event_id)
        .filter(Boolean)
      const uniqueEvIds = [...new Set(itemEvIds)]
      if (uniqueEvIds.length > 0) {
        const names = uniqueEvIds.map(id => eventsMap.get(String(id))?.nama).filter(Boolean)
        order._eventName = names.length > 0 ? names.join(', ') : (order.is_ots ? 'OTS Non-Event' : 'Umum / Lainnya')
      } else {
        const ev = order.event_id ? eventsMap.get(String(order.event_id)) : null
        order._eventName = ev ? ev.nama : (order.is_ots ? 'OTS Non-Event' : 'Umum / Lainnya')
      }
      const primaryEv = order.event_id ? eventsMap.get(String(order.event_id)) : (uniqueEvIds[0] ? eventsMap.get(String(uniqueEvIds[0])) : null)
      order._eventObj = primaryEv
    })

    // Kelompokkan order berdasarkan event
    const eventGroupsMap = new Map()
    orders.forEach(order => {
      const eId = order.event_id ? String(order.event_id) : 'unknown'
      if (!eventGroupsMap.has(eId)) {
        const ev = order._eventObj
        const label = ev ? `${ev.nama} (${ev.tanggal || ''} ${ev.bulan || ''} ${ev.tahun || ''})` : 'Order Non-Event / Umum'
        eventGroupsMap.set(eId, {
          id: eId,
          eventObj: ev,
          nama: ev ? ev.nama : 'Non-Event / Umum',
          fullLabel: label,
          lokasi: ev?.lokasi || '-',
          orders: []
        })
      }
      eventGroupsMap.get(eId).orders.push(order)
    })

    const distinctEvents = Array.from(eventGroupsMap.values())
    const isMultiEvent = distinctEvents.length > 1 || Boolean(month)

    // Kalkulasi data per event dan akumulasi bulanan
    let grandTotalRevenue = 0
    let grandTotalChekiSold = 0
    let grandTotalModalCheki = 0
    let grandTotalStaffHonor = 0
    let grandTotalMemberFees = 0
    let grandTotalManagementCut = 0
    let grandTotalOtsOrders = 0
    let grandTotalPoOrders = 0

    const allMemberNamesSet = new Set()

    distinctEvents.forEach(eg => {
      const paidOrders = eg.orders.filter(o => o.status === 'checked' || o.status === 'completed')
      eg.paidOrders = paidOrders
      eg.revenue = paidOrders.reduce((sum, o) => sum + (o.total_harga || 0), 0)
      eg.otsOrders = eg.orders.filter(o => o.is_ots)
      eg.poOrders = eg.orders.filter(o => !o.is_ots)

      grandTotalRevenue += eg.revenue
      grandTotalOtsOrders += eg.otsOrders.length
      grandTotalPoOrders += eg.poOrders.length

      const memberStats = {}
      paidOrders.forEach(order => {
        order.order_items?.forEach(item => {
          let name = String(item.item_name || '')
            .replace('Cheki ', '')
            .replace(' (Pre-Order)', '')
            .replace(/[^a-zA-Z0-9\s()]/gu, '')
            .trim()
          if (name.toLowerCase().includes('all member') || name.toLowerCase().includes('group')) {
            name = 'All Member (Group)'
          }
          if (!memberStats[name]) memberStats[name] = { qty: 0, otsQty: 0, poQty: 0, revenue: 0 }
          const qty = item.quantity || 0
          memberStats[name].qty += qty
          if (order.is_ots) memberStats[name].otsQty += qty
          else memberStats[name].poQty += qty
          memberStats[name].revenue += (qty * (item.price || 0))
        })
      })

      eg.memberStats = memberStats

      let totalCheki = 0
      let singlePoQty = 0
      let singleOtsQty = 0
      let groupPoQty = 0
      let groupOtsQty = 0

      Object.entries(memberStats).forEach(([name, stats]) => {
        const isGroup = name.toLowerCase().includes('group') || name.toLowerCase().includes('all member')
        if (isGroup) {
          groupPoQty += (stats.poQty || 0)
          groupOtsQty += (stats.otsQty || 0)
        } else {
          singlePoQty += (stats.poQty || 0)
          singleOtsQty += (stats.otsQty || 0)
          allMemberNamesSet.add(name)
        }
        totalCheki += (stats.qty || 0)
      })

      eg.chekiSold = totalCheki
      grandTotalChekiSold += totalCheki

      const modalCheki = totalCheki * 15000
      const staffHonor = totalCheki * 2000
      const groupPool = (groupPoQty * 15000) + (groupOtsQty * 20000)

      const individualMembers = Object.keys(memberStats).filter(n => !n.toLowerCase().includes('group') && !n.toLowerCase().includes('all member'))
      const activeMemberCount = individualMembers.length || 1
      const groupSharePerMember = groupPool > 0 ? Math.floor(groupPool / activeMemberCount) : 0

      let totalMemberFee = 0
      const memberFeeDetails = {}

      individualMembers.forEach(name => {
        const stats = memberStats[name]
        const poFee = (stats.poQty || 0) * 10000
        const otsFee = (stats.otsQty || 0) * 15000
        const groupShare = groupSharePerMember
        const totalTakeHome = poFee + otsFee + groupShare

        memberFeeDetails[name] = {
          poQty: stats.poQty || 0,
          poFee,
          otsQty: stats.otsQty || 0,
          otsFee,
          groupShare,
          totalTakeHome
        }
        totalMemberFee += totalTakeHome
      })

      const mgmtCut = (singlePoQty * 3000) + (singleOtsQty * 3000) + (groupPoQty * 8000) + (groupOtsQty * 13000)

      eg.modalCheki = modalCheki
      eg.staffHonor = staffHonor
      eg.groupPool = groupPool
      eg.memberFeeDetails = memberFeeDetails
      eg.totalMemberFee = totalMemberFee
      eg.mgmtCut = mgmtCut
      eg.singlePoQty = singlePoQty
      eg.singleOtsQty = singleOtsQty
      eg.groupPoQty = groupPoQty
      eg.groupOtsQty = groupOtsQty
      eg.activeMemberCount = activeMemberCount

      grandTotalModalCheki += modalCheki
      grandTotalStaffHonor += staffHonor
      grandTotalMemberFees += totalMemberFee
      grandTotalManagementCut += mgmtCut
    })

    const allMembersList = Array.from(allMemberNamesSet).sort((a, b) => a.localeCompare(b))

    // 1. HEADER UTAMA (ELECTRIC VIOLET NOIZE)
    const titleText = isMultiEvent 
      ? 'NOIZE - LAPORAN KONSOLIDASI PENJUALAN BULANAN' 
      : 'NOIZE - LAPORAN PENJUALAN EVENT'

    const titleRow = worksheet.addRow([titleText])
    mergeRow(titleRow.number, 'A', 'K', titleText, {
      font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9D26FF' } },
      alignment: { vertical: 'middle', horizontal: 'left' }
    })

    const subtitleRow = worksheet.addRow([`OFFICIAL SALES REPORT / ${new Date().toLocaleDateString('id-ID')}`])
    mergeRow(subtitleRow.number, 'A', 'K', subtitleRow.getCell(1).value, {
      font: { bold: true, size: 10, color: { argb: 'FF166534' } },
      alignment: { vertical: 'middle', horizontal: 'left' }
    })

    worksheet.addRow([])

    // Informasi Event-Event yang Terlibat
    if (isMultiEvent) {
      const eventHeaderRow = worksheet.addRow([`EVENT TERLIBAT DALAM PERIODE INI (${distinctEvents.length} EVENT):`])
      mergeRow(eventHeaderRow.number, 'A', 'K', eventHeaderRow.getCell(1).value, {
        font: { bold: true, color: { argb: 'FF166534' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D124D' } }
      })
      distinctEvents.forEach((eg, idx) => {
        const evRow = worksheet.addRow([`   ${idx + 1}. ${eg.fullLabel} | Lokasi: ${eg.lokasi} | Total: ${eg.orders.length} order (${eg.chekiSold} cheki)`])
        mergeRow(evRow.number, 'A', 'K', evRow.getCell(1).value, {
          font: { color: { argb: 'FF065F46' }, size: 9.5 }
        })
      })
    } else {
      const singleEv = distinctEvents[0]
      const eventRow = worksheet.addRow(['EVENT', singleEv?.fullLabel || 'Semua Event'])
      worksheet.mergeCells(`B${eventRow.number}:K${eventRow.number}`)
      eventRow.getCell(1).font = { bold: true, color: { argb: 'FF166534' } }
      eventRow.getCell(2).font = { bold: true }
      if (singleEv?.lokasi) {
        const metaRow = worksheet.addRow(['LOKASI', singleEv.lokasi])
        worksheet.mergeCells(`B${metaRow.number}:K${metaRow.number}`)
        metaRow.getCell(1).font = { bold: true, color: { argb: 'FF047857' } }
        metaRow.getCell(2).font = { color: { argb: 'FF047857' } }
      }
    }

    worksheet.addRow([])

    // 2. KARTU RINGKASAN OMSET (WARNA HIJAU)
    const summaryLabelRow = worksheet.addRow([])
    const summaryValueRow = worksheet.addRow([])
    const summaryBlocks = [
      { start: 'A', end: 'C', label: isMultiEvent ? 'TOTAL OMSET BULANAN' : 'TOTAL OMSET (GROSS)', value: formatCurrency(grandTotalRevenue), color: 'FF166534' },
      { start: 'D', end: 'E', label: 'TOTAL POLAROID', value: `${grandTotalChekiSold} units`, color: 'FF16A34A' },
      { start: 'F', end: 'H', label: 'OTS ORDERS', value: `${grandTotalOtsOrders} orders`, color: 'FF059669' },
      { start: 'I', end: 'K', label: 'PO ORDERS', value: `${grandTotalPoOrders} orders`, color: 'FF15803D' },
    ]

    summaryBlocks.forEach(block => {
      worksheet.mergeCells(`${block.start}${summaryLabelRow.number}:${block.end}${summaryLabelRow.number}`)
      worksheet.mergeCells(`${block.start}${summaryValueRow.number}:${block.end}${summaryValueRow.number}`)
      const labelCell = worksheet.getCell(`${block.start}${summaryLabelRow.number}`)
      const valueCell = worksheet.getCell(`${block.start}${summaryValueRow.number}`)
      labelCell.value = block.label
      valueCell.value = block.value
      labelCell.font = { bold: true, color: { argb: 'FF166534' } }
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D124D' } }
      labelCell.alignment = { vertical: 'middle', horizontal: 'center' }
      valueCell.font = { bold: true, color: { argb: block.color } }
      valueCell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    applyBorders(summaryLabelRow)
    applyBorders(summaryValueRow)

    worksheet.addRow([])

    // 3. KARTU ALOKASI KAS & DIVIDEN (WARNA ELECTRIC VIOLET)
    const dividenBannerText = isMultiEvent 
      ? 'ALOKASI KAS & DIVIDEN BULANAN (SOP RESMI NOIZE)' 
      : 'ALOKASI BIAYA & DIVIDEN EVENT (SOP RESMI NOIZE)'

    const dividenTitleRow = worksheet.addRow([dividenBannerText])
    mergeRow(dividenTitleRow.number, 'A', 'K', dividenBannerText, {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } },
      alignment: { vertical: 'middle', horizontal: 'left' }
    })

    const feeLabelRow = worksheet.addRow([])
    const feeValueRow = worksheet.addRow([])
    const feeBlocks = [
      { start: 'A', end: 'C', label: 'MODAL FILM (15K/LBR)', value: formatCurrency(grandTotalModalCheki), color: 'FF064E3B', fill: 'FFD1FAE5' },
      { start: 'D', end: 'E', label: 'HONOR STAFF (2K/LBR)', value: formatCurrency(grandTotalStaffHonor), color: 'FF15803D', fill: 'FFD1FAE5' },
      { start: 'F', end: 'H', label: 'TOTAL GAJI/FEE MEMBER', value: formatCurrency(grandTotalMemberFees), color: 'FF9D26FF', fill: 'FF2D124D' },
      { start: 'I', end: 'K', label: 'LABA BERSIH MANAJEMEN', value: formatCurrency(grandTotalManagementCut), color: 'FF166534', fill: 'FF2D124D' },
    ]

    feeBlocks.forEach(block => {
      worksheet.mergeCells(`${block.start}${feeLabelRow.number}:${block.end}${feeLabelRow.number}`)
      worksheet.mergeCells(`${block.start}${feeValueRow.number}:${block.end}${feeValueRow.number}`)
      const labelCell = worksheet.getCell(`${block.start}${feeLabelRow.number}`)
      const valueCell = worksheet.getCell(`${block.start}${feeValueRow.number}`)
      labelCell.value = block.label
      valueCell.value = block.value
      labelCell.font = { bold: true, size: 9, color: { argb: block.color } }
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: block.fill } }
      labelCell.alignment = { vertical: 'middle', horizontal: 'center' }
      valueCell.font = { bold: true, size: 11, color: { argb: block.color } }
      valueCell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    applyBorders(feeLabelRow)
    applyBorders(feeValueRow)

    worksheet.addRow([])

    // 4. MATRIKS GAJI BULANAN PER MEMBER (Jika Lebih Dari 1 Event)
    if (isMultiEvent) {
      const matrixTitle = `REKAP TOTAL GAJI BULANAN PER MEMBER (AKUMULASI ${distinctEvents.length} EVENT)`
      const mRow = worksheet.addRow([matrixTitle])
      mergeRow(mRow.number, 'A', 'K', matrixTitle, {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9D26FF' } },
        alignment: { vertical: 'middle', horizontal: 'left' }
      })

      // Buat Header Dinamis: Nama Member (A-C), Event-Event (D..), Total Bulanan (J-K)
      const matrixHeaders = ['Nama Member / Talent', '', '']
      distinctEvents.forEach((eg) => {
        matrixHeaders.push(eg.nama.length > 15 ? eg.nama.substring(0, 15) + '..' : eg.nama)
      })
      while (matrixHeaders.length < 9) {
        matrixHeaders.push('')
      }
      matrixHeaders.push('TOTAL GAJI BULANAN DITERIMA')
      matrixHeaders.push('')

      const mHeaderRow = worksheet.addRow(matrixHeaders)
      worksheet.mergeCells(`A${mHeaderRow.number}:C${mHeaderRow.number}`)
      worksheet.mergeCells(`J${mHeaderRow.number}:K${mHeaderRow.number}`)
      mHeaderRow.font = { bold: true }
      mHeaderRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D124D' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      })
      applyBorders(mHeaderRow)

      allMembersList.forEach(mName => {
        const rowVals = [mName, '', '']
        let memberMonthTotal = 0
        distinctEvents.forEach((eg) => {
          const fee = eg.memberFeeDetails[mName]?.totalTakeHome || 0
          memberMonthTotal += fee
          rowVals.push(fee)
        })
        while (rowVals.length < 9) {
          rowVals.push(0)
        }
        rowVals.push(memberMonthTotal)
        rowVals.push('')

        const r = worksheet.addRow(rowVals)
        worksheet.mergeCells(`A${r.number}:C${r.number}`)
        worksheet.mergeCells(`J${r.number}:K${r.number}`)
        
        r.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }
        for (let col = 4; col <= 10; col++) {
          r.getCell(col).numFmt = '"Rp" #,##0'
          r.getCell(col).alignment = { vertical: 'middle', horizontal: 'right' }
        }
        r.getCell(10).font = { bold: true, color: { argb: 'FF9D26FF' } }
        applyBorders(r)
      })

      // Total Matriks Row
      const matrixTotalVals = ['TOTAL GAJI DIBAGIKAN KE MEMBER', '', '']
      distinctEvents.forEach(eg => {
        matrixTotalVals.push(eg.totalMemberFee)
      })
      while (matrixTotalVals.length < 9) {
        matrixTotalVals.push(0)
      }
      matrixTotalVals.push(grandTotalMemberFees)
      matrixTotalVals.push('')

      const mTotRow = worksheet.addRow(matrixTotalVals)
      worksheet.mergeCells(`A${mTotRow.number}:C${mTotRow.number}`)
      worksheet.mergeCells(`J${mTotRow.number}:K${mTotRow.number}`)
      mTotRow.font = { bold: true }
      mTotRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
      for (let col = 4; col <= 10; col++) {
        mTotRow.getCell(col).numFmt = '"Rp" #,##0'
        mTotRow.getCell(col).alignment = { vertical: 'middle', horizontal: 'right' }
      }
      mTotRow.getCell(10).font = { bold: true, color: { argb: 'FF166534' } }
      applyBorders(mTotRow)

      worksheet.addRow([])
    }

    // 5. RINCIAN PER EVENT (Jika multi-event, tampilkan per event. Jika single event, tampilkan langsung)
    distinctEvents.forEach((eg, egIdx) => {
      const sectionTitle = isMultiEvent 
        ? `RINCIAN EVENT ${egIdx + 1}: ${eg.fullLabel}` 
        : `RINCIAN FEE & GAJI MEMBER (PO 10k, OTS 15k, Grup dibagi rata ${eg.activeMemberCount} member)`

      const evSecRow = worksheet.addRow([sectionTitle])
      mergeRow(evSecRow.number, 'A', 'K', sectionTitle, {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } },
        alignment: { vertical: 'middle', horizontal: 'left' }
      })

      // Mini-summary per event jika multi-event
      if (isMultiEvent) {
        const miniLabelRow = worksheet.addRow([])
        const miniValRow = worksheet.addRow([])
        const miniBlocks = [
          { start: 'A', end: 'C', label: 'OMSET EVENT', val: formatCurrency(eg.revenue) },
          { start: 'D', end: 'E', label: 'MODAL FILM', val: formatCurrency(eg.modalCheki) },
          { start: 'F', end: 'G', label: 'HONOR STAFF', val: formatCurrency(eg.staffHonor) },
          { start: 'H', end: 'I', label: 'FEE MEMBER', val: formatCurrency(eg.totalMemberFee) },
          { start: 'J', end: 'K', label: 'PROFIT MGMT', val: formatCurrency(eg.mgmtCut) }
        ]
        miniBlocks.forEach(b => {
          worksheet.mergeCells(`${b.start}${miniLabelRow.number}:${b.end}${miniLabelRow.number}`)
          worksheet.mergeCells(`${b.start}${miniValRow.number}:${b.end}${miniValRow.number}`)
          miniLabelRow.getCell(b.start).value = b.label
          miniValRow.getCell(b.start).value = b.val
          miniLabelRow.getCell(b.start).font = { size: 8, bold: true, color: { argb: 'FF166534' } }
          miniLabelRow.getCell(b.start).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D124D' } }
          miniLabelRow.getCell(b.start).alignment = { horizontal: 'center' }
          miniValRow.getCell(b.start).font = { size: 9, bold: true, color: { argb: 'FF065F46' } }
          miniValRow.getCell(b.start).alignment = { horizontal: 'center' }
        })
        applyBorders(miniLabelRow)
        applyBorders(miniValRow)
      }

      // Tabel member event ini
      const evMemHeaderRow = worksheet.addRow([
        'Nama Member / Talent', '', '',
        'PO Qty', 'Fee PO (10k)',
        'OTS Qty', 'Fee OTS (15k)',
        'Share Grup', '',
        'TOTAL FEE DITERIMA', ''
      ])
      worksheet.mergeCells(`A${evMemHeaderRow.number}:C${evMemHeaderRow.number}`)
      worksheet.mergeCells(`H${evMemHeaderRow.number}:I${evMemHeaderRow.number}`)
      worksheet.mergeCells(`J${evMemHeaderRow.number}:K${evMemHeaderRow.number}`)
      evMemHeaderRow.font = { bold: true, size: 9.5 }
      evMemHeaderRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D124D' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      })
      applyBorders(evMemHeaderRow)

      const evSortedMembers = Object.keys(eg.memberFeeDetails).sort((a, b) => a.localeCompare(b))
      if (evSortedMembers.length === 0) {
        const emptyRow = worksheet.addRow(['-', '', '', '-', '-', '-', '-', '-', '', '-', ''])
        worksheet.mergeCells(`A${emptyRow.number}:C${emptyRow.number}`)
        worksheet.mergeCells(`H${emptyRow.number}:I${emptyRow.number}`)
        worksheet.mergeCells(`J${emptyRow.number}:K${emptyRow.number}`)
        applyBorders(emptyRow)
      } else {
        evSortedMembers.forEach(mName => {
          const d = eg.memberFeeDetails[mName]
          const r = worksheet.addRow([
            mName, '', '',
            d.poQty,
            d.poFee,
            d.otsQty,
            d.otsFee,
            d.groupShare, '',
            d.totalTakeHome, ''
          ])
          worksheet.mergeCells(`A${r.number}:C${r.number}`)
          worksheet.mergeCells(`H${r.number}:I${r.number}`)
          worksheet.mergeCells(`J${r.number}:K${r.number}`)

          r.getCell(5).numFmt = '"Rp" #,##0'
          r.getCell(7).numFmt = '"Rp" #,##0'
          r.getCell(8).numFmt = '"Rp" #,##0'
          r.getCell(10).numFmt = '"Rp" #,##0'

          r.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }
          r.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
          r.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' }
          r.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' }
          r.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' }
          r.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' }
          r.getCell(10).alignment = { vertical: 'middle', horizontal: 'right' }
          r.getCell(10).font = { bold: true, color: { argb: 'FF9D26FF' } }
          applyBorders(r)
        })

        // Subtotal row event
        const subTotRow = worksheet.addRow([
          `SUBTOTAL FEE EVENT (${eg.nama})`, '', '',
          eg.singlePoQty,
          eg.singlePoQty * 10000,
          eg.singleOtsQty,
          eg.singleOtsQty * 15000,
          eg.groupPool, '',
          eg.totalMemberFee, ''
        ])
        worksheet.mergeCells(`A${subTotRow.number}:C${subTotRow.number}`)
        worksheet.mergeCells(`H${subTotRow.number}:I${subTotRow.number}`)
        worksheet.mergeCells(`J${subTotRow.number}:K${subTotRow.number}`)
        subTotRow.font = { bold: true }
        subTotRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
        subTotRow.getCell(5).numFmt = '"Rp" #,##0'
        subTotRow.getCell(7).numFmt = '"Rp" #,##0'
        subTotRow.getCell(8).numFmt = '"Rp" #,##0'
        subTotRow.getCell(10).numFmt = '"Rp" #,##0'
        subTotRow.getCell(10).font = { bold: true, color: { argb: 'FF166534' } }
        subTotRow.eachCell((cell, colNumber) => {
          if (colNumber >= 4) {
            cell.alignment = { vertical: 'middle', horizontal: [4, 6].includes(colNumber) ? 'center' : 'right' }
          }
        })
        applyBorders(subTotRow)
      }

      worksheet.addRow([])
    })

    // 6. DETAIL TRANSAKSI LENGKAP (DENGAN KOLOM EVENT)
    const detailsTitleRow = worksheet.addRow(['DETAIL TRANSAKSI PESANAN'])
    mergeRow(detailsTitleRow.number, 'A', 'K', 'DETAIL TRANSAKSI PESANAN', {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } },
      alignment: { vertical: 'middle', horizontal: 'left' }
    })

    const addOrderSection = (title, fillColor, ordersList) => {
      const sectionRow = worksheet.addRow([title])
      mergeRow(sectionRow.number, 'A', 'K', title, {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
        alignment: { vertical: 'middle', horizontal: 'left' }
      })

      const headerRow = worksheet.addRow(['Kode', 'Customer', 'Contact', 'Event', 'Type', 'Items', 'Qty', 'Amount', 'Status', 'Date', 'Catatan'])
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      })
      applyBorders(headerRow)

      if (ordersList.length === 0) {
        const emptyRow = worksheet.addRow(['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'])
        applyBorders(emptyRow)
        return
      }

      ordersList.forEach(order => {
        const itemsText = order.order_items
          ?.map(item => `${item.item_name} x${item.quantity}`)
          .join(', ') || '-'
        const qty = order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
        const contact = order.is_ots ? '-' : ([order.whatsapp, order.instagram].filter(Boolean).join(' / ') || '-')
        const row = worksheet.addRow([
          order.order_number || '-',
          order.nama_lengkap || '-',
          contact,
          order._eventName || '-',
          order.is_ots ? 'OTS' : 'PO',
          itemsText,
          qty,
          order.total_harga || 0,
          formatStatus(order.status),
          new Date(order.created_at).toLocaleString('id-ID'),
          order.catatan || '-'
        ])
        row.getCell(8).numFmt = '"Rp" #,##0'
        row.eachCell((cell, colNumber) => {
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 8 ? 'right' : 'left', wrapText: true }
        })
        applyBorders(row)
      })
    }

    const allOtsOrders = orders.filter(o => o.is_ots)
    const allPoOrders = orders.filter(o => !o.is_ots)

    addOrderSection('TRANSAKSI ON THE SPOT (OTS)', 'FF059669', allOtsOrders)
    worksheet.addRow([])
    addOrderSection('TRANSAKSI PRE-ORDER (PO)', 'FF15803D', allPoOrders)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=Noize_Report_${Date.now()}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()

  } catch (error) {
    console.error('Error exporting to Excel:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Delete order
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Order deleted' })
  } catch (error) {
    console.error('Error deleting order:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Bulk delete orders with filters (Clean DB + Purge Storage Files)
router.post('/bulk-delete', authMiddleware, async (req, res) => {
  try {
    const { deleteType, eventId, weeks, months } = req.body

    console.log('[Orders] Bulk delete request:', { deleteType, eventId, weeks, months })

    let query = supabase.from('orders').select('id, payment_proof_url')

    // Apply filters based on delete type
    if (deleteType === 'event' && eventId) {
      const { data: matchedItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('event_id', eventId)

      const matchedOrderIds = [...new Set((matchedItems || []).map(i => i.order_id).filter(Boolean))]
      if (matchedOrderIds.length > 0) {
        query = query.or(`event_id.eq.${eventId},id.in.(${matchedOrderIds.join(',')})`)
      } else {
        query = query.eq('event_id', eventId)
      }
    } else if (deleteType === 'weeks' && weeks) {
      const weeksAgo = new Date()
      weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7))
      query = query.gte('created_at', weeksAgo.toISOString())
    } else if (deleteType === 'months' && months) {
      const monthsAgo = new Date()
      monthsAgo.setMonth(monthsAgo.getMonth() - months)
      query = query.gte('created_at', monthsAgo.toISOString())
    } else if (deleteType !== 'all') {
      return res.status(400).json({ error: 'Invalid delete type' })
    }

    // Get orders to delete
    const { data: ordersToDelete, error: selectError } = await query

    if (selectError) throw selectError

    if (!ordersToDelete || ordersToDelete.length === 0) {
      return res.json({ success: true, message: 'Tidak ada data order yang perlu dihapus', count: 0 })
    }

    const orderIds = ordersToDelete.map(o => o.id)
    const paymentUrls = ordersToDelete
      .map(o => o.payment_proof_url)
      .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')))

    // 1. Purge physical files from Supabase Storage
    if (paymentUrls.length > 0) {
      await deletePaymentProofFiles(paymentUrls, 'payment-proofs')
    }

    // 2. Delete order_items first (foreign key constraint)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds)

    if (itemsError) throw itemsError

    // 3. Delete orders
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds)

    if (ordersError) throw ordersError

    console.log(`[Orders] Cleaned ${ordersToDelete.length} orders and purged payment storage files`)

    res.json({
      success: true,
      message: `Berhasil menghapus ${ordersToDelete.length} data order & membersihkan file penyimpanan bukti bayar`,
      count: ordersToDelete.length
    })
  } catch (error) {
    console.error('Error bulk deleting orders:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Purge old payment proof images (> 1 month / 30 days) from Supabase Storage
router.post('/purge-old-payments', authMiddleware, async (req, res) => {
  try {
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

    // Find orders created more than 30 days ago that still have payment_proof_url
    const { data: oldOrders, error: fetchErr } = await supabase
      .from('orders')
      .select('id, payment_proof_url')
      .lte('created_at', oneMonthAgo.toISOString())
      .not('payment_proof_url', 'is', null)

    if (fetchErr) throw fetchErr

    if (!oldOrders || oldOrders.length === 0) {
      return res.json({ success: true, message: 'Tidak ada file bukti pembayaran lama (> 1 bulan) yang perlu dibersihkan', count: 0 })
    }

    const paymentUrls = oldOrders
      .map(o => o.payment_proof_url)
      .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')))

    // 1. Remove from storage
    const { deletedCount } = await deletePaymentProofFiles(paymentUrls, 'payment-proofs')

    // 2. Set payment_proof_url = null in DB to free reference
    const orderIds = oldOrders.map(o => o.id)
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ payment_proof_url: null })
      .in('id', orderIds)

    if (updateErr) throw updateErr

    console.log(`[StorageCleaner] Purged ${deletedCount} old payment files from orders > 30 days`)

    res.json({
      success: true,
      message: `Berhasil membersihkan ${deletedCount} file bukti pembayaran dari pesanan yang lewat 1 bulan`,
      count: deletedCount
    })
  } catch (error) {
    console.error('Error purging old payments:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
