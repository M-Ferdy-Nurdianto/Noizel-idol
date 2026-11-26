import React from 'react'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCloudUploadAlt, FaImage, FaBox, FaSave, FaArrowLeft, FaBoxes, FaCopy, FaTshirt, FaSpinner } from 'react-icons/fa'
import CustomSelect from '../components/CustomSelect'

const MerchTab = ({
  merch,
  merchBatches = [],
  selectedMerchBatchFilter = 'all',
  setSelectedMerchBatchFilter,
  onOpenBatchModal,
  onOpenDuplicateModal,
  showMerchForm,
  editingMerch,
  merchForm,
  setMerchForm,
  merchHargaRaw,
  handleHargaChange,
  availableSizes,
  setAvailableSizes,
  merchImagePreview,
  merchFileInputRef,
  handleMerchImageChange,
  setMerchImageFile,
  setMerchImagePreview,
  merchExtraImagePreviews = [],
  extraImagesInputRef,
  handleExtraImagesChange,
  handleRemoveExtraImage,
  merchSizeChartPreviews,
  setMerchSizeChartPreviews,
  setMerchSizeChartFiles,
  sizeChart1InputRef,
  merchSaving,
  openMerchForm,
  closeMerchForm,
  handleMerchSubmit,
  handleSizeChartChange,
  handleToggleSize,
  onToggleMerchAvailability,
  handleDeleteMerch
}) => {
  const [dragTarget, setDragTarget] = React.useState(null)

  const filteredMerch = selectedMerchBatchFilter === 'all'
    ? merch
    : merch.filter(item => item.batch_id === selectedMerchBatchFilter)

  return (
    <div className="space-y-6">
      {!showMerchForm ? (
        <>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Manajemen <span className="text-[#9D26FF]">Merchandise</span></h2>
              <p className="text-xs text-zinc-400 font-medium mt-1">Katalog & stok merchandise per batch penjualan.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenBatchModal}
                className="bg-[#1E1C2E] hover:bg-[#1e2942] text-[#24C6F5] border border-[#9D26FF]/30 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-md active:scale-95"
              >
                <FaBoxes /> Kelola Batch
              </button>
              <button
                onClick={() => openMerchForm()}
                className="bg-[#9D26FF] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#8215db] transition-all flex items-center gap-2 text-xs shadow-[0_0_15px_rgba(157,38,255,0.3)] active:scale-95"
              >
                <FaPlus /> Tambah Merch
              </button>
            </div>
          </div>

          {/* Batch Filter Bar */}
          <div className="bg-[#13121D]/80 p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-[#9D26FF]">Filter Batch:</span>
              <div className="min-w-[220px]">
                <CustomSelect
                  options={[
                    { value: 'all', label: `Semua Batch (${merch.length} produk)` },
                    ...merchBatches.map(b => ({
                      value: b.id,
                      label: `${b.nama} ${b.is_active ? '(Aktif)' : ''}`
                    }))
                  ]}
                  value={selectedMerchBatchFilter}
                  onChange={e => setSelectedMerchBatchFilter(e.target.value)}
                  variant="filter"
                  className="min-w-[220px]"
                />
              </div>
            </div>
            <div className="text-xs text-zinc-400">
              Menampilkan <strong className="text-white">{filteredMerch.length}</strong> produk
            </div>
          </div>

          {/* ── MOBILE: Merch Card Grid (< md) ── */}
          <div className="md:hidden space-y-3">
            {filteredMerch.length === 0 ? (
              <div className="bg-[#13121D]/90 p-8 rounded-2xl border border-white/10 text-center text-zinc-400 text-xs">
                Belum ada merchandise di batch ini. Klik &quot;Tambah Merch&quot; untuk menambahkan.
              </div>
            ) : (
              filteredMerch.map((item) => (
                <div key={item.id} className="bg-[#13121D]/90 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-[#1E1C2E] overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10">
                      {item.gambar_url ? (
                        <img src={item.gambar_url} alt={item.nama} className="w-full h-full object-cover" />
                      ) : (
                        <FaBox className="text-zinc-500 text-xl" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-white text-sm truncate">{item.nama}</p>
                        <button
                          type="button"
                          onClick={() => onToggleMerchAvailability(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border shrink-0 transition-all ${
                            item.available
                              ? 'bg-[#9D26FF]/15 text-[#24C6F5] border-[#9D26FF]/30 shadow-[0_0_8px_rgba(157,38,255,0.2)]'
                              : 'bg-zinc-800/80 text-zinc-400 border-white/10 hover:bg-zinc-700/80'
                          }`}
                          title={item.available ? 'Klik untuk sembunyikan dari Shop' : 'Klik untuk tampilkan di Shop'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-[#24C6F5] animate-pulse' : 'bg-zinc-500'}`} />
                          <span>{item.available ? 'Tampil di Shop' : 'Disembunyikan'}</span>
                        </button>
                      </div>
                      <p className="font-bold text-[#9D26FF] text-xs mt-1">Rp {item.harga.toLocaleString('id-ID')}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.merch_batches?.nama && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {item.merch_batches.nama}
                          </span>
                        )}
                        <span className={`text-[10px] font-medium ${!item.stok ? 'text-zinc-500' : 'text-zinc-300'}`}>
                          Stok: {!item.stok ? 'PO' : item.stok}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => onOpenDuplicateModal(item)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 hover:bg-cyan-500/20 transition-all"
                    >
                      <FaCopy className="text-xs" /> Duplikat
                    </button>
                    <button
                      onClick={() => openMerchForm(item)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-white/20 transition-all"
                    >
                      <FaEdit className="text-xs" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMerch(item.id, item.nama)}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      title="Hapus merch"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── DESKTOP: Merch Table (≥ md) ── */}
          <div className="hidden md:block bg-[#13121D]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#1E1C2E] text-zinc-300 uppercase text-[11px] font-bold tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Produk</th>
                    <th className="px-4 py-3.5">Batch</th>
                    <th className="px-4 py-3.5">Harga</th>
                    <th className="px-4 py-3.5">Stok</th>
                    <th className="px-4 py-3.5 text-center">Tampilkan di Shop</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-200">
                  {filteredMerch.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-12 text-zinc-400">Belum ada merchandise di batch ini. Klik &quot;Tambah Merch&quot; untuk menambahkan.</td></tr>
                  ) : (
                    filteredMerch.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#1E1C2E] overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10">
                              {item.gambar_url ? <img src={item.gambar_url} alt={item.nama} className="w-full h-full object-cover" /> : <FaBox className="text-zinc-500 text-xl" />}
                            </div>
                            <div className="min-w-0 max-w-sm">
                              <p className="font-bold text-white text-sm truncate">{item.nama}</p>
                              {item.deskripsi && (
                                <p
                                  className="text-xs text-zinc-400 max-w-xs line-clamp-1 truncate mt-0.5"
                                  title={item.deskripsi}
                                >
                                  {item.deskripsi.replace(/\r?\n+/g, ' ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {item.merch_batches?.nama ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              {item.merch_batches.nama}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#9D26FF]">Rp {item.harga.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5">
                          <span className={`font-bold text-xs ${!item.stok ? 'text-zinc-500' : item.stok <= 5 ? 'text-amber-400' : 'text-zinc-200'}`}>
                            {!item.stok ? 'PO' : item.stok}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleMerchAvailability(item)}
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              item.available
                                ? 'bg-[#9D26FF]/15 text-[#24C6F5] border-[#9D26FF]/30 hover:bg-[#9D26FF]/25 shadow-[0_0_10px_rgba(157,38,255,0.2)]'
                                : 'bg-zinc-800/80 text-zinc-400 border-white/10 hover:bg-zinc-700/80 hover:text-zinc-300'
                            }`}
                            title={item.available ? 'Klik untuk sembunyikan dari Shop' : 'Klik untuk tampilkan di Shop'}
                          >
                            <span className={`w-2 h-2 rounded-full ${item.available ? 'bg-[#24C6F5] animate-pulse' : 'bg-zinc-500'}`} />
                            <span>{item.available ? 'Tampil di Shop' : 'Disembunyikan'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenDuplicateModal(item)}
                              className="text-zinc-400 hover:text-cyan-400 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
                              title="Duplikat ke batch lain"
                            >
                              <FaCopy className="text-base" />
                            </button>
                            <button onClick={() => openMerchForm(item)} className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors" title="Edit merch"><FaEdit className="text-base" /></button>
                            <button onClick={() => handleDeleteMerch(item.id, item.nama)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Hapus merch"><FaTrash className="text-base" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Full-page Edit/Create Form matching EventsTab style */
        <div className="relative space-y-6 animate-fade-in max-w-5xl">
          {/* Loading Overlay saat menyimpan */}
          {merchSaving && (
            <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-fade-in">
              <div className="bg-[#13121D]/95 border border-[#9D26FF]/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(157,38,255,0.3)] space-y-4">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-[#272438] border-t-[#9D26FF] animate-spin" />
                  <FaBox className="text-2xl text-[#24C6F5] animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-black uppercase tracking-wider text-white">Menyimpan Merchandise</h4>
                  <p className="text-xs text-zinc-400 mt-1">Mengompres foto & menyimpan katalog, mohon tunggu...</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-[#9D26FF] animate-pulse w-full" />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={closeMerchForm}
              disabled={merchSaving}
              className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Kembali"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {editingMerch ? 'Edit Merchandise' : 'Tambah Merchandise Baru'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                {editingMerch ? `Mengubah produk "${editingMerch.nama}"` : 'Isi detail produk, tipe merchandise, harga, stok, dan foto.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleMerchSubmit} className="bg-[#13121D]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kolom Kiri */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Batch Merchandise</label>
                  <CustomSelect
                    options={[
                      { value: '', label: '-- Pilih Batch (Default: Batch Aktif) --' },
                      ...merchBatches.map(b => ({
                        value: b.id,
                        label: `${b.nama} ${b.is_active ? '(Aktif)' : ''}`
                      }))
                    ]}
                    value={merchForm.batch_id || ''}
                    onChange={e => setMerchForm({ ...merchForm, batch_id: e.target.value })}
                    variant="form"
                    placeholder="-- Pilih Batch (Default: Batch Aktif) --"
                    className="w-full"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Produk akan terkelompok ke batch penjualan ini.</p>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Nama produk *</label>
                  <input
                    required
                    value={merchForm.nama}
                    onChange={e => setMerchForm({ ...merchForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#9D26FF]"
                    placeholder="Contoh: Kaos Noize"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Deskripsi</label>
                  <textarea
                    value={merchForm.deskripsi}
                    onChange={e => setMerchForm({ ...merchForm, deskripsi: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#9D26FF] resize-none"
                    placeholder="Deskripsi produk (opsional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Harga (Rp) *</label>
                    <input
                      required
                      value={merchHargaRaw}
                      onChange={e => handleHargaChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#9D26FF]"
                      placeholder="150000"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Bisa ketik 150000, 150k, atau 1.5jt</p>
                    {merchForm.harga && merchHargaRaw && !/^\d+$/.test(merchHargaRaw) && (
                      <p className="text-xs text-[#9D26FF] mt-1 font-semibold">= Rp {Number(merchForm.harga).toLocaleString('id-ID')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Stok <span className="text-[10px] text-zinc-500 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={merchForm.stok}
                      onChange={e => setMerchForm({ ...merchForm, stok: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#9D26FF]"
                      placeholder="Kosongkan jika PO"
                    />
                  </div>
                </div>

                {/* Pemisah Tipe Produk: Baju / Apparel vs Non-Baju */}
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <label className="block text-xs font-bold text-zinc-300">Tipe Merchandise</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMerchForm({ ...merchForm, category: 'apparel' })}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                        merchForm.category !== 'other'
                          ? 'bg-[#9D26FF] border-[#9D26FF] text-white shadow-[0_0_12px_rgba(7,145,8,0.35)]'
                          : 'bg-[#1E1C2E] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <FaTshirt className="text-sm" />
                      <span>Baju / Apparel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMerchForm({ ...merchForm, category: 'other', jumbo_start_size: 'none', jumbo_increment_price: 0 });
                        setAvailableSizes('');
                        setMerchSizeChartPreviews(['']);
                        setMerchSizeChartFiles([null]);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                        merchForm.category === 'other'
                          ? 'bg-[#9D26FF] border-[#9D26FF] text-white shadow-[0_0_12px_rgba(7,145,8,0.35)]'
                          : 'bg-[#1E1C2E] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <FaBox className="text-sm" />
                      <span>Non-Baju / Lain-lain</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    {merchForm.category !== 'other'
                      ? 'Pakaian / apparel yang memiliki pilihan ukuran (S, M, L, XL, XXL) dan size chart.'
                      : 'Aksesoris seperti keychain, photobook, sticker, totebag, lightstick, dll (tanpa pilihan ukuran).'}
                  </p>
                </div>

                {/* Konten Khusus Baju / Apparel */}
                {merchForm.category !== 'other' ? (
                  <div className="pt-2 space-y-3">
                    <label className="block text-xs text-zinc-400">Ukuran tersedia</label>
                    <div className="flex flex-wrap gap-2">
                      {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].map(sz => {
                        const isActive = availableSizes.split(',').map(s => s.trim()).includes(sz)
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleToggleSize(sz)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              isActive
                                ? 'bg-[#9D26FF] border-[#9D26FF] text-white shadow-[0_0_10px_rgba(157,38,255,0.4)]'
                                : 'bg-[#1E1C2E] border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            {sz}
                          </button>
                        )
                      })}
                    </div>

                    <input
                      value={availableSizes}
                      onChange={e => setAvailableSizes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#9D26FF]"
                      placeholder="Atau ketik sendiri (dipisahkan koma)"
                    />
                    <p className="text-[10px] text-zinc-500 italic">Pilihan ukuran di atas akan otomatis menambahkan atau menghapus dari kolom ini.</p>

                    {/* Pengaturan Tambahan Harga Ukuran Jumbo */}
                    <div className="mt-3 p-3.5 bg-[#141b2d] rounded-xl border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white tracking-wide">Tambahan Harga Ukuran Jumbo</h4>
                          <p className="text-[10px] text-zinc-400">Atur mulai ukuran apa dikenakan biaya tambahan dan nominal per tingkat.</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${merchForm.jumbo_start_size && merchForm.jumbo_start_size !== 'none' && Number(merchForm.jumbo_increment_price) > 0 ? 'bg-[#24C6F5]/15 text-[#24C6F5] border border-[#24C6F5]/30' : 'bg-zinc-800 text-zinc-400'}`}>
                          {merchForm.jumbo_start_size && merchForm.jumbo_start_size !== 'none' && Number(merchForm.jumbo_increment_price) > 0 ? 'Aktif' : 'Nonaktif (Flat)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Mulai Tambahan dari Ukuran</label>
                          <CustomSelect
                            options={[
                              { value: 'none', label: 'Tidak ada tambahan (Flat)' },
                              { value: '2XL', label: 'Mulai 2XL / XXL' },
                              { value: '3XL', label: 'Mulai 3XL / XXXL' },
                              { value: '4XL', label: 'Mulai 4XL' },
                              { value: '5XL', label: 'Mulai 5XL' }
                            ]}
                            value={merchForm.jumbo_start_size || 'none'}
                            onChange={e => setMerchForm({ ...merchForm, jumbo_start_size: e.target.value })}
                            variant="form"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Nominal Tambahan per Step (Rp)</label>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={merchForm.jumbo_increment_price ?? 5000}
                            onChange={e => setMerchForm({ ...merchForm, jumbo_increment_price: e.target.value })}
                            disabled={!merchForm.jumbo_start_size || merchForm.jumbo_start_size === 'none'}
                            placeholder="Contoh: 5000"
                            className="w-full px-3 py-2 bg-[#1E1C2E] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-[#9D26FF] disabled:opacity-40"
                          />
                        </div>
                      </div>

                      {/* Simulasi Kenaikan Harga */}
                      {merchForm.jumbo_start_size && merchForm.jumbo_start_size !== 'none' && Number(merchForm.jumbo_increment_price) > 0 ? (
                        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-zinc-400 font-semibold">Simulasi:</span>
                          {['2XL', '3XL', '4XL'].map(sz => {
                            const ladder = ['2XL', '3XL', '4XL', '5XL'];
                            const normStart = merchForm.jumbo_start_size === 'XXL' ? '2XL' : merchForm.jumbo_start_size;
                            const sIdx = ladder.indexOf(normStart);
                            const cIdx = ladder.indexOf(sz);
                            const inc = (cIdx >= sIdx && sIdx !== -1) ? (cIdx - sIdx + 1) * Number(merchForm.jumbo_increment_price) : 0;
                            return (
                              <span key={sz} className={`px-2 py-0.5 rounded font-mono ${inc > 0 ? 'bg-[#24C6F5]/20 text-[#24C6F5] font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
                                {sz}: {inc > 0 ? `+Rp ${inc.toLocaleString('id-ID')}` : 'Rp 0'}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-500 italic">
                          Semua ukuran memakai harga dasar yang sama (tanpa surcharge).
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Banner Produk Non-Baju */
                  <div className="p-4 rounded-xl bg-[#13121D] border border-[#272438] text-center space-y-1">
                    <p className="text-xs font-bold text-[#24C6F5] flex items-center justify-center gap-1.5">
                      <FaBox className="text-sm" /> Produk Non-Baju (Tanpa Ukuran)
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Produk ini tidak memiliki opsi ukuran. Pembeli di toko dapat langsung memasukkannya ke keranjang tanpa memilih size.
                    </p>
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Upload Foto Produk & Foto Size Chart */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Foto produk</label>
                  <div
                    onClick={() => merchFileInputRef.current?.click()}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragTarget('merchMain'); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDragTarget(null); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragTarget(null);
                      const f = e.dataTransfer?.files?.[0];
                      if (f) handleMerchImageChange(f);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all min-h-[170px] flex flex-col items-center justify-center gap-2 ${
                      dragTarget === 'merchMain'
                        ? 'border-[#9D26FF] bg-[#9D26FF]/25 shadow-[0_0_25px_rgba(157,38,255,0.4)] scale-[1.01] ring-2 ring-[#9D26FF]'
                        : 'border-white/20 bg-[#1E1C2E]/50 hover:border-[#9D26FF] hover:bg-[#9D26FF]/10'
                    }`}
                  >
                    {dragTarget === 'merchMain' ? (
                      <div className="pointer-events-none text-center">
                        <FaCloudUploadAlt className="text-4xl text-[#9D26FF] animate-bounce mx-auto mb-1" />
                        <p className="text-xs text-white font-bold uppercase tracking-wider">Lepaskan foto produk di sini</p>
                      </div>
                    ) : merchImagePreview ? (
                      <img src={merchImagePreview} alt="Preview" className="max-h-[170px] max-w-full object-contain rounded-xl" />
                    ) : (
                      <>
                        <FaCloudUploadAlt className="text-4xl text-zinc-500" />
                        <p className="text-xs text-zinc-300 font-medium">Klik atau seret (drag & drop) foto produk ke sini</p>
                        <p className="text-[10px] text-zinc-500">JPG, PNG, WebP (maks. 10MB)</p>
                      </>
                    )}
                  </div>
                  <input ref={merchFileInputRef} type="file" accept="image/*" onChange={handleMerchImageChange} className="hidden" />
                  {merchImagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setMerchImageFile(null)
                        setMerchImagePreview('')
                        if (merchFileInputRef.current) merchFileInputRef.current.value = ''
                      }}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold mt-2"
                    >
                      <FaTimes /> Hapus Foto Utama
                    </button>
                  )}
                </div>

                {/* Foto Tambahan Produk (Opsional / Multi-foto) */}
                <div 
                  className="pt-2 border-t border-white/5"
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragTarget('merchExtra'); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDragTarget(null); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragTarget(null);
                    const files = Array.from(e.dataTransfer?.files || []);
                    if (files.length > 0) handleExtraImagesChange(files);
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-zinc-400">
                      Foto Tambahan Produk <span className="text-[10px] text-zinc-500 font-normal">(opsional)</span>
                    </label>
                    <span className="text-[10px] font-bold text-zinc-400">
                      {merchExtraImagePreviews?.length || 0} foto
                    </span>
                  </div>

                  {/* Grid Preview Foto Tambahan */}
                  <div className={`grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2 p-1.5 rounded-xl transition-all ${
                    dragTarget === 'merchExtra' ? 'ring-2 ring-[#24C6F5] bg-[#24C6F5]/10' : ''
                  }`}>
                    {merchExtraImagePreviews && merchExtraImagePreviews.map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl bg-[#1E1C2E] border border-white/10 overflow-hidden group">
                        <img src={imgUrl} alt={`Foto tambahan ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          title="Hapus foto ini"
                        >
                          <FaTimes className="text-[10px]" />
                        </button>
                      </div>
                    ))}

                    {/* Tombol Tambah Foto */}
                    <button
                      type="button"
                      onClick={() => extraImagesInputRef.current?.click()}
                      className="aspect-square rounded-xl border border-dashed border-white/20 hover:border-[#9D26FF] bg-[#1E1C2E]/40 hover:bg-[#9D26FF]/10 text-zinc-400 hover:text-white flex flex-col items-center justify-center gap-1 transition-all text-center p-2"
                    >
                      <FaPlus className="text-sm text-[#9D26FF]" />
                      <span className="text-[10px] font-bold leading-tight">Tambah Foto</span>
                    </button>
                  </div>

                  <input
                    ref={extraImagesInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleExtraImagesChange}
                    className="hidden"
                  />
                  <p className="text-[10px] text-zinc-500 italic">
                    Bisa klik atau drag & drop beberapa foto sekaligus (tampak belakang, detail bahan, dll).
                  </p>
                </div>

                {merchForm.category !== 'other' && (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Foto size chart <span className="text-[10px] text-zinc-500 font-normal">(opsional)</span>
                    </label>
                    <div className="space-y-2">
                      <div
                        onClick={() => sizeChart1InputRef.current?.click()}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragTarget('merchSizeChart'); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDragTarget(null); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragTarget(null);
                          const f = e.dataTransfer?.files?.[0];
                          if (f) handleSizeChartChange(f, 0);
                        }}
                        className={`border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer transition-all min-h-[120px] flex flex-col items-center justify-center gap-1.5 ${
                          dragTarget === 'merchSizeChart'
                            ? 'border-[#24C6F5] bg-[#24C6F5]/25 shadow-[0_0_20px_rgba(36,198,245,0.4)] ring-2 ring-[#24C6F5]'
                            : 'border-white/20 bg-[#1E1C2E]/50 hover:border-[#9D26FF] hover:bg-[#9D26FF]/10'
                        }`}
                      >
                        {dragTarget === 'merchSizeChart' ? (
                          <div className="pointer-events-none text-center">
                            <FaCloudUploadAlt className="text-3xl text-[#24C6F5] animate-bounce mx-auto mb-1" />
                            <p className="text-xs text-white font-bold uppercase tracking-wider">Lepaskan foto size chart di sini</p>
                          </div>
                        ) : merchSizeChartPreviews[0] ? (
                          <img src={merchSizeChartPreviews[0]} alt="Size Chart" className="max-h-[110px] max-w-full object-contain rounded-lg" />
                        ) : (
                          <>
                            <FaCloudUploadAlt className="text-3xl text-zinc-500" />
                            <p className="text-xs text-zinc-300 font-medium">Klik atau seret (drag & drop) size chart</p>
                            <p className="text-[10px] text-zinc-500">Panduan ukuran kaos / apparel</p>
                          </>
                        )}
                      </div>
                      {merchSizeChartPreviews[0] && (
                        <button
                          type="button"
                          onClick={() => {
                            setMerchSizeChartPreviews([''])
                            setMerchSizeChartFiles([null])
                            if (sizeChart1InputRef.current) sizeChart1InputRef.current.value = ''
                          }}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold w-full justify-center mt-1"
                        >
                          <FaTimes /> Hapus Size Chart
                        </button>
                      )}
                    </div>
                    <input ref={sizeChart1InputRef} type="file" accept="image/*" onChange={(e) => handleSizeChartChange(e, 0)} className="hidden" />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 mt-6 pt-4 border-t border-white/10 justify-end">
              <button
                type="button"
                disabled={merchSaving}
                onClick={closeMerchForm}
                className="w-full sm:w-auto px-5 py-2.5 bg-white/10 text-zinc-300 rounded-xl font-bold text-xs hover:bg-white/20 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={merchSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#9D26FF] text-white rounded-xl font-bold text-xs hover:bg-[#8215db] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(157,38,255,0.3)] transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {merchSaving ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    <span>Menyimpan...</span>
                  </>
                ) : editingMerch ? (
                  <>
                    <FaSave />
                    <span>Update Merchandise</span>
                  </>
                ) : (
                  <>
                    <FaPlus />
                    <span>Tambah Merchandise</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default MerchTab
