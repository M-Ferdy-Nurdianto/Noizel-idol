import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaTimes, FaShoppingCart, FaPlus, FaMinus, FaTrash, 
  FaChevronRight, FaShoppingBag, FaTicketAlt, FaInfoCircle 
} from 'react-icons/fa'

const CartDrawer = ({
  isOpen,
  onClose,
  cart = [],
  merchCart = [],
  updateQuantity,
  removeFromCart,
  updateMerchQuantity,
  removeFromMerchCart,
  totalHarga = 0,
  totalMerchHarga = 0,
  onCheckoutCheki,
  onCheckoutMerch
}) => {
  const hasCheki = cart && cart.length > 0
  const hasMerch = merchCart && merchCart.length > 0
  const totalItems = (cart?.length || 0) + (merchCart?.length || 0)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle click-outside backdrop (transparent/faint, no full black veil) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity cursor-pointer"
          />

          {/* Floating Pop Up Card anchored above bottom center bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[min(540px,calc(100vh-8rem))] bg-[#13121D]/95 border border-[#272438] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-white flex flex-col overflow-hidden origin-bottom"
          >
            {/* Pop Up Header */}
            <div className="px-4 py-3 border-b border-[#272438] flex items-center justify-between bg-[#1A1828]/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#9D26FF]/20 text-[#9D26FF] flex items-center justify-center text-xs shadow-inner">
                  <FaShoppingCart />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Keranjang Belanja
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#9D26FF] text-white">
                      {totalItems}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Keranjang"
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            {/* Pop Up Body - Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {totalItems === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-[#1E1C2E] border border-[#272438] flex items-center justify-center text-zinc-600 text-lg">
                    <FaShoppingCart />
                  </div>
                  <p className="text-xs font-bold text-zinc-300">Keranjang masih kosong</p>
                  <p className="text-[11px] text-zinc-500">Pilih tiket cheki atau merchandise favoritmu.</p>
                </div>
              ) : (
                <>
                  {/* Notice if both types exist */}
                  {hasCheki && hasMerch && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2">
                      <FaInfoCircle className="text-amber-400 text-xs shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-200 leading-tight">
                        Tiket Cheki & Merchandise memiliki rekening terpisah. Silakan checkout satu per satu.
                      </p>
                    </div>
                  )}

                  {/* Section: Cheki Items */}
                  {hasCheki && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-[#272438]/80 text-[10px] font-bold">
                        <span className="text-[#9D26FF] uppercase tracking-wider flex items-center gap-1">
                          <FaTicketAlt className="text-[9px]" /> Tiket Cheki
                        </span>
                        <span className="font-mono text-zinc-400">
                          IDR {totalHarga.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {cart.map((item) => {
                          const itemId = item.cartId || item.id
                          return (
                            <div
                              key={itemId}
                              className="p-2.5 rounded-xl bg-[#1A1828]/70 border border-[#272438] flex items-center gap-2.5 hover:border-white/10 transition group"
                            >
                              <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#0A0F1D] border border-white/5 shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-white truncate leading-tight">
                                      {item.baseName || item.name}
                                    </h4>
                                    {item.event_name && (
                                      <p className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">
                                        {item.event_name}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(itemId)}
                                    aria-label="Hapus item"
                                    className="text-zinc-500 hover:text-red-400 transition-colors p-1 shrink-0"
                                  >
                                    <FaTrash className="text-[9px]" />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-xs font-bold text-[#9D26FF] font-mono">
                                    IDR {Number(item.price).toLocaleString('id-ID')}
                                  </span>

                                  <div className="flex items-center bg-[#13121D] border border-[#272438] rounded-md p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(itemId, -1)}
                                      className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                      <FaMinus className="text-[7px]" />
                                    </button>
                                    <span className="w-5 text-center text-[11px] font-bold font-mono text-white">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(itemId, 1)}
                                      className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded text-[#9D26FF] transition-colors cursor-pointer"
                                    >
                                      <FaPlus className="text-[7px]" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section: Merch Items */}
                  {hasMerch && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between pb-1 border-b border-[#272438]/80 text-[10px] font-bold">
                        <span className="text-[#24C6F5] uppercase tracking-wider flex items-center gap-1">
                          <FaShoppingBag className="text-[9px]" /> Merchandise
                        </span>
                        <span className="font-mono text-zinc-400">
                          IDR {totalMerchHarga.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {merchCart.map((item) => (
                          <div
                            key={item.cartId}
                            className="p-2.5 rounded-xl bg-[#1A1828]/70 border border-[#272438] flex items-center gap-2.5 hover:border-white/10 transition group"
                          >
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#0A0F1D] border border-white/5 shrink-0">
                              {item.gambar_url ? (
                                <img
                                  src={item.gambar_url}
                                  alt={item.nama}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                  <FaShoppingBag className="text-sm" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-white truncate leading-tight">
                                    {item.nama}
                                  </h4>
                                  {item.size && (
                                    <span className="inline-block text-[9px] bg-[#13121D] border border-[#272438] px-1.5 py-0.2 rounded text-zinc-300 font-bold uppercase font-mono mt-0.5">
                                      Size: {item.size}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFromMerchCart(item.cartId)}
                                  aria-label="Hapus item merch"
                                  className="text-zinc-500 hover:text-red-400 transition-colors p-1 shrink-0"
                                >
                                  <FaTrash className="text-[9px]" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-xs font-bold text-[#24C6F5] font-mono">
                                  IDR {Number(item.harga).toLocaleString('id-ID')}
                                </span>

                                <div className="flex items-center bg-[#13121D] border border-[#272438] rounded-md p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => updateMerchQuantity(item.cartId, -1)}
                                    className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  >
                                    <FaMinus className="text-[7px]" />
                                  </button>
                                  <span className="w-5 text-center text-[11px] font-bold font-mono text-white">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateMerchQuantity(item.cartId, 1)}
                                    className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded text-[#24C6F5] transition-colors cursor-pointer"
                                  >
                                    <FaPlus className="text-[7px]" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pop Up Footer - Subtotals & Action Buttons */}
            {totalItems > 0 && (
              <div className="p-3 border-t border-[#272438] bg-[#0E0D17]/95 space-y-2 shrink-0">
                <div className="flex items-center justify-between text-xs font-mono px-1">
                  <span className="text-zinc-400">Total Keseluruhan</span>
                  <span className="text-sm font-bold text-white">
                    IDR {(totalHarga + totalMerchHarga).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  {hasCheki && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        if (onCheckoutCheki) onCheckoutCheki()
                      }}
                      className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-[#9D26FF] hover:bg-[#8215db] text-white flex items-center justify-between shadow-[0_0_15px_rgba(157,38,255,0.35)] transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <FaTicketAlt className="text-xs" />
                        <span>Checkout Tiket Cheki</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <span>IDR {totalHarga.toLocaleString('id-ID')}</span>
                        <FaChevronRight className="text-[9px]" />
                      </div>
                    </button>
                  )}

                  {hasMerch && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        if (onCheckoutMerch) onCheckoutMerch()
                      }}
                      className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-[#24C6F5] hover:bg-[#1bb2de] text-black flex items-center justify-between shadow-[0_0_15px_rgba(36,198,245,0.35)] transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <FaShoppingBag className="text-xs" />
                        <span>Checkout Merchandise</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <span>IDR {totalMerchHarga.toLocaleString('id-ID')}</span>
                        <FaChevronRight className="text-[9px]" />
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartDrawer
