import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getAssetPath } from '../lib/pathUtils'
import { nzToast } from '../components/ui/NzToast'
import api from '../lib/api'
import Header from '../components/Header'
import { useShopCart } from '../hooks/useShopCart'
import { useFlyToCart } from '../context/FlyToCartContext'

// Refactored Components
import ChekiSection from '../components/shop/ChekiSection'
import MerchSection from '../components/shop/MerchSection'
import CartDrawer from '../components/shop/CartDrawer'
import MerchDetailModal from '../components/shop/MerchDetailModal'
import CheckoutProcess from '../components/shop/CheckoutProcess'
import { FaShoppingCart, FaChevronRight } from 'react-icons/fa'

// In-memory cache for instant navigation without re-loading screen
let cachedShopData = {
  config: null,
  members: null,
  groupMember: null,
  events: null,
  merch: null,
}

const MONTH_MAP = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agustus: 7, august: 7,
  sep: 8, september: 8,
  okt: 9, oktober: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, december: 11
}

const parseEventDate = (ev) => {
  if (!ev) return 0
  const year = parseInt(ev.tahun, 10) || new Date().getFullYear()
  const monthKey = String(ev.bulan || '').toLowerCase().trim()
  const month = MONTH_MAP[monthKey] ?? 0
  const day = parseInt(ev.tanggal, 10) || 1
  return new Date(year, month, day).getTime()
}

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')?.toLowerCase()
  const activeTab = tabParam === 'merch' ? 'merch' : 'cheki'
  const eventParam = searchParams.get('event')

  const { triggerFly } = useFlyToCart()
  const [config, setConfig] = useState(cachedShopData.config || {})
  const [members, setMembers] = useState(cachedShopData.members || [])
  const [groupMember, setGroupMember] = useState(cachedShopData.groupMember)
  const [events, setEvents] = useState(cachedShopData.events || [])
  const [loading, setLoading] = useState(!cachedShopData.events)
  const [copied, setCopied] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('transfer')
  const [step, setStep] = useState(1)
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)

  // Cheki checkout form state
  const [formData, setFormData] = useState({ nama_panggilan: '', kontak: '', catatan: '' })
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [receiptData, setReceiptData] = useState(null)
  const [activeDropdownId, setActiveDropdownId] = useState(null)
  const fileInputRef = useRef(null)

  // Merch State
  const [merch, setMerch] = useState(cachedShopData.merch || [])
  const [merchForm, setMerchForm] = useState({ nama_lengkap: '', whatsapp: '', instagram: '', catatan: '' })
  const [merchFile, setMerchFile] = useState(null)
  const [merchFilePreview, setMerchFilePreview] = useState(null)
  const [merchSubmitting, setMerchSubmitting] = useState(false)
  const [merchUploading, setMerchUploading] = useState(false)
  const [merchTurnstileToken, setMerchTurnstileToken] = useState('')
  const [merchOrderSuccess, setMerchOrderSuccess] = useState(null)
  const [merchReceiptData, setMerchReceiptData] = useState(null)
  const [maskContact, setMaskContact] = useState(false)
  const [maskMerchContact, setMaskMerchContact] = useState(false)
  const merchFileInputRef = useRef(null)
  const [selectedMerch, setSelectedMerch] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)

  // Cart Hook with config and events synchronization
  const cartHook = useShopCart(config, events)

  // Urutkan event dari tanggal terdekat
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => parseEventDate(a) - parseEventDate(b))
  }, [events])

  // Event terpilih dari URL (?event=<id>) atau fallback ke event terdekat
  const selectedEventId = useMemo(() => {
    if (eventParam && sortedEvents.some(e => String(e.id) === String(eventParam))) {
      return eventParam
    }
    return sortedEvents[0]?.id || ''
  }, [eventParam, sortedEvents])

  const handleSelectEvent = (eventId) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', 'cheki')
    newParams.set('event', eventId)
    setSearchParams(newParams)
  }

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', newTab)
    if (newTab === 'cheki') {
      const targetEventId = eventParam && sortedEvents.some(e => String(e.id) === String(eventParam))
        ? eventParam
        : (sortedEvents[0]?.id || '')
      if (targetEventId) newParams.set('event', targetEventId)
    } else {
      newParams.delete('event')
    }
    setSearchParams(newParams)
  }

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.custom-dropdown-container')) {
        setActiveDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sanitizeName = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const getMemberImage = (member) => {
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
    const clean = member?.member_id || sanitizeName(member?.nama_panggung || '')
    if (clean) return getAssetPath(`/images/shop/${clean}.webp`)
    return getAssetPath('/images/members/placeholder.svg')
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, membersRes, eventsRes] = await Promise.all([
          api.get('/config'),
          api.get('/members'),
          api.get('/events?is_past=false')
        ])

        try {
          const merchRes = await api.get('/merchandise')
          if (merchRes.data.success) {
            setMerch(merchRes.data.data)
            cachedShopData.merch = merchRes.data.data
          }
        } catch (_) {}
        
        if (configRes.data.success) {
          setConfig(configRes.data.data)
          cachedShopData.config = configRes.data.data
        }

        if (membersRes.data.success) {
          const activeMembers = membersRes.data.data.filter(m => m.member_id !== 'group' && m.hadir !== false)
          setMembers(activeMembers)
          cachedShopData.members = activeMembers
          const grp = membersRes.data.data.find(m => m.member_id === 'group')
          if (grp) {
            setGroupMember(grp)
            cachedShopData.groupMember = grp
          }
        }

        if (eventsRes.data.success) {
          setEvents(eventsRes.data.data)
          cachedShopData.events = eventsRes.data.data
        }
      } catch (err) {
        console.error('Failed to load shop data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFilePreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleMerchFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setMerchFile(selectedFile)
      setMerchFilePreview(URL.createObjectURL(selectedFile))
    }
  }

  const paymentCheki = {
    bank: config?.payment_bank || config?.payment_cheki_bank || 'BCA',
    rekening: (config?.payment_rekening && config.payment_rekening !== '-') 
      ? config.payment_rekening 
      : (config?.payment_cheki_rekening && config.payment_cheki_rekening !== '-') 
        ? config.payment_cheki_rekening 
        : '0902683273',
    atasNama: (config?.payment_atas_nama && config.payment_atas_nama !== '-') 
      ? config.payment_atas_nama 
      : (config?.payment_cheki_atas_nama && config.payment_cheki_atas_nama !== '-') 
        ? config.payment_cheki_atas_nama 
        : 'NOIZE',
    method: config?.payment_method || config?.payment_cheki_method || 'Manual TF',
    transferActive: config?.payment_cheki_transfer_active !== undefined ? config.payment_cheki_transfer_active === 'true' : true,
    qrisActive: config?.payment_cheki_qris_active === 'true',
    qrisImage: config?.payment_cheki_qris_image || ''
  }

  const paymentMerch = {
    bank: config?.payment_merch_bank || config?.payment_bank || 'BCA',
    rekening: (config?.payment_merch_rekening && config.payment_merch_rekening !== '-') 
      ? config.payment_merch_rekening 
      : (config?.payment_rekening && config.payment_rekening !== '-') 
        ? config.payment_rekening 
        : '0902683273',
    atasNama: (config?.payment_merch_atas_nama && config.payment_merch_atas_nama !== '-') 
      ? config.payment_merch_atas_nama 
      : (config?.payment_atas_nama && config.payment_atas_nama !== '-') 
        ? config.payment_atas_nama 
        : 'NOIZE',
    method: config?.payment_merch_method || config?.payment_method || 'Manual TF',
    transferActive: config?.payment_merch_transfer_active !== undefined ? config.payment_merch_transfer_active === 'true' : true,
    qrisActive: config?.payment_merch_qris_active === 'true',
    qrisImage: config?.payment_merch_qris_image || ''
  }

  const currentPayment = step === 2 ? paymentCheki : paymentMerch

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      nzToast.error('Silakan upload bukti pembayaran!')
      return
    }

    setSubmitting(true)
    setUploading(true)

    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('payment_proof', file)
      const uploadRes = await api.post('/upload/payment-proof', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (!uploadRes.data.success) {
        throw new Error(uploadRes.data.error || uploadRes.data.message || 'Gagal mengupload bukti pembayaran')
      }

      const paymentProofUrl = uploadRes.data.data.url
      setUploading(false)

      const orderData = {
        nama_panggilan: formData.nama_panggilan,
        kontak: formData.kontak,
        catatan: formData.catatan,
        payment_proof_url: paymentProofUrl,
        payment_method: selectedPaymentMethod || 'transfer',
        items: cartHook.cart.map(item => ({
          member_id: item.type === 'member' ? (item.member_id || item.id) : null,
          quantity: item.quantity,
          type: item.type,
          price: item.price,
          nama: item.displayName || item.name || item.nama,
          event_id: item.event_id
        })),
        turnstileToken: turnstileToken || 'dev-turnstile-token',
        turnstile_token: turnstileToken || 'dev-turnstile-token',
        'cf-turnstile-response': turnstileToken || 'dev-turnstile-token'
      }

      const res = await api.post('/orders', orderData)

      if (res.data.success) {
        const savedCart = [...cartHook.cart]
        const savedTotal = cartHook.totalHarga
        if (typeof cartHook.clearCart === 'function') cartHook.clearCart()
        else cartHook.setCart([])

        const uniqueEvents = [...new Set(savedCart.map(item => {
          const ev = events.find(e => String(e.id) === String(item.event_id))
          return ev ? ev.nama : item.event_name
        }).filter(Boolean))]

        const orderObj = res.data.order || res.data.data?.order || res.data.data || res.data || {}
        const orderId = orderObj.order_number || res.data.order_number || orderObj.id || res.data.order_id || `NZ${Date.now()}`

        const orderSummary = {
          orderId,
          order_number: orderObj.order_number || res.data.order_number || orderId,
          date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          customerName: formData.nama_panggilan,
          nama: formData.nama_panggilan,
          kontak: formData.kontak,
          catatan: formData.catatan,
          eventName: uniqueEvents.join(', ') || '-',
          items: orderData.items.map(item => ({
            name: item.nama,
            quantity: item.quantity,
            price: item.price
          })),
          total: savedTotal,
          status: 'Menunggu Verifikasi',
          paymentMethod: selectedPaymentMethod || 'transfer',
          payment_method: selectedPaymentMethod || 'transfer',
          createdAt: new Date().toLocaleString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':').replace(/\//g, '/')
        }
        setReceiptData(orderSummary)
        setOrderSuccess(orderObj)
        setStep(3)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        throw new Error(res.data.error || res.data.message || 'Gagal membuat pesanan')
      }
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Terjadi kesalahan saat memproses pesanan'
      nzToast.error(errorMsg)
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const handleMerchSubmit = async (e) => {
    e.preventDefault()
    if (!merchFile) {
      nzToast.error('Silakan upload bukti pembayaran!')
      return
    }

    setMerchSubmitting(true)
    setMerchUploading(true)

    try {
      const uploadData = new FormData()
      uploadData.append('file', merchFile)
      uploadData.append('payment_proof', merchFile)
      const uploadRes = await api.post('/upload/payment-proof', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (!uploadRes.data.success) {
        throw new Error(uploadRes.data.error || uploadRes.data.message || 'Gagal mengupload bukti pembayaran')
      }

      const paymentProofUrl = uploadRes.data.data.url
      setMerchUploading(false)

      const orderData = {
        nama_lengkap: merchForm.nama_lengkap,
        whatsapp: merchForm.whatsapp,
        instagram: merchForm.instagram,
        catatan: merchForm.catatan,
        payment_proof_url: paymentProofUrl,
        payment_method: selectedPaymentMethod || 'transfer',
        items: cartHook.merchCart.map(item => ({
          merchandise_id: item.id,
          quantity: item.quantity,
          size: item.size || null,
          harga: item.harga,
          nama: item.nama,
          gambar_url: item.gambar_url
        })),
        turnstileToken: merchTurnstileToken || 'dev-turnstile-token',
        turnstile_token: merchTurnstileToken || 'dev-turnstile-token',
        'cf-turnstile-response': merchTurnstileToken || 'dev-turnstile-token'
      }

      // Kirim pesanan merchandise
      let res
      try {
        res = await api.post('/merch-orders', orderData)
      } catch (postErr) {
        if (postErr.response?.status === 404) {
          res = await api.post('/orders/merchandise', orderData)
        } else {
          throw postErr
        }
      }

      if (res.data.success) {
        const savedMerchTotal = cartHook.totalMerchHarga
        if (typeof cartHook.clearMerchCart === 'function') cartHook.clearMerchCart()
        else cartHook.setMerchCart([])

        const orderObj = res.data.order || res.data.data?.order || res.data.data || res.data || {}
        const orderId = orderObj.order_number || res.data.order_number || orderObj.id || res.data.order_id || `NZM${Date.now()}`

        const orderSummary = {
          orderId,
          order_number: orderObj.order_number || res.data.order_number || orderId,
          date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          customerName: merchForm.nama_lengkap,
          eventName: 'Official Merchandise',
          eventDate: '-',
          items: orderData.items.map(item => ({
            name: item.nama + (item.size ? ` (${item.size})` : ''),
            quantity: item.quantity,
            price: item.harga
          })),
          total: savedMerchTotal,
          status: 'Menunggu Verifikasi',
          paymentMethod: selectedPaymentMethod || 'transfer',
          payment_method: selectedPaymentMethod || 'transfer',
          createdAt: new Date().toLocaleString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':').replace(/\//g, '/')
        }
        setMerchReceiptData(orderSummary)
        setMerchOrderSuccess(orderObj)
        setStep(5)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        throw new Error(res.data.error || res.data.message || 'Gagal membuat pesanan')
      }
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Terjadi kesalahan saat memproses pesanan merchandise'
      nzToast.error(errorMsg)
    } finally {
      setMerchSubmitting(false)
      setMerchUploading(false)
    }
  }

  // Primary event for checkout theme accents
  const activeEvent = sortedEvents.find(e => String(e.id) === String(selectedEventId)) || sortedEvents[0]
  const isSpecialEvent = Boolean(activeEvent?.is_special || activeEvent?.type === 'special' || activeEvent?.theme_name)
  const themeColor = isSpecialEvent ? (activeEvent?.theme_color || '#FF6B9D') : '#9D26FF'

  const mainPadding = step === 1 ? 'pb-36 sm:pb-44' : 'pb-8 lg:pb-16'

  return (
    <div
      className={`min-h-screen text-white transition-colors duration-500 relative ${
        activeTab === 'merch' ? 'bg-[#070B14]' : 'bg-[#0D0814]'
      }`}
    >
      {/* Tab-specific Backgrounds (Pure CSS, respects reduced motion) */}
      {activeTab === 'merch' ? (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 85% 15%, rgba(36, 198, 245, 0.12) 0%, rgba(36, 198, 245, 0.02) 45%, transparent 70%),
              radial-gradient(circle, rgba(36, 198, 245, 0.07) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 28px 28px'
          }}
        />
      ) : (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 15%, rgba(157, 38, 255, 0.14) 0%, rgba(255, 28, 227, 0.05) 45%, transparent 70%),
              repeating-linear-gradient(135deg, transparent, transparent 38px, rgba(157, 38, 255, 0.025) 38px, rgba(157, 38, 255, 0.025) 40px)
            `
          }}
        />
      )}

      <Header 
        cartCount={cartHook.cart.length + cartHook.merchCart.length} 
        onCartClick={() => {
          if (step !== 1) setStep(1)
          setIsCartDrawerOpen(true)
        }} 
      />
      
      <main className={`relative z-10 pt-28 sm:pt-32 ${mainPadding} max-w-6xl mx-auto px-4 sm:px-6`}>
        {step === 1 ? (
          <div>
            {/* ─────────────────────────────────────────────────────────────
                HEADER HALAMAN: Judul Dua Warna + Switcher
                ───────────────────────────────────────────────────────────── */}
            <div className="flex flex-col items-center text-center mb-6 sm:mb-7">
              {/* Judul besar dua warna: NOIZE putih + CHEKI ungu / MERCH cyan */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase mb-4 leading-none">
                <span className="text-white">NOIZE</span>{' '}
                <span className={activeTab === 'merch' ? 'text-[#24C6F5]' : 'text-[#9D26FF]'}>
                  {activeTab === 'merch' ? 'MERCH' : 'CHEKI'}
                </span>
              </h1>

              {/* 3. Switcher tab (CHEKI | MERCH) di bawah judul (tinggi ~48px) */}
              <div className="inline-flex h-12 p-1 rounded-2xl bg-[#13121D]/90 backdrop-blur-xl border border-[#272438] shadow-lg">
                <button
                  type="button"
                  onClick={() => handleTabChange('cheki')}
                  className={`px-7 sm:px-9 h-full rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center ${
                    activeTab === 'cheki'
                      ? 'bg-[#9D26FF]/25 text-white border border-[#9D26FF]/50 shadow-sm'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  Cheki
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('merch')}
                  className={`px-7 sm:px-9 h-full rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center ${
                    activeTab === 'merch'
                      ? 'bg-[#24C6F5]/20 text-[#24C6F5] border border-[#24C6F5]/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  Merch
                </button>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                MAIN CONTENT GRID (Cheki / Merch)
                ───────────────────────────────────────────────────────────── */}
            <div className="w-full">
              <AnimatePresence mode="wait">
                {activeTab === 'merch' ? (
                  <motion.div
                    key="merch-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <MerchSection
                      loading={loading}
                      merch={merch}
                      merchCart={cartHook.merchCart}
                      setSelectedMerch={setSelectedMerch}
                      addToMerchCart={cartHook.addToMerchCart}
                      onSwitchTab={handleTabChange}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="cheki-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChekiSection
                      loading={loading}
                      events={sortedEvents}
                      selectedEventId={selectedEventId}
                      onSelectEvent={handleSelectEvent}
                      members={members}
                      groupMember={groupMember}
                      config={config}
                      cart={cartHook.cart}
                      addToCart={cartHook.addToCart}
                      updateQuantity={cartHook.updateQuantity}
                      getMemberImage={getMemberImage}
                      getAssetPath={getAssetPath}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                FLOATING BOTTOM CART BAR (Tengah Bawah Layar, Jelas & Berisi)
                ───────────────────────────────────────────────────────────── */}
            <AnimatePresence>
              {(cartHook.cart.length > 0 || cartHook.merchCart.length > 0) && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-lg"
                >
                  <div
                    onClick={() => setIsCartDrawerOpen(prev => !prev)}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#13121D]/95 border border-[#9D26FF]/40 text-white shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex items-center justify-between gap-3 hover:border-[#9D26FF] transition-all cursor-pointer ring-1 ring-white/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#9D26FF] flex items-center justify-center text-white text-sm shadow-[0_0_15px_rgba(157,38,255,0.5)] shrink-0">
                        <FaShoppingCart />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] text-zinc-300 font-bold block leading-tight truncate">
                          {cartHook.cart.length + cartHook.merchCart.length} Item di Keranjang
                        </span>
                        <span className="text-sm sm:text-base font-black text-white block leading-tight mt-0.5">
                          IDR {(cartHook.totalHarga + cartHook.totalMerchHarga).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsCartDrawerOpen(prev => !prev)
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#9D26FF] hover:bg-[#8215db] text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      <span>Lihat Keranjang</span>
                      <FaChevronRight className="text-[10px]" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─────────────────────────────────────────────────────────────
                SLIDE-OVER CART DRAWER
                ───────────────────────────────────────────────────────────── */}
            <CartDrawer
              isOpen={isCartDrawerOpen}
              onClose={() => setIsCartDrawerOpen(false)}
              cart={cartHook.cart}
              merchCart={cartHook.merchCart}
              updateQuantity={cartHook.updateQuantity}
              removeFromCart={cartHook.removeFromCart}
              updateMerchQuantity={cartHook.updateMerchQuantity}
              removeFromMerchCart={cartHook.removeFromMerchCart}
              totalHarga={cartHook.totalHarga}
              totalMerchHarga={cartHook.totalMerchHarga}
              onCheckoutCheki={() => {
                setIsCartDrawerOpen(false)
                setStep(2)
              }}
              onCheckoutMerch={() => {
                setIsCartDrawerOpen(false)
                setStep(4)
              }}
            />
          </div>
        ) : (
          <CheckoutProcess 
            step={step} setStep={setStep} {...cartHook}
            formData={formData} setFormData={setFormData} merchForm={merchForm} setMerchForm={setMerchForm}
            file={file} setFile={setFile} filePreview={filePreview} setFilePreview={setFilePreview}
            merchFile={merchFile} setMerchFile={setMerchFile} merchFilePreview={merchFilePreview} setMerchFilePreview={setMerchFilePreview}
            events={sortedEvents} submitting={submitting} uploading={uploading} merchSubmitting={merchSubmitting} merchUploading={merchUploading}
            handleSubmit={handleSubmit} handleMerchSubmit={handleMerchSubmit} handleFileChange={handleFileChange} handleMerchFileChange={handleMerchFileChange}
            orderSuccess={orderSuccess} merchOrderSuccess={merchOrderSuccess} receiptData={receiptData} merchReceiptData={merchReceiptData}
            maskContact={maskContact} setMaskContact={setMaskContact} maskMerchContact={maskMerchContact} setMaskMerchContact={setMaskMerchContact}
            activeDropdownId={activeDropdownId} setActiveDropdownId={setActiveDropdownId} 
            fileInputRef={fileInputRef} merchFileInputRef={merchFileInputRef} themeColor={themeColor} isSpecialEvent={isSpecialEvent} payment={currentPayment}
            paymentCheki={paymentCheki} paymentMerch={paymentMerch}
            selectedPaymentMethod={selectedPaymentMethod} setSelectedPaymentMethod={setSelectedPaymentMethod}
            turnstileToken={turnstileToken} setTurnstileToken={setTurnstileToken}
            merchTurnstileToken={merchTurnstileToken} setMerchTurnstileToken={setMerchTurnstileToken}
            copied={copied} setCopied={setCopied}
          />
        )}
      </main>

      <MerchDetailModal 
        selectedMerch={selectedMerch} setSelectedMerch={setSelectedMerch} activeSlide={activeSlide} setActiveSlide={setActiveSlide} 
        selectedSize={selectedSize} setSelectedSize={setSelectedSize} addToMerchCart={cartHook.addToMerchCart} 
      />
    </div>
  )
}

export default ShopPage
