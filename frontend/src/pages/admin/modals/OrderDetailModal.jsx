import React, { useState, useEffect } from 'react'
import { FaDownload, FaTimes, FaEye, FaPlus, FaMinus, FaTrash, FaSave, FaMoneyBillWave, FaQrcode } from 'react-icons/fa'
import { showToast } from '../../../lib/toast'
import api from '../../../lib/api'

const OrderDetailModal = ({ isOpen = false, order, events = [], onClose, onOrderUpdated }) => {
  const [editName, setEditName] = useState('')
  const [editPayment, setEditPayment] = useState('Cash')
  const [editItems, setEditItems] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (order) {
      setEditName(order.nama_lengkap || '')
      setEditPayment((order.payment_proof_url === 'QR' || order.payment_proof_url === 'QR Code') ? 'QR' : 'Cash')
      setEditItems((order.order_items || []).map(item => ({ ...item })))
    }
  }, [order])

  if (!isOpen || !order) {
    return null
  }

  const handleUpdateQty = (idx, delta) => {
    setEditItems(prev => {
      const next = [...prev]
      const newQty = (next[idx].quantity || 1) + delta
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx)
      }
      next[idx] = { ...next[idx], quantity: newQty }
      return next
    })
  }

  const handleSaveOts = async (e) => {
    e.preventDefault()
    if (!editName.trim()) {
      showToast.error('Nama pembeli tidak boleh kosong')
      return
    }
    if (editItems.length === 0) {
      showToast.error('Minimal harus ada 1 item pesanan')
      return
    }
    setSaving(true)
    try {
      await api.patch(`/orders/${order.id}/ots`, {
        nama_lengkap: editName.trim(),
        payment_method: editPayment,
        items: editItems
      })
      showToast.success('Order OTS berhasil diperbarui!')
      if (onOrderUpdated) onOrderUpdated()
      onClose()
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Gagal memperbarui order OTS')
    } finally {
      setSaving(false)
    }
  }

  const generateReceipt = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const W = 500
    const pad = 30
    const lineH = 22

    const orderItemEvents = (order.order_items || [])
      .map(i => i.event_id || order.event_id)
      .filter(Boolean)
    const uniqueEvIds = [...new Set(orderItemEvents)]
    const eventNames = uniqueEvIds
      .map(id => events.find(e => String(e.id) === String(id))?.nama || (order.events && String(order.events.id) === String(id) ? order.events.nama : null))
      .filter(Boolean)
    const eventName = eventNames.length > 0
      ? eventNames.join(', ')
      : (order.event_name || events.find(e => e.id === order.event_id)?.nama || '-')

    const items = order.order_items || []

    const logo = new Image()
    logo.src = '/noize-logo.png'

    logo.onload = () => {
      let totalLines = 0
      totalLines += 8
      totalLines += 1
      totalLines += items.length
      totalLines += 3
      totalLines += 6
      if (order.catatan) totalLines += 2
      totalLines += 2
      totalLines += 3

      const H = 100 + (pad * 2) + (totalLines * lineH) + 100
      canvas.width = W
      canvas.height = H

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, W, H)

      let y = pad + 20

      const drawText = (text, x, size, color = '#000000', align = 'left', weight = 'normal', font = 'Courier New') => {
        ctx.fillStyle = color
        ctx.font = `${weight} ${size}px ${font}`
        ctx.textAlign = align
        ctx.fillText(text, x, y)
      }

      const drawDashedLine = () => {
        ctx.setLineDash([5, 5])
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(pad, y)
        ctx.lineTo(W - pad, y)
        ctx.stroke()
        ctx.setLineDash([])
        y += lineH
      }

      const logoW = 80
      const logoH = 80 * (logo.height / logo.width)
      ctx.drawImage(logo, (W - logoW) / 2, y, logoW, logoH)
      y += logoH + 20

      drawText('NOIZE', W / 2, 24, '#000000', 'center', 'bold')
      y += lineH + 5
      drawText('Official Store', W / 2, 14, '#000000', 'center', 'normal')
      y += lineH + 5

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      const boxW = 280
      const boxH = 34
      ctx.strokeRect((W - boxW) / 2, y, boxW, boxH)
      y += 24
      drawText(order.order_number, W / 2, 16, '#000000', 'center', 'bold')
      y += lineH + 10

      drawDashedLine()

      const dateStr = new Date(order.created_at).toLocaleString('id-ID')
      drawText(dateStr, pad, 12, '#000000', 'left', 'normal')
      drawText('Admin', W - pad, 12, '#000000', 'right', 'normal')
      y += lineH
      drawText(`Event: ${eventName}`, pad, 12, '#000000', 'left', 'normal')
      y += lineH

      drawDashedLine()

      items.forEach(item => {
        drawText(item.item_name, pad, 12, '#000000', 'left', 'bold')
        y += lineH - 4

        drawText(`${item.quantity} x ${item.price.toLocaleString('id-ID')}`, pad + 20, 12, '#000000', 'left', 'normal')
        drawText(`Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`, W - pad, 12, '#000000', 'right', 'normal')
        y += lineH + 4
      })

      drawDashedLine()

      drawText('Total QTY:', pad, 12, '#000000', 'left', 'normal')
      const totalQty = items.reduce((acc, i) => acc + i.quantity, 0)
      drawText(totalQty.toString(), W - pad, 12, '#000000', 'right', 'normal')
      y += lineH

      drawText('Sub Total', pad, 12, '#000000', 'left', 'normal')
      drawText(`Rp ${order.total_harga.toLocaleString('id-ID')}`, W - pad, 12, '#000000', 'right', 'normal')
      y += lineH + 5

      drawText('TOTAL', pad, 20, '#000000', 'left', 'bold')
      drawText(`Rp ${order.total_harga.toLocaleString('id-ID')}`, W - pad, 20, '#000000', 'right', 'bold')
      y += lineH + 10

      drawText('Metode Bayar', pad, 12, '#000000', 'left', 'normal')
      const bayarStr = order.is_ots
        ? (order.payment_proof_url === 'QR' ? 'OTS (QRIS)' : 'OTS (Cash)')
        : (order.payment_method === 'qris' ? 'QRIS' : 'Transfer Bank')
      drawText(bayarStr, W - pad, 12, '#000000', 'right', 'normal')
      y += lineH

      if (!order.is_ots && order.payment_method !== 'qris') {
        drawText('Bank', pad, 12, '#000000', 'left', 'normal')
        drawText('BCA', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
        drawText('No. Rek', pad, 12, '#000000', 'left', 'normal')
        drawText('8162015779', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
        drawText('A/n', pad, 12, '#000000', 'left', 'normal')
        drawText('REYHAN ALFA SUKMAJATI', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
      }

      drawDashedLine()

      drawText('Nama  :', pad, 12, '#000000', 'left', 'normal')
      drawText(order.nama_lengkap || '-', pad + 80, 12, '#000000', 'left', 'bold')
      y += lineH
      drawText('Kontak:', pad, 12, '#000000', 'left', 'normal')
      const kontak = order.whatsapp && order.whatsapp !== '-' ? order.whatsapp : order.instagram
      drawText(kontak || '-', pad + 80, 12, '#000000', 'left', 'normal')
      y += lineH

      if (order.catatan) {
        drawText('Catatan:', pad, 12, '#000000', 'left', 'normal')
        y += lineH
        const words = order.catatan.split(' ')
        let line = ''
        words.forEach(word => {
          if (ctx.measureText(line + word).width > W - (pad * 2)) {
            drawText(line, pad, 12, '#000000', 'left', 'italic')
            line = word + ' '
            y += lineH
          } else {
            line += word + ' '
          }
        })
        drawText(line, pad, 12, '#000000', 'left', 'italic')
        y += lineH
      }

      drawDashedLine()

      y += 10
      drawText('Terima kasih telah berbelanja', W / 2, 14, '#000000', 'center', 'normal')
      y += lineH
      drawText('IG: @noize.official', W / 2, 14, '#000000', 'center', 'bold')
      y += lineH

      const link = document.createElement('a')
      link.download = `Nota_${order.order_number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    logo.onerror = () => {
      showToast.error('Gagal memuat logo. Pastikan koneksi internet aman.')
    }
  }

  // Group order_items by event
  const itemsByEvent = React.useMemo(() => {
    const groups = new Map()
    ;(order.order_items || []).forEach(item => {
      const evId = item.event_id || order.event_id || 'unknown'
      if (!groups.has(String(evId))) {
        const ev = events.find(e => String(e.id) === String(evId)) || (order.events && String(order.events.id) === String(evId) ? order.events : null)
        groups.set(String(evId), {
          event: ev,
          eventName: ev?.nama || ev?.name || (order.is_ots ? 'OTS Non-Event' : 'Umum'),
          eventDate: ev?.tanggal ? `${ev.tanggal} ${ev.bulan || ''} ${ev.tahun || ''}`.trim() : null,
          isSpecial: ev?.is_special || ev?.type === 'special',
          themeColor: ev?.theme_color,
          items: []
        })
      }
      groups.get(String(evId)).items.push(item)
    })
    return Array.from(groups.values())
  }, [order, events])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#13121D] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar text-white">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#161f33] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h3 className="text-base md:text-lg font-bold text-white">
              {order.is_ots ? 'Edit Order OTS' : 'Detail Order'}
            </h3>
            <button
              onClick={generateReceipt}
              className="bg-[#9D26FF]/20 hover:bg-[#9D26FF]/30 text-[#9D26FF] border border-[#9D26FF]/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Download Nota"
            >
              <FaDownload /> Nota
            </button>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-lg transition-colors p-1">
            <FaTimes />
          </button>
        </div>

        {order.is_ots ? (
          <form onSubmit={handleSaveOts} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Nama Pembeli</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 text-white text-sm rounded-xl focus:border-[#9D26FF] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditPayment('Cash')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                    editPayment === 'Cash'
                      ? 'bg-[#9D26FF] text-white border-[#9D26FF]'
                      : 'bg-[#1E1C2E] text-zinc-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  <FaMoneyBillWave /> Cash
                </button>
                <button
                  type="button"
                  onClick={() => setEditPayment('QR')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                    editPayment === 'QR'
                      ? 'bg-[#9D26FF] text-white border-[#9D26FF]'
                      : 'bg-[#1E1C2E] text-zinc-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  <FaQrcode /> QRIS
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">Item Pesanan</label>
              <div className="space-y-2">
                {editItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 bg-[#181625] border border-white/10 p-3 rounded-xl">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.item_name}</div>
                      <div className="text-[11px] text-[#9D26FF] font-mono">
                        Rp {(Number(item.price) || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center justify-center"
                      >
                        <FaMinus className="text-[9px]" />
                      </button>
                      <span className="text-xs font-bold text-white px-2 font-mono">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center justify-center"
                      >
                        <FaPlus className="text-[9px]" />
                      </button>
                      {editItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditItems(prev => prev.filter((_, i) => i !== idx))}
                          className="ml-1 w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center"
                          title="Hapus Item"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="font-bold text-sm text-zinc-300">Total Harga:</span>
              <span className="font-black text-2xl text-[#9D26FF]">
                Rp {editItems.reduce((sum, i) => sum + ((Number(i.price) || 0) * (i.quantity || 1)), 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9D26FF] hover:bg-[#8215db] text-white text-xs font-bold transition disabled:opacity-50"
              >
                <FaSave /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        ) : (
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#161f33]/60 p-4 rounded-xl border border-white/5">
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Nama Lengkap</p>
              <p className="font-bold text-white text-sm mt-0.5">{order.nama_lengkap}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp</p>
              <p className="font-bold text-[#00e5e5] text-sm mt-0.5">{order.whatsapp}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Instagram</p>
              <p className="font-semibold text-zinc-300 text-sm mt-0.5">{order.instagram || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tipe Order</p>
              <p className="font-semibold text-xs mt-0.5">
                <span className={`px-2 py-0.5 rounded-md font-bold ${order.is_ots ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'}`}>
                  {order.is_ots ? 'OTS' : 'Pre-Order'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Metode Bayar</p>
              <p className="font-semibold text-xs mt-0.5">
                <span className={`px-2 py-0.5 rounded-md font-bold ${
                  order.is_ots
                    ? (order.payment_proof_url === 'QR' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-[#24C6F5]/15 text-[#24C6F5] border border-[#24C6F5]/30')
                    : (order.payment_method === 'qris' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30')
                }`}>
                  {order.is_ots
                    ? `OTS · ${order.payment_proof_url === 'QR' ? 'QRIS' : 'Cash'}`
                    : (order.payment_method === 'qris' ? 'QRIS' : 'Transfer Bank')}
                </span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300 mb-3">Order Items</h4>
            <div className="space-y-4">
              {itemsByEvent.map((group, gIdx) => (
                <div key={gIdx} className="bg-[#181625] border border-white/10 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {group.eventName}
                      </span>
                      {group.isSpecial && (
                        <span
                          className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border"
                          style={{
                            color: group.themeColor || '#9D26FF',
                            borderColor: group.themeColor || '#9D26FF',
                            background: `${group.themeColor || '#9D26FF'}15`
                          }}
                        >
                          Special
                        </span>
                      )}
                    </div>
                    {group.eventDate && (
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {group.eventDate}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-[#12111A] border border-white/5 p-2.5 rounded-lg">
                        <span className="text-xs font-medium text-zinc-200">
                          {item.item_name} <span className="text-[#9D26FF] font-bold ml-1">x{item.quantity}</span>
                        </span>
                        <span className="font-bold text-[#9D26FF] text-xs font-mono">
                          Rp {((item.price || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="font-bold text-sm text-zinc-300">Total Harga:</span>
              <span className="font-black text-2xl text-[#9D26FF]">
                Rp {order.total_harga?.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {order.catatan && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 mb-2">Catatan Order</h4>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs text-amber-200 whitespace-pre-wrap">{order.catatan}</p>
              </div>
            </div>
          )}

          {order.payment_proof_url && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300 mb-3">Bukti Pembayaran</h4>
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={order.payment_proof_url}
                  alt="Payment Proof"
                  className="w-full max-w-md mx-auto rounded-xl border border-white/10 shadow-xl hover:opacity-90 transition-opacity cursor-pointer max-h-80 object-contain bg-black/40"
                />
              </a>
              <div className="text-center mt-2">
                <a
                  href={order.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#00e5e5] hover:underline"
                >
                  <FaEye /> Lihat Bukti Ukuran Penuh
                </a>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}

export default OrderDetailModal
