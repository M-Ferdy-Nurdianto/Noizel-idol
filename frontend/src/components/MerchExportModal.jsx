import React, { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaFilePdf, FaFileExcel, FaTimes, FaCheck, FaDownload, FaBoxOpen, FaCalendarAlt, FaLayerGroup } from 'react-icons/fa'
import CustomSelect from '../pages/admin/components/CustomSelect'

const MerchExportModal = memo(({
  isOpen,
  onClose,
  onExport,
  batches = [],
  currentBatchId = 'all',
  batchName = 'Semua Batch',
  orderCount = 0
}) => {
  const [format, setFormat] = useState('excel') // 'excel' | 'pdf'
  const [scope, setScope] = useState('all') // 'all' | 'month' | 'batch'
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFormat('excel')
      setScope(currentBatchId && currentBatchId !== 'all' ? 'batch' : 'all')
      if (batches.length > 0) {
        const initialBatch = currentBatchId && currentBatchId !== 'all' ? currentBatchId : batches[0].id
        setSelectedBatchId(initialBatch)
      }
      setLoading(false)
      setErrorMessage('')
    }
  }, [isOpen, batches, currentBatchId])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  const handleDownload = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      let value = null
      let displayBatchName = 'Semua Batch (Full)'

      if (scope === 'month') {
        value = selectedMonth
        const [yearStr, monthStr] = String(selectedMonth).split('-')
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        const mNum = parseInt(monthStr, 10)
        displayBatchName = !isNaN(mNum) && monthNames[mNum - 1] ? `Bulan ${monthNames[mNum - 1]} ${yearStr}` : selectedMonth
      } else if (scope === 'batch') {
        value = selectedBatchId
        const found = batches.find(b => String(b.id) === String(selectedBatchId))
        displayBatchName = found ? found.nama : 'Batch Terpilih'
      }

      await onExport({
        format,
        scope,
        value,
        batchName: displayBatchName
      })
      onClose()
    } catch (err) {
      console.error('Export merch error:', err)
      setErrorMessage(err?.message || 'Gagal mengekspor data merchandise. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-[#13121D] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white z-10"
          >
            {/* Header */}
            <div className="bg-[#161f33] px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FaDownload className="text-[#9D26FF]" />
                  Export Data Merch
                </h3>
                <p className="text-[11px] text-zinc-400">Unduh laporan pesanan merchandise Noize</p>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Tutup"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 1. Format Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 block">
                  1. Pilih Format File
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Excel Card */}
                  <button
                    type="button"
                    onClick={() => setFormat('excel')}
                    disabled={loading}
                    className={`relative p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                      format === 'excel'
                        ? 'border-[#9D26FF] bg-[#9D26FF]/15 text-[#24C6F5] shadow-[0_0_15px_rgba(157,38,255,0.3)]'
                        : 'border-white/10 bg-[#161f33] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <FaFileExcel className="text-2xl text-[#24C6F5]" />
                    <div>
                      <span className="font-bold text-xs block text-white">Excel (.xlsx)</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Olah data spreadsheet</span>
                    </div>
                    {format === 'excel' && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#9D26FF] flex items-center justify-center text-[10px] text-white shadow-sm">
                        <FaCheck size={8} />
                      </span>
                    )}
                  </button>

                  {/* PDF Card */}
                  <button
                    type="button"
                    onClick={() => setFormat('pdf')}
                    disabled={loading}
                    className={`relative p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                      format === 'pdf'
                        ? 'border-red-500 bg-red-500/15 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'border-white/10 bg-[#161f33] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <FaFilePdf className="text-2xl text-red-400" />
                    <div>
                      <span className="font-bold text-xs block text-white">PDF Document</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Siap cetak & arsip</span>
                    </div>
                    {format === 'pdf' && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white shadow-sm">
                        <FaCheck size={8} />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Scope Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 block">
                  2. Cakupan Data Merch
                </label>
                <div className="space-y-2.5">
                  {/* Full Semua Batch */}
                  <label
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                      scope === 'all'
                        ? 'border-[#9D26FF] bg-[#9D26FF]/10 text-white'
                        : 'border-white/10 bg-[#161f33] text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="merchScope"
                      checked={scope === 'all'}
                      onChange={() => setScope('all')}
                      className="w-4 h-4 accent-[#9D26FF] cursor-pointer"
                    />
                    <div className="ml-3 flex items-center gap-2.5 text-xs font-semibold">
                      <FaLayerGroup className={scope === 'all' ? 'text-[#24C6F5]' : 'text-zinc-400'} />
                      <span>Semua Batch (Full Semua Transaksi)</span>
                    </div>
                  </label>

                  {/* Per Bulan Transaksi */}
                  <div
                    className={`rounded-xl border transition-all overflow-hidden ${
                      scope === 'month'
                        ? 'border-[#9D26FF] bg-[#9D26FF]/10'
                        : 'border-white/10 bg-[#161f33] hover:border-white/20'
                    }`}
                  >
                    <label className="flex items-center p-3 cursor-pointer">
                      <input
                        type="radio"
                        name="merchScope"
                        checked={scope === 'month'}
                        onChange={() => setScope('month')}
                        className="w-4 h-4 accent-[#9D26FF] cursor-pointer"
                      />
                      <div className="ml-3 flex items-center gap-2.5 text-xs font-semibold text-zinc-200">
                        <FaCalendarAlt className={scope === 'month' ? 'text-[#24C6F5]' : 'text-zinc-400'} />
                        <span>Per Bulan Transaksi</span>
                      </div>
                    </label>

                    {scope === 'month' && (
                      <div className="px-3 pb-3 pt-0">
                        <input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="w-full bg-[#1E1C2E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#9D26FF] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Per Batch Spesifik */}
                  <div
                    className={`rounded-xl border transition-all overflow-hidden ${
                      scope === 'batch'
                        ? 'border-[#9D26FF] bg-[#9D26FF]/10'
                        : 'border-white/10 bg-[#161f33] hover:border-white/20'
                    }`}
                  >
                    <label className="flex items-center p-3 cursor-pointer">
                      <input
                        type="radio"
                        name="merchScope"
                        checked={scope === 'batch'}
                        onChange={() => setScope('batch')}
                        className="w-4 h-4 accent-[#9D26FF] cursor-pointer"
                      />
                      <div className="ml-3 flex items-center gap-2.5 text-xs font-semibold text-zinc-200">
                        <FaBoxOpen className={scope === 'batch' ? 'text-[#24C6F5]' : 'text-zinc-400'} />
                        <span>Per Batch Spesifik</span>
                      </div>
                    </label>

                    {scope === 'batch' && (
                      <div className="px-3 pb-3 pt-0">
                        <CustomSelect
                          options={batches.map((b) => ({
                            value: b.id,
                            label: b.nama || `Batch ${b.id}`
                          }))}
                          value={selectedBatchId}
                          onChange={(e) => setSelectedBatchId(e.target.value)}
                          placeholder="Pilih Batch Merchandise"
                          variant="form"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message if export failed */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <span className="font-bold shrink-0">Peringatan:</span>
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="bg-[#161f33] px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
                  format === 'excel'
                    ? 'bg-[#9D26FF] hover:bg-[#8215db] shadow-[#9D26FF]/30'
                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Menyiapkan...</span>
                  </>
                ) : (
                  <>
                    <FaDownload size={12} />
                    <span>Unduh {format === 'excel' ? 'Excel' : 'PDF'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})

export default MerchExportModal
