import React, { useState } from 'react'
import { FaCopy, FaTimes, FaBoxes, FaCheck } from 'react-icons/fa'
import Swal from 'sweetalert2'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'
import CustomSelect from '../components/CustomSelect'

const DuplicateMerchModal = ({
  isOpen,
  onClose,
  product,
  batches = [],
  onSuccess
}) => {
  const [targetBatchId, setTargetBatchId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !product) return null

  const handleDuplicate = async (e) => {
    e.preventDefault()
    if (!targetBatchId) {
      showToast.error('Pilih batch tujuan duplikasi')
      return
    }

    const selectedBatch = batches.find(b => b.id === targetBatchId)
    const result = await Swal.fire({
      title: 'Duplikat Merchandise?',
      text: `Salin "${product.nama}" ke batch "${selectedBatch?.nama || 'Tujuan'}"? Stok produk hasil salinan akan otomatis diset 0.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9D26FF',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Duplikat',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      setSubmitting(true)
      const res = await api.post(`/merchandise/${product.id}/duplicate`, {
        target_batch_id: targetBatchId
      })

      showToast.success('Produk berhasil diduplikasi ke batch target!')
      if (onSuccess) onSuccess(res.data.data)
      onClose()
    } catch (error) {
      console.error('Error duplicating product:', error)
      Swal.fire({
        icon: 'error',
        title: 'Gagal Duplikasi',
        text: error.response?.data?.error || error.message
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#13121D] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#161f33]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <FaCopy className="text-cyan-400 text-lg" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight uppercase">Duplikat Merchandise</h3>
              <p className="text-[11px] text-zinc-400">Salin produk ke batch penjualan lain.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleDuplicate} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
            {product.gambar_url ? (
              <img src={product.gambar_url} alt={product.nama} className="w-12 h-12 object-cover rounded-lg border border-white/10" />
            ) : (
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-zinc-500">
                <FaBoxes />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs text-zinc-400 font-medium">Produk Sumber:</p>
              <h4 className="text-sm font-bold text-white truncate">{product.nama}</h4>
              <p className="text-xs text-[#9D26FF] font-bold">Rp {product.harga?.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Pilih Batch Tujuan *</label>
            <CustomSelect
              options={[
                { value: '', label: '-- Pilih Batch Tujuan --' },
                ...batches.map(batch => ({
                  value: batch.id,
                  label: `${batch.nama} ${batch.is_active ? '(Sedang Aktif)' : ''}`
                }))
              ]}
              value={targetBatchId}
              onChange={(e) => setTargetBatchId(e.target.value)}
              variant="form"
              placeholder="-- Pilih Batch Tujuan --"
              className="w-full"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              * Seluruh atribut (foto, ukuran, varian, harga) akan disalin utuh. Stok awal otomatis 0.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !targetBatchId}
              className="bg-[#9D26FF] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#8215db] transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 shadow-[0_0_12px_rgba(7,145,8,0.3)]"
            >
              <FaCheck /> {submitting ? 'Menduplikasi...' : 'Duplikat Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DuplicateMerchModal
