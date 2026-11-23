import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FaArrowRight, FaTshirt, FaShoppingBag, FaKey } from 'react-icons/fa'
import api from '../../lib/api'

// Helper for category-based placeholder icon
const renderCategoryPlaceholderIcon = (item, isSmall = false) => {
  const cat = String(item?.category || '').toLowerCase()
  const name = String(item?.nama || '').toLowerCase()

  const isBag = cat.includes('bag') || cat.includes('tote') || cat.includes('tas') || name.includes('tote') || name.includes('bag') || name.includes('tas')
  const isAccessory = cat.includes('acc') || cat.includes('keychain') || cat.includes('gantungan') || name.includes('keychain') || name.includes('pin') || name.includes('sticker') || name.includes('gantungan')

  if (isBag) {
    return <FaShoppingBag className={`${isSmall ? 'text-base' : 'text-2xl mb-1'} text-[#24C6F5] opacity-80`} />
  }
  if (isAccessory) {
    return <FaKey className={`${isSmall ? 'text-base' : 'text-xl mb-1'} text-[#FF1CE3] opacity-80`} />
  }
  return <FaTshirt className={`${isSmall ? 'text-base' : 'text-2xl mb-1'} text-[#9D26FF] opacity-80`} />
}

// Sub-component for product image with category fallback placeholder
const ProductImage = ({ item, getAssetPath, isSmall = false }) => {
  const [imgError, setImgError] = useState(false)
  const rawUrl = item?.gambar_url || (Array.isArray(item?.images) && item.images[0])

  if (!rawUrl || imgError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#9D26FF]/20 via-[#13121D] to-[#24C6F5]/20 flex flex-col items-center justify-center p-1 text-center select-none">
        {renderCategoryPlaceholderIcon(item, isSmall)}
        {!isSmall && (
          <span className="text-[9px] font-bold text-zinc-400 font-mono tracking-wider">NOIZE</span>
        )}
      </div>
    )
  }

  const src = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:'))
    ? rawUrl 
    : (getAssetPath ? getAssetPath(rawUrl) : rawUrl)

  return (
    <img
      src={src}
      alt={item?.nama || 'Product'}
      className="w-full h-full object-cover object-center group-hover/featured:scale-105 group-hover/item:scale-105 transition-transform duration-300"
      onError={() => setImgError(true)}
      loading="lazy"
    />
  )
}

