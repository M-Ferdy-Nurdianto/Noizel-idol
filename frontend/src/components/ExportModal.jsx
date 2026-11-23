import React, { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaFilePdf, FaFileExcel, FaCalendarAlt, FaTicketAlt, FaLayerGroup, FaTimes, FaCheck, FaDownload, FaSlidersH, FaChevronDown, FaChevronUp, FaUndo } from 'react-icons/fa'
import CustomSelect from '../pages/admin/components/CustomSelect'

const DEFAULT_SALARY_CONFIG = {
  includeSalary: true,
  feePoMember: 10000,
  feePoMode: 'nominal', // 'nominal' | 'percent'
  feeOtsMember: 15000,
  feeOtsMode: 'nominal',
  modalFilm: 15000,
  modalFilmMode: 'nominal',
  honorStaff: 2000,
  honorStaffMode: 'nominal',
  groupPoPool: 15000,
  groupPoMode: 'nominal',
  groupOtsPool: 20000,
  groupOtsMode: 'nominal',
  eventFeePerMember: 0
}

const STORAGE_KEY = 'noize_salary_config'

const ExportModal = memo(({ isOpen, onClose, onExport, events = [] }) => {
  const [format, setFormat] = useState('excel') // 'excel' | 'pdf'
  const [scope, setScope] = useState('current') // 'current' | 'event' | 'month'
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [showConfig, setShowConfig] = useState(true)

  // Salary / Financial config state
  const [financialConfig, setFinancialConfig] = useState(DEFAULT_SALARY_CONFIG)

  // Load saved config on open
  useEffect(() => {
    if (isOpen) {
      setFormat('excel')
      setScope('current')
      if (events.length > 0) setSelectedEventId(events[0].id)

      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          setFinancialConfig(prev => ({ ...prev, ...parsed }))
        }
      } catch (err) {
        console.warn('Could not load saved salary config', err)
      }
    }
  }, [isOpen, events])

  const updateConfig = (key, value) => {
    setFinancialConfig(prev => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (_) {}
      return next
    })
  }

  const resetConfig = () => {
    setFinancialConfig(DEFAULT_SALARY_CONFIG)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SALARY_CONFIG))
    } catch (_) {}
  }

  const handleExport = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(financialConfig))
    } catch (_) {}

    const exportData = {
      format,
      scope,
      value: scope === 'event' ? selectedEventId : scope === 'month' ? selectedMonth : null,
      financialConfig
    }
    onExport(exportData)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-[#13121D] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-white z-10"
          >
            {/* Header */}
            <div className="bg-[#161f33] px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FaDownload className="text-[#9D26FF]" />
                  Export Data Order & Laporan
                </h3>
                <p className="text-[11px] text-zinc-400">Unduh laporan dalam format Excel atau PDF dengan skema fleksibel</p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Tutup"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {/* 1. Format Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 block">
                  1. Pilih Format File
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('excel')}
                    className={`relative p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      format === 'excel'
                        ? 'border-[#9D26FF] bg-[#9D26FF]/15 text-[#24C6F5] shadow-[0_0_15px_rgba(157,38,255,0.25)]'
                        : 'border-white/10 bg-[#161f33] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <FaFileExcel className="text-2xl" />
                    <span className="font-bold text-xs">Excel (.xlsx)</span>
                    {format === 'excel' && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#9D26FF] flex items-center justify-center text-[10px] text-white">
                        <FaCheck size={8} />
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('pdf')}
                    className={`relative p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      format === 'pdf'
                        ? 'border-[#9D26FF] bg-[#9D26FF]/15 text-[#9D26FF] shadow-[0_0_15px_rgba(157,38,255,0.25)]'
                        : 'border-white/10 bg-[#161f33] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <FaFilePdf className="text-2xl" />
                    <span className="font-bold text-xs">PDF Document</span>
                    {format === 'pdf' && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#9D26FF] flex items-center justify-center text-[10px] text-white">
                        <FaCheck size={8} />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Scope Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 block">
                  2. Cakupan Data
                </label>
                <div className="space-y-2.5">
                  {/* Current Filter */}
                  <label
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                      scope === 'current'
                        ? 'border-[#9D26FF] bg-[#9D26FF]/10 text-white'
                        : 'border-white/10 bg-[#161f33] text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={scope === 'current'}
                      onChange={() => setScope('current')}
                      className="w-4 h-4 accent-[#9D26FF] cursor-pointer"
                    />
                    <div className="ml-3 flex items-center gap-2.5 text-xs font-semibold">
                      <FaLayerGroup className={scope === 'current' ? 'text-[#24C6F5]' : 'text-zinc-400'} />
                      <span>Sesuai Filter di Layar (Data Saat Ini)</span>
                    </div>
                  </label>

                  {/* By Event */}
                  <div
                    className={`rounded-xl border transition-all overflow-hidden ${
                      scope === 'event'
                        ? 'border-[#9D26FF] bg-[#9D26FF]/10'
                        : 'border-white/10 bg-[#161f33] hover:border-white/20'
                    }`}
                  >
                    <label className="flex items-center p-3 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === 'event'}
                        onChange={() => setScope('event')}
                        className="w-4 h-4 accent-[#9D26FF] cursor-pointer"
                      />
                      <div className="ml-3 flex items-center gap-2.5 text-xs font-semibold text-zinc-200">
                        <FaTicketAlt className={scope === 'event' ? 'text-[#24C6F5]' : 'text-zinc-400'} />
                        <span>Per Event Spesifik</span>
                      </div>
                    </label>

                    {scope === 'event' && (
                      <div className="px-3 pb-3 pt-0">
                        <CustomSelect
                          options={events.map((ev) => ({
                            value: ev.id,
                            label: `${ev.nama} (${ev.tanggal} ${ev.bulan} ${ev.tahun})`
                          }))}
                          value={selectedEventId}
                          onChange={(e) => setSelectedEventId(e.target.value)}
                          placeholder="Pilih Event"
                          variant="form"
                        />
                      </div>
                    )}
                  </div>

                  {/* By Month */}
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
                        name="scope"
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
                </div>
              </div>

              {/* 3. Salary & Deductions Configuration */}
              <div className="rounded-xl border border-white/10 bg-[#161f33] overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <FaSlidersH className="text-[#9D26FF]" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        3. Skema Gaji & Potongan Cheki
                      </h4>
                      <p className="text-[10px] text-zinc-400">Atur nominal atau persentase fee member & kas</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {showConfig ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                  </button>
                </div>

                {showConfig && (
                  <div className="p-4 space-y-4">
                    {/* Toggle Include Salary */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#1E1C2E] border border-white/5">
                      <div>
                        <span className="text-xs font-semibold text-white block">Hitung Rincian Gaji & Pembagian</span>
                        <span className="text-[10px] text-zinc-400">
                          {financialConfig.includeSalary
                            ? 'Menampilkan tabel bagi hasil, kas, dan fee talent di laporan'
                            : 'Hanya mencetak rekap penjualan, omset, dan detail pesanan'}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={financialConfig.includeSalary}
                          onChange={(e) => updateConfig('includeSalary', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9D26FF]"></div>
                      </label>
                    </div>

                    {financialConfig.includeSalary && (
                      <div className="space-y-3 pt-1">
                        {/* Member Fee (PO & OTS) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Fee PO Member */}
                          <div className="bg-[#1E1C2E] p-3 rounded-lg border border-white/5">
                            <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                              Fee PO Member
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={financialConfig.feePoMember}
                                onChange={(e) => updateConfig('feePoMember', Number(e.target.value))}
                                className="w-full bg-[#13121D] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#9D26FF] focus:outline-none font-mono"
                              />
                              <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateConfig('feePoMode', 'nominal')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.feePoMode === 'nominal'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  Rp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateConfig('feePoMode', 'percent')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.feePoMode === 'percent'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Fee OTS Member */}
                          <div className="bg-[#1E1C2E] p-3 rounded-lg border border-white/5">
                            <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                              Fee OTS Member
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={financialConfig.feeOtsMember}
                                onChange={(e) => updateConfig('feeOtsMember', Number(e.target.value))}
                                className="w-full bg-[#13121D] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#9D26FF] focus:outline-none font-mono"
                              />
                              <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateConfig('feeOtsMode', 'nominal')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.feeOtsMode === 'nominal'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  Rp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateConfig('feeOtsMode', 'percent')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.feeOtsMode === 'percent'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Potongan Operasional (Film & Staff) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Modal Film */}
                          <div className="bg-[#1E1C2E] p-3 rounded-lg border border-white/5">
                            <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                              Modal Film / Kertas (per lbr)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={financialConfig.modalFilm}
                                onChange={(e) => updateConfig('modalFilm', Number(e.target.value))}
                                className="w-full bg-[#13121D] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#9D26FF] focus:outline-none font-mono"
                              />
                              <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateConfig('modalFilmMode', 'nominal')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.modalFilmMode === 'nominal'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  Rp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateConfig('modalFilmMode', 'percent')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.modalFilmMode === 'percent'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Honor Staff */}
                          <div className="bg-[#1E1C2E] p-3 rounded-lg border border-white/5">
                            <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                              Honor Staff / Chekiman (per lbr)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={financialConfig.honorStaff}
                                onChange={(e) => updateConfig('honorStaff', Number(e.target.value))}
                                className="w-full bg-[#13121D] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#9D26FF] focus:outline-none font-mono"
                              />
                              <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateConfig('honorStaffMode', 'nominal')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.honorStaffMode === 'nominal'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  Rp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateConfig('honorStaffMode', 'percent')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.honorStaffMode === 'percent'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pool Cheki Group (PO & OTS) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Pool PO Group */}
                          <div className="bg-[#1E1C2E] p-3 rounded-lg border border-white/5">
                            <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                              Kas / Pool Cheki Group PO (per lbr)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={financialConfig.groupPoPool}
                                onChange={(e) => updateConfig('groupPoPool', Number(e.target.value))}
                                className="w-full bg-[#13121D] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#9D26FF] focus:outline-none font-mono"
                              />
                              <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateConfig('groupPoMode', 'nominal')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.groupPoMode === 'nominal'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  Rp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateConfig('groupPoMode', 'percent')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.groupPoMode === 'percent'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Pool OTS Group */}
                          <div className="bg-[#1E1C2E] p-3 rounded-lg border border-white/5">
                            <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                              Kas / Pool Cheki Group OTS (per lbr)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={financialConfig.groupOtsPool}
                                onChange={(e) => updateConfig('groupOtsPool', Number(e.target.value))}
                                className="w-full bg-[#13121D] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#9D26FF] focus:outline-none font-mono"
                              />
                              <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateConfig('groupOtsMode', 'nominal')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.groupOtsMode === 'nominal'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  Rp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateConfig('groupOtsMode', 'percent')}
                                  className={`px-2 py-1 text-[10px] font-bold ${
                                    financialConfig.groupOtsMode === 'percent'
                                      ? 'bg-[#9D26FF] text-white'
                                      : 'bg-[#13121D] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Flat Event Fee per Member */}
                        <div className="bg-[#1E1C2E] p-3 rounded-lg border border-white/5 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <label className="text-[11px] font-semibold text-zinc-300 block mb-0.5">
                              Honor Tetap Event / Member (Flat)
                            </label>
                            <p className="text-[10px] text-zinc-500">Honor tampil tetap per member per event (jika ada)</p>
                          </div>
                          <div className="w-36 shrink-0 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">Rp</span>
                            <input
                              type="number"
                              min="0"
                              value={financialConfig.eventFeePerMember}
                              onChange={(e) => updateConfig('eventFeePerMember', Number(e.target.value))}
                              placeholder="0"
                              className="w-full bg-[#13121D] border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white focus:border-[#9D26FF] focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        {/* Reset button */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={resetConfig}
                            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <FaUndo size={10} /> Reset Skema Default
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#161f33] flex items-center justify-between border-t border-white/10 shrink-0">
              <span className="text-[11px] text-zinc-400">
                {format === 'pdf' ? 'Dokumen PDF siap cetak' : 'File spreadsheet XLSX'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 active:scale-95 bg-[#9D26FF] hover:bg-[#8215db] shadow-[#9D26FF]/30"
                >
                  <FaDownload size={12} /> Unduh {format === 'excel' ? 'Excel' : 'PDF'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})

export default ExportModal


