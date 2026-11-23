import express from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import ExcelJS from 'exceljs'
import { verifyTurnstileToken } from '../utils/turnstile.js'

const router = express.Router()

// ───────────────────────────────────────────
// MERCH ORDERS
// ───────────────────────────────────────────

// GET all merch orders (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, search, dateFrom, dateTo, batch_id, month } = req.query

    let query = supabase
      .from('merch_orders')
      .select(`
        *,
        merch_batches (
          id,
          nama,
          slug,
          is_active
        ),
        merch_order_items (
          id,
          item_name,
          harga,
          quantity,
          merchandise_id,
          size
        )
      `)
      .order('created_at', { ascending: false })

    if (batch_id && batch_id !== 'all') {
      query = query.eq('batch_id', batch_id)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`nama_lengkap.ilike.%${search}%,whatsapp.ilike.%${search}%,order_number.ilike.%${search}%`)
    }

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yStr, mStr] = month.split('-')
      const yNum = parseInt(yStr, 10)
      const mNum = parseInt(mStr, 10)
      const startDate = new Date(Date.UTC(yNum, mNum - 1, 1, 0, 0, 0, 0)).toISOString()
      const endDate = new Date(Date.UTC(yNum, mNum, 0, 23, 59, 59, 999)).toISOString()
      query = query.gte('created_at', startDate).lte('created_at', endDate)
    } else {
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)
    }

    const { data, error } = await query
    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching merch orders:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET single merch order (admin only)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merch_orders')
      .select(`
        *,
        merch_order_items (
          id,
          item_name,
          harga,
          quantity,
          merchandise_id,
          size
        )
      `)
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching merch order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST create merch order (customer checkout)
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
        return res.status(503).json({ error: 'Sistem sedang dalam pemeliharaan. Transaksi merchandise saat ini belum dapat diproses.' })
      }
    }

    const { nama_lengkap, whatsapp, instagram, catatan, items, payment_proof_url } = req.body
    const turnstileToken = req.body['cf-turnstile-response'] || req.body.turnstile_token || req.body.turnstileToken

    // Cloudflare Turnstile Server-side verification (skip for logged-in admin, local development, or if disabled)
    const isTurnstileActive = process.env.TURNSTILE_ENABLED !== 'false' && process.env.NODE_ENV === 'production'
    if (!isAdmin && isTurnstileActive) {
      const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
      const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp)
      if (!turnstileResult.success) {
        return res.status(400).json({ error: turnstileResult.error || 'Verifikasi keamanan gagal' })
      }
    }

    if (!whatsapp) {
      return res.status(400).json({ error: 'No. WhatsApp wajib diisi' })
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Tidak ada item di keranjang' })
    }

    // Check active merch batch
    const { data: activeBatch, error: batchErr } = await supabase
      .from('merch_batches')
      .select('id, nama')
      .eq('is_active', true)
      .maybeSingle()

    if (batchErr || !activeBatch) {
      return res.status(400).json({ error: 'Saat ini tidak ada batch merchandise yang aktif untuk pemesanan.' })
    }

    // Fetch config for payment method validation
    const { data: dbConfig } = await supabase
      .from('config')
      .select('*')
    const configMap = {}
    ;(dbConfig || []).forEach(c => { configMap[c.key] = c.value })

    const rawPaymentMethod = (req.body.payment_method || 'transfer').toLowerCase()
    const paymentMethod = rawPaymentMethod === 'tf' ? 'transfer' : rawPaymentMethod

    if (paymentMethod === 'qris') {
      const isQrisActive = configMap.payment_merch_qris_active === 'true'
      const qrisImage = configMap.payment_merch_qris_image
      if (!isQrisActive || !qrisImage) {
        return res.status(400).json({ error: 'Metode pembayaran QRIS tidak aktif untuk Merchandise' })
      }
    } else if (paymentMethod === 'transfer') {
      const isTransferActive = configMap.payment_merch_transfer_active !== 'false'
      if (!isTransferActive) {
        return res.status(400).json({ error: 'Metode pembayaran Transfer Bank tidak aktif untuk Merchandise' })
      }
    } else {
      return res.status(400).json({ error: 'Metode pembayaran tidak valid' })
    }

    const orderNumber = `MERCH${Date.now()}`
    const total_harga = items.reduce((sum, item) => sum + (item.harga * item.quantity), 0)

    const { data: order, error: orderError } = await supabase
      .from('merch_orders')
      .insert({
        order_number: orderNumber,
        nama_lengkap: nama_lengkap || null,
        whatsapp,
        instagram: instagram || null,
        catatan: catatan || null,
        total_harga,
        payment_proof_url: payment_proof_url || null,
        payment_method: paymentMethod,
        status: 'pending',
        batch_id: activeBatch.id
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const orderItems = items.map(item => ({
      merch_order_id: order.id,
      merchandise_id: item.merchandise_id || null,
      item_name: item.nama,
      harga: item.harga,
      quantity: item.quantity,
      size: item.size || null
    }))

    const { error: itemsError } = await supabase
      .from('merch_order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Update stock if available
    for (const item of items) {
      if (item.merchandise_id) {
        const { data: merch } = await supabase
          .from('merchandise')
          .select('stok')
          .eq('id', item.merchandise_id)
          .single()

        if (merch && merch.stok > 0) {
          const newStok = Math.max(0, merch.stok - item.quantity)
          await supabase
            .from('merchandise')
            .update({ stok: newStok })
            .eq('id', item.merchandise_id)
        }
      }
    }

    res.json({ success: true, order })
  } catch (error) {
    console.error('Error creating merch order:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH update merch order status (admin only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body

    const validStatuses = ['pending', 'checked', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' })
    }

    const { data, error } = await supabase
      .from('merch_orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE merch order (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('merch_orders')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true, message: 'Merch order berhasil dihapus' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET export merch orders to Excel
router.get('/export/excel', authMiddleware, async (req, res) => {
  try {
    const { status, search, dateFrom, dateTo, batch_id, month } = req.query

    let query = supabase
      .from('merch_orders')
      .select(`
        *,
        merch_batches (
          nama
        ),
        merch_order_items (
          item_name,
          harga,
          quantity,
          size
        )
      `)
      .order('created_at', { ascending: false })

    if (batch_id && batch_id !== 'all') query = query.eq('batch_id', batch_id)
    if (status && status !== 'all') query = query.eq('status', status)
    if (search) query = query.or(`nama_lengkap.ilike.%${search}%,whatsapp.ilike.%${search}%,order_number.ilike.%${search}%`)

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yStr, mStr] = month.split('-')
      const yNum = parseInt(yStr, 10)
      const mNum = parseInt(mStr, 10)
      const startDate = new Date(Date.UTC(yNum, mNum - 1, 1, 0, 0, 0, 0)).toISOString()
      const endDate = new Date(Date.UTC(yNum, mNum, 0, 23, 59, 59, 999)).toISOString()
      query = query.gte('created_at', startDate).lte('created_at', endDate)
    } else {
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)
    }

    const { data: orders, error } = await query
    if (error) throw error

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Merch Orders')

    worksheet.columns = [
      { header: 'Order Number', key: 'order_number', width: 22 },
      { header: 'Batch', key: 'batch_name', width: 22 },
      { header: 'Nama Pembeli', key: 'nama_lengkap', width: 25 },
      { header: 'WhatsApp', key: 'whatsapp', width: 16 },
      { header: 'Instagram', key: 'instagram', width: 20 },
      { header: 'Items', key: 'items', width: 45 },
      { header: 'Size', key: 'size', width: 10 },
      { header: 'Total Harga', key: 'total_harga', width: 18 },
      { header: 'Catatan / Alamat Pengiriman', key: 'catatan', width: 45 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Order', key: 'created_at', width: 20 }
    ]

    // Style Header
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9D26FF' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    const itemSummary = {} // { product_name: { total: 0, sizes: { 'M': 1, ... } } }
    const sizeSummary = {} // { 'M': 5, 'L': 3 }
    let grandTotalRevenue = 0
    let totalItemsSold = 0

    // Master katalog merchandise dari batch agar produk yang belum terjual tetap terdata di ringkasan
    try {
      let catalogQuery = supabase.from('merchandise').select('nama, category, sizes')
      if (batch_id && batch_id !== 'all') {
        catalogQuery = catalogQuery.eq('batch_id', batch_id)
      }
      const { data: catalogProducts } = await catalogQuery
      if (catalogProducts) {
        catalogProducts.forEach(prod => {
          const isApparel = prod.category !== 'other' && Array.isArray(prod.sizes) && prod.sizes.length > 0
          if (!itemSummary[prod.nama]) {
            itemSummary[prod.nama] = { total: 0, revenue: 0, sizes: {}, hasSizes: isApparel }
          }
        })
      }
    } catch (catErr) {
      console.warn('Could not load catalog products for excel summary:', catErr)
    }

    orders.forEach(order => {
      grandTotalRevenue += order.total_harga

      const itemsText = order.merch_order_items
        .map((item, idx) => {
          const prefix = order.merch_order_items.length > 1 ? `${idx + 1}. ` : '• '
          const sizeTag = item.size ? `[${item.size}] ` : ''
          return `${prefix}${sizeTag}${item.item_name} (${item.quantity}x)`
        })
        .join('\n')

      const sizesText = order.merch_order_items
        .map(item => item.size || '-')
        .join(', ')

      order.merch_order_items.forEach(item => {
        const name = item.item_name
        const rawSize = item.size ? item.size.trim().toUpperCase() : ''
        const isApparel = rawSize && !['NO SIZE', 'NOSIZE', 'NONE', '-', 'NON'].includes(rawSize)
        const qty = item.quantity
        const price = item.harga
        
        // Track per product
        if (!itemSummary[name]) {
          itemSummary[name] = { total: 0, revenue: 0, sizes: {}, hasSizes: false }
        }
        itemSummary[name].total += qty
        itemSummary[name].revenue += (qty * price)

        if (isApparel) {
          itemSummary[name].hasSizes = true
          if (!itemSummary[name].sizes[rawSize]) itemSummary[name].sizes[rawSize] = 0
          itemSummary[name].sizes[rawSize] += qty

          // Track global size totals
          if (!sizeSummary[rawSize]) sizeSummary[rawSize] = 0
          sizeSummary[rawSize] += qty
        }

        totalItemsSold += qty
      })

      const row = worksheet.addRow({
        order_number: order.order_number,
        batch_name: order.merch_batches?.nama || '-',
        nama_lengkap: order.nama_lengkap || '-',
        whatsapp: order.whatsapp,
        instagram: order.instagram || '-',
        items: itemsText,
        size: sizesText,
        total_harga: order.total_harga,
        catatan: order.catatan || '-',
        status: order.status,
        created_at: new Date(order.created_at).toLocaleString('id-ID')
      })

      row.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
      })
    })

    // Add spacing
    worksheet.addRow([])
    worksheet.addRow([])

    // 1. GLOBAL SIZE RECAP (The "size M: L: XL:" part)
    if (Object.keys(sizeSummary).length > 0) {
      const sizeHeader = worksheet.addRow(['REKAP TOTAL PER UKURAN (SIZE)'])
      sizeHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
      sizeHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }
      worksheet.mergeCells(`A${sizeHeader.number}:K${sizeHeader.number}`)
      sizeHeader.alignment = { horizontal: 'center' }

      Object.entries(sizeSummary).sort().forEach(([size, qty]) => {
        const row = worksheet.addRow([`Ukuran ${size}`, '', '', '', '', '', '', '', '', qty, 'pcs'])
        worksheet.mergeCells(`A${row.number}:I${row.number}`)
        row.getCell(10).alignment = { horizontal: 'center' }
        row.getCell(11).alignment = { horizontal: 'center' }
        row.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        })
      })
      worksheet.addRow([])
      worksheet.addRow([])
    }

    // 2. PRODUCT SUMMARY
    const summaryHeader = worksheet.addRow(['RINGKASAN PENJUALAN PER PRODUK'])
    summaryHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9D26FF' } }
    worksheet.mergeCells(`A${summaryHeader.number}:K${summaryHeader.number}`)
    summaryHeader.alignment = { horizontal: 'center' }

    // Summary Headers
    const subHeader = worksheet.addRow(['Nama Produk', '', '', '', '', '', '', '', '', 'Jumlah Terjual', 'Total Pendapatan'])
    subHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    subHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } }
    worksheet.mergeCells(`A${subHeader.number}:I${subHeader.number}`)
    subHeader.alignment = { horizontal: 'center' }
    
    // Summary Rows
    Object.keys(itemSummary).forEach(name => {
      const product = itemSummary[name]
      
      // Main Product Row
      const productRow = worksheet.addRow([
        name, '', '', '', '', '', '', '', '',
        product.total, 
        product.revenue
      ])
      worksheet.mergeCells(`A${productRow.number}:I${productRow.number}`)
      productRow.getCell(11).numFmt = '"Rp "#,##0'
      productRow.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        cell.font = { bold: true }
      })

      // Size Breakdown Rows (The "size M: L: XL:" sub-items)
      if (product.hasSizes) {
        Object.entries(product.sizes).sort().forEach(([size, qty]) => {
          const sizeRow = worksheet.addRow([
            `   • Ukuran ${size}`, '', '', '', '', '', '', '', '',
            qty, 
            '' // Price not needed for sub-item usually
          ])
          worksheet.mergeCells(`A${sizeRow.number}:I${sizeRow.number}`)
          sizeRow.getCell(10).alignment = { horizontal: 'center' }
          sizeRow.eachCell(cell => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
            cell.font = { italic: true }
            cell.font.color = { argb: 'FF666666' }
          })
        })
      }
    })

    // Grand Total Row
    worksheet.addRow([])
    const footerRow = worksheet.addRow(['TOTAL KESELURUHAN', '', '', '', '', '', '', '', '', totalItemsSold, grandTotalRevenue])
    footerRow.font = { bold: true, color: { argb: 'FF166534' } }
    footerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } } // Light green tint
    worksheet.mergeCells(`A${footerRow.number}:I${footerRow.number}`)
    footerRow.getCell(11).numFmt = '"Rp "#,##0'
    footerRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })

    // 3. ANALISIS HPP, BIAYA OPERASIONAL & NET INCOME (Bagan Resmi Noize)
    worksheet.addRow([])
    worksheet.addRow([])

    const hppTitleRow = worksheet.addRow(['ANALISIS HPP, BIAYA OPERASIONAL & NET INCOME MERCHANDISE'])
    hppTitleRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    hppTitleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9D26FF' } }
    worksheet.mergeCells(`A${hppTitleRow.number}:K${hppTitleRow.number}`)
    hppTitleRow.alignment = { horizontal: 'left', vertical: 'middle' }

    const getMerchUnitEconomics = (productName, avgPrice) => {
      const lower = String(productName || '').toLowerCase()
      if (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('kaos') || lower.includes('baju')) {
        return {
          category: 'T-Shirt',
          unitProduksi: 100000,
          unitFreebies: 10000,
          unitDesign: 5000,
          unitKardus: 3000,
          unitIncome: avgPrice > 118000 ? (avgPrice - 118000) : 32000
        }
      }
      if (lower.includes('towel') || lower.includes('handuk')) {
        return {
          category: 'Towel',
          unitProduksi: 60000,
          unitFreebies: 5000,
          unitDesign: 5000,
          unitKardus: 3000,
          unitIncome: avgPrice > 73000 ? (avgPrice - 73000) : 7000
        }
      }
      if (lower.includes('bibs') || lower.includes('bib')) {
        return {
          category: 'Bibs',
          unitProduksi: 55000,
          unitFreebies: 10000,
          unitDesign: 5000,
          unitKardus: 3000,
          unitIncome: avgPrice > 73000 ? (avgPrice - 73000) : 27000
        }
      }
      // Fallback merchandise umum
      const estProduksi = Math.round((avgPrice || 50000) * 0.6)
      const estKardus = 3000
      const estFreebies = 5000
      const estDesign = 5000
      const estIncome = Math.max(0, (avgPrice || 50000) - (estProduksi + estKardus + estFreebies + estDesign))
      return {
        category: 'Merch Lainnya',
        unitProduksi: estProduksi,
        unitFreebies: estFreebies,
        unitDesign: estDesign,
        unitKardus: estKardus,
        unitIncome: estIncome
      }
    }

    const hppHeaderRow = worksheet.addRow([
      'Nama Produk', '', '',
      'Qty', 'Total Omset',
      'Biaya Produksi', 'Freebies', 'Design Fee', 'Kardus',
      'NET INCOME MANAJEMEN', ''
    ])
    worksheet.mergeCells(`A${hppHeaderRow.number}:C${hppHeaderRow.number}`)
    worksheet.mergeCells(`J${hppHeaderRow.number}:K${hppHeaderRow.number}`)
    hppHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    hppHeaderRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })

    let aggProduksi = 0
    let aggFreebies = 0
    let aggDesign = 0
    let aggKardus = 0
    let aggIncome = 0

    Object.keys(itemSummary).forEach(name => {
      const prod = itemSummary[name]
      if (prod.total <= 0) return
      const avgPrice = prod.total > 0 ? (prod.revenue / prod.total) : 0
      const eco = getMerchUnitEconomics(name, avgPrice)

      const totProduksi = prod.total * eco.unitProduksi
      const totFreebies = prod.total * eco.unitFreebies
      const totDesign = prod.total * eco.unitDesign
      const totKardus = prod.total * eco.unitKardus
      const totIncome = prod.total * eco.unitIncome

      aggProduksi += totProduksi
      aggFreebies += totFreebies
      aggDesign += totDesign
      aggKardus += totKardus
      aggIncome += totIncome

      const row = worksheet.addRow([
        name, '', '',
        prod.total,
        prod.revenue,
        totProduksi,
        totFreebies,
        totDesign,
        totKardus,
        totIncome, ''
      ])
      worksheet.mergeCells(`A${row.number}:C${row.number}`)
      worksheet.mergeCells(`J${row.number}:K${row.number}`)

      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
      for (let c = 5; c <= 10; c++) {
        row.getCell(c).numFmt = '"Rp "#,##0'
        row.getCell(c).alignment = { vertical: 'middle', horizontal: 'right' }
      }
      row.getCell(10).font = { bold: true, color: { argb: 'FF9D26FF' } }

      row.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      })
    })

    // Total Ringkasan HPP & Margin Row
    const hppSummaryRow = worksheet.addRow([
      'TOTAL KESELURUHAN (HPP & NET INCOME)', '', '',
      totalItemsSold,
      grandTotalRevenue,
      aggProduksi,
      aggFreebies,
      aggDesign,
      aggKardus,
      aggIncome, ''
    ])
    worksheet.mergeCells(`A${hppSummaryRow.number}:C${hppSummaryRow.number}`)
    worksheet.mergeCells(`J${hppSummaryRow.number}:K${hppSummaryRow.number}`)
    hppSummaryRow.font = { bold: true }
    hppSummaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }

    hppSummaryRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
    for (let c = 5; c <= 10; c++) {
      hppSummaryRow.getCell(c).numFmt = '"Rp "#,##0'
      hppSummaryRow.getCell(c).alignment = { vertical: 'middle', horizontal: 'right' }
    }
    hppSummaryRow.getCell(10).font = { bold: true, color: { argb: 'FF166534' } }

    hppSummaryRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=Noize_Merch_Orders_${Date.now()}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error('Error exporting merch orders:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
