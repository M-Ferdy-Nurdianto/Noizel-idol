import React, { useState, useRef } from 'react'
import Swal from 'sweetalert2'
import { FaShoppingCart, FaPlus, FaTimes, FaFileExcel, FaBox, FaEye, FaTrash, FaStar, FaTruck, FaClipboardList, FaCopy, FaAngleDown, FaAngleUp } from 'react-icons/fa'
import { showToast } from '../../../lib/toast'
import RenderTable from '../components/RenderTable'
import CustomSelect from '../components/CustomSelect'
import ExportModal from '../../../components/ExportModal'
import MerchExportModal from '../../../components/MerchExportModal'
import OTSOrderInlineForm from '../components/OTSOrderInlineForm'
import OTSSpecialInlineForm from '../components/OTSSpecialInlineForm'
import Skeleton from '../../../components/Skeleton'

const OrdersTab = ({
  orders,
  events,
  loading,
  orderSubTab,
  setOrderSubTab,
  statusFilter,
  setStatusFilter,
  eventFilter,
  setEventFilter,
  dateFilter,
  setDateFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  searchQuery,
  setSearchQuery,
  onViewOrder,
  onDeleteOrder,
  onStatusChange,
  onShowOTSModal,
  onShowOTSSpecialModal,
  onExportExcel,
  onExportPdf,
  merchOrders,
  loadingMerchOrders,
  merchOrderSearch,
  setMerchOrderSearch,
  merchOrderStatusFilter,
  setMerchOrderStatusFilter,
  merchBatches = [],
  merchBatchFilter = 'all',
  setMerchBatchFilter,
  onMerchOrderStatusChange,
  onDeleteMerchOrder,
  onFetchMerchOrders,
  onExportMerchExcel,
  onExportMerchPdf,
  members = [],
  hargaOtsPerMember = 25000,
  hargaOtsGrup = 30000,
  onRefreshOrders,
  onOtsCartActiveChange
}) => {
  // Helper to check if order is from special event
  const isSpecialOrder = (order) => {
    if (order.order_items?.some(i => {
      const evId = i.event_id || order.event_id
      const event = events.find(e => String(e.id) === String(evId))
      return event && (event.is_special || event.type === 'special')
    })) {
      return true
    }
    const event = events.find(e => String(e.id) === String(order.event_id))
    return Boolean(event && (event.is_special || event.type === 'special'))
  }

  // Filter Logic
  const specialOrders = orders.filter(o => isSpecialOrder(o))
  const otsOrders = orders.filter(o => o.is_ots && !isSpecialOrder(o))
  const poOrders = orders.filter(o => !o.is_ots && !isSpecialOrder(o))

  const [showExportModal, setShowExportModal] = useState(false)
  const [showMerchExportModal, setShowMerchExportModal] = useState(false)
  const [showInlineOTS, setShowInlineOTS] = useState(false)
  const [showInlineSpecialOTS, setShowInlineSpecialOTS] = useState(false)
  const otsTopRef = useRef(null)
  const otsSpecialTopRef = useRef(null)

  const [showAllNotes, setShowAllNotes] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})

  const toggleNote = (orderId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  const copyToClipboard = (text, label = 'Catatan / Alamat') => {
    if (!text) return
    navigator.clipboard.writeText(text)
    showToast.success(`${label} disalin!`)
  }

  const handleToggleOTS = () => {
    setShowInlineOTS(prev => {
      const next = !prev
      if (!next && onOtsCartActiveChange) {
        onOtsCartActiveChange(false)
      }
      if (next) {
        setTimeout(() => {
          if (otsTopRef.current) {
            otsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
          const adminMain = document.querySelector('main')
          if (adminMain) adminMain.scrollTo({ top: 0, behavior: 'smooth' })
        }, 50)
      }
      return next
    })
  }

  const handleToggleSpecialOTS = () => {
    setShowInlineSpecialOTS(prev => {
      const next = !prev
      if (!next && onOtsCartActiveChange) {
        onOtsCartActiveChange(false)
      }
      if (next) {
        setTimeout(() => {
          if (otsSpecialTopRef.current) {
            otsSpecialTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
          const adminMain = document.querySelector('main')
          if (adminMain) adminMain.scrollTo({ top: 0, behavior: 'smooth' })
        }, 50)
      }
      return next
    })
  }

  const handleSelectSubTab = (tabId) => {
    setOrderSubTab(tabId)
    if (tabId === 'special') {
      // Otomatis arahkan ke event spesial aktif jika saat ini filter masih mengarah ke event reguler
      const currentIsSpecial = events.some(e => String(e.id) === String(eventFilter) && (e.is_special || e.type === 'special'))
      if (!currentIsSpecial) {
        const activeSpecial = events.find(e => (e.is_special || e.type === 'special') && !e.is_past) || events.find(e => e.is_special || e.type === 'special')
        if (activeSpecial) {
          setEventFilter(String(activeSpecial.id))
        } else {
          setEventFilter('all')
        }
      }
    } else if (tabId === 'all' || tabId === 'ots' || tabId === 'po') {
      // Jika kembali ke regular, pastikan tidak tertinggal di filter event spesial
      const currentIsSpecial = events.some(e => String(e.id) === String(eventFilter) && (e.is_special || e.type === 'special'))
      if (currentIsSpecial) {
        const activeRegular = events.find(e => !e.is_special && e.type !== 'special' && !e.is_past) || events.find(e => !e.is_special && e.type !== 'special')
        if (activeRegular) {
          setEventFilter(String(activeRegular.id))
        } else {
          setEventFilter('all')
        }
      }
    }
  }

  const handleTriggerExport = async (exportData) => {
    const { format, scope, value, financialConfig } = exportData
    if (format === 'excel') {
      await onExportExcel({ scope, value, financialConfig })
    } else {
      await onExportPdf({ scope, value, financialConfig })
    }
  }

  return (
    <div className="space-y-6">
      <div ref={otsTopRef} />
      {/* Inline OTS Form (Collapsible, Direct in Page) */}
      {showInlineOTS && (
        <OTSOrderInlineForm
          members={members}
          events={events}
          onClose={() => {
            setShowInlineOTS(false)
            if (onOtsCartActiveChange) onOtsCartActiveChange(false)
          }}
          onSuccess={() => {
            if (onOtsCartActiveChange) onOtsCartActiveChange(false)
            if (onRefreshOrders) onRefreshOrders(true)
          }}
          onCartChange={(count) => {
            if (onOtsCartActiveChange) onOtsCartActiveChange(count > 0)
          }}
          hargaOtsPerMember={hargaOtsPerMember}
          hargaOtsGrup={hargaOtsGrup}
        />
      )}
      {/* Sub-tabs */}
      <div className="bg-[#13121D]/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex overflow-x-auto md:overflow-x-visible overflow-y-hidden gap-2 scrollbar-hide py-0.5">
          {[
            { id: 'all', label: 'All (Reg)', color: 'bg-[#9D26FF] text-white shadow-[0_0_15px_rgba(157,38,255,0.4)]' },
            { id: 'ots', label: 'OTS', color: 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' },
            { id: 'po', label: 'PO', color: 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' },
            { id: 'special', label: 'Special', color: 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' },
            { id: 'merch', label: 'Merch', color: 'bg-[#FF1CE3] text-white shadow-[0_0_15px_rgba(255,28,227,0.4)]', onClick: () => { handleSelectSubTab('merch'); onFetchMerchOrders() } }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={tab.onClick || (() => handleSelectSubTab(tab.id))}
              className={`flex-1 min-w-[90px] shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors duration-150 ${
                orderSubTab === tab.id
                  ? `${tab.color}`
                  : 'text-zinc-400 hover:bg-[#1E1C2E] hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cheki Status Legend & Filters (Only when viewing Cheki sub-tabs) */}
      {orderSubTab !== 'merch' && (
        <>
          {/* Status Legend */}
          <div className="bg-[#13121D]/80 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center text-xs text-zinc-300 backdrop-blur-md">
            <span className="font-bold uppercase tracking-wider text-[#24C6F5]">Panduan Status:</span>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></span>
                <span><strong className="text-amber-300">Unchecked:</strong> Order Baru</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#24C6F5]/20 border border-[#24C6F5]/50"></span>
                <span><strong className="text-[#24C6F5]">Checked:</strong> Lunas (Valid)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#9D26FF]/20 border border-[#9D26FF]/50"></span>
                <span><strong className="text-[#9D26FF]">Completed:</strong> Selesai (Diambil)</span>
              </div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="bg-[#13121D]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <input
                type="text"
                placeholder="Cari nama atau order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[44px] px-4 bg-[#1E1C2E] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-sm focus:outline-none focus:border-[#9D26FF] focus:ring-1 focus:ring-[#9D26FF] transition-all"
              />

              <CustomSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                variant="search"
                options={[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'pending', label: 'Unchecked' },
                  { value: 'checked', label: 'Checked' },
                  { value: 'completed', label: 'Completed' }
                ]}
              />

              <CustomSelect
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                variant="search"
                options={[
                  { value: 'all', label: orderSubTab === 'special' ? 'Semua Event Spesial' : 'Semua Event' },
                  ...(orderSubTab === 'special'
                    ? events.filter(ev => ev.is_special || ev.type === 'special')
                    : events.filter(ev => !ev.is_special && ev.type !== 'special')
                  ).map(ev => ({
                    value: ev.id,
                    label: `${ev.nama}${ev.theme_name ? ` (${ev.theme_name})` : ''} - ${ev.bulan} ${ev.tahun}`
                  }))
                ]}
              />

              <CustomSelect
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                variant="search"
                options={[
                  { value: 'all', label: 'Semua Waktu' },
                  { value: 'week', label: 'Minggu Ini' },
                  { value: 'month', label: 'Bulan Ini' },
                  { value: 'custom', label: 'Custom Range' }
                ]}
              />
            </div>

            {dateFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-[44px] px-4 bg-[#1E1C2E] border border-white/10 text-white text-sm rounded-xl focus:border-[#9D26FF]"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-[44px] px-4 bg-[#1E1C2E] border border-white/10 text-white text-sm rounded-xl focus:border-[#9D26FF]"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end border-t border-white/10 pt-4 flex-wrap">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-xs font-bold border border-white/10 active:scale-95"
              >
                <FaFileExcel /> Export Data
              </button>
            </div>
          </div>
        </>
      )}

      {/* Orders Tables */}
      {orderSubTab === 'special' && (
        <div className="space-y-6">
          <div ref={otsSpecialTopRef} />
          {showInlineSpecialOTS && (
            <OTSSpecialInlineForm
              members={members}
              events={events}
              defaultEventId={eventFilter !== 'all' ? eventFilter : ''}
              onClose={() => {
                setShowInlineSpecialOTS(false)
                if (onOtsCartActiveChange) onOtsCartActiveChange(false)
              }}
              onSuccess={() => {
                if (onOtsCartActiveChange) onOtsCartActiveChange(false)
                if (onRefreshOrders) onRefreshOrders(true)
              }}
              onCartChange={(count) => {
                if (onOtsCartActiveChange) onOtsCartActiveChange(count > 0)
              }}
              hargaOtsPerMember={hargaOtsPerMember}
            />
          )}

          <RenderTable
            data={specialOrders}
            title="Special Event Orders"
            events={events}
            emptyMessage="Tidak ada order special event"
            loading={loading}
            onView={onViewOrder}
            onDelete={onDeleteOrder}
            onStatusChange={onStatusChange}
            action={
              <button
                onClick={handleToggleSpecialOTS}
                className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-[0_0_15px_rgba(236,72,153,0.3)] active:scale-95 ${
                  showInlineSpecialOTS
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
              >
                {showInlineSpecialOTS ? <><FaTimes /> Tutup Form OTS Spesial</> : <><FaPlus /> Order OTS Spesial</>}
              </button>
            }
          />
        </div>
      )}

      {(orderSubTab === 'all' || orderSubTab === 'ots') && (
        <RenderTable
          data={otsOrders}
          title="Order OTS (On The Spot)"
          events={events}
          emptyMessage="Tidak ada data OTS"
          loading={loading}
          onView={onViewOrder}
          onDelete={onDeleteOrder}
          onStatusChange={onStatusChange}
          action={
            <button
              onClick={handleToggleOTS}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-[0_0_15px_rgba(157,38,255,0.3)] active:scale-95 ${
                showInlineOTS 
                  ? 'bg-zinc-700 hover:bg-zinc-600 text-white' 
                  : 'bg-[#9D26FF] hover:bg-[#8215db] text-white'
              }`}
            >
              {showInlineOTS ? <><FaTimes /> Tutup Form OTS</> : <><FaPlus /> Order OTS</>}
            </button>
          }
        />
      )}

      {(orderSubTab === 'all' || orderSubTab === 'po') && (
        <RenderTable
          data={poOrders}
          title="Pre-Order (Online)"
          events={events}
          emptyMessage="Tidak ada data Pre-Order"
          loading={loading}
          onView={onViewOrder}
          onDelete={onDeleteOrder}
          onStatusChange={onStatusChange}
        />
      )}

      {orderSubTab === 'merch' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Order Merch</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMerchExportModal(true)}
                className="bg-[#9D26FF] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#8215db] flex items-center gap-2 text-xs transition-all shadow-[0_0_15px_rgba(157,38,255,0.3)]"
              >
                <FaFileExcel /> Export Merch
              </button>
              <button
                onClick={onFetchMerchOrders}
                className="bg-[#9D26FF] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#8215db] flex items-center gap-2 text-xs transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Panduan Status Merch */}
          <div className="bg-[#13121D]/80 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center text-xs text-zinc-300 backdrop-blur-md">
            <span className="font-bold uppercase tracking-wider text-[#24C6F5]">Panduan Status Merch:</span>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></span>
                <span><strong className="text-amber-300">Pending:</strong> Order Baru</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#24C6F5]/20 border border-[#24C6F5]/50"></span>
                <span><strong className="text-[#24C6F5]">Checked:</strong> Lunas (Valid)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#9D26FF]/20 border border-[#9D26FF]/50"></span>
                <span><strong className="text-[#9D26FF]">Completed:</strong> Selesai (Diambil)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></span>
                <span><strong className="text-rose-400">Cancelled:</strong> Batal</span>
              </div>
            </div>
          </div>

          <div className="bg-[#13121D]/80 p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
            {/* Batch Filter di atas filter status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-[#9D26FF]">Batch Merch:</span>
                <CustomSelect
                  options={[
                    { value: 'all', label: 'Semua Batch' },
                    ...merchBatches.map(b => ({
                      value: b.id,
                      label: `${b.nama}${b.is_active ? ' (Aktif)' : ''}`
                    }))
                  ]}
                  value={merchBatchFilter}
                  onChange={e => {
                    setMerchBatchFilter(e.target.value)
                    onFetchMerchOrders(e.target.value)
                  }}
                  className="min-w-[200px]"
                />
              </div>
              <div className="text-[11px] text-zinc-400">
                {merchBatchFilter === 'all' ? (
                  <span>Menampilkan pesanan dari <strong className="text-white">semua batch</strong></span>
                ) : (
                  <span>Filter aktif: <strong className="text-[#24C6F5]">{merchBatches.find(b => b.id === merchBatchFilter)?.nama || 'Batch Terpilih'}</strong></span>
                )}
              </div>
            </div>

            {/* Search, Status Filter & Toggle Catatan */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Cari nama / WA / order..."
                value={merchOrderSearch}
                onChange={e => setMerchOrderSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onFetchMerchOrders(merchBatchFilter)}
                className="px-4 h-[38px] bg-[#1E1C2E] border border-white/10 text-white text-xs rounded-xl focus:border-[#9D26FF] flex-1 min-w-[180px]"
              />
              <CustomSelect
                options={[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'checked', label: 'Checked' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
                value={merchOrderStatusFilter}
                onChange={e => setMerchOrderStatusFilter(e.target.value)}
                className="min-w-[140px] h-[38px]"
              />
              <button onClick={() => onFetchMerchOrders(merchBatchFilter)} className="bg-[#9D26FF] text-white px-4 h-[38px] rounded-xl font-bold text-xs hover:bg-[#8215db]">Cari</button>
              
              <button
                type="button"
                onClick={() => setShowAllNotes(prev => !prev)}
                className={`px-3 h-[38px] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  showAllNotes
                    ? 'bg-cyan-500/20 text-[#00e5e5] border border-cyan-500/50 shadow-[0_0_12px_rgba(0,229,229,0.25)]'
                    : 'bg-[#1E1C2E] text-zinc-300 hover:text-white border border-white/10'
                }`}
                title="Tampilkan atau ringkas seluruh catatan pesanan dan alamat pengiriman"
              >
                <FaClipboardList className="text-xs" />
                <span>{showAllNotes ? 'Catatan: Buka Semua' : 'Catatan: Ringkas'}</span>
              </button>
            </div>
          </div>
          {/* ── MOBILE: Merch Order Cards (< md) ── */}
          <div className="md:hidden space-y-3">
            {loadingMerchOrders && merchOrders.length === 0 ? (
              [1, 2, 3].map((k) => (
                <div key={k} className="bg-[#13121D]/90 p-4 rounded-2xl border border-white/10 space-y-3 animate-pulse">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <Skeleton className="h-5 w-40 rounded" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <div className="flex justify-between items-center pt-1">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))
            ) : merchOrders.length === 0 ? (
              <div className="bg-[#13121D]/90 p-8 rounded-2xl border border-white/10 text-center text-zinc-400 text-xs">
                Belum ada order merch
              </div>
            ) : (
              <div className={`space-y-3 transition-opacity duration-200 ${loadingMerchOrders ? 'opacity-70' : 'opacity-100'}`}>
                {merchOrders.map((order) => (
                <div key={order.id} className="bg-[#13121D]/90 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
                  {/* Top: Order #, Date, Batch, Bukti Bayar */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-white">{order.order_number}</span>
                        {order.payment_method && (
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            order.payment_method === 'qris'
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {order.payment_method === 'qris' ? 'QRIS' : 'Transfer'}
                          </span>
                        )}
                        {merchBatchFilter === 'all' && order.merch_batches?.nama && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {order.merch_batches.nama}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    {order.payment_proof_url && (
                      <a
                        href={order.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-[#00e5e5] bg-[#00e5e5]/10 border border-[#00e5e5]/20 px-2.5 py-1 rounded-lg font-bold hover:bg-[#00e5e5]/20 transition shrink-0"
                      >
                        <FaEye className="text-[9px]" /> Bukti
                      </a>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h4 className="text-sm font-black text-white">{order.nama_lengkap || '-'}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1">
                      {order.whatsapp && (
                        <a
                          href={`https://wa.me/${order.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#00e5e5] hover:underline font-medium"
                        >
                          WA: {order.whatsapp}
                        </a>
                      )}
                      {order.instagram && (
                        <span className="text-zinc-400">IG: {order.instagram}</span>
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="bg-[#1E1C2E]/60 rounded-xl p-3 border border-white/5 space-y-1">
                    {order.merch_order_items?.map((item, i) => (
                      <div key={i} className="text-xs text-zinc-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {item.size && (
                            <span className="font-mono font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded text-[10px] shrink-0 border border-cyan-500/30">
                              {item.size}
                            </span>
                          )}
                          <span className="truncate">
                            {item.item_name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#9D26FF] bg-[#9D26FF]/15 px-2 py-0.5 rounded text-xs shrink-0 border border-[#9D26FF]/30">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                    {order.catatan && (
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-zinc-400 flex items-center gap-1">
                            <FaClipboardList className="text-[10px] text-cyan-400" /> Catatan / Alamat:
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.catatan, 'Catatan / Alamat')}
                            className="text-[10px] text-[#00e5e5] bg-[#00e5e5]/10 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-[#00e5e5]/20 font-semibold transition-colors"
                            title="Salin catatan / alamat"
                          >
                            <FaCopy className="text-[9px]" /> Salin
                          </button>
                        </div>
                        <div className={`text-xs text-zinc-200 leading-relaxed ${
                          showAllNotes || expandedNotes[order.id]
                            ? 'whitespace-pre-wrap break-words bg-white/[0.04] p-2.5 rounded-xl border border-white/10 font-mono text-[11px]'
                            : 'line-clamp-2'
                        }`}>
                          {order.catatan}
                        </div>
                        {order.catatan.length > 50 && !showAllNotes && (
                          <button
                            type="button"
                            onClick={() => toggleNote(order.id)}
                            className="text-[11px] text-[#00e5e5] hover:underline font-bold inline-flex items-center gap-1"
                          >
                            {expandedNotes[order.id] ? (
                              <>Tutup Ringkas <FaAngleUp className="text-[9px]" /></>
                            ) : (
                              <>Lihat Selengkapnya <FaAngleDown className="text-[9px]" /></>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Total & Status Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Total</span>
                      <span className="text-sm font-black text-[#9D26FF]">Rp {order.total_harga.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CustomSelect
                        value={order.status}
                        onChange={e => onMerchOrderStatusChange(order.id, e.target.value)}
                        variant="status"
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'checked', label: 'Checked' },
                          { value: 'completed', label: 'Completed' },
                          { value: 'cancelled', label: 'Cancelled' }
                        ]}
                      />
                      <button
                        onClick={() => onDeleteMerchOrder(order.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Hapus Order"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* ── DESKTOP: Merch Order Table (≥ md) ── */}
          <div className="hidden md:block bg-[#13121D]/90 rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
            {loadingMerchOrders && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#9D26FF] to-transparent animate-pulse z-20" />
            )}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-[#1E1C2E] text-zinc-300 uppercase text-[11px] font-bold tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Order</th>
                    <th className="px-4 py-3.5">Pembeli</th>
                    <th className="px-4 py-3.5">Items</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-4 py-3.5">Catatan / Alamat</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-white/5 text-sm text-zinc-200 transition-opacity duration-200 ${loadingMerchOrders ? 'opacity-70' : 'opacity-100'}`}>
                  {loadingMerchOrders && merchOrders.length === 0 ? (
                    [1, 2, 3, 4].map((k) => (
                      <tr key={k} className="border-b border-white/5 animate-pulse">
                        <td className="px-4 py-3.5">
                          <Skeleton className="h-4 w-24 rounded mb-1" />
                          <Skeleton className="h-3 w-16 rounded" />
                        </td>
                        <td className="px-4 py-3.5">
                          <Skeleton className="h-4 w-28 rounded mb-1" />
                          <Skeleton className="h-3 w-20 rounded" />
                        </td>
                        <td className="px-4 py-3.5"><Skeleton className="h-4 w-32 rounded" /></td>
                        <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded" /></td>
                        <td className="px-4 py-3.5"><Skeleton className="h-4 w-36 rounded" /></td>
                        <td className="px-4 py-3.5 text-center"><Skeleton className="h-7 w-24 rounded-lg mx-auto" /></td>
                        <td className="px-4 py-3.5 text-center"><Skeleton className="h-7 w-8 rounded-lg mx-auto" /></td>
                      </tr>
                    ))
                  ) : merchOrders.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-10 text-zinc-400">Belum ada order merch</td></tr>
                  ) : (
                    merchOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs">
                          <p className="font-bold text-white">{order.order_number}</p>
                          <p className="text-[10px] text-zinc-400">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            {order.payment_method && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                order.payment_method === 'qris'
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              }`}>
                                {order.payment_method === 'qris' ? 'QRIS' : 'Transfer'}
                              </span>
                            )}
                            {/* Badge Nama Batch per order pada mode Semua Batch */}
                            {merchBatchFilter === 'all' && order.merch_batches?.nama && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                {order.merch_batches.nama}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-white">{order.nama_lengkap || '-'}</p>
                          <p className="text-xs text-[#00e5e5]">WA: {order.whatsapp}</p>
                          {order.instagram && <p className="text-xs text-zinc-400">IG: {order.instagram}</p>}
                        </td>
                        <td className="px-4 py-3.5 align-top min-w-[210px]">
                          <div className="space-y-1.5">
                            {order.merch_order_items?.map((item, i) => (
                              <div key={i} className="text-xs text-zinc-200 flex items-start gap-1.5">
                                <span className="font-mono font-bold text-[#9D26FF] bg-[#9D26FF]/15 px-1.5 py-0.5 rounded text-[10px] shrink-0 border border-[#9D26FF]/30">
                                  x{item.quantity}
                                </span>
                                {item.size && (
                                  <span className="font-mono font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded text-[10px] shrink-0 border border-cyan-500/30">
                                    {item.size}
                                  </span>
                                )}
                                <span className="leading-snug text-zinc-200">
                                  {item.item_name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#9D26FF]">Rp {order.total_harga.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-xs text-zinc-300 align-top">
                          {order.catatan ? (
                            <div className={`space-y-1 ${showAllNotes || expandedNotes[order.id] ? 'min-w-[220px] max-w-[340px]' : 'max-w-[180px]'}`}>
                              <div className="flex items-start justify-between gap-1">
                                <div
                                  className={`leading-relaxed text-zinc-200 ${
                                    showAllNotes || expandedNotes[order.id]
                                      ? 'whitespace-pre-wrap break-words bg-white/[0.04] p-2 rounded-lg border border-white/10 font-mono text-[11px]'
                                      : 'truncate cursor-pointer'
                                  }`}
                                  title={order.catatan}
                                  onClick={() => !showAllNotes && toggleNote(order.id)}
                                >
                                  {order.catatan}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(order.catatan, 'Catatan / Alamat')}
                                  className="text-zinc-400 hover:text-[#00e5e5] p-1 rounded hover:bg-white/10 transition shrink-0"
                                  title="Salin catatan / alamat"
                                >
                                  <FaCopy className="text-[10px]" />
                                </button>
                              </div>
                              {order.catatan.length > 30 && !showAllNotes && (
                                <button
                                  type="button"
                                  onClick={() => toggleNote(order.id)}
                                  className="text-[10px] text-[#00e5e5] hover:underline font-bold inline-flex items-center gap-0.5"
                                >
                                  {expandedNotes[order.id] ? (
                                    <>Tutup <FaAngleUp className="text-[8px]" /></>
                                  ) : (
                                    <>Buka <FaAngleDown className="text-[8px]" /></>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <CustomSelect
                            value={order.status}
                            onChange={e => onMerchOrderStatusChange(order.id, e.target.value)}
                            variant="status"
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'checked', label: 'Checked' },
                              { value: 'completed', label: 'Completed' },
                              { value: 'cancelled', label: 'Cancelled' }
                            ]}
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {order.payment_proof_url && (
                              <a href={order.payment_proof_url} target="_blank" rel="noreferrer"
                                className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Lihat Bukti Pembayaran"
                              ><FaEye /></a>
                            )}
                            <button onClick={() => onDeleteMerchOrder(order.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleTriggerExport}
          events={events}
          currentEventId={eventFilter}
        />
      )}

      {showMerchExportModal && (
        <MerchExportModal
          isOpen={showMerchExportModal}
          onClose={() => setShowMerchExportModal(false)}
          batches={merchBatches}
          currentBatchId={merchBatchFilter}
          batchName={merchBatchFilter === 'all' ? 'Semua Batch' : (merchBatches.find(b => String(b.id) === String(merchBatchFilter))?.nama || 'Batch Terpilih')}
          orderCount={merchOrders?.length || 0}
          onExport={async (exportData) => {
            const { format, scope, value, batchName } = exportData
            if (format === 'excel') {
              await onExportMerchExcel({ scope, value, batchName })
            } else {
              await onExportMerchPdf({ scope, value, batchName })
            }
          }}
        />
      )}
    </div>
  )
}

export default OrdersTab
