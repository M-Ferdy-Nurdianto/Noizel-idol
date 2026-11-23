import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaChevronRight, FaPlus, FaMinus, FaCamera, 
  FaUniversity, FaRegCopy, FaCheckCircle, FaTrash, 
  FaInstagram, FaWhatsapp, FaChevronDown, FaUpload,
  FaQrcode, FaDownload, FaExpand, FaTimes, FaExclamationTriangle
} from 'react-icons/fa'
import { useState, useRef, useEffect } from 'react'
import DigitalReceipt from './DigitalReceipt'
import imageCompression from 'browser-image-compression'
import TurnstileWidget from './TurnstileWidget'
import { nzToast } from '../ui/NzToast'
import { useSocialLinks } from '../../hooks/useSocialLinks'

// --- REUSABLE COMPACT PAYMENT INFO CARD ---

const InternalPaymentInfo = ({ 
  payment, 
  copyToClipboard, 
  copied, 
  title, 
  total,
  selectedMethod,
  setSelectedMethod,
  onOpenQrisModal
}) => {
  const isTransferAvailable = payment?.transferActive !== false
  const isQrisAvailable = Boolean(payment?.qrisActive && payment?.qrisImage)

  const displayBank = payment?.bank || 'BCA'
  const displayRekening = (payment?.rekening && payment.rekening.trim() !== '' && payment.rekening.trim() !== '-')
    ? payment.rekening
    : '0902683273'
  const displayAtasNama = (payment?.atasNama && payment.atasNama.trim() !== '' && payment.atasNama.trim() !== '-')
    ? payment.atasNama
    : 'Natasya Angelina Putri'
  const displayMethod = payment?.method || 'Manual TF'

  // Download QRIS image
  const handleDownloadQris = async () => {
    if (!payment?.qrisImage) return
    try {
      const response = await fetch(payment.qrisImage)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `QRIS-NOIZE-${(title || 'PAYMENT').replace(/\s+/g, '-').toUpperCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download QRIS error:', err)
      window.open(payment.qrisImage, '_blank')
    }
  }

  // Fallback jika tidak ada metode yang aktif
  if (!isTransferAvailable && !isQrisAvailable) {
    return (
      <div className="bg-[#181625] border border-amber-500/30 rounded-xl p-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
          <FaExclamationTriangle />
          <span>Metode Pembayaran Belum Diaktifkan</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Admin belum mengaktifkan metode pembayaran atau melengkapi nomor rekening / QRIS resmi untuk {title}. Silakan hubungi admin official NOIZE.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#181625] border border-[#272438] rounded-xl p-4 transition-all space-y-4">
      {/* 1. Header Segmented Tabs (Hanya jika KEDUA metode aktif) */}
      {isTransferAvailable && isQrisAvailable && (
        <div className="flex bg-[#12111A] p-1 rounded-xl border border-[#272438]">
          <button
            type="button"
            onClick={() => setSelectedMethod('transfer')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedMethod === 'transfer'
                ? 'bg-[#9D26FF] text-white shadow-md shadow-[#9D26FF]/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FaUniversity className="text-xs" />
            <span>Transfer Bank</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod('qris')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedMethod === 'qris'
                ? 'bg-[#9D26FF] text-white shadow-md shadow-[#9D26FF]/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FaQrcode className="text-xs" />
            <span>QRIS</span>
          </button>
        </div>
      )}

      {/* 2. Total yang Harus Dibayar (Jelas & Besar untuk kedua metode) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#272438]">
        <div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Pembayaran {title && `(${title})`}:
          </span>
          <span className="text-[10px] text-zinc-500">
            {selectedMethod === 'qris' ? 'Scan dan transfer sesuai nominal persis di samping' : 'Transfer tepat sesuai nominal berikut'}
          </span>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-lg sm:text-xl font-black font-mono text-[#24C6F5] tracking-wide">
            IDR {(total || 0).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* 3A. Tampilan TRANSFER BANK */}
      {selectedMethod === 'transfer' && isTransferAvailable && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-md bg-[#9D26FF]/20 border border-[#9D26FF]/40 flex items-center justify-center shrink-0">
                <FaUniversity className="text-[#9D26FF] dark:text-[#24C6F5] text-xs" />
              </div>
              <span className="text-xs font-black uppercase text-white tracking-wide">
                {displayBank}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                · {displayMethod}
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              a.n. <span className="font-semibold text-white">{displayAtasNama}</span>
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 bg-[#12111A] border border-[#272438] rounded-lg px-3 py-2">
            <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
              {displayRekening}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(displayRekening)}
              aria-label="Salin nomor rekening"
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                copied
                  ? 'bg-[#9D26FF] text-white'
                  : 'bg-[#1E1C2E] text-zinc-300 hover:text-white hover:bg-[#272438]'
              }`}
              title="Salin nomor rekening"
            >
              {copied ? <FaCheckCircle className="text-xs" /> : <FaRegCopy className="text-xs" />}
            </button>
          </div>
        </div>
      )}

      {/* 3B. Tampilan QRIS */}
      {selectedMethod === 'qris' && isQrisAvailable && (
        <div className="flex flex-col items-center text-center space-y-3 pt-1">
          {/* Card Berlatar Putih dengan Padding (QR terbaca murni tanpa filter) */}
          <div 
            onClick={onOpenQrisModal}
            className="w-full max-w-[280px] bg-white rounded-2xl p-4 shadow-xl border border-white/20 cursor-pointer group relative flex flex-col items-center"
            title="Klik untuk perbesar gambar QRIS"
          >
            <div className="w-full max-w-[240px] aspect-square flex items-center justify-center overflow-hidden">
              <img
                src={payment?.qrisImage}
                alt="Barcode QRIS NOIZE"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
            <div className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-800 transition-colors flex items-center gap-1">
              <FaExpand className="text-[9px]" />
              <span>Ketuk untuk memperbesar</span>
            </div>
          </div>

          {/* Tombol Simpan Gambar (Download QRIS) */}
          <div className="w-full max-w-[280px] space-y-2">
            <button
              type="button"
              onClick={handleDownloadQris}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md"
            >
              <FaDownload className="text-xs text-[#24C6F5]" />
              <span>Simpan Gambar QRIS</span>
            </button>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Bisa dibayar lewat semua aplikasi mobile banking & e-wallet (BCA, Mandiri, GoPay, OVO, Dana, ShopeePay, dll).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// --- REUSABLE CART SUMMARY ---

const InternalCartSummary = ({
  items,
  type,
  total,
  onConfirm,
  isDisabled,
  onUpdateQty,
  onRemoveItem,
  onBackToShop,
}) => {
  const hasItems = items && items.length > 0

  return (
    <div className="flex flex-col">
      {/* Header ringkas */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#272438]">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Ringkasan Pesanan
        </span>
        <span className="text-[11px] font-bold text-[#9D26FF] bg-[#9D26FF]/15 px-2.5 py-0.5 rounded-full border border-[#9D26FF]/30">
          {items?.length || 0} item
        </span>
      </div>

      {/* List item dengan kontrol tambah / kurang / hapus */}
      <div className="max-h-[380px] overflow-y-auto pr-1 custom-scrollbar mb-4 space-y-3">
        {hasItems ? (
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const itemId = item.cartId || item.id
              const itemTitle = type === 'cheki'
                ? (item.displayName || (item.event_name ? `${item.baseName?.replace('Cheki ', '') || item.member_name || 'Cheki'} · ${item.event_name} · ${item.event_date_short || ''}` : item.name))
                : (item.name || item.nama || '').replace(/cheki/gi, '').trim()
              const itemImg = item.image || item.gambar_url

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={itemId}
                  className="p-3 rounded-xl bg-[#181625] border border-[#272438] flex flex-col gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#12111A] overflow-hidden flex-shrink-0 border border-[#272438]">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={itemTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                          NZ
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-tight" title={itemTitle}>
                        {itemTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono font-bold text-[#9D26FF] dark:text-[#24C6F5]">
                          IDR {Number(item.price || item.harga || 0).toLocaleString('id-ID')}
                        </span>
                        {item.size && (
                          <span className="text-[9px] bg-[#1E1C2E] border border-[#272438] px-1.5 py-0.2 rounded text-zinc-300 font-bold uppercase font-mono">
                            {item.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kontrol Qty (+ / -) & Subtotal */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#272438]/80">
                    <div className="flex items-center bg-[#12111A] rounded-lg border border-[#272438] p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQty && onUpdateQty(item, -1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Kurangi"
                      >
                        <FaMinus className="text-[8px]" />
                      </button>
                      <span className="w-7 text-center text-xs font-mono font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty && onUpdateQty(item, 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-[#9D26FF] dark:text-[#24C6F5] transition-colors cursor-pointer"
                        title="Tambah"
                      >
                        <FaPlus className="text-[8px]" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-zinc-400 font-mono">
                        IDR {((item.price || item.harga || 0) * item.quantity).toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveItem && onRemoveItem(item)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Hapus item"
                      >
                        <FaTrash className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        ) : (
          <div className="py-8 px-4 text-center rounded-xl border border-dashed border-[#272438]">
            <p className="text-xs font-medium text-zinc-400 mb-2">
              Keranjang kamu kosong
            </p>
            <button
              type="button"
              onClick={onBackToShop}
              className="text-[11px] font-bold uppercase tracking-wider text-[#9D26FF] dark:text-[#24C6F5] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              + Tambah Pesanan
            </button>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-3 border-t border-[#272438] mb-4">
        <span className="text-xs font-semibold text-zinc-400">
          Total
        </span>
        <span className="text-base font-bold text-white font-mono">
          IDR {(total || 0).toLocaleString('id-ID')}
        </span>
      </div>

      {/* Tombol Confirm selebar kartu */}
      <button
        type="button"
        onClick={onConfirm}
        disabled={isDisabled || !hasItems}
        className="w-full bg-[#9D26FF] hover:bg-[#8215db] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-[#9D26FF]/20 cursor-pointer"
      >
        Konfirmasi Pesanan
      </button>
    </div>
  )
}

// --- MAIN CHECKOUT PROCESS COMPONENT ---

const CheckoutProcess = ({
  step, setStep, cart, merchCart, totalHarga, totalMerchHarga, updateQuantity, removeFromCart,
  updateMerchQuantity, removeFromMerchCart, formData, setFormData, merchForm, setMerchForm,
  file, setFile, filePreview, setFilePreview, merchFile, setMerchFile, merchFilePreview, setMerchFilePreview,
  events = [], submitting, uploading, merchSubmitting, merchUploading, handleSubmit, handleMerchSubmit,
  receiptData, merchReceiptData, payment, copied, setCopied, fileInputRef, merchFileInputRef,
  selectedPaymentMethod, setSelectedPaymentMethod,
  turnstileToken, setTurnstileToken, merchTurnstileToken, setMerchTurnstileToken
}) => {
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showQrisModal, setShowQrisModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const { links: socialLinks } = useSocialLinks()

  // Otomatis sinkronisasi metode pembayaran yang valid & aktif
  useEffect(() => {
    const isTransfer = payment?.transferActive !== false
    const isQris = Boolean(payment?.qrisActive && payment?.qrisImage)

    if (isTransfer && isQris) {
      if (!selectedPaymentMethod || (selectedPaymentMethod !== 'transfer' && selectedPaymentMethod !== 'qris')) {
        setSelectedPaymentMethod?.('transfer')
      }
    } else if (isQris && !isTransfer) {
      setSelectedPaymentMethod?.('qris')
    } else if (isTransfer && !isQris) {
      setSelectedPaymentMethod?.('transfer')
    }
  }, [payment?.transferActive, payment?.qrisActive, payment?.qrisImage, selectedPaymentMethod, setSelectedPaymentMethod])

  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onFileSelect = async (e, type) => {
    const selectedFile = e?.target?.files?.[0] || (e instanceof File || e instanceof Blob ? e : null)
    if (!selectedFile) return
    
    // Immediate preview
    const previewUrl = URL.createObjectURL(selectedFile)
    if (type === 'cheki') setFilePreview(previewUrl)
    else setMerchFilePreview(previewUrl)

    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true, fileType: 'image/webp' }
      const compressedFile = await imageCompression(selectedFile, options)
      const webpFile = new File([compressedFile], selectedFile.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' })
      if (type === 'cheki') setFile(webpFile)
      else setMerchFile(webpFile)
    } catch (error) {
      console.error("Compression error:", error)
      if (type === 'cheki') setFile(selectedFile)
      else setMerchFile(selectedFile)
    }
  }

  // --- RECEIPT SCREENS (STEP 3 & STEP 5) ---
  if (step === 3 || step === 5) {
    const data = step === 3 ? receiptData : merchReceiptData
    const waChannelUrl = (data?.whatsapp_channel || socialLinks?.whatsapp_channel || '').trim()
    
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-[700px] mx-auto text-center space-y-5 pt-4 pb-12 px-4">
        <div className="w-14 h-14 rounded-full bg-[#9D26FF] flex items-center justify-center text-white text-xl shadow-lg shadow-[#9D26FF]/40 mx-auto">
          <FaCheckCircle />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Terima Kasih!</h2>
          <p className="text-xs text-zinc-400 font-medium">Pesanan kamu sudah diterima oleh <span className="text-[#9D26FF] font-bold">NOIZE</span>.</p>
        </div>

        <div className="space-y-4">
          <DigitalReceipt data={data} payment={payment} isPreview />
          
          <div className="max-w-md mx-auto space-y-3 pt-2">
            {/* WhatsApp Channel Info Button (Hanya tampil jika channel WA diisi di Settings) */}
            {waChannelUrl && (
              <div className="space-y-1.5">
                <a 
                  href={waChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 shadow-md shadow-[#25D366]/25 active:scale-98 transition-all"
                >
                  <FaWhatsapp className="text-base" />
                  <span>Gabung Channel WhatsApp</span>
                </a>
                <p className="text-[10px] text-zinc-400">
                  Info jadwal & pengambilan akan dibagikan via WhatsApp Channel & Instagram
                </p>
              </div>
            )}

            {/* IG Story Button */}
            <div className="space-y-1.5">
              <a 
                href="https://instagram.com/noize.official"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#181625] hover:bg-[#201d32] border border-[#272438] text-white py-3 px-6 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 active:scale-98 transition-all"
              >
                <FaInstagram className="text-base text-pink-500" />
                <span>Post Nota ke IG Story</span>
              </a>
              <p className="text-[10px] text-zinc-500">
                Tag @noize.official dan dukung oshimu!
              </p>
            </div>
          </div>
        </div>

        {step === 3 && merchCart?.length > 0 && (
          <div className="p-4 rounded-xl bg-[#181625] border border-[#272438] max-w-md mx-auto text-center space-y-2.5">
            <p className="text-xs font-bold text-zinc-300">
              Kamu masih punya {merchCart.length} item Merchandise di keranjang!
            </p>
            <button
              type="button"
              onClick={() => { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="bg-[#24C6F5] hover:bg-[#1bb3df] text-black px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Lanjut Bayar Merchandise</span>
              <FaChevronRight className="text-[9px]" />
            </button>
          </div>
        )}

        {step === 5 && cart?.length > 0 && (
          <div className="p-4 rounded-xl bg-[#181625] border border-[#272438] max-w-md mx-auto text-center space-y-2.5">
            <p className="text-xs font-bold text-zinc-300">
              Kamu masih punya {cart.length} tiket Cheki di keranjang!
            </p>
            <button
              type="button"
              onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="bg-[#9D26FF] hover:bg-[#8215db] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Lanjut Bayar Tiket Cheki</span>
              <FaChevronRight className="text-[9px]" />
            </button>
          </div>
        )}

        <button 
          type="button" 
          onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
          className="text-zinc-400 hover:text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5 pt-2 cursor-pointer"
        >
          <span>Kembali ke Shop</span>
          <FaChevronRight className="text-[8px]" />
        </button>
      </motion.div>
    )
  }

  const currentTotal = step === 2 ? totalHarga : totalMerchHarga
  const activeTurnstileToken = step === 2 ? turnstileToken : merchTurnstileToken
  const requiresTurnstile = import.meta.env.VITE_TURNSTILE_ENABLED === 'true' && !!import.meta.env.VITE_TURNSTILE_SITE_KEY
  const isSubmitDisabled =
    (step === 2 ? submitting : merchSubmitting) ||
    (step === 2 ? cart.length === 0 : merchCart.length === 0)

  const triggerCheckoutSubmit = () => {
    if (step === 2 ? submitting : merchSubmitting) return

    // Validasi field sisi client dengan feedback jelas
    if (step === 2) {
      if (!formData.nama_panggilan || !formData.nama_panggilan.trim()) {
        nzToast.warning('Silakan isi nama panggilan kamu!')
        return
      }
      if (!formData.kontak || !formData.kontak.trim()) {
        nzToast.warning('Silakan isi nomor WhatsApp atau username IG!')
        return
      }
      if (!file) {
        nzToast.warning('Silakan upload bukti pembayaran terlebih dahulu!')
        return
      }
    } else {
      if (!merchForm.nama_lengkap || !merchForm.nama_lengkap.trim()) {
        nzToast.warning('Silakan isi nama lengkap kamu!')
        return
      }
      if (!merchForm.whatsapp || !merchForm.whatsapp.trim()) {
        nzToast.warning('Silakan isi nomor WhatsApp kamu!')
        return
      }
      if (!merchFile) {
        nzToast.warning('Silakan upload bukti pembayaran terlebih dahulu!')
        return
      }
    }

    if (requiresTurnstile && !activeTurnstileToken) {
      const isDummyKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || '').startsWith('1x00000000000000000000')
      if (isDummyKey || import.meta.env.DEV) {
        if (step === 2) setTurnstileToken('dev-turnstile-token')
        else setMerchTurnstileToken('dev-turnstile-token')
      } else {
        nzToast.warning('Sedang memverifikasi keamanan, mohon tunggu sebentar...')
        return
      }
    }

    const formEl = document.getElementById('checkout-form')
    if (formEl) {
      if (typeof formEl.requestSubmit === 'function') {
        formEl.requestSubmit()
      } else {
        formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }
    }
  }

  const activeFilePreview = step === 2 ? filePreview : merchFilePreview

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1100px] mx-auto px-4 pb-8 lg:pb-16"
    >
      {/* ===== MOBILE COLLAPSIBLE ORDER SUMMARY ===== */}
      <div className="lg:hidden mb-5 bg-[#13121D] rounded-xl border border-[#272438] overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>Ringkasan Pesanan ({(step === 2 ? cart : merchCart)?.length || 0} item)</span>
            <FaChevronDown className={`text-[10px] transition-transform duration-200 ${mobileSummaryOpen ? 'rotate-180' : ''}`} />
          </div>
          <span className="font-mono font-bold text-white">
            IDR {(currentTotal || 0).toLocaleString('id-ID')}
          </span>
        </button>
        {mobileSummaryOpen && (
          <div className="p-4 pt-2 border-t border-[#272438] space-y-3">
            {(step === 2 ? cart : merchCart)?.map((item) => {
              const itemId = item.cartId || item.id
              const itemTitle = step === 2
                ? (item.displayName || (item.event_name ? `${item.baseName?.replace('Cheki ', '') || item.member_name || 'Cheki'} · ${item.event_name} · ${item.event_date_short || ''}` : item.name))
                : (item.name || item.nama || '').replace(/cheki/gi, '').trim()
              return (
                <div key={itemId} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-zinc-400 font-bold">{item.quantity}x</span>
                    <span className="text-zinc-200 truncate" title={itemTitle}>{itemTitle}</span>
                    {item.size && <span className="text-[10px] font-mono text-zinc-400 uppercase">({item.size})</span>}
                  </div>
                  <span className="font-mono font-semibold text-white shrink-0 ml-2">
                    IDR {((item.price || item.harga || 0) * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== TWO-COLUMN DESKTOP / STACKED MOBILE LAYOUT ===== */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

        {/* ===== KOLOM KIRI: FORM CHECKOUT (~60%) ===== */}
        <div className="w-full lg:w-[60%] bg-[#13121D] rounded-2xl p-5 sm:p-7 border border-[#272438] shadow-xl space-y-6">
          
          {/* Sederhana: Tombol Kembali + teks "Kembali ke Shop" */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-[#1E1C2E] border border-[#272438] flex items-center justify-center group-hover:border-zinc-500 transition-colors">
                <FaChevronRight className="rotate-180 text-[8px]" />
              </div>
              <span>Kembali ke Shop</span>
            </button>
          </div>

          {/* Judul: Checkout (Ukuran lebih kecil, tanpa garis dekoratif) */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Checkout
            </h2>
          </div>

          {/* Info Rekening / QRIS Ringkas dalam Satu Kartu */}
          <InternalPaymentInfo
            payment={payment}
            copyToClipboard={copyToClipboard}
            copied={copied}
            title={step === 2 ? 'Tiket Cheki' : 'Merchandise'}
            total={currentTotal}
            selectedMethod={selectedPaymentMethod}
            setSelectedMethod={setSelectedPaymentMethod}
            onOpenQrisModal={() => setShowQrisModal(true)}
          />

          {/* Form */}
          <form
            id="checkout-form"
            onSubmit={step === 2 ? handleSubmit : handleMerchSubmit}
            noValidate
            className="space-y-4"
          >
            {/* Nama & kontak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Nama panggilan *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Kiki"
                  value={step === 2 ? formData.nama_panggilan : merchForm.nama_lengkap}
                  onChange={(e) =>
                    step === 2
                      ? setFormData({ ...formData, nama_panggilan: e.target.value })
                      : setMerchForm({ ...merchForm, nama_lengkap: e.target.value })
                  }
                  className="w-full text-sm bg-[#181625] border border-[#272438] focus:border-[#9D26FF] focus:ring-1 focus:ring-[#9D26FF] rounded-xl px-4 py-3 font-medium outline-none transition-all placeholder:text-zinc-600 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  {step === 2 ? 'WhatsApp / IG *' : 'Nomor WhatsApp *'}
                </label>
                <input
                  required
                  type="text"
                  placeholder={step === 2 ? '08xxx / @username' : '08xxxxxxxxx'}
                  value={step === 2 ? formData.kontak : merchForm.whatsapp}
                  onChange={(e) =>
                    step === 2
                      ? setFormData({ ...formData, kontak: e.target.value })
                      : setMerchForm({ ...merchForm, whatsapp: e.target.value })
                  }
                  className="w-full text-sm bg-[#181625] border border-[#272438] focus:border-[#9D26FF] focus:ring-1 focus:ring-[#9D26FF] rounded-xl px-4 py-3 font-medium outline-none transition-all placeholder:text-zinc-600 text-white"
                />
              </div>
            </div>

            {/* Instagram — khusus merch */}
            {step === 4 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Instagram (opsional)
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={merchForm.instagram}
                  onChange={(e) =>
                    setMerchForm({ ...merchForm, instagram: e.target.value })
                  }
                  className="w-full text-sm bg-[#181625] border border-[#272438] focus:border-[#9D26FF] focus:ring-1 focus:ring-[#9D26FF] rounded-xl px-4 py-3 font-medium outline-none transition-all placeholder:text-zinc-600 text-white"
                />
              </div>
            )}

            {/* Upload bukti pembayaran */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Bukti pembayaran *
                </label>
                {activeFilePreview && (
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="text-[10px] font-bold text-[#9D26FF] dark:text-[#24C6F5] flex items-center gap-1 bg-[#1E1C2E] px-2 py-0.5 rounded-md border border-[#272438] hover:border-zinc-500 transition-all cursor-pointer"
                  >
                    <FaCheckCircle className="text-[9px]" /> Lihat foto
                  </button>
                )}
              </div>

              {/* Area upload */}
              <div
                onClick={() =>
                  step === 2
                    ? fileInputRef.current?.click()
                    : merchFileInputRef.current?.click()
                }
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dragCounter.current++
                  if (dragCounter.current === 1) setIsDragging(true)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dragCounter.current--
                  if (dragCounter.current <= 0) {
                    dragCounter.current = 0
                    setIsDragging(false)
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dragCounter.current = 0
                  setIsDragging(false)
                  const droppedFile = e.dataTransfer?.files?.[0]
                  if (droppedFile && droppedFile.type.startsWith('image/')) {
                    onFileSelect(droppedFile, step === 2 ? 'cheki' : 'merch')
                  }
                }}
                className={`relative rounded-xl border border-dashed transition-all cursor-pointer overflow-hidden group h-24 flex items-center justify-center ${
                  isDragging
                    ? 'border-[#9D26FF] bg-[#9D26FF]/15'
                    : activeFilePreview
                    ? 'border-[#9D26FF]/60 bg-[#181625]'
                    : 'border-[#272438] hover:border-zinc-500 bg-[#181625]/60'
                }`}
              >
                {isDragging ? (
                  <div className="flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                    <FaUpload className="text-xl text-[#9D26FF] mb-1" />
                    <p className="text-xs font-bold text-white">
                      Lepaskan foto di sini
                    </p>
                  </div>
                ) : activeFilePreview ? (
                  <div className="flex items-center gap-3 px-4 w-full">
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowPhotoModal(true)
                      }}
                      className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-[#9D26FF]/50"
                    >
                      <img
                        src={activeFilePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">
                        Foto sudah dipilih
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Ketuk foto untuk preview · Ketuk area ini untuk ganti
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#9D26FF]/15 flex items-center justify-center border border-[#9D26FF]/30">
                      <FaCheckCircle className="text-[#9D26FF] text-xs" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 w-full">
                    <div className="w-9 h-9 rounded-lg bg-[#12111A] border border-[#272438] flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors flex-shrink-0">
                      <FaCamera className="text-sm" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Upload bukti pembayaran
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Klik untuk memilih atau seret (drag & drop) gambar ke sini
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={step === 2 ? fileInputRef : merchFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileSelect(e, step === 2 ? 'cheki' : 'merch')}
                  className="hidden"
                />
              </div>
            </div>

            {/* Catatan (alamiah, tanpa min-height yang memaksa) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Catatan pesanan / alamat pengiriman (opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Tulis pesan khusus atau alamat pengiriman jika perlu"
                value={step === 2 ? formData.catatan : merchForm.catatan}
                onChange={(e) =>
                  step === 2
                    ? setFormData({ ...formData, catatan: e.target.value })
                    : setMerchForm({ ...merchForm, catatan: e.target.value })
                }
                className="w-full text-sm bg-[#181625] border border-[#272438] focus:border-[#9D26FF] focus:ring-1 focus:ring-[#9D26FF] rounded-xl px-4 py-3 font-medium outline-none resize-y transition-all placeholder:text-zinc-600 text-white"
              />
            </div>

            {/* Cloudflare Turnstile */}
            {requiresTurnstile && (
              <div className="pt-1">
                <TurnstileWidget
                  key={`turnstile-step-${step}`}
                  onSuccess={(token) => {
                    if (step === 2) setTurnstileToken(token)
                    else setMerchTurnstileToken(token)
                  }}
                  onExpire={() => {
                    if (step === 2) setTurnstileToken('')
                    else setMerchTurnstileToken('')
                  }}
                  onError={() => {
                    if (step === 2) setTurnstileToken('')
                    else setMerchTurnstileToken('')
                  }}
                />
              </div>
            )}
          </form>
        </div>

        {/* ===== KOLOM KANAN: RINGKASAN PESANAN STICKY (~40%) ===== */}
        <div className="hidden lg:block w-[40%] sticky top-24 self-start">
          <div className="bg-[#13121D] rounded-2xl p-6 border border-[#272438] shadow-xl">
            <InternalCartSummary
              items={step === 2 ? cart : merchCart}
              type={step === 2 ? 'cheki' : 'merch'}
              total={currentTotal}
              onConfirm={triggerCheckoutSubmit}
              isDisabled={isSubmitDisabled}
              onUpdateQty={(item, delta) => {
                if (step === 2) {
                  updateQuantity(item.id, delta)
                } else {
                  updateMerchQuantity(item.cartId, delta)
                }
              }}
              onRemoveItem={(item) => {
                if (step === 2) {
                  removeFromCart(item.id)
                } else {
                  removeFromMerchCart(item.cartId)
                }
              }}
              onBackToShop={() => {
                setStep(1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== MODAL PREVIEW FOTO BUKTI PEMBAYARAN ===== */}
      <AnimatePresence>
        {showPhotoModal && activeFilePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPhotoModal(false)}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#13121D] rounded-2xl overflow-hidden border border-[#272438] shadow-2xl max-w-lg w-full cursor-default"
            >
              {/* Header modal */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#272438]">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-[#9D26FF] text-sm" />
                  <span className="text-sm font-bold text-white">
                    Preview Bukti Pembayaran
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="w-7 h-7 rounded-lg bg-[#181625] border border-[#272438] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Foto */}
              <div className="p-4 flex items-center justify-center bg-[#070B14]">
                <img
                  src={activeFilePreview}
                  alt="Bukti Pembayaran"
                  className="w-full rounded-xl object-contain max-h-[60vh]"
                />
              </div>

              {/* Footer modal */}
              <div className="p-4 border-t border-[#272438] flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoModal(false)
                    setTimeout(() => {
                      step === 2
                        ? fileInputRef.current?.click()
                        : merchFileInputRef.current?.click()
                    }, 200)
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[#272438] text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Ganti Foto
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#9D26FF] text-white text-xs font-bold hover:bg-[#8215db] transition-all cursor-pointer"
                >
                  Sudah Benar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODAL PREVIEW QRIS PEMBAYARAN ===== */}
      <AnimatePresence>
        {showQrisModal && payment?.qrisImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQrisModal(false)}
            className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full p-5 text-center cursor-default space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <FaQrcode className="text-zinc-800 text-sm" />
                  <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    QRIS {step === 2 ? 'Tiket Cheki' : 'Merchandise'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrisModal(false)}
                  className="text-zinc-500 hover:text-zinc-800 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="w-full flex items-center justify-center py-2 bg-white">
                <img
                  src={payment.qrisImage}
                  alt="QRIS Full Size"
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              <div className="bg-zinc-100 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Total Nominal:</span>
                <span className="text-base font-black font-mono text-zinc-900">
                  IDR {(currentTotal || 0).toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch(payment.qrisImage)
                    const blob = await response.blob()
                    const blobUrl = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = blobUrl
                    link.download = `QRIS-NOIZE-${Date.now()}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(blobUrl)
                  } catch (err) {
                    window.open(payment.qrisImage, '_blank')
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-[#9D26FF] hover:bg-[#8215db] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <FaDownload className="text-xs" />
                <span>Simpan Gambar ke Perangkat</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== STICKY BOTTOM BAR MOBILE ===== */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#13121D]/95 backdrop-blur-xl border-t border-[#272438] px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-zinc-400 font-medium leading-none">
              Total pesanan
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base font-bold font-mono text-white truncate">
                IDR {(currentTotal || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={triggerCheckoutSubmit}
            disabled={isSubmitDisabled}
            className="flex-1 bg-[#9D26FF] hover:bg-[#8215db] text-white py-3 px-5 rounded-xl font-bold text-xs shadow-md shadow-[#9D26FF]/25 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            Konfirmasi Pesanan
          </button>
        </div>
      </div>

      <LoadingOverlay isVisible={(step === 2 ? submitting : merchSubmitting)} message={(step === 2 ? uploading : merchUploading) ? 'Mengunggah Bukti...' : 'Memproses Pesanan...'} />
    </motion.div>
  )
}

const LoadingOverlay = ({ isVisible, message }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-[9999] bg-[#070B14]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="w-10 h-10 rounded-full border-2 border-[#272438] border-t-[#9D26FF] animate-spin mb-4" />
        <h3 className="text-base font-bold text-white tracking-wide">{message}</h3>
        <p className="text-xs text-zinc-400 mt-1">Mohon tunggu sebentar ya!</p>
      </motion.div>
    )}
  </AnimatePresence>
)

export default CheckoutProcess
