import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Swal from 'sweetalert2'
import { getValidAdminToken } from './authSession'

export const stripEmoji = (text) => String(text || '').replace(/[^a-zA-Z0-9\s()]/gu, '').trim()

export const getMerchUnitEconomics = (productName, avgPrice) => {
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

export const generateExcel = async ({ scope, value, params, events, api }) => {
  try {
    const exportParams = { ...params }

    if (scope === 'event') {
      exportParams.event_id = value
      delete exportParams.dateFrom
      delete exportParams.dateTo
      delete exportParams.is_ots
      delete exportParams.search
      delete exportParams.month
    } else if (scope === 'month') {
      delete exportParams.event_id
      delete exportParams.is_ots
      delete exportParams.search
      delete exportParams.status

      exportParams.month = value
      const [yearStr, monthStr] = String(value || '').split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10)
      if (!isNaN(year) && !isNaN(month)) {
        const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
        const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
        exportParams.dateFrom = firstDay.toISOString()
        exportParams.dateTo = lastDay.toISOString()
      }
    }

    const queryString = new URLSearchParams(exportParams).toString()
    const token = getValidAdminToken()
    const apiUrl = import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')

    Swal.fire({ title: 'Downloading Excel...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

    const response = await fetch(`${apiUrl}/orders/export/excel?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) throw new Error('Export gagal')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeSuffix = (() => {
      if (scope === 'event' && value) {
        const ev = events.find(e => e.id === value)
        return ev ? `${ev.nama}_${ev.tanggal}_${ev.bulan}_${ev.tahun}` : `Event_${value}`
      }
      if (scope === 'month') return `Bulanan_${value}`
      return 'Filtered'
    })().replace(/[^a-zA-Z0-9_\-]/g, '_')

    a.download = `Noize_Report_${safeSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    Swal.fire({ icon: 'success', title: 'Excel berhasil didownload!', timer: 2000, showConfirmButton: false })
  } catch (error) {
    console.error('Error exporting:', error)
    Swal.fire({ icon: 'error', title: 'Export Gagal', text: error.message })
  }
}

export const generateMerchExcel = async ({ scope = 'all', value, statusFilter, searchQuery, batchId, batchName }) => {
  try {
    const params = {}
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter
    if (searchQuery) params.search = searchQuery

    if (scope === 'batch' && value) {
      params.batch_id = value
    } else if (scope === 'month' && value) {
      params.month = value
      const [yearStr, monthStr] = String(value).split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10)
      if (!isNaN(year) && !isNaN(month)) {
        const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
        const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
        params.dateFrom = firstDay.toISOString()
        params.dateTo = lastDay.toISOString()
      }
    } else if (scope === 'all') {
      // all batches
    } else if (batchId && batchId !== 'all') {
      params.batch_id = batchId
    }

    const queryString = new URLSearchParams(params).toString()
    const token = getValidAdminToken()
    const apiUrl = import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')

    Swal.fire({ title: 'Downloading Merch Excel...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

    const response = await fetch(`${apiUrl}/merch-orders/export/excel?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) throw new Error('Export gagal')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    let safeSuffix = ''
    if (scope === 'all') safeSuffix = '_Semua_Batch'
    else if (scope === 'month') safeSuffix = `_Bulanan_${value}`
    else if (scope === 'batch') safeSuffix = `_${(batchName || 'Batch').replace(/[^a-zA-Z0-9_-]/g, '_')}`
    else if (batchName) safeSuffix = `_${batchName.replace(/[^a-zA-Z0-9_-]/g, '_')}`

    a.download = `Noize_Merch_Orders${safeSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    Swal.fire({ icon: 'success', title: 'Excel Merch berhasil didownload!', timer: 2000, showConfirmButton: false })
  } catch (error) {
    console.error('Error exporting merch:', error)
    Swal.fire({ icon: 'error', title: 'Export Gagal', text: error.message })
  }
}

const loadLogoDataUrl = async () => {
  const logoPaths = [
    '/noize-logo.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png'
  ]
  for (const path of logoPaths) {
    try {
      const res = await fetch(path)
      if (!res.ok) continue
      const blob = await res.blob()
      const image = await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to load logo'))
        img.src = URL.createObjectURL(blob)
      })
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0)
      URL.revokeObjectURL(image.src)
      return canvas.toDataURL('image/png')
    } catch (error) {
      // Try next logo path
    }
  }
  return null
}

export const generateMerchPDF = async ({ api, scope = 'all', value, statusFilter, searchQuery, batchId, batchName }) => {
  try {
    Swal.fire({ title: 'Generating Merch PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

    const params = {}
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter
    if (searchQuery) params.search = searchQuery

    if (scope === 'batch' && value) {
      params.batch_id = value
    } else if (scope === 'month' && value) {
      params.month = value
      const [yearStr, monthStr] = String(value).split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10)
      if (!isNaN(year) && !isNaN(month)) {
        const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
        const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
        params.dateFrom = firstDay.toISOString()
        params.dateTo = lastDay.toISOString()
      }
    } else if (scope === 'all') {
      // all batches
    } else if (batchId && batchId !== 'all') {
      params.batch_id = batchId
    }

    const res = await api.get('/merch-orders', { params })
    let orders = res.data.data || []

    if (!orders || orders.length === 0) throw new Error('Tidak ada data pesanan untuk diexport.')

    // Urut dari order terbaru
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const formatCurrency = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`
    const formatDate = (val) => {
      if (!val) return '-'
      const d = new Date(val)
      if (isNaN(d.getTime())) return '-'
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const day = d.getDate()
      const month = months[d.getMonth()]
      const year = d.getFullYear()
      const hours = String(d.getHours()).padStart(2, '0')
      const mins = String(d.getMinutes()).padStart(2, '0')
      return `${day} ${month} ${year}, ${hours}.${mins}`
    }

    const getStatusBadge = (status) => {
      const s = String(status || '').toLowerCase()
      if (s === 'pending') {
        return { text: 'PENDING', textColor: [180, 83, 9], fillColor: [254, 243, 199] }
      }
      if (s === 'checked') {
        return { text: 'LUNAS', textColor: [22, 101, 52], fillColor: [220, 252, 231] }
      }
      if (s === 'completed') {
        return { text: 'DI AMBIL', textColor: [255, 255, 255], fillColor: [6, 95, 70] }
      }
      if (s === 'cancelled') {
        return { text: 'BATAL', textColor: [153, 27, 27], fillColor: [254, 226, 226] }
      }
      return { text: String(status || '-').toUpperCase(), textColor: [51, 65, 85], fillColor: [241, 245, 249] }
    }

    // 1. Ringkasan Finansial Lunas vs Pending
    const paidOrders = orders.filter(o => o.status === 'checked' || o.status === 'completed')
    const lunasRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total_harga) || 0), 0)
    const pendingOrders = orders.filter(o => o.status === 'pending')
    const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (Number(o.total_harga) || 0), 0)
    const totalTerjual = orders.reduce((sum, o) => sum + (o.merch_order_items?.reduce((p, it) => p + (Number(it.quantity) || 0), 0) || 0), 0)
    const totalOrders = orders.length

    // 2. Muat Master Katalog Produk Merchandise untuk Klasifikasi Akurat
    const itemSummary = {}
    const totalQtyPerSize = {}
    const SIZE_ORDER = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

    try {
      const merchParams = { admin: 'true' }
      if (scope === 'batch' && value) {
        merchParams.batch_id = value
      } else if (batchId && batchId !== 'all' && scope !== 'all' && scope !== 'month') {
        merchParams.batch_id = batchId
      } else {
        merchParams.all = 'true'
      }
      const merchRes = await api.get('/merchandise', { params: merchParams })
      const catalogItems = merchRes.data?.data || []
      catalogItems.forEach(prod => {
        const fullName = String(prod.nama || '').trim()
        const isApparel = prod.category === 'apparel' || (prod.category !== 'other' && Array.isArray(prod.sizes) && prod.sizes.length > 0)
        if (!itemSummary[fullName]) {
          itemSummary[fullName] = {
            fullName,
            category: isApparel ? 'apparel' : 'other',
            hasSizes: isApparel,
            qty: 0,
            lunasQty: 0,
            lunasRevenue: 0,
            pendingQty: 0,
            pendingRevenue: 0,
            totalRevenue: 0,
            sizes: {}
          }
        }
      })
    } catch (catalogErr) {
      console.warn('Gagal memuat master katalog merchandise:', catalogErr)
    }

    // Iterasi seluruh order untuk akumulasi produk dan ukuran
    orders.forEach(o => {
      const isOrderPaid = (o.status === 'checked' || o.status === 'completed')
      const isOrderPending = (o.status === 'pending')

      o.merch_order_items?.forEach(it => {
        const fullName = String(it.item_name || 'Item').trim()
        const rawSize = it.size ? it.size.trim().toUpperCase() : ''
        const isApparelSize = rawSize && !['NO SIZE', 'NOSIZE', 'NONE', '-', 'NON'].includes(rawSize)
        const qty = Number(it.quantity) || 0
        const price = Number(it.harga) || 0
        const subtotal = qty * price

        if (!itemSummary[fullName]) {
          itemSummary[fullName] = {
            fullName,
            category: isApparelSize ? 'apparel' : 'other',
            hasSizes: isApparelSize,
            qty: 0,
            lunasQty: 0,
            lunasRevenue: 0,
            pendingQty: 0,
            pendingRevenue: 0,
            totalRevenue: 0,
            sizes: {}
          }
        }

        itemSummary[fullName].qty += qty
        itemSummary[fullName].totalRevenue += subtotal

        if (isOrderPaid) {
          itemSummary[fullName].lunasQty += qty
          itemSummary[fullName].lunasRevenue += subtotal
        } else if (isOrderPending) {
          itemSummary[fullName].pendingQty += qty
          itemSummary[fullName].pendingRevenue += subtotal
        }

        if (isApparelSize) {
          itemSummary[fullName].hasSizes = true
          itemSummary[fullName].category = 'apparel'
          itemSummary[fullName].sizes[rawSize] = (itemSummary[fullName].sizes[rawSize] || 0) + qty
          totalQtyPerSize[rawSize] = (totalQtyPerSize[rawSize] || 0) + qty
        }
      })
    })

    const activeSizes = SIZE_ORDER.filter(s => (totalQtyPerSize[s] || 0) > 0)
    Object.keys(totalQtyPerSize).forEach(s => {
      if (!SIZE_ORDER.includes(s) && totalQtyPerSize[s] > 0) {
        activeSizes.push(s)
      }
    })

    // Inisialisasi Dokumen PDF Portrait A4
    const logoDataUrl = await loadLogoDataUrl()
    const doc = new jsPDF('p', 'mm', 'a4')

    // 1. Header Banner Hijau (#0B8A1F) + Logo
    doc.setFillColor(11, 138, 31)
    doc.rect(0, 0, 210, 24, 'F')
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 5, 14, 14)
    }
    let headerTitle = 'NOIZE - LAPORAN MERCH'
    let displayScope = batchName || 'Semua Batch'

    if (scope === 'all') {
      headerTitle = 'NOIZE - LAPORAN MERCH (SEMUA BATCH)'
      displayScope = 'Semua Batch (Full Konsolidasi)'
    } else if (scope === 'month') {
      const [yearStr, monthStr] = String(value || '').split('-')
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const mNum = parseInt(monthStr, 10)
      const mDisplay = !isNaN(mNum) && monthNames[mNum - 1] ? `${monthNames[mNum - 1]} ${yearStr}` : value
      headerTitle = 'NOIZE - LAPORAN MERCH BULANAN'
      displayScope = `Periode Bulan: ${mDisplay}`
    } else if (scope === 'batch') {
      displayScope = `Batch: ${batchName || 'Batch Terpilih'}`
    }

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(headerTitle, 105, 15, { align: 'center' })

    // Info Tanggal & Cakupan
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 31)
    doc.text(`Cakupan: ${displayScope}`, 14, 35.5)

    // 2. 4 Kartu Ringkasan
    autoTable(doc, {
      startY: 40,
      head: [['PENDAPATAN LUNAS', 'MENUNGGU BAYAR', 'TOTAL TERJUAL', 'TOTAL ORDER']],
      body: [
        [
          formatCurrency(lunasRevenue),
          formatCurrency(pendingRevenue),
          `${totalTerjual} pcs`,
          `${totalOrders} order`
        ],
        [
          { content: `${paidOrders.length} order lunas`, styles: { fontSize: 7, fontStyle: 'normal', textColor: [22, 101, 52] } },
          { content: `${pendingOrders.length} order pending`, styles: { fontSize: 7, fontStyle: 'normal', textColor: [180, 83, 9] } },
          { content: 'Total item terjual', styles: { fontSize: 7, fontStyle: 'normal', textColor: [5, 150, 105] } },
          { content: 'Semua status transaksi', styles: { fontSize: 7, fontStyle: 'normal', textColor: [71, 85, 105] } }
        ]
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, halign: 'center', cellPadding: 2 },
      headStyles: { fillColor: [240, 253, 244], textColor: [22, 101, 52], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { textColor: [21, 128, 61], cellWidth: 45.5 },
        1: { textColor: [180, 83, 9], cellWidth: 45.5 },
        2: { textColor: [5, 150, 105], cellWidth: 45.5 },
        3: { textColor: [30, 41, 59], cellWidth: 45.5 }
      },
      margin: { left: 14, right: 14 }
    })

    let currentY = doc.lastAutoTable.finalY + 8

    // Perhitungan HPP & Alokasi Biaya Merch
    let aggProduksi = 0
    let aggFreebies = 0
    let aggDesign = 0
    let aggKardus = 0
    let aggIncome = 0

    const hppTableRows = []
    Object.values(itemSummary).forEach(prod => {
      const soldQty = prod.lunasQty > 0 ? prod.lunasQty : prod.qty
      if (soldQty <= 0) return
      const avgPrice = prod.qty > 0 ? (prod.totalRevenue / prod.qty) : 0
      const eco = getMerchUnitEconomics(prod.fullName, avgPrice)

      const totProduksi = soldQty * eco.unitProduksi
      const totFreebies = soldQty * eco.unitFreebies
      const totDesign = soldQty * eco.unitDesign
      const totKardus = soldQty * eco.unitKardus
      const totIncome = soldQty * eco.unitIncome
      const revenue = prod.lunasRevenue > 0 ? prod.lunasRevenue : prod.totalRevenue

      aggProduksi += totProduksi
      aggFreebies += totFreebies
      aggDesign += totDesign
      aggKardus += totKardus
      aggIncome += totIncome

      hppTableRows.push([
        prod.fullName,
        `${soldQty} pcs`,
        formatCurrency(revenue),
        formatCurrency(totProduksi),
        formatCurrency(totKardus),
        formatCurrency(totFreebies),
        formatCurrency(totDesign),
        formatCurrency(totIncome)
      ])
    })

    if (hppTableRows.length > 0) {
      hppTableRows.push([
        { content: 'TOTAL KESELURUHAN', styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } },
        { content: `${totalTerjual} pcs`, styles: { fontStyle: 'bold', halign: 'center', fillColor: [220, 252, 231] } },
        { content: formatCurrency(lunasRevenue || grandTotalRevenue), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231] } },
        { content: formatCurrency(aggProduksi), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231] } },
        { content: formatCurrency(aggKardus), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231] } },
        { content: formatCurrency(aggFreebies), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231] } },
        { content: formatCurrency(aggDesign), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231] } },
        { content: formatCurrency(aggIncome), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231], textColor: [21, 128, 61] } }
      ])
    }

    // 2b. Kartu Ringkasan Alokasi Kas & Profit Merchandise
    autoTable(doc, {
      startY: currentY,
      head: [['BIAYA PRODUKSI (VENDOR)', 'PACKAGING (KARDUS)', 'OPERASIONAL (FREEBIES+DESAIN)', 'NET INCOME MANAJEMEN']],
      body: [
        [
          formatCurrency(aggProduksi),
          formatCurrency(aggKardus),
          formatCurrency(aggFreebies + aggDesign),
          formatCurrency(aggIncome)
        ]
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, halign: 'center', cellPadding: 2 },
      headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { textColor: [6, 95, 70], cellWidth: 45.5 },
        1: { textColor: [22, 101, 52], cellWidth: 45.5 },
        2: { textColor: [5, 150, 105], cellWidth: 45.5 },
        3: { textColor: [21, 128, 61], cellWidth: 45.5 }
      },
      margin: { left: 14, right: 14 }
    })

    currentY = doc.lastAutoTable.finalY + 8

    // Section Header Helper (Keep with Next)
    const addSectionHeader = (title) => {
      const pageHeight = doc.internal.pageSize.getHeight()
      if (currentY + 28 > pageHeight) {
        doc.addPage()
        currentY = 15
      }
      doc.setFillColor(157, 38, 255) // Electric Violet #9D26FF
      doc.rect(14, currentY, 182, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9.5)
      doc.setFont('helvetica', 'bold')
      doc.text(title, 16, currentY + 5)
      currentY += 9
    }

    // 3. Section RINGKASAN PER PRODUK
    addSectionHeader('RINGKASAN PER PRODUK')

    const allProducts = Object.values(itemSummary).sort((a, b) => b.qty - a.qty)
    const apparelProducts = allProducts.filter(p => p.category === 'apparel' || p.hasSizes)
    const accessoryProducts = allProducts.filter(p => p.category !== 'apparel' && !p.hasSizes)

    const summaryBody = []

    // Sub-header Baju / Apparel
    if (apparelProducts.length > 0) {
      summaryBody.push([
        { content: 'KATEGORI: BAJU / APPAREL', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52], fontSize: 7.5 } }
      ])
      apparelProducts.forEach(p => {
        summaryBody.push([
          { content: p.fullName, styles: { fontStyle: 'bold' } },
          { content: `${p.qty} pcs`, styles: { halign: 'center' } },
          { content: formatCurrency(p.lunasRevenue), styles: { halign: 'right' } },
          { content: formatCurrency(p.pendingRevenue), styles: { halign: 'right' } },
          { content: formatCurrency(p.totalRevenue), styles: { halign: 'right', fontStyle: 'bold' } }
        ])
      })
    }

    // Sub-header Non-Baju / Aksesoris
    if (accessoryProducts.length > 0) {
      summaryBody.push([
        { content: 'KATEGORI: NON-BAJU / AKSESORIS', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52], fontSize: 7.5 } }
      ])
      accessoryProducts.forEach(p => {
        summaryBody.push([
          { content: p.fullName, styles: { fontStyle: 'bold' } },
          { content: `${p.qty} pcs`, styles: { halign: 'center' } },
          { content: formatCurrency(p.lunasRevenue), styles: { halign: 'right' } },
          { content: formatCurrency(p.pendingRevenue), styles: { halign: 'right' } },
          { content: formatCurrency(p.totalRevenue), styles: { halign: 'right', fontStyle: 'bold' } }
        ])
      })
    }

    // Baris Total Keseluruhan (Hijau tua teks putih)
    const grandLunas = allProducts.reduce((s, p) => s + p.lunasRevenue, 0)
    const grandPending = allProducts.reduce((s, p) => s + p.pendingRevenue, 0)
    const grandTotal = allProducts.reduce((s, p) => s + p.totalRevenue, 0)

    summaryBody.push([
      { content: 'TOTAL KESELURUHAN', styles: { fontStyle: 'bold', fillColor: [6, 95, 70], textColor: [255, 255, 255] } },
      { content: `${totalTerjual} pcs`, styles: { fontStyle: 'bold', fillColor: [6, 95, 70], textColor: [255, 255, 255], halign: 'center' } },
      { content: formatCurrency(grandLunas), styles: { fontStyle: 'bold', fillColor: [6, 95, 70], textColor: [255, 255, 255], halign: 'right' } },
      { content: formatCurrency(grandPending), styles: { fontStyle: 'bold', fillColor: [6, 95, 70], textColor: [255, 255, 255], halign: 'right' } },
      { content: formatCurrency(grandTotal), styles: { fontStyle: 'bold', fillColor: [6, 95, 70], textColor: [255, 255, 255], halign: 'right' } }
    ])

    autoTable(doc, {
      startY: currentY,
      head: [['Produk', 'Terjual', 'Lunas', 'Pending', 'Total']],
      body: summaryBody,
      theme: 'grid',
      headStyles: { fillColor: [7, 145, 8], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 74 },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' }
      },
      margin: { left: 14, right: 14 },
      rowPageBreak: 'avoid',
      showHead: 'everyPage'
    })
    currentY = doc.lastAutoTable.finalY + 8

    // 4. Section REKAP UKURAN (Matriks - Khusus Baju / Apparel)
    if (activeSizes.length > 0 && apparelProducts.length > 0) {
      addSectionHeader('REKAP UKURAN (APPAREL)')
      const matrixHead = [['Produk', ...activeSizes, 'Total']]
      const matrixBody = []

      apparelProducts.forEach(p => {
        matrixBody.push([
          p.fullName,
          ...activeSizes.map(s => p.sizes[s] ? `${p.sizes[s]}` : '-'),
          `${p.qty} pcs`
        ])
      })

      const totalApparelQty = apparelProducts.reduce((sum, p) => sum + p.qty, 0)
      matrixBody.push([
        { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [22, 101, 52] } },
        ...activeSizes.map(s => ({ content: `${totalQtyPerSize[s] || 0}`, styles: { fontStyle: 'bold', halign: 'center', fillColor: [220, 252, 231], textColor: [22, 101, 52] } })),
        { content: `${totalApparelQty} pcs`, styles: { fontStyle: 'bold', halign: 'center', fillColor: [220, 252, 231], textColor: [22, 101, 52] } }
      ])

      const prodWidth = 80
      const totalColWidth = 22
      const remWidth = 182 - prodWidth - totalColWidth
      const sizeColWidth = Math.floor(remWidth / activeSizes.length)
      const colStyles = {
        0: { cellWidth: prodWidth },
        [activeSizes.length + 1]: { cellWidth: totalColWidth, halign: 'center' }
      }
      activeSizes.forEach((_, idx) => {
        colStyles[idx + 1] = { cellWidth: sizeColWidth, halign: 'center' }
      })

      autoTable(doc, {
        startY: currentY,
        head: matrixHead,
        body: matrixBody,
        theme: 'grid',
        headStyles: { fillColor: [6, 95, 70], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: colStyles,
        margin: { left: 14, right: 14 },
        rowPageBreak: 'avoid',
        showHead: 'everyPage'
      })
      currentY = doc.lastAutoTable.finalY + 8
    }

    // Section Analisis HPP & Margin Merch
    if (hppTableRows.length > 0) {
      addSectionHeader('ANALISIS HPP, BIAYA OPERASIONAL & NET INCOME')
      autoTable(doc, {
        startY: currentY,
        head: [['Produk', 'Qty', 'Omset', 'Produksi', 'Kardus', 'Freebies', 'Desain', 'Net Income']],
        body: hppTableRows,
        theme: 'grid',
        headStyles: { fillColor: [6, 95, 70], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 44 },
          1: { cellWidth: 16, halign: 'center' },
          2: { cellWidth: 20, halign: 'right' },
          3: { cellWidth: 20, halign: 'right' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 18, halign: 'right' },
          7: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] }
        },
        margin: { left: 14, right: 14 },
        rowPageBreak: 'avoid',
        showHead: 'everyPage'
      })
      currentY = doc.lastAutoTable.finalY + 8
    }

    // 5. Section DETAIL ORDER
    addSectionHeader('DETAIL ORDER')
    let hasMismatch = false
    const detailRows = []

    orders.forEach((order) => {
      const itemsLines = []
      const priceLines = []

      const totalItems = order.merch_order_items?.length || 0
      order.merch_order_items?.forEach((it, idx) => {
        const rawSize = it.size ? it.size.trim().toUpperCase() : ''
        const isApparelSize = rawSize && !['NO SIZE', 'NOSIZE', 'NONE', '-', 'NON'].includes(rawSize)
        const sizeTag = isApparelSize ? ` [${rawSize}]` : ''
        const lineQty = Number(it.quantity) || 1
        const linePrice = Number(it.harga) || 0
        const itemFullName = it.item_name || 'Item'
        const prefix = totalItems > 1 ? `${idx + 1}. ` : ''

        itemsLines.push(`${prefix}${itemFullName}${sizeTag} x${lineQty}`)
        priceLines.push(formatCurrency(linePrice * lineQty))
      })

      const itemsSum = order.merch_order_items?.reduce((s, it) => s + (Number(it.harga || 0) * Number(it.quantity || 0)), 0) || 0
      const diff = (Number(order.total_harga) || 0) - itemsSum

      if (diff > 0) {
        itemsLines.push('+ Ongkir / Lain-lain')
        priceLines.push(formatCurrency(diff))
        hasMismatch = true
      } else if (diff < 0) {
        itemsLines.push('- Diskon / Potongan')
        priceLines.push(formatCurrency(Math.abs(diff)))
        hasMismatch = true
      }

      // Gunakan separator baris kosong antar item jika lebih dari 1 produk
      const sep = totalItems > 1 ? '\n\n' : '\n'
      const itemsText = itemsLines.join(sep) || '-'
      const priceText = priceLines.join(sep) || '-'
      const batchTag = (scope === 'all' || scope === 'month') && order.merch_batches?.nama ? `[${order.merch_batches.nama}]\n` : ''
      const contactText = `${batchTag}WA: ${order.whatsapp || '-'}${order.instagram ? '\nIG: ' + order.instagram : ''}`
      const badge = getStatusBadge(order.status)

      detailRows.push([
        { content: order.order_number || '-', styles: { fontStyle: 'bold', fontSize: 6.8, overflow: 'ellipsize' } },
        { content: order.nama_lengkap || '-', styles: { fontSize: 7.5 } },
        { content: contactText, styles: { fontSize: 7 } },
        { content: itemsText, styles: { fontSize: 7.5 } },
        { content: priceText, styles: { fontSize: 7.5, halign: 'right' } },
        { content: formatCurrency(order.total_harga), styles: { halign: 'right', fontStyle: 'bold', fontSize: 7.5 } },
        { content: badge.text, styles: { halign: 'center', fontStyle: 'bold', textColor: badge.textColor, fillColor: badge.fillColor, fontSize: 6.8 } },
        { content: formatDate(order.created_at), styles: { fontSize: 6.5, halign: 'center' } }
      ])

      // Baris Catatan / Alamat di bawah order terkait
      if (order.catatan && order.catatan.trim()) {
        detailRows.push([
          {
            content: `Catatan / Alamat: "${order.catatan.trim()}"`,
            colSpan: 8,
            styles: {
              fontStyle: 'italic',
              textColor: [100, 116, 139],
              fillColor: [248, 250, 252],
              fontSize: 7,
              cellPadding: { top: 1.5, bottom: 2, left: 3, right: 3 }
            }
          }
        ])
      }
    })

    autoTable(doc, {
      startY: currentY,
      head: [['Kode', 'Customer', 'Kontak', 'Items', 'Harga', 'Total', 'Status', 'Tanggal']],
      body: detailRows.length ? detailRows : [['-', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [7, 145, 8], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 22 },
        2: { cellWidth: 20 },
        3: { cellWidth: 45 },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 18, halign: 'right' },
        6: { cellWidth: 16, halign: 'center' },
        7: { cellWidth: 18, halign: 'center' }
      },
      margin: { left: 14, right: 14 },
      rowPageBreak: 'avoid',
      showHead: 'everyPage'
    })
    currentY = doc.lastAutoTable.finalY + 4

    // Peringatan selisih jika ada
    if (hasMismatch) {
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(220, 38, 38)
      doc.text('* Catatan: Terdapat penyesuaian (ongkir / diskon / selisih harga) pada rincian pesanan di atas.', 14, currentY + 3)
    }

    // Footer Tiap Halaman: "Halaman X dari Y"
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      const pageHeight = doc.internal.pageSize.getHeight()
      const pageWidth = doc.internal.pageSize.getWidth()
      doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
      doc.text('Noize Official Merchandise Report', 14, pageHeight - 8)
    }

    let safeSuffix = ''
    if (scope === 'all') safeSuffix = '_Semua_Batch'
    else if (scope === 'month') safeSuffix = `_Bulanan_${value}`
    else if (scope === 'batch') safeSuffix = `_${(batchName || 'Batch').replace(/[^a-zA-Z0-9_-]/g, '_')}`
    else if (batchName) safeSuffix = `_${batchName.replace(/[^a-zA-Z0-9_-]/g, '_')}`

    doc.save(`Noize_Merch_Orders${safeSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`)
    Swal.fire({ icon: 'success', title: 'PDF Merch Berhasil!', timer: 1500, showConfirmButton: false })
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Gagal PDF Merch', text: error.message })
  }
}

export const generatePDF = async ({ api, scope, value, params, events }) => {
  try {
    Swal.fire({ title: 'Generating PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
    const exportParams = { ...params }
    let monthDisplay = ''

    if (scope === 'event') {
      exportParams.event_id = value
      delete exportParams.dateFrom
      delete exportParams.dateTo
      delete exportParams.is_ots
      delete exportParams.search
      delete exportParams.month
    } else if (scope === 'month') {
      delete exportParams.event_id
      delete exportParams.is_ots
      delete exportParams.search
      delete exportParams.status

      exportParams.month = value
      const [yearStr, monthStr] = String(value || '').split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10)
      if (!isNaN(year) && !isNaN(month)) {
        const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
        const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
        exportParams.dateFrom = firstDay.toISOString()
        exportParams.dateTo = lastDay.toISOString()

        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        monthDisplay = `${monthNames[month - 1]} ${year}`
      }
    }

    const res = await api.get('/orders', { params: exportParams })
    const orders = res.data.data
    if (!orders || orders.length === 0) throw new Error('Tidak ada data untuk diexport.')

    const formatCurrency = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`
    const formatDate = (val) => {
      if (!val) return '-'
      const d = new Date(val)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
    const statusLabel = (status) => {
      if (status === 'pending') return 'BELUM BAYAR'
      if (status === 'checked') return 'DI BAYAR'
      if (status === 'completed') return 'DI AMBIL'
      return String(status || '-').toUpperCase()
    }

    // Kelompokkan order berdasarkan event
    const eventGroupsMap = new Map()
    orders.forEach(order => {
      const eId = order.event_id ? String(order.event_id) : 'unknown'
      if (!eventGroupsMap.has(eId)) {
        const ev = events?.find(e => String(e.id) === eId)
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
      const eg = eventGroupsMap.get(eId)
      eg.orders.push(order)

      const orderItemEvents = (order.order_items || [])
        .map(i => i.event_id || order.event_id)
        .filter(Boolean)
      const uniqueEvIds = [...new Set(orderItemEvents)]
      const names = uniqueEvIds
        .map(id => events?.find(e => String(e.id) === String(id))?.nama || (order.events && String(order.events.id) === String(id) ? order.events.nama : null))
        .filter(Boolean)
      order._eventName = names.length > 0 ? names.join(', ') : eg.nama
    })

    const distinctEvents = Array.from(eventGroupsMap.values())
    const isMultiEvent = distinctEvents.length > 1 || scope === 'month'

    // Kalkulasi finansial per event dan akumulasi bulanan
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
          let name = stripEmoji(String(item.item_name || '').replace('Cheki ', '').replace(' (Pre-Order)', ''))
          if (name.toLowerCase().includes('all member') || name.toLowerCase().includes('group')) {
            name = 'All Member (Group)'
          }
          if (!memberStats[name]) memberStats[name] = { qty: 0, otsQty: 0, poQty: 0, revenue: 0 }
          const qty = item.quantity || 0
          const price = Number(item.price ?? item.harga ?? 0)

          memberStats[name].qty += qty
          if (order.is_ots) memberStats[name].otsQty += qty
          else memberStats[name].poQty += qty
          memberStats[name].revenue += (qty * price)
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

    const buildOrderRows = (list) => list.map(order => {
      const items = order.order_items?.map(item => `${stripEmoji(item.item_name)} x${item.quantity}`).join(', ') || '-'
      const qty = order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
      const contact = order.is_ots ? '-' : ([order.whatsapp, order.instagram].filter(Boolean).join(' / ') || '-')
      const row = [
        order.order_number || '-',
        stripEmoji(order.nama_lengkap || '-'),
        contact
      ]
      if (isMultiEvent) {
        row.push(order._eventName || '-')
      }
      row.push(
        order.is_ots ? 'OTS' : 'PO',
        items,
        qty,
        formatCurrency(order.total_harga),
        statusLabel(order.status),
        formatDate(order.created_at)
      )
      return row
    })

    const logoDataUrl = await loadLogoDataUrl()
    const doc = new jsPDF('p', 'mm', 'a4')

    // 1. Header Banner Hijau (#9D26FF) + Logo
    doc.setFillColor(7, 145, 8)
    doc.rect(0, 0, 210, 24, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 5, 14, 14)
    }

    const mainTitle = isMultiEvent
      ? 'NOIZE - LAPORAN KONSOLIDASI BULANAN'
      : 'NOIZE - LAPORAN PENJUALAN EVENT'
    doc.text(mainTitle, 105, 15, { align: 'center' })

    // Meta Header
    doc.setTextColor(22, 101, 52)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    let currentY = 31
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, currentY)

    if (isMultiEvent) {
      currentY += 4.5
      doc.text(`Periode Bulan: ${monthDisplay || value}`, 14, currentY)
      currentY += 4.5
      doc.text(`Daftar Event Terlibat (${distinctEvents.length} Event):`, 14, currentY)
      currentY += 2

      // Tabel mini ringkasan event-event dalam bulan ini
      const eventListRows = distinctEvents.map((eg, idx) => [
        idx + 1,
        eg.nama,
        eg.eventObj ? `${eg.eventObj.tanggal || ''} ${eg.eventObj.bulan || ''} ${eg.eventObj.tahun || ''}`.trim() : '-',
        eg.lokasi,
        `${eg.orders.length} order`,
        `${eg.chekiSold} units`
      ])

      autoTable(doc, {
        startY: currentY,
        head: [['No', 'Nama Event', 'Tanggal / Bulan', 'Lokasi', 'Total Order', 'Total Cheki']],
        body: eventListRows,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.5 },
        headStyles: { fillColor: [6, 95, 70], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 46 },
          2: { cellWidth: 34 },
          3: { cellWidth: 36 },
          4: { cellWidth: 28, halign: 'center' },
          5: { cellWidth: 28, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      })
      currentY = doc.lastAutoTable.finalY + 6
    } else {
      const singleEv = distinctEvents[0]
      const eventLabel = singleEv?.fullLabel || 'Semua Event'
      currentY += 4.5
      doc.text(`Event: ${eventLabel}`, 14, currentY)
      if (singleEv?.lokasi) {
        currentY += 4.5
        doc.text(`Lokasi: ${singleEv.lokasi}`, 14, currentY)
      }
      currentY += 4
    }

    // Helper untuk Section Header Hijau
    const addSectionHeader = (title, bg = [6, 95, 70]) => {
      const pageHeight = doc.internal.pageSize.getHeight()
      if (currentY + 25 > pageHeight) {
        doc.addPage()
        currentY = 15
      }
      doc.setFillColor(...bg)
      doc.rect(14, currentY, 182, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9.5)
      doc.setFont('helvetica', 'bold')
      doc.text(title, 16, currentY + 5)
      currentY += 9
    }

    // 2. KARTU RINGKASAN OMSET (WARNA HIJAU)
    autoTable(doc, {
      startY: currentY,
      head: [[
        isMultiEvent ? 'TOTAL OMSET BULANAN' : 'TOTAL OMSET (GROSS)',
        'TOTAL POLAROID',
        'OTS ORDERS',
        'PO ORDERS'
      ]],
      body: [
        [
          formatCurrency(grandTotalRevenue),
          `${grandTotalChekiSold} units`,
          `${grandTotalOtsOrders} orders`,
          `${grandTotalPoOrders} orders`
        ]
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, halign: 'center', cellPadding: 2 },
      headStyles: { fillColor: [220, 252, 231], textColor: [22, 101, 52], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { textColor: [21, 128, 61], cellWidth: 45.5 },
        1: { textColor: [22, 163, 74], cellWidth: 45.5 },
        2: { textColor: [5, 150, 105], cellWidth: 45.5 },
        3: { textColor: [16, 185, 129], cellWidth: 45.5 }
      },
      margin: { left: 14, right: 14 }
    })
    currentY = doc.lastAutoTable.finalY + 6

    // 3. KARTU ALOKASI KAS & DIVIDEN (WARNA HIJAU RESMI, BEBAS BIRU/HITAM)
    autoTable(doc, {
      startY: currentY,
      head: [['MODAL FILM (15K/LBR)', 'HONOR STAFF (2K/LBR)', 'TOTAL GAJI MEMBER', 'LABA BERSIH MGMT']],
      body: [[
        formatCurrency(grandTotalModalCheki),
        formatCurrency(grandTotalStaffHonor),
        formatCurrency(grandTotalMemberFees),
        formatCurrency(grandTotalManagementCut)
      ]],
      theme: 'grid',
      styles: { fontSize: 8.5, halign: 'center', cellPadding: 2 },
      headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { textColor: [6, 78, 59], cellWidth: 45.5 },
        1: { textColor: [21, 128, 61], cellWidth: 45.5 },
        2: { textColor: [7, 145, 8], cellWidth: 45.5 },
        3: { textColor: [22, 101, 52], cellWidth: 45.5 }
      },
      margin: { left: 14, right: 14 }
    })
    currentY = doc.lastAutoTable.finalY + 8

    // 4. MATRIKS GAJI BULANAN PER MEMBER (Jika Multi-Event)
    if (isMultiEvent) {
      addSectionHeader(`MATRIKS REKAP GAJI BULANAN PER MEMBER (${distinctEvents.length} EVENT)`)

      const matrixHead = [
        'Member / Talent',
        ...distinctEvents.map(eg => eg.nama.length > 15 ? eg.nama.substring(0, 15) + '..' : eg.nama),
        'Total Gaji Bulanan'
      ]

      const matrixBody = allMembersList.map(mName => {
        let memberMonthTotal = 0
        const evFees = distinctEvents.map(eg => {
          const fee = eg.memberFeeDetails[mName]?.totalTakeHome || 0
          memberMonthTotal += fee
          return formatCurrency(fee)
        })
        return [
          mName,
          ...evFees,
          formatCurrency(memberMonthTotal)
        ]
      })

      matrixBody.push([
        { content: 'TOTAL DIBAGIKAN KE MEMBER', styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [22, 101, 52] } },
        ...distinctEvents.map(eg => ({
          content: formatCurrency(eg.totalMemberFee),
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231], textColor: [22, 101, 52] }
        })),
        {
          content: formatCurrency(grandTotalMemberFees),
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231], textColor: [7, 145, 8] }
        }
      ])

      const memberColWidth = 46
      const totalColWidth = 36
      const remWidth = 182 - memberColWidth - totalColWidth
      const evColWidth = Math.max(20, Math.floor(remWidth / distinctEvents.length))

      const colStyles = {
        0: { cellWidth: memberColWidth },
        [distinctEvents.length + 1]: { cellWidth: totalColWidth, halign: 'right', fontStyle: 'bold', textColor: [7, 145, 8] }
      }
      distinctEvents.forEach((_, idx) => {
        colStyles[idx + 1] = { cellWidth: evColWidth, halign: 'right' }
      })

      autoTable(doc, {
        startY: currentY,
        head: [matrixHead],
        body: matrixBody,
        theme: 'grid',
        headStyles: { fillColor: [7, 145, 8], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: colStyles,
        margin: { left: 14, right: 14 },
        rowPageBreak: 'avoid',
        showHead: 'everyPage'
      })
      currentY = doc.lastAutoTable.finalY + 8
    }

    // 5. RINCIAN PER EVENT
    distinctEvents.forEach((eg, egIdx) => {
      const sectionTitle = isMultiEvent
        ? `RINCIAN EVENT ${egIdx + 1}: ${eg.fullLabel}`
        : `RINCIAN GAJI & FEE MEMBER (PO 10k, OTS 15k, Grup dibagi rata ${eg.activeMemberCount} member)`

      addSectionHeader(sectionTitle)

      if (isMultiEvent) {
        autoTable(doc, {
          startY: currentY,
          head: [['OMSET EVENT', 'MODAL FILM', 'HONOR STAFF', 'FEE MEMBER', 'PROFIT MGMT']],
          body: [[
            formatCurrency(eg.revenue),
            formatCurrency(eg.modalCheki),
            formatCurrency(eg.staffHonor),
            formatCurrency(eg.totalMemberFee),
            formatCurrency(eg.mgmtCut)
          ]],
          theme: 'grid',
          styles: { fontSize: 7.5, halign: 'center', cellPadding: 1.5 },
          headStyles: { fillColor: [240, 253, 244], textColor: [22, 101, 52], fontStyle: 'bold' },
          bodyStyles: { fontStyle: 'bold', textColor: [6, 95, 70] },
          margin: { left: 14, right: 14 }
        })
        currentY = doc.lastAutoTable.finalY + 4
      }

      const evMemRows = Object.keys(eg.memberFeeDetails).sort((a, b) => a.localeCompare(b)).map(name => {
        const d = eg.memberFeeDetails[name]
        return [
          name,
          d.poQty,
          formatCurrency(d.poFee),
          d.otsQty,
          formatCurrency(d.otsFee),
          formatCurrency(d.groupShare),
          formatCurrency(d.totalTakeHome)
        ]
      })

      if (evMemRows.length > 0) {
        evMemRows.push([
          { content: `SUBTOTAL EVENT (${eg.nama})`, styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [22, 101, 52] } },
          { content: String(eg.singlePoQty), styles: { fontStyle: 'bold', halign: 'center', fillColor: [220, 252, 231] } },
          { content: formatCurrency(eg.singlePoQty * 10000), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231] } },
          { content: String(eg.singleOtsQty), styles: { fontStyle: 'bold', halign: 'center', fillColor: [220, 252, 231] } },
          { content: formatCurrency(eg.singleOtsQty * 15000), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231] } },
          { content: formatCurrency(eg.groupPool), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231] } },
          { content: formatCurrency(eg.totalMemberFee), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231], textColor: [7, 145, 8] } }
        ])
      }

      autoTable(doc, {
        startY: currentY,
        head: [['Member / Talent', 'PO Qty', 'Fee PO', 'OTS Qty', 'Fee OTS', 'Share Grup', 'Total Fee Event']],
        body: evMemRows.length ? evMemRows : [['-', '-', '-', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [6, 95, 70], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          1: { halign: 'center', cellWidth: 15 },
          2: { halign: 'right', cellWidth: 22 },
          3: { halign: 'center', cellWidth: 15 },
          4: { halign: 'right', cellWidth: 22 },
          5: { halign: 'right', cellWidth: 22 },
          6: { halign: 'right', fontStyle: 'bold', textColor: [7, 145, 8] }
        },
        margin: { left: 14, right: 14 }
      })
      currentY = doc.lastAutoTable.finalY + 8
    })

    // Single-event: tampilkan tabel Performa Member jika bukan multi-event
    if (!isMultiEvent) {
      addSectionHeader('MEMBER PERFORMANCE (A-Z)')
      const singleEv = distinctEvents[0]
      const memberBody = Object.entries(singleEv?.memberStats || {})
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, stats]) => [stripEmoji(name), stats.qty, stats.otsQty, stats.poQty, formatCurrency(stats.revenue)])

      autoTable(doc, {
        startY: currentY,
        head: [['Member / Lineup', 'Total Qty', 'OTS Qty', 'PO Qty', 'Revenue']],
        body: memberBody.length ? memberBody : [['-', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [7, 145, 8], textColor: 255 },
        styles: { fontSize: 7.5 },
        columnStyles: {
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      })
      currentY = doc.lastAutoTable.finalY + 8
    }

    // 6. DETAIL TRANSAKSI LENGKAP
    addSectionHeader('DETAIL TRANSAKSI LENGKAP')

    const allOtsOrders = orders.filter(o => o.is_ots)
    const allPoOrders = orders.filter(o => !o.is_ots)

    const tableHeaders = ['Kode', 'Customer', 'Kontak']
    if (isMultiEvent) tableHeaders.push('Event')
    tableHeaders.push('Tipe', 'Items', 'Qty', 'Total', 'Status', 'Tanggal')

    // OTS Section
    doc.setFillColor(5, 150, 105)
    doc.rect(14, currentY, 182, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('TRANSAKSI ON THE SPOT (OTS)', 16, currentY + 4)
    currentY += 8

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: buildOrderRows(allOtsOrders).length ? buildOrderRows(allOtsOrders) : [['-', '-', '-', ...(isMultiEvent ? ['-'] : []), '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      styles: { fontSize: 6.8, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [5, 150, 105], textColor: 255 },
      columnStyles: {
        [isMultiEvent ? 5 : 4]: { cellWidth: 38 },
        [isMultiEvent ? 7 : 6]: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    })
    currentY = doc.lastAutoTable.finalY + 6

    // PO Section
    const pageHeight = doc.internal.pageSize.getHeight()
    if (currentY + 25 > pageHeight) {
      doc.addPage()
      currentY = 15
    }

    doc.setFillColor(22, 163, 74)
    doc.rect(14, currentY, 182, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('TRANSAKSI PRE-ORDER (PO)', 16, currentY + 4)
    currentY += 8

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: buildOrderRows(allPoOrders).length ? buildOrderRows(allPoOrders) : [['-', '-', '-', ...(isMultiEvent ? ['-'] : []), '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      styles: { fontSize: 6.8, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
      columnStyles: {
        [isMultiEvent ? 5 : 4]: { cellWidth: 38 },
        [isMultiEvent ? 7 : 6]: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    })

    // Footer Tiap Halaman: "Halaman X dari Y" & "Noize Official Sales Report"
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      const pHeight = doc.internal.pageSize.getHeight()
      const pWidth = doc.internal.pageSize.getWidth()
      doc.text(`Halaman ${i} dari ${totalPages}`, pWidth - 14, pHeight - 8, { align: 'right' })
      doc.text('Noize Official Sales Report', 14, pHeight - 8)
    }

    const safeLabel = (scope === 'month' ? `Bulanan_${monthDisplay || value || 'Semua'}` : (distinctEvents[0]?.fullLabel || 'Semua_Event')).replace(/[^a-zA-Z0-9_\-]/g, '_')
    doc.save(`Noize_Orders_${safeLabel}_${new Date().toISOString().slice(0, 10)}.pdf`)
    Swal.fire({ icon: 'success', title: 'PDF Berhasil!', timer: 1500, showConfirmButton: false })
  } catch (error) {
    console.error('Error generating PDF:', error)
    Swal.fire({ icon: 'error', title: 'Gagal PDF', text: error.message })
  }
}
