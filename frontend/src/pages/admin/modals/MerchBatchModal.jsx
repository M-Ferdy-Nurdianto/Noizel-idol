import React, { useState } from 'react'
import Swal from 'sweetalert2'
import { FaBoxes, FaPlus, FaCheckCircle, FaTimesCircle, FaEdit, FaTrash, FaTimes, FaSave } from 'react-icons/fa'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'

const MerchBatchModal = ({
  isOpen,
  onClose,
  batches = [],
  onRefreshBatches,
  onBatchActivated
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [form, setForm] = useState({
    nama: '',
    is_active: false
  })
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const resetForm = () => {
    setForm({
      nama: '',
      is_active: false
    })
    setIsCreating(false)
    setEditingBatch(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsCreating(true)
  }

  const handleOpenEdit = (batch) => {
    setEditingBatch(batch)
    setIsCreating(false)
    setForm({
      nama: batch.nama || '',
      is_active: batch.is_active || false
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nama.trim()) {
      showToast.error('Nama batch wajib diisi')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        nama: form.nama.trim(),
        is_active: form.is_active
      }

      if (editingBatch) {
        await api.put(`/merch-batches/${editingBatch.id}`, payload)
        showToast.success('Batch berhasil diperbarui!')
      } else {
        await api.post('/merch-batches', payload)
        showToast.success('Batch baru berhasil dibuat!')
      }

      resetForm()
      await onRefreshBatches()
    } catch (error) {
      console.error('Error saving batch:', error)
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Batch',
        text: error.response?.data?.error || error.message
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivate = async (batch) => {
    if (batch.is_active) return

    const result = await Swal.fire({
      title: `Buka PO untuk "${batch.nama}"?`,
      text: 'Batch yang sedang dibuka saat ini akan otomatis ditutup. Pengunjung web akan langsung diarahkan untuk memesan batch ini.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9D26FF',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Buka PO Sekarang',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      await api.post(`/merch-batches/${batch.id}/activate`)
      showToast.success(`PO "${batch.nama}" sekarang dibuka!`)
      await onRefreshBatches()
      if (onBatchActivated) onBatchActivated(batch)
    } catch (error) {
      console.error('Error activating batch:', error)
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuka PO',
        text: error.response?.data?.error || error.message
      })
    }
  }

  const handleDeactivate = async (batch) => {
    if (!batch.is_active) return

    const result = await Swal.fire({
      title: `Tutup PO "${batch.nama}"?`,
      text: 'Pemesanan merch untuk batch ini akan dihentikan. Pengunjung web tidak bisa order sampai Anda membuka batch PO lagi.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Tutup PO',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      await api.post(`/merch-batches/${batch.id}/deactivate`)
      showToast.success(`PO untuk "${batch.nama}" berhasil ditutup!`)
      await onRefreshBatches()
      if (onBatchActivated) onBatchActivated(null)
    } catch (error) {
      console.error('Error deactivating batch:', error)
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menutup PO',
        text: error.response?.data?.error || error.message
      })
    }
  }

  const handleDelete = async (batch) => {
    if (batch.is_active) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Bisa Dihapus',
        text: 'Batch ini sedang dibuka (aktif). Silakan tutup PO terlebih dahulu sebelum menghapus batch ini.'
      })
      return
    }

    const result = await Swal.fire({
      title: `Hapus Batch "${batch.nama}"?`,
      text: 'Riwayat order dan data produk yang terhubung ke batch ini TIDAK akan terhapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus Batch',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      await api.delete(`/merch-batches/${batch.id}`)
      showToast.success('Batch berhasil dihapus!')
      await onRefreshBatches()
    } catch (error) {
      console.error('Error deleting batch:', error)
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus Batch',
        text: error.response?.data?.error || error.message
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#13121D] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#161f33]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9D26FF]/20 flex items-center justify-center border border-[#9D26FF]/30">
              <FaBoxes className="text-[#9D26FF] text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Kelola Batch Merchandise</h3>
              <p className="text-xs text-zinc-400">Atur buka & tutup periode PO merchandise dengan mudah.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Top Actions */}
          {!isCreating && !editingBatch && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Total Batch: {batches.length}
              </span>
              <button
                onClick={handleOpenCreate}
                className="bg-[#9D26FF] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#8215db] transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(157,38,255,0.3)] active:scale-95"
              >
                <FaPlus /> Buat Batch Baru
              </button>
            </div>
          )}

          {/* Form Create / Edit */}
          {(isCreating || editingBatch) && (
            <form onSubmit={handleSubmit} className="bg-[#1E1C2E] p-4 rounded-xl border border-white/10 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {editingBatch ? <FaEdit className="text-amber-400" /> : <FaPlus className="text-[#9D26FF]" />}
                  {editingBatch ? `Edit: ${editingBatch.nama}` : 'Buat Batch Baru'}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <FaTimes /> Batal
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nama Batch *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Batch 1"
                  value={form.nama}
                  onChange={(e) => setForm(prev => ({ ...prev, nama: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#13121D] border border-white/10 text-white rounded-lg text-xs focus:outline-none focus:border-[#9D26FF]"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Nama pemisah rilis PO (misal: Batch 1, Batch 2, dll).</p>
              </div>

              {!editingBatch && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_active_create"
                    checked={form.is_active}
                    onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#9D26FF] focus:ring-0 bg-[#13121D] border-white/20"
                  />
                  <label htmlFor="is_active_create" className="text-xs text-zinc-300 font-medium cursor-pointer">
                    Langsung buka PO untuk batch ini sekarang
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#9D26FF] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#8215db] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <FaSave /> {submitting ? 'Menyimpan...' : 'Simpan Batch'}
                </button>
              </div>
            </form>
          )}

          {/* List of Batches */}
          <div className="space-y-3">
            {batches.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs bg-white/5 rounded-xl border border-white/5">
                Belum ada batch. Klik &quot;Buat Batch Baru&quot;.
              </div>
            ) : (
              batches.map(batch => (
                <div
                  key={batch.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    batch.is_active
                      ? 'bg-[#9D26FF]/15 border-[#9D26FF]/40 shadow-[0_0_15px_rgba(157,38,255,0.25)]'
                      : 'bg-[#1E1C2E] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">{batch.nama}</h4>
                      {batch.is_active ? (
                        <span className="bg-[#24C6F5]/10 text-[#24C6F5] border border-[#24C6F5]/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <FaCheckCircle className="text-[10px]" /> PO Dibuka (Aktif)
                        </span>
                      ) : (
                        <span className="bg-zinc-700/40 text-zinc-400 border border-white/10 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                          PO Ditutup
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {batch.is_active ? (
                      <button
                        onClick={() => handleDeactivate(batch)}
                        className="bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-1.5 active:scale-95"
                        title="Tutup PO sekarang"
                      >
                        <FaTimesCircle className="text-xs" /> Tutup PO
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(batch)}
                        className="bg-[#9D26FF]/30 hover:bg-[#9D26FF] text-[#24C6F5] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-[#9D26FF]/30 flex items-center gap-1.5 active:scale-95"
                        title="Buka PO untuk batch ini"
                      >
                        <FaCheckCircle className="text-xs" /> Buka PO
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(batch)}
                      className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                      title="Edit nama batch"
                    >
                      <FaEdit />
                    </button>
                    {!batch.is_active && (
                      <button
                        onClick={() => handleDelete(batch)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Hapus batch"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#161f33]/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default MerchBatchModal
