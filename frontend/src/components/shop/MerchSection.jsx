import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FaPlus, FaBox } from 'react-icons/fa'
import Skeleton from '../Skeleton'
import { useFlyToCart } from '../../context/FlyToCartContext'

const MerchSection = ({
  loading = false,
  merch = [],
  merchCart = [],
  setSelectedMerch,
  addToMerchCart
}) => {
  const { triggerFly } = useFlyToCart()
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Extract unique categories (only present if > 1)
  const categories = useMemo(() => {
    const set = new Set()
    merch.forEach(item => {
      if (item.category && typeof item.category === 'string' && item.category.trim()) {
        set.add(item.category.trim())
      }
    })
    return Array.from(set)
  }, [merch])

  const filteredMerch = useMemo(() => {
    if (selectedCategory === 'all') return merch
    return merch.filter(item => (item.category || '').toLowerCase() === selectedCategory.toLowerCase())
  }, [merch, selectedCategory])

  if (loading && merch.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-2xl bg-[#13121D] border border-[#272438] p-3">
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (!loading && merch.length === 0) {
    return (
      <div className="py-24 text-center text-sm text-zinc-400 font-medium">
        Belum ada produk.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter kategori berupa chip kecil, HANYA muncul kalau ada lebih dari 1 kategori di data */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#24C6F5]/20 text-[#24C6F5] border-[#24C6F5]/50'
                : 'bg-[#13121D] text-zinc-400 border-[#272438] hover:text-white'
            }`}
          >
            Semua
          </button>
          {categories.map(cat => {
            const isAct = selectedCategory.toLowerCase() === cat.toLowerCase()
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shrink-0 ${
                  isAct
                    ? 'bg-[#24C6F5]/20 text-[#24C6F5] border-[#24C6F5]/50'
                    : 'bg-[#13121D] text-zinc-400 border-[#272438] hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      )}

      {/* Grid produk: 4 kolom desktop, 3 tablet, 2 mobile */}
      {filteredMerch.length === 0 ? (
        <div className="py-20 text-center text-sm text-zinc-400 font-medium">
          Belum ada produk.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredMerch.map(item => {
            const inCart = merchCart.find(i => i.id === item.id)
            const isClosed = item.available === false
            const isOutOfStock = !isClosed && item.stok !== null && item.stok !== undefined && item.stok <= (inCart?.quantity || 0)
            const isSoldOut = isClosed || isOutOfStock
            const hasSizes = item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => !isSoldOut && setSelectedMerch(item)}
                className={`group relative bg-[#13121D] rounded-2xl border border-[#272438] hover:border-[#24C6F5]/40 transition-all duration-300 p-3 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg cursor-pointer overflow-hidden ${
                  isSoldOut ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {/* Foto rasio 4:5 */}
                <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#0A0F1D] mb-3">
                  {item.gambar_url ? (
                    <img
                      src={item.gambar_url}
                      alt={item.nama}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <FaBox className="text-2xl" />
                    </div>
                  )}

                </div>

                {/* Nama produk & Harga ("IDR 185.000") */}
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-[#24C6F5] transition-colors">
                    {item.nama}
                  </h4>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#272438]/50">
                    <span className="text-xs sm:text-sm font-semibold text-white font-mono">
                      IDR {Number(item.harga).toLocaleString('id-ID')}
                    </span>

                    {isSoldOut ? (
                      <span className="text-[11px] font-bold text-zinc-500 font-mono">
                        Habis
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Tambah ${item.nama}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          const startPos = {
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2
                          }
                          if (triggerFly && item.gambar_url) {
                            triggerFly(startPos, item.gambar_url)
                          }
                          if (hasSizes) {
                            setSelectedMerch(item)
                          } else {
                            addToMerchCart(item)
                          }
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1E1C2E] border border-[#272438] hover:border-[#24C6F5] hover:bg-[#24C6F5] hover:text-black text-[#24C6F5] flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer"
                      >
                        <FaPlus className="text-[10px]" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MerchSection