const ShopPreviewSection = ({ 
  merchPreview = [], 
  shopMembers = [], 
  groupMember = null, 
  siteConfig = null, 
  navigate, 
  getAssetPath 
}) => {
  const shouldReduceMotion = useReducedMotion()
  const [configData, setConfigData] = useState(siteConfig || null)
  const [activeGroupMember, setActiveGroupMember] = useState(groupMember || null)
  const [randomMembers, setRandomMembers] = useState([])
  
  // Database merchandise state (fresh fetch with cache-busting)
  const [products, setProducts] = useState(merchPreview || [])
  const [loadingProducts, setLoadingProducts] = useState(!merchPreview || merchPreview.length === 0)

  // Fetch fresh merchandise from Supabase backend
  useEffect(() => {
    let isMounted = true
    api.get(`/merchandise?available=true&t=${Date.now()}`)
      .then(res => {
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          const sorted = res.data.data
            .sort((a, b) => (a.urutan ?? 99) - (b.urutan ?? 99))
            .slice(0, 4)
          setProducts(sorted)
        }
      })
      .catch(err => {
        console.warn('Failed to fetch merchandise preview:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingProducts(false)
      })

    return () => { isMounted = false }
  }, [])

  // Fetch fresh config from backend (with cache busting)
  useEffect(() => {
    api.get(`/config?t=${Date.now()}`)
      .then(res => {
        if (res.data.success && res.data.data) {
          setConfigData(res.data.data)
        }
      })
      .catch(() => {})

    // Fallback fetch group member if not provided via props
    if (!groupMember) {
      api.get(`/members?t=${Date.now()}`)
        .then(res => {
          if (res.data.success && res.data.data) {
            const grp = res.data.data.find(m => m.member_id === 'group')
            if (grp) setActiveGroupMember(grp)
          }
        })
        .catch(() => {})
    }
  }, [groupMember])

  // Randomize 3 unique members on mount / when shopMembers update
  useEffect(() => {
    const pool = (shopMembers || []).filter(m => m.member_id !== 'group' && m.hadir !== false)
    if (pool.length === 0) return

    if (pool.length <= 3) {
      setRandomMembers(pool)
      return
    }

    // Shuffle array using Fisher-Yates copy
    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setRandomMembers(shuffled.slice(0, 3))
  }, [shopMembers])

  const getShopPhoto = (member, fallbackId) => {
    if (member?.is_secret) {
      if (member.silhouette_image_url) {
        if (member.silhouette_image_url.startsWith('http://') || member.silhouette_image_url.startsWith('https://')) return member.silhouette_image_url
        if (member.silhouette_image_url.startsWith('/')) return getAssetPath(member.silhouette_image_url)
        return getAssetPath(`/images/members/${member.silhouette_image_url}`)
      }
      return getAssetPath('/images/members/placeholder.svg')
    }
    if (member?.shop_image_url) {
      if (member.shop_image_url.startsWith('http://') || member.shop_image_url.startsWith('https://')) return member.shop_image_url
      if (member.shop_image_url.startsWith('/')) return getAssetPath(member.shop_image_url)
      return getAssetPath(`/images/shop/${member.shop_image_url}`)
    }
    if (member?.image_url && (member.image_url.startsWith('http://') || member.image_url.startsWith('https://'))) {
      return member.image_url
    }
    const clean = member?.member_id ? String(member.member_id).toLowerCase().replace(/[^a-z0-9]/g, '') : fallbackId
    return getAssetPath(`/images/shop/${clean}.webp`)
  }

  const getGroupPhoto = () => {
    const grp = activeGroupMember || groupMember
    if (grp?.shop_image_url) return grp.shop_image_url
    if (grp?.image_url) return grp.image_url
    return getAssetPath('/noize-logo.png')
  }

  // Fallback for initial render before random selection resolves
  const effectiveMembers = randomMembers.length > 0 
    ? randomMembers 
    : (shopMembers || []).filter(m => m.member_id !== 'group').slice(0, 3)

  const memberLeft = effectiveMembers[0]
  const memberCenter = effectiveMembers[1] || effectiveMembers[0]
  const memberRight = effectiveMembers[2] || effectiveMembers[0]

  // Formatter harga IDR
  const formatPrice = (val) => {
    if (val === undefined || val === null || val === '') return '-'
    const str = String(val).replace(/\D/g, '')
    if (!str) return '-'
    const num = parseInt(str, 10)
    if (isNaN(num) || num <= 0) return '-'
    return `IDR ${num.toLocaleString('id-ID')}`
  }

  // Badge styling helper
  const getBadgeStyle = (badge) => {
    const b = String(badge || '').toUpperCase().trim()
    switch (b) {
      case 'NEW':
        return 'bg-[#9D26FF] text-white shadow-[#9D26FF]/40'
      case 'BEST SELLER':
        return 'bg-[#24C6F5] text-zinc-950 font-black shadow-[#24C6F5]/40'
      case 'LIMITED':
        return 'bg-[#FF1CE3] text-white shadow-[#FF1CE3]/40'
      case 'SOLD OUT':
        return 'bg-rose-500 text-white shadow-rose-500/40'
      default:
        return 'bg-zinc-800 text-zinc-200 border border-zinc-700'
    }
  }

  const rawGrupPrice = configData?.harga_cheki_grup ?? siteConfig?.harga_cheki_grup
  const rawMemberPrice = configData?.harga_cheki_per_member ?? siteConfig?.harga_cheki_per_member

  const formattedHargaGrup = formatPrice(rawGrupPrice)
  const formattedHargaMember = formatPrice(rawMemberPrice)

  // Determine featured product and other products
  const featuredIndex = products.findIndex(p => {
    const b = String(p.badge || '').toUpperCase()
    return b.includes('BEST SELLER') || b.includes('FEATURED')
  })
  const safeFeaturedIndex = featuredIndex !== -1 ? featuredIndex : 0
  const featuredProduct = products[safeFeaturedIndex]
  const otherProducts = products.filter((_, idx) => idx !== safeFeaturedIndex).slice(0, 3)
  const featuredBadge = featuredProduct ? (featuredProduct.stok <= 0 ? 'SOLD OUT' : (featuredProduct.badge || null)) : null

  return (
    <section className="py-6 sm:py-8 lg:py-6 bg-pattern-dots text-white relative overflow-hidden border-t border-[#272438]">
      <div className="container mx-auto max-w-7xl px-4 relative z-10">

        {/* Section Header (Compact & Crisp) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 lg:mb-5 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
              OFFICIAL <span className="text-[#9D26FF]">MERCH</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-md">
              Cheki member dan apparel resmi NOIZE.
            </p>
          </div>

          <button 
            onClick={() => navigate('/shop')}
            className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-2 px-4 py-2 rounded-xl border border-[#272438] hover:border-[#9D26FF] bg-[#13121D] hover:bg-[#1a1829] transition-all shadow-sm shrink-0"
          >
            <span>Kunjungi Shop Lengkap</span>
            <FaArrowRight size={10} />
          </button>
        </div>

        {/* 50 / 50 Layout Grid - Equal Heights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">

          {/* SISI KIRI (50%): CHEKI COLLECTION (Member & Group Cheki) */}
          <motion.div 
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            onClick={() => navigate('/shop?tab=cheki')}
            className="group bg-[#13121D] rounded-2xl sm:rounded-3xl border border-[#272438] hover:border-[#9D26FF] transition-all duration-300 p-4 sm:p-5 lg:p-5 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] h-full"
          >
            <div>
              {/* Header Card */}
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-[#9D26FF]/30 bg-[#9D26FF]/10 text-[#9D26FF]">
                  CHEKI COLLECTION
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-1 group-hover:text-[#9D26FF] transition-colors">
                MEMBER & GROUP CHEKI
              </h3>
              <p className="text-xs text-zinc-400 mb-3.5 line-clamp-1">
                2-Shot Polaroid bertandatangan & frame Group Cheki resmi seluruh member.
              </p>

              {/* Visual Display: Layered Polaroid Showcase (Compact Height) */}
              <div className="relative h-40 sm:h-44 md:h-48 lg:h-[185px] w-full bg-[#09090B] rounded-xl border border-[#272438] overflow-hidden p-2 sm:p-3 flex items-center justify-between">
                
                {/* Background Logo Backdrop */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity flex items-center justify-center pointer-events-none">
                  <img 
                    src={getAssetPath('/noize-logo.png')} 
                    alt="NOIZE Backdrop" 
                    className="w-full h-full object-contain p-6"
                  />
                </div>

                {/* SISI KIRI: 1 POLAROID GROUP (Perkecil 10-15%, Seimbang Atas & Bawah ~16px) */}
                <div className="relative z-10 w-1/2 flex flex-col items-center justify-center pr-1 sm:pr-2">
                  <div className="polaroid-card w-20 sm:w-24 md:w-[108px] lg:w-[110px] bg-white p-1 rounded-xs shadow-md transform -rotate-3 group-hover:-rotate-6 group-hover:scale-105 transition-all duration-300">
                    <div className="w-full aspect-[4/5] bg-zinc-900 overflow-hidden rounded-xs">
                      <img 
                        src={getGroupPhoto()} 
                        alt="GROUP CHEKI" 
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = getAssetPath('/noize-logo.png')
                        }}
                      />
                    </div>
                    <div className="h-5 sm:h-5.5 flex items-center justify-center">
                      <p className="text-[8px] sm:text-[9px] font-black text-center text-zinc-900 uppercase tracking-wider font-mono select-none truncate">
                        GROUP CHEKI
                      </p>
                    </div>
                  </div>
                </div>

                {/* SISI KANAN: 3 POLAROID 2-SHOT MEMBER FAN STACK */}
                <div className="relative z-10 w-1/2 flex items-center justify-center pl-1 sm:pr-2">
                  <div className="relative w-28 sm:w-34 md:w-38 h-32 sm:h-38 flex items-center justify-center">
                    
                    {/* Polaroid 1 (Belakang Kiri - Mengintip Keluar di Kondisi Diam) */}
                    {memberLeft && (
                      <div className={`polaroid-card absolute w-18 sm:w-22 md:w-[94px] lg:w-[96px] bg-white p-1 rounded-xs shadow-md transform -rotate-12 -translate-x-4 sm:-translate-x-5 ${shouldReduceMotion ? '' : 'group-hover:-rotate-16 group-hover:-translate-x-7 sm:group-hover:-translate-x-8'} transition-all duration-500 z-10 brightness-90 opacity-90`}>
                        <div className="w-full aspect-[4/5] bg-zinc-900 overflow-hidden rounded-xs">
                          <img 
                            src={getShopPhoto(memberLeft, 'left')} 
                            alt={memberLeft.nama_panggung || 'Member'} 
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getAssetPath('/noize-logo.png')
                            }}
                          />
                        </div>
                        <div className="h-4 sm:h-4.5 flex items-center justify-center">
                          <p className="text-[7px] font-bold text-center text-zinc-600 uppercase tracking-wider font-mono select-none truncate">
                            {memberLeft.nama_panggung || '2-SHOT'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Polaroid 3 (Belakang Kanan - Mengintip Keluar di Kondisi Diam) */}
                    {memberRight && (
                      <div className={`polaroid-card absolute w-18 sm:w-22 md:w-[94px] lg:w-[96px] bg-white p-1 rounded-xs shadow-md transform rotate-12 translate-x-4 sm:translate-x-5 ${shouldReduceMotion ? '' : 'group-hover:rotate-16 group-hover:translate-x-7 sm:group-hover:translate-x-8'} transition-all duration-500 z-10 brightness-90 opacity-90`}>
                        <div className="w-full aspect-[4/5] bg-zinc-900 overflow-hidden rounded-xs">
                          <img 
                            src={getShopPhoto(memberRight, 'right')} 
                            alt={memberRight.nama_panggung || 'Member'} 
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getAssetPath('/noize-logo.png')
                            }}
                          />
                        </div>
                        <div className="h-4 sm:h-4.5 flex items-center justify-center">
                          <p className="text-[7px] font-bold text-center text-zinc-600 uppercase tracking-wider font-mono select-none truncate">
                            {memberRight.nama_panggung || '2-SHOT'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Polaroid 2 (Depan Tengah - Fokus Utama, Teks Sejajar dengan Group) */}
                    {memberCenter && (
                      <div className={`polaroid-card absolute w-20 sm:w-24 md:w-[104px] lg:w-[106px] bg-white p-1 rounded-xs shadow-xl transform rotate-0 ${shouldReduceMotion ? '' : 'group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(157,38,255,0.35)]'} transition-all duration-500 z-20 brightness-100`}>
                        <div className="w-full aspect-[4/5] bg-zinc-900 overflow-hidden rounded-xs">
                          <img 
                            src={getShopPhoto(memberCenter, 'center')} 
                            alt="2-SHOT MEMBER" 
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getAssetPath('/noize-logo.png')
                            }}
                          />
                        </div>
                        <div className="h-5 sm:h-5.5 flex items-center justify-center">
                          <p className="text-[8px] sm:text-[9px] font-black text-center text-zinc-900 uppercase tracking-wider font-mono select-none truncate">
                            2-SHOT MEMBER
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

              {/* Harga (Tepat di bawah visual) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-3">
                {/* Cheki Grup + Harga */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#09090B] border border-[#272438] group-hover:border-[#9D26FF]/50 transition-colors flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono mb-0.5">
                    Cheki Grup
                  </span>
                  <div className="text-sm sm:text-base font-black text-[#9D26FF] tracking-tight">
                    {formattedHargaGrup}
                  </div>
                </div>

                {/* Cheki Member + Harga */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#09090B] border border-[#272438] group-hover:border-[#24C6F5]/50 transition-colors flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono mb-0.5">
                    Cheki Member
                  </span>
                  <div className="text-sm sm:text-base font-black text-[#24C6F5] tracking-tight">
                    {formattedHargaMember}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-3 mt-3 border-t border-[#272438] flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                Pilih Member / Group Cheki
              </span>
              <div className="px-4 py-2 rounded-xl bg-[#9D26FF] group-hover:bg-[#8A1AD6] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#9D26FF]/25">
                <span>Order Cheki</span>
                <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* SISI KANAN (50%): OFFICIAL APPAREL (1 Produk Unggulan + 3 Produk Lain) */}
          <motion.div 
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onClick={() => navigate('/shop?tab=merch')}
            className="group bg-[#13121D] rounded-2xl sm:rounded-3xl border border-[#272438] hover:border-[#24C6F5]/80 transition-all duration-300 p-4 sm:p-5 lg:p-5 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] h-full"
          >
            <div>
              {/* 1. Header Card: Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-[#24C6F5]/30 bg-[#24C6F5]/10 text-[#24C6F5]">
                  APPAREL & MERCH
                </span>
              </div>

              {/* 2. Judul */}
              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-1 group-hover:text-[#24C6F5] transition-colors">
                OFFICIAL APPAREL
              </h3>

              {/* 3. Deskripsi Singkat */}
              <p className="text-xs text-zinc-400 mb-3.5 line-clamp-1">
                Tee, hoodie, tote bag, dan aksesoris resmi NOIZE.
              </p>

              {/* 4. Layout Baru: 1 Produk Unggulan + 3 Produk Lain */}
              {loadingProducts ? (
                <div className="h-40 sm:h-44 md:h-48 lg:h-[251px] flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch animate-pulse">
                  <div className="w-full sm:w-[55%] rounded-xl bg-[#09090B] border border-[#272438] p-2.5 flex flex-col justify-between">
                    <div className="w-full h-32 bg-zinc-800 rounded-lg"></div>
                    <div className="mt-2">
                      <div className="h-3 bg-zinc-800 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-zinc-800 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="w-full sm:w-[45%] flex flex-col justify-between gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex-1 rounded-xl bg-[#09090B] border border-[#272438] p-2 flex items-center gap-2">
                        <div className="w-12 h-12 bg-zinc-800 rounded-lg shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-2.5 bg-zinc-800 rounded w-3/4 mb-1"></div>
                          <div className="h-2.5 bg-zinc-800 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="h-40 sm:h-44 md:h-48 lg:h-[251px] w-full bg-[#09090B] rounded-xl border border-[#272438] flex flex-col items-center justify-center text-center p-4">
                  <FaTshirt className="text-2xl text-zinc-600 mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">Merch segera hadir</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 h-auto sm:h-[251px] items-stretch">
                  
                  {/* KIRI: PRODUK UNGGULAN (~55% Lebar Area) */}
                  {featuredProduct && (
                    <div className={`flex flex-col h-full ${otherProducts.length > 0 ? 'w-full sm:w-[55%]' : 'w-full'}`}>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/shop')
                        }}
                        className="group/featured relative p-2.5 rounded-xl bg-[#09090B] border border-[#272438] hover:border-[#24C6F5]/70 hover:shadow-[0_0_20px_rgba(36,198,245,0.18)] transition-all duration-300 flex flex-col justify-between h-full cursor-pointer overflow-hidden"
                      >
                        {/* Foto Produk Besar (Rasio ~4:5, Sudut Membulat) */}
                        <div className="relative w-full h-[142px] sm:h-[152px] rounded-lg overflow-hidden bg-zinc-950 flex items-center justify-center shrink-0">
                          <ProductImage item={featuredProduct} getAssetPath={getAssetPath} />
                          {featuredBadge && (
                            <div className="absolute top-1.5 left-1.5 z-10">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-md tracking-wider ${getBadgeStyle(featuredBadge)}`}>
                                {featuredBadge}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Di Bawah Foto: Nama Produk (2 baris max, tidak terpotong) & Harga Besar Bold Cyan */}
                        <div className="mt-2 flex flex-col justify-end">
                          <h4 
                            className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover/featured:text-[#24C6F5] transition-colors"
                            title={featuredProduct.nama}
                          >
                            {featuredProduct.nama}
                          </h4>
                          <div className="mt-1 text-sm sm:text-base font-black text-[#24C6F5] font-mono tracking-tight">
                            {formatPrice(featuredProduct.harga)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KANAN: 3 PRODUK LAIN (~45% Lebar Area, Tinggi Dibagi Rata) */}
                  {otherProducts.length > 0 && (
                    <div className="flex flex-col justify-between gap-2 w-full sm:w-[45%] h-full">
                      {otherProducts.map((item, idx) => {
                        const itemBadge = item.stok <= 0 ? 'SOLD OUT' : (item.badge || null)
                        return (
                          <div 
                            key={item.id || idx}
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate('/shop')
                            }}
                            className="group/item flex-1 min-h-[64px] sm:min-h-0 flex items-center gap-2.5 p-2 rounded-xl bg-[#09090B] border border-[#272438] hover:border-[#24C6F5]/80 hover:bg-[#12111d] transition-all duration-300 cursor-pointer"
                          >
                            {/* Thumbnail Kotak Kecil di Kiri */}
                            <div className="relative aspect-square h-[50px] sm:h-full max-h-[58px] rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-[#272438]/50">
                              <ProductImage item={item} getAssetPath={getAssetPath} isSmall={true} />
                            </div>

                            {/* Info: Nama Produk (Maks 2 Baris) + Badge Kecil, & Harga */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="flex items-start justify-between gap-1">
                                <h4 
                                  className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover/item:text-[#24C6F5] transition-colors"
                                  title={item.nama}
                                >
                                  {item.nama}
                                </h4>
                                {itemBadge && (
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 shadow-xs tracking-wider ${getBadgeStyle(itemBadge)}`}>
                                    {itemBadge}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-xs font-black text-[#24C6F5] font-mono tracking-tight">
                                {formatPrice(item.harga)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* 5. Action Footer: Hanya satu tombol CTA Shop Apparel */}
            {products.length > 0 && (
              <div className="pt-3 mt-3 border-t border-[#272438] flex items-center justify-end">
                <div className="px-5 py-2 rounded-xl bg-[#24C6F5] hover:bg-[#1db3de] text-[#09090B] text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#24C6F5]/25">
                  <span>Shop Apparel</span>
                  <FaArrowRight size={10} className={shouldReduceMotion ? '' : 'group-hover:translate-x-1 transition-transform'} />
                </div>
              </div>
            )}
          </motion.div>

        </div>

      </div>
    </section>
  )
}

export default ShopPreviewSection
