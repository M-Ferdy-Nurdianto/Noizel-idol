import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight, 
  FaShoppingCart, 
  FaExpand, 
  FaSearchPlus, 
  FaSearchMinus 
} from 'react-icons/fa'
import { getSizePriceIncrement } from '../../hooks/useShopCart'
import { nzToast } from '../ui/NzToast'

const MerchDetailModal = ({ 
  selectedMerch, 
  setSelectedMerch, 
  activeSlide, 
  setActiveSlide, 
  selectedSize, 
  setSelectedSize, 
  addToMerchCart 
}) => {
  if (!selectedMerch) return null

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isPaused, setIsPaused] = useState(false)

  const productImages = Array.isArray(selectedMerch.images) && selectedMerch.images.length > 0
    ? selectedMerch.images
    : (selectedMerch.gambar_url ? [selectedMerch.gambar_url] : [])
  const sizeChartImages = selectedMerch.size_chart_urls || []
  const images = [...productImages, ...sizeChartImages].filter(Boolean)
  const hasMultipleImages = images.length > 1

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setZoomLevel(1)
  }

  const toggleZoom = (e) => {
    if (e) e.stopPropagation()
    setZoomLevel(prev => (prev === 1 ? 2 : 1))
  }

  // Auto-slide effect if multiple images exist (every 3.5 seconds)
  useEffect(() => {
    if (!hasMultipleImages || isPaused || isPreviewOpen) return

    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % images.length)
    }, 3500)

    return () => clearInterval(interval)
  }, [hasMultipleImages, isPaused, isPreviewOpen, images.length, setActiveSlide])

  useEffect(() => {
    if (!isPreviewOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClosePreview()
      if (e.key === 'ArrowLeft') {
        setActiveSlide(prev => (prev - 1 + images.length) % images.length)
        setZoomLevel(1)
      }
      if (e.key === 'ArrowRight') {
        setActiveSlide(prev => (prev + 1) % images.length)
        setZoomLevel(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPreviewOpen, images.length, setActiveSlide])

  return (
    <AnimatePresence>
      <motion.div 
        key="merch-detail-modal"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md"
        onClick={() => setSelectedMerch(null)}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 30 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.95, y: 30 }}
          className="bg-white dark:bg-[#13121D] rounded-t-[2rem] sm:rounded-[2.5rem] max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative border border-gray-100 dark:border-white/10"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={() => setSelectedMerch(null)}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-50 w-9 h-9 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 sm:bg-white/90 sm:dark:bg-[#1E1C2E]/90 backdrop-blur-md rounded-full flex items-center justify-center text-white sm:text-gray-900 sm:dark:text-white border border-white/20 sm:border-gray-200 sm:dark:border-white/10 shadow-lg transition-all"
            title="Tutup"
          >
            <FaTimes className="text-xs sm:text-sm" />
          </button>

          {/* Left: Image Carousel (Compact on mobile) */}
          <div 
            className="w-full md:w-1/2 bg-gray-950/20 dark:bg-black/30 relative flex items-center justify-center h-[230px] sm:h-[280px] md:h-auto md:min-h-[420px] shrink-0 overflow-hidden group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => {
              setTimeout(() => setIsPaused(false), 3000)
            }}
          >
             {/* Tombol Perbesar / Preview Badge */}
             <button
               type="button"
               onClick={() => setIsPreviewOpen(true)}
               className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white text-[10px] font-bold border border-white/20 shadow-md transition-all"
               title="Lihat foto ukuran penuh"
             >
               <FaExpand className="text-[9px]" />
               <span>Perbesar</span>
             </button>

             <AnimatePresence mode="wait">
                <motion.img 
                  key={activeSlide}
                  src={images[activeSlide]} 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="w-full h-full object-contain p-3 sm:p-6 md:p-8 cursor-zoom-in"
                  onClick={() => setIsPreviewOpen(true)}
                  title="Klik untuk melihat foto lebih besar"
                />
             </AnimatePresence>

             {hasMultipleImages && (
                <>
                  <div className="absolute inset-x-2 sm:inset-x-4 flex justify-between pointer-events-none">
                     <button 
                       type="button"
                       onClick={() => {
                         setActiveSlide((activeSlide - 1 + images.length) % images.length)
                         setIsPaused(true)
                         setTimeout(() => setIsPaused(false), 4000)
                       }}
                       className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 sm:bg-white/90 sm:dark:bg-[#1E1C2E]/90 backdrop-blur-md flex items-center justify-center text-white sm:text-gray-900 sm:dark:text-white border border-white/20 sm:border-gray-200 sm:dark:border-white/10 shadow-lg pointer-events-auto transition-all"
                     >
                        <FaChevronLeft className="text-[10px] sm:text-xs" />
                     </button>
                     <button 
                       type="button"
                       onClick={() => {
                         setActiveSlide((activeSlide + 1) % images.length)
                         setIsPaused(true)
                         setTimeout(() => setIsPaused(false), 4000)
                       }}
                       className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 sm:bg-white/90 sm:dark:bg-[#1E1C2E]/90 backdrop-blur-md flex items-center justify-center text-white sm:text-gray-900 sm:dark:text-white border border-white/20 sm:border-gray-200 sm:dark:border-white/10 shadow-lg pointer-events-auto transition-all"
                     >
                        <FaChevronRight className="text-[10px] sm:text-xs" />
                     </button>
                  </div>
                  <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                     {images.map((_, i) => (
                        <button 
                            type="button"
                            key={i} 
                            onClick={() => {
                              setActiveSlide(i)
                              setIsPaused(true)
                              setTimeout(() => setIsPaused(false), 4000)
                            }}
                            className={`h-1.5 rounded-full transition-all ${i === activeSlide ? 'bg-[#9D26FF] w-4' : 'bg-white/50 w-1.5'}`}
                        />
                     ))}
                  </div>
                </>
             )}
          </div>

          {/* Right: Content with Sticky Bottom Bar */}
          <div className="w-full md:w-1/2 flex flex-col flex-1 min-h-0 bg-white dark:bg-[#13121D]">
             {/* Scrollable Details */}
             <div className="p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-4 sm:space-y-5">
                 <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] sm:text-[10px] font-black text-[#9D26FF] uppercase tracking-wider bg-[#9D26FF]/10 px-2 py-0.5 rounded-md border border-[#9D26FF]/20">
                        Official Merchandise
                      </span>
                      {selectedMerch.stok > 0 ? (
                        <span className="text-[10px] font-bold text-zinc-400">
                          Stok: {selectedMerch.stok}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-cyan-400">
                          Pre-Order
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-snug">
                      {selectedMerch.nama}
                    </h2>
                    <div className="flex items-baseline gap-2 mt-1.5">
                       <p className="text-lg sm:text-2xl font-black text-[#9D26FF]">
                          IDR {(selectedMerch.harga + getSizePriceIncrement(selectedSize, selectedMerch)).toLocaleString('id-ID')}
                       </p>
                       {getSizePriceIncrement(selectedSize, selectedMerch) > 0 && (
                          <span className="text-[11px] sm:text-xs font-bold text-[#9D26FF]">
                             (+IDR {getSizePriceIncrement(selectedSize, selectedMerch).toLocaleString('id-ID')} untuk {selectedSize})
                          </span>
                       )}
                    </div>
                 </div>

                 {/* Deskripsi Produk */}
                 {selectedMerch.deskripsi && (
                   <div className="space-y-1">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-400">Deskripsi</h4>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                        {selectedMerch.deskripsi}
                      </p>
                   </div>
                 )}

                 {/* Pilihan Ukuran (Jika tipe baju/apparel) */}
                 {selectedMerch.sizes && selectedMerch.sizes.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-400">
                            Pilih Ukuran {selectedSize ? <span className="text-[#9D26FF]">({selectedSize})</span> : <span className="text-rose-400">*wajib</span>}
                          </h4>
                          {selectedMerch.size_chart_urls?.length > 0 && (
                             <button 
                               type="button"
                               onClick={() => setActiveSlide(productImages.length)}
                               className="text-[10px] font-black text-[#9D26FF] uppercase tracking-wider hover:underline"
                             >
                                Size Chart
                             </button>
                          )}
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {(selectedMerch.sizes || []).filter(s => s && String(s).trim()).map((size, sIdx) => {
                             const inc = getSizePriceIncrement(size, selectedMerch);
                             const isSelected = selectedSize === size;
                             return (
                                <button 
                                   key={`size_${size}_${sIdx}`}
                                   type="button"
                                   onClick={() => setSelectedSize(size)}
                                   className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                                     isSelected 
                                       ? 'bg-[#9D26FF] border-[#9D26FF] text-white shadow-lg shadow-[#9D26FF]/25 scale-[1.02]' 
                                       : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 hover:border-[#9D26FF]/50'
                                   }`}
                                >
                                   <span>{size}</span>
                                   {inc > 0 && (
                                     <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-[#9D26FF]/15 text-[#9D26FF]'}`}>
                                       +{inc >= 1000 ? `${inc / 1000}k` : inc}
                                     </span>
                                   )}
                                </button>
                             );
                          })}
                       </div>
                    </div>
                 )}
             </div>

             {/* Sticky Bottom Action Bar */}
             <div className="p-3 sm:p-5 border-t border-gray-100 dark:border-white/10 bg-white/95 dark:bg-[#13121D]/95 backdrop-blur-md sticky bottom-0 z-20">
                 <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                       if (selectedMerch.sizes?.length > 0 && !selectedSize) {
                          nzToast.warning('Silakan pilih ukuran terlebih dahulu')
                          return
                       }
                       addToMerchCart(selectedMerch, selectedSize)
                       setSelectedMerch(null)
                    }}
                    className="w-full bg-[#9D26FF] hover:bg-[#8215db] text-white py-3 sm:py-3.5 rounded-xl font-black uppercase tracking-wider text-xs sm:text-sm shadow-xl shadow-[#9D26FF]/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                 >
                    <FaShoppingCart className="text-sm" />
                    <span>Masukkan ke Keranjang</span>
                    <span className="text-[11px] opacity-80 font-normal ml-1">
                      · IDR {(selectedMerch.harga + getSizePriceIncrement(selectedSize, selectedMerch)).toLocaleString('id-ID')}
                    </span>
                 </motion.button>
             </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Fullscreen Photo Preview / Zoom Modal */}
        {isPreviewOpen && (
          <motion.div
            key="merch-zoom-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col justify-between"
            onClick={handleClosePreview}
          >
            {/* Top Bar */}
            <div 
              className="p-4 sm:p-6 flex items-center justify-between z-30 select-none bg-gradient-to-b from-black/80 to-transparent"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white/90 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                  {activeSlide < productImages.length 
                    ? `Foto ${activeSlide + 1} / ${images.length}` 
                    : `Size Chart (${activeSlide + 1}/${images.length})`
                  }
                </span>
                <span className="text-xs text-zinc-400 hidden sm:inline truncate max-w-xs">
                  {selectedMerch.nama}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleZoom}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition border border-white/10 shadow-lg"
                  title={zoomLevel === 1 ? 'Perbesar (Zoom In)' : 'Perkecil (Zoom Out)'}
                >
                  {zoomLevel === 1 ? <FaSearchPlus className="text-sm" /> : <FaSearchMinus className="text-sm" />}
                </button>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 text-white flex items-center justify-center transition border border-white/10 shadow-lg"
                  title="Tutup Preview"
                >
                  <FaTimes className="text-base" />
                </button>
              </div>
            </div>

            {/* Main Fullscreen Image View */}
            <div 
              className="flex-1 relative flex items-center justify-center overflow-hidden p-2 sm:p-6"
              onClick={e => {
                if (e.target.tagName === 'IMG') {
                  toggleZoom(e)
                } else {
                  handleClosePreview()
                }
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeSlide}
                  src={images[activeSlide]}
                  alt={selectedMerch.nama}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ 
                    opacity: 1, 
                    scale: zoomLevel,
                    transition: { type: 'spring', damping: 25, stiffness: 300 }
                  }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className={`max-h-[80vh] max-w-[96vw] object-contain select-none transition-transform cursor-pointer ${
                    zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  drag={zoomLevel > 1}
                  dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
                />
              </AnimatePresence>

              {/* Left / Right Arrow buttons in fullscreen */}
              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveSlide((activeSlide - 1 + images.length) % images.length)
                      setZoomLevel(1)
                    }}
                    className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center border border-white/20 shadow-xl z-20 transition"
                    title="Foto Sebelumnya"
                  >
                    <FaChevronLeft className="text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveSlide((activeSlide + 1) % images.length)
                      setZoomLevel(1)
                    }}
                    className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center border border-white/20 shadow-xl z-20 transition"
                    title="Foto Berikutnya"
                  >
                    <FaChevronRight className="text-sm" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Bar: Thumbnails / Hints */}
            <div 
              className="p-4 sm:p-6 flex flex-col items-center gap-2 z-30 bg-gradient-to-t from-black/90 to-transparent"
              onClick={e => e.stopPropagation()}
            >
              {/* Thumbnails strip if multiple */}
              {hasMultipleImages && (
                <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-2 custom-scrollbar">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setActiveSlide(i)
                        setZoomLevel(1)
                      }}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        i === activeSlide 
                          ? 'border-[#9D26FF] scale-105 shadow-[0_0_12px_rgba(7,145,8,0.5)]' 
                          : 'border-white/20 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-zinc-400 text-center">
                Ketuk gambar untuk {zoomLevel === 1 ? 'perbesar (Zoom)' : 'tampilan normal'} · Geser atau gunakan panah untuk ganti foto
              </p>
            </div>
          </motion.div>
        )}
    </AnimatePresence>
  )
}

export default MerchDetailModal
