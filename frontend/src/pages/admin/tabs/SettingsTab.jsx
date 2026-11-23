import React, { useState, useRef } from 'react'
import { 
  FaSave, FaTrash, FaWrench, FaCopy, FaTicketAlt, FaShoppingBag, 
  FaCheck, FaInstagram, FaTiktok, FaYoutube, FaTwitter, FaDiscord, FaWhatsapp, FaEnvelope,
  FaExternalLinkAlt, FaShareAlt, FaInfoCircle, FaQrcode, FaUpload, 
  FaSpinner, FaEye, FaTimes 
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { updateCachedSocialLinks } from '../../../hooks/useSocialLinks'
import { updateCachedFooterSettings } from '../../../hooks/useFooterSettings'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'
import Swal from 'sweetalert2'

// Helper to format string into thousand separator (e.g. "30000" -> "30.000")
const formatThousand = (val) => {
  if (val === undefined || val === null || val === '') return ''
  const numStr = String(val).replace(/\D/g, '')
  if (!numStr) return ''
  return Number(numStr).toLocaleString('id-ID')
}

const SettingsTab = ({
  hargaPerMember, setHargaPerMember,
  hargaGrup, setHargaGrup,
  hargaOtsPerMember, setHargaOtsPerMember,
  hargaOtsGrup, setHargaOtsGrup,
  paymentBank, setPaymentBank,
  paymentRekening, setPaymentRekening,
  paymentAtasNama, setPaymentAtasNama,
  paymentMethod, setPaymentMethod,
  paymentMerchBank, setPaymentMerchBank,
  paymentMerchRekening, setPaymentMerchRekening,
  paymentMerchAtasNama, setPaymentMerchAtasNama,
  paymentMerchMethod, setPaymentMerchMethod,
  paymentChekiTransferActive, setPaymentChekiTransferActive,
  paymentChekiQrisActive, setPaymentChekiQrisActive,
  paymentChekiQrisImage, setPaymentChekiQrisImage,
  paymentMerchTransferActive, setPaymentMerchTransferActive,
  paymentMerchQrisActive, setPaymentMerchQrisActive,
  paymentMerchQrisImage, setPaymentMerchQrisImage,
  maintenanceMode, setMaintenanceMode,
  maintenanceMessage, setMaintenanceMessage,
  maintenanceEstimatedEnd, setMaintenanceEstimatedEnd,
  socialLinks, setSocialLinks,
  officialEmail, setOfficialEmail,
  configLoading, updateConfig,
  onShowBulkDeleteModal,
  onPurgeOldPayments
}) => {
  const [copiedFromCheki, setCopiedFromCheki] = useState(false)
  const [uploadingChekiQris, setUploadingChekiQris] = useState(false)
  const [uploadingMerchQris, setUploadingMerchQris] = useState(false)
  const [previewModalImg, setPreviewModalImg] = useState(null)
  const chekiQrisInputRef = useRef(null)
  const merchQrisInputRef = useRef(null)

  const handleCopyFromCheki = () => {
    setPaymentMerchBank(paymentBank || 'BCA')
    setPaymentMerchRekening(paymentRekening || '')
    setPaymentMerchAtasNama(paymentAtasNama || '')
    setPaymentMerchMethod(paymentMethod || 'Manual TF')
    setPaymentMerchTransferActive(paymentChekiTransferActive)
    setPaymentMerchQrisActive(paymentChekiQrisActive)
    setPaymentMerchQrisImage(paymentChekiQrisImage || '')
    setCopiedFromCheki(true)
    setTimeout(() => setCopiedFromCheki(false), 2000)
    showToast.success('Pengaturan rekening & QRIS disalin dari Cheki!')
  }

  const handleQrisFileChange = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi format file: hanya PNG, JPG, WebP
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Format Tidak Sesuai',
        text: 'Format file tidak didukung. Hanya file PNG, JPG, atau WebP yang diperbolehkan.',
        confirmButtonColor: '#9D26FF'
      })
      e.target.value = ''
      return
    }

    // Validasi ukuran maksimal 2MB
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Ukuran Terlalu Besar',
        text: 'Ukuran file terlalu besar. Maksimal 2MB.',
        confirmButtonColor: '#9D26FF'
      })
      e.target.value = ''
      return
    }

    const isCheki = type === 'cheki'
    const setUploading = isCheki ? setUploadingChekiQris : setUploadingMerchQris
    const currentOldUrl = isCheki ? paymentChekiQrisImage : paymentMerchQrisImage
    const setImage = isCheki ? setPaymentChekiQrisImage : setPaymentMerchQrisImage
    const setQrisActive = isCheki ? setPaymentChekiQrisActive : setPaymentMerchQrisActive

    try {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      if (currentOldUrl) {
        fd.append('oldUrl', currentOldUrl)
      }

      const res = await api.post('/upload/qris', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data?.success && res.data?.data?.url) {
        const newUrl = res.data.data.url
        setImage(newUrl)
        setQrisActive(true) // Auto-aktifkan saat upload berhasil
        showToast.success(`QRIS ${isCheki ? 'Tiket Cheki' : 'Merchandise'} berhasil diunggah!`)
      } else {
        throw new Error(res.data?.error || 'Gagal mengunggah QRIS')
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Upload Gagal',
        text: err.response?.data?.error || err.message || 'Gagal mengunggah gambar QRIS',
        confirmButtonColor: '#9D26FF'
      })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteQris = async (type) => {
    const isCheki = type === 'cheki'
    const currentUrl = isCheki ? paymentChekiQrisImage : paymentMerchQrisImage
    const transferActive = isCheki ? paymentChekiTransferActive : paymentMerchTransferActive
    const setImage = isCheki ? setPaymentChekiQrisImage : setPaymentMerchQrisImage
    const setQrisActive = isCheki ? setPaymentChekiQrisActive : setPaymentMerchQrisActive

    // Cek agar tidak menjadi 0 metode aktif
    if (!transferActive) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Bisa Menghapus',
        text: 'Aktifkan Transfer Bank terlebih dahulu sebelum menghapus QRIS agar tetap ada minimal satu metode pembayaran aktif.',
        confirmButtonColor: '#9D26FF'
      })
      return
    }

    const confirm = await Swal.fire({
      title: 'Hapus QRIS?',
      text: `Gambar QRIS ${isCheki ? 'Tiket Cheki' : 'Merchandise'} akan dihapus permanen dari storage dan metode QRIS akan dinonaktifkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    })

    if (!confirm.isConfirmed) return

    try {
      if (currentUrl) {
        await api.delete('/upload/qris', { data: { url: currentUrl } })
      }
      setImage('')
      setQrisActive(false)
      showToast.success(`QRIS ${isCheki ? 'Tiket Cheki' : 'Merchandise'} berhasil dihapus!`)
    } catch (err) {
      console.error(err)
      showToast.error('Gagal menghapus gambar QRIS')
    }
  }

  const handleToggleChekiTransfer = () => {
    if (paymentChekiTransferActive) {
      if (!paymentChekiQrisActive || !paymentChekiQrisImage) {
        Swal.fire({
          icon: 'warning',
          title: 'Tidak Bisa Dinonaktifkan',
          text: 'Minimal harus ada satu metode pembayaran aktif. Aktifkan QRIS dan upload gambarnya terlebih dahulu jika ingin menonaktifkan Transfer Bank.',
          confirmButtonColor: '#9D26FF'
        })
        return
      }
      setPaymentChekiTransferActive(false)
    } else {
      setPaymentChekiTransferActive(true)
    }
  }

  const handleToggleChekiQris = () => {
    if (paymentChekiQrisActive) {
      if (!paymentChekiTransferActive) {
        Swal.fire({
          icon: 'warning',
          title: 'Tidak Bisa Dinonaktifkan',
          text: 'Minimal harus ada satu metode pembayaran aktif. Aktifkan Transfer Bank terlebih dahulu jika ingin menonaktifkan QRIS.',
          confirmButtonColor: '#9D26FF'
        })
        return
      }
      setPaymentChekiQrisActive(false)
    } else {
      if (!paymentChekiQrisImage) {
        Swal.fire({
          icon: 'warning',
          title: 'QRIS Belum Diupload',
          text: 'Upload gambar QRIS terlebih dahulu sebelum mengaktifkan metode QRIS.',
          confirmButtonColor: '#9D26FF'
        })
        return
      }
      setPaymentChekiQrisActive(true)
    }
  }

  const handleToggleMerchTransfer = () => {
    if (paymentMerchTransferActive) {
      if (!paymentMerchQrisActive || !paymentMerchQrisImage) {
        Swal.fire({
          icon: 'warning',
          title: 'Tidak Bisa Dinonaktifkan',
          text: 'Minimal harus ada satu metode pembayaran aktif. Aktifkan QRIS dan upload gambarnya terlebih dahulu jika ingin menonaktifkan Transfer Bank.',
          confirmButtonColor: '#9D26FF'
        })
        return
      }
      setPaymentMerchTransferActive(false)
    } else {
      setPaymentMerchTransferActive(true)
    }
  }

  const handleToggleMerchQris = () => {
    if (paymentMerchQrisActive) {
      if (!paymentMerchTransferActive) {
        Swal.fire({
          icon: 'warning',
          title: 'Tidak Bisa Dinonaktifkan',
          text: 'Minimal harus ada satu metode pembayaran aktif. Aktifkan Transfer Bank terlebih dahulu jika ingin menonaktifkan QRIS.',
          confirmButtonColor: '#9D26FF'
        })
        return
      }
      setPaymentMerchQrisActive(false)
    } else {
      if (!paymentMerchQrisImage) {
        Swal.fire({
          icon: 'warning',
          title: 'QRIS Belum Diupload',
          text: 'Upload gambar QRIS terlebih dahulu sebelum mengaktifkan metode QRIS.',
          confirmButtonColor: '#9D26FF'
        })
        return
      }
      setPaymentMerchQrisActive(true)
    }
  }

  const handleSaveSettings = async () => {
    // Validasi minimal 1 metode aktif per kartu
    if (!paymentChekiTransferActive && !paymentChekiQrisActive) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan!',
        text: 'Minimal harus ada satu metode pembayaran aktif untuk Tiket Cheki (Transfer Bank atau QRIS).',
        confirmButtonColor: '#9D26FF'
      })
      return
    }

    if (paymentChekiQrisActive && !paymentChekiQrisImage) {
      Swal.fire({
        icon: 'warning',
        title: 'QRIS Belum Diupload!',
        text: 'QRIS Tiket Cheki hanya bisa diaktifkan jika gambar QRIS sudah diupload.',
        confirmButtonColor: '#9D26FF'
      })
      return
    }

    if (!paymentMerchTransferActive && !paymentMerchQrisActive) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan!',
        text: 'Minimal harus ada satu metode pembayaran aktif untuk Merchandise (Transfer Bank atau QRIS).',
        confirmButtonColor: '#9D26FF'
      })
      return
    }

    if (paymentMerchQrisActive && !paymentMerchQrisImage) {
      Swal.fire({
        icon: 'warning',
        title: 'QRIS Belum Diupload!',
        text: 'QRIS Merchandise hanya bisa diaktifkan jika gambar QRIS sudah diupload.',
        confirmButtonColor: '#9D26FF'
      })
      return
    }

    const updates = {
      harga_cheki_per_member: String(hargaPerMember).replace(/\D/g, ''),
      harga_cheki_grup: String(hargaGrup).replace(/\D/g, ''),
      harga_ots_per_member: String(hargaOtsPerMember).replace(/\D/g, ''),
      harga_ots_grup: String(hargaOtsGrup).replace(/\D/g, ''),
      // Cheki (tetap simpan ke payment_* lama untuk backward compatibility)
      payment_bank: paymentBank || '',
      payment_rekening: paymentRekening || '',
      payment_atas_nama: paymentAtasNama || '',
      payment_method: paymentMethod || 'Manual TF',
      payment_cheki_bank: paymentBank || '',
      payment_cheki_rekening: paymentRekening || '',
      payment_cheki_atas_nama: paymentAtasNama || '',
      payment_cheki_method: paymentMethod || 'Manual TF',
      payment_cheki_transfer_active: paymentChekiTransferActive ? 'true' : 'false',
      payment_cheki_qris_active: paymentChekiQrisActive ? 'true' : 'false',
      payment_cheki_qris_image: paymentChekiQrisImage || '',
      // Merch
      payment_merch_bank: paymentMerchBank || '',
      payment_merch_rekening: paymentMerchRekening || '',
      payment_merch_atas_nama: paymentMerchAtasNama || '',
      payment_merch_method: paymentMerchMethod || 'Manual TF',
      payment_merch_transfer_active: paymentMerchTransferActive ? 'true' : 'false',
      payment_merch_qris_active: paymentMerchQrisActive ? 'true' : 'false',
      payment_merch_qris_image: paymentMerchQrisImage || '',
      maintenance_mode: maintenanceMode ? 'true' : 'false',
      maintenance_message: maintenanceMessage || '',
      maintenance_estimated_end: maintenanceEstimatedEnd || '',
      social_links: JSON.stringify(socialLinks || {}),
      whatsapp_channel: (socialLinks?.whatsapp_channel || '').trim(),
      contact_email: (officialEmail || '').trim()
    }

    try {
      const cfgRes = await api.get('/config')
      if (cfgRes.data?.success && cfgRes.data.data) {
        const cfg = cfgRes.data.data
        if (cfg.footer_settings) {
          const f = typeof cfg.footer_settings === 'string' ? JSON.parse(cfg.footer_settings) : cfg.footer_settings
          f.email = (officialEmail || '').trim()
          updates.footer_settings = JSON.stringify(f)
          updateCachedFooterSettings(f)
        }
        if (cfg.about_story_text) {
          const a = typeof cfg.about_story_text === 'string' ? JSON.parse(cfg.about_story_text) : cfg.about_story_text
          a.cp_email = (officialEmail || '').trim()
          updates.about_story_text = JSON.stringify(a)
        }
      }
    } catch (_) {}

    await updateConfig(updates)
    updateCachedSocialLinks(socialLinks || {})
  }

  const handleSaveSocialLinks = async () => {
    updateCachedSocialLinks(socialLinks || {})
    const emailVal = (officialEmail || '').trim()
    const updates = {
      social_links: JSON.stringify(socialLinks || {}),
      whatsapp_channel: (socialLinks?.whatsapp_channel || '').trim(),
      contact_email: emailVal
    }

    try {
      const cfgRes = await api.get('/config')
      if (cfgRes.data?.success && cfgRes.data.data) {
        const cfg = cfgRes.data.data
        if (cfg.footer_settings) {
          const f = typeof cfg.footer_settings === 'string' ? JSON.parse(cfg.footer_settings) : cfg.footer_settings
          f.email = emailVal
          updates.footer_settings = JSON.stringify(f)
          updateCachedFooterSettings(f)
        }
        if (cfg.about_story_text) {
          const a = typeof cfg.about_story_text === 'string' ? JSON.parse(cfg.about_story_text) : cfg.about_story_text
          a.cp_email = emailVal
          updates.about_story_text = JSON.stringify(a)
        }
      }
    } catch (_) {}

    await updateConfig(updates)
  }

  const handleBlurSocialLink = async () => {
    updateCachedSocialLinks(socialLinks || {})
    await updateConfig({
      social_links: JSON.stringify(socialLinks || {}),
      whatsapp_channel: (socialLinks?.whatsapp_channel || '').trim()
    }, true)
  }

  const handleBlurEmail = async () => {
    const emailVal = (officialEmail || '').trim()
    const updates = {
      contact_email: emailVal
    }
    try {
      const cfgRes = await api.get('/config')
      if (cfgRes.data?.success && cfgRes.data.data) {
        const cfg = cfgRes.data.data
        if (cfg.footer_settings) {
          const f = typeof cfg.footer_settings === 'string' ? JSON.parse(cfg.footer_settings) : cfg.footer_settings
          f.email = emailVal
          updates.footer_settings = JSON.stringify(f)
          updateCachedFooterSettings(f)
        }
        if (cfg.about_story_text) {
          const a = typeof cfg.about_story_text === 'string' ? JSON.parse(cfg.about_story_text) : cfg.about_story_text
          a.cp_email = emailVal
          updates.about_story_text = JSON.stringify(a)
        }
      }
    } catch (_) {}
    await updateConfig(updates, true)
  }

  const handleToggleMaintenance = async () => {
    const nextState = !maintenanceMode
    setMaintenanceMode(nextState)
    await updateConfig({
      maintenance_mode: nextState ? 'true' : 'false',
      maintenance_message: maintenanceMessage || '',
      maintenance_estimated_end: maintenanceEstimatedEnd || ''
    }, true)
  }

  const handleBlurMaintenanceDetails = async () => {
    await updateConfig({
      maintenance_message: maintenanceMessage || '',
      maintenance_estimated_end: maintenanceEstimatedEnd || ''
    }, true)
  }

  // Handle formatted input change
  const handleInputChange = (setter) => (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '')
    setter(rawDigits)
  }

  // Numeric values for calculation
  const numPoMember = parseInt(String(hargaPerMember).replace(/\D/g, '') || '0', 10)
  const numPoGroup = parseInt(String(hargaGrup).replace(/\D/g, '') || '0', 10)
  const numOtsMember = parseInt(String(hargaOtsPerMember).replace(/\D/g, '') || '0', 10)
  const numOtsGroup = parseInt(String(hargaOtsGrup).replace(/\D/g, '') || '0', 10)

  // Simulation: Fan orders 3 individual chekis + 1 group cheki
  const simQtyIndividual = 3
  const simPoTotal = (numPoMember * simQtyIndividual) + numPoGroup
  const simOtsTotal = (numOtsMember * simQtyIndividual) + numOtsGroup

  // Difference between PO & OTS per member
  const otsMarkupPerMember = numOtsMember - numPoMember
  const otsMarkupGroup = numOtsGroup - numPoGroup

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
          Pengaturan <span className="text-[#9D26FF]">Sistem & Harga</span>
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Harga tiket, rekening, dan konfigurasi sistem.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. HARGA PO & OTS (2 Kolom Sejajar)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Kolom 1: Harga Pre-Order (PO) */}
        <div className="bg-[#13121D]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 flex flex-col justify-between gap-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-base font-bold text-white">Harga Pre-Order (PO)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                Harga cheki per member
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatThousand(hargaPerMember)}
                  onChange={handleInputChange(setHargaPerMember)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-white font-bold text-sm"
                  placeholder="25.000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                Harga cheki grup (semua member)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatThousand(hargaGrup)}
                  onChange={handleInputChange(setHargaGrup)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-white font-bold text-sm"
                  placeholder="30.000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 2: Harga OTS (On The Spot) */}
        <div className="bg-[#13121D]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 flex flex-col justify-between gap-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-base font-bold text-white">Harga OTS (On The Spot)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                Harga OTS per member
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatThousand(hargaOtsPerMember)}
                  onChange={handleInputChange(setHargaOtsPerMember)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-amber-400 focus:outline-none transition-colors text-white font-bold text-sm"
                  placeholder="25.000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                Harga OTS grup (semua member)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatThousand(hargaOtsGrup)}
                  onChange={handleInputChange(setHargaOtsGrup)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-amber-400 focus:outline-none transition-colors text-white font-bold text-sm"
                  placeholder="30.000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SIMULASI & PERBANDINGAN (Full-Width, Horizontal)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#13121D]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 space-y-5">
        <div className="pb-3 border-b border-white/10">
          <h3 className="text-base font-bold text-white">Simulasi & Perbandingan</h3>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kotak 1: Simulasi Belanja */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-white/10 space-y-2.5">
            <span className="text-xs font-bold text-zinc-200 block">
              Simulasi (3 Member + 1 Grup)
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#13121D] border border-white/5">
                <span className="text-cyan-300 font-medium">Total PO:</span>
                <span className="font-bold text-white">
                  Rp {simPoTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#13121D] border border-white/5">
                <span className="text-amber-300 font-medium">Total OTS:</span>
                <span className="font-bold text-white">
                  Rp {simOtsTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Kotak 2: Selisih Harga */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-white/10 space-y-2.5">
            <span className="text-xs font-bold text-zinc-200 block">Selisih Harga</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#13121D] border border-white/5">
                <span className="text-zinc-400">Per Member:</span>
                <span className={`font-semibold ${otsMarkupPerMember > 0 ? 'text-amber-300' : 'text-zinc-400'}`}>
                  {otsMarkupPerMember > 0 ? `+Rp ${otsMarkupPerMember.toLocaleString('id-ID')} di OTS` : 'Sama'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#13121D] border border-white/5">
                <span className="text-zinc-400">Grup:</span>
                <span className={`font-semibold ${otsMarkupGroup > 0 ? 'text-amber-300' : 'text-zinc-400'}`}>
                  {otsMarkupGroup > 0 ? `+Rp ${otsMarkupGroup.toLocaleString('id-ID')} di OTS` : 'Sama'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Simpan Tunggal untuk Section Harga */}
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={configLoading}
          className="w-full bg-[#9D26FF] text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(157,38,255,0.3)] hover:bg-[#8215db] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
        >
          <FaSave className="text-sm" />
          {configLoading ? 'Menyimpan...' : 'Simpan Pengaturan Harga'}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. METODE PEMBAYARAN & REKENING (Cheki & Merch Terpisah)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#13121D]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-tight">
              Metode Pembayaran & <span className="text-[#24C6F5]">Rekening Resmi</span>
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Nomor rekening tujuan pembayaran terpisah untuk Tiket Cheki dan Merchandise Store.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={configLoading}
            className="self-start sm:self-auto bg-[#9D26FF] text-white py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(157,38,255,0.3)] hover:bg-[#8215db] transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            <FaSave className="text-xs" />
            <span>{configLoading ? 'Menyimpan...' : 'Simpan Rekening'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
          {/* Sub-Card 1: Rekening Cheki */}
          <div className="bg-[#161f33] rounded-2xl p-5 border border-cyan-500/20 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <FaTicketAlt className="text-xs" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Pembayaran Tiket Cheki</h4>
                    <p className="text-[11px] text-zinc-400">Penerimaan transaksi 2-Shot & sesi event</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wider">
                  Tiket Cheki
                </span>
              </div>

              {/* 1A. METODE TRANSFER BANK */}
              <div className="p-4 rounded-xl bg-[#1E1C2E]/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Metode Transfer Bank</span>
                    <span className="text-[11px] text-zinc-400">Transfer manual ke rekening resmi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${paymentChekiTransferActive ? 'text-cyan-400' : 'text-zinc-500'}`}>
                      {paymentChekiTransferActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleChekiTransfer}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none ${
                        paymentChekiTransferActive ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                          paymentChekiTransferActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 ${!paymentChekiTransferActive ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Nama Bank / E-Wallet
                    </label>
                    <input
                      type="text"
                      value={paymentBank}
                      onChange={(e) => setPaymentBank(e.target.value)}
                      className="w-full px-3 py-2 bg-[#13121D] border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-white font-bold text-xs"
                      placeholder="Contoh: BCA, Mandiri"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Nomor Rekening / Akun
                    </label>
                    <input
                      type="text"
                      value={paymentRekening}
                      onChange={(e) => setPaymentRekening(e.target.value)}
                      className="w-full px-3 py-2 bg-[#13121D] border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-white font-mono font-bold text-xs"
                      placeholder="Contoh: 0902683273"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Nama Pemilik (A/N)
                    </label>
                    <input
                      type="text"
                      value={paymentAtasNama}
                      onChange={(e) => setPaymentAtasNama(e.target.value)}
                      className="w-full px-3 py-2 bg-[#13121D] border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-white font-bold text-xs"
                      placeholder="Contoh: Natasya Angelina Putri"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Label / Keterangan
                    </label>
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-[#13121D] border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-white font-bold text-xs"
                      placeholder="Contoh: Manual TF"
                    />
                  </div>
                </div>
              </div>

              {/* 1B. METODE QRIS */}
              <div className="p-4 rounded-xl bg-[#1E1C2E]/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaQrcode className="text-cyan-400 text-sm" />
                    <div>
                      <span className="text-xs font-bold text-white block">Metode QRIS</span>
                      <span className="text-[11px] text-zinc-400">Scan QRIS dinamis/statis untuk checkout</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${paymentChekiQrisActive ? 'text-cyan-400' : 'text-zinc-500'}`}>
                      {paymentChekiQrisActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleChekiQris}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none ${
                        paymentChekiQrisActive ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                          paymentChekiQrisActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Upload / Preview Area */}
                <input
                  type="file"
                  ref={chekiQrisInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleQrisFileChange(e, 'cheki')}
                  className="hidden"
                />

                {paymentChekiQrisImage ? (
                  <div className="flex items-center gap-4 p-3 bg-[#13121D] rounded-xl border border-white/10">
                    <div 
                      onClick={() => setPreviewModalImg(paymentChekiQrisImage)}
                      className="w-20 h-20 bg-white rounded-lg p-1.5 flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all shadow-md group relative"
                      title="Klik untuk perbesar"
                    >
                      <img src={paymentChekiQrisImage} alt="QRIS Cheki" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity text-white text-xs">
                        <FaEye />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <span className="text-xs font-bold text-white block">Gambar QRIS Terpasang</span>
                        <span className="text-[10px] text-zinc-400 block truncate">Klik gambar untuk melihat preview penuh</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={uploadingChekiQris}
                          onClick={() => chekiQrisInputRef.current?.click()}
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                          {uploadingChekiQris ? <FaSpinner className="animate-spin text-xs" /> : <FaUpload className="text-[10px]" />}
                          <span>Ganti</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQris('cheki')}
                          className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                          <FaTrash className="text-[10px]" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadingChekiQris && chekiQrisInputRef.current?.click()}
                    className="p-5 border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[#13121D]/50 hover:bg-[#13121D]"
                  >
                    {uploadingChekiQris ? (
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                        <FaSpinner className="animate-spin" />
                        <span>Mengunggah QRIS...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                          <FaUpload className="text-sm" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold text-white block">Upload Gambar QRIS Cheki</span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">PNG, JPG, WebP (Maksimal 2MB)</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Card 2: Rekening Merchandise */}
          <div className="bg-[#161f33] rounded-2xl p-5 border border-[#272438] space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#24C6F5]/10 border border-[#24C6F5]/20 flex items-center justify-center text-[#24C6F5] shrink-0">
                    <FaShoppingBag className="text-xs" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">Pembayaran Merchandise</h4>
                    <p className="text-[11px] text-zinc-400 truncate">Penerimaan pesanan merch & apparel</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyFromCheki}
                    className="text-[10px] font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95"
                    title="Salin data rekening & QRIS dari Cheki"
                  >
                    {copiedFromCheki ? <FaCheck className="text-[#24C6F5] text-[10px]" /> : <FaCopy className="text-[10px]" />}
                    <span>{copiedFromCheki ? 'Disalin' : 'Samakan dg Cheki'}</span>
                  </button>
                  <span className="text-[10px] font-bold text-[#24C6F5] bg-[#24C6F5]/10 px-2.5 py-1 rounded-full border border-[#24C6F5]/20 uppercase tracking-wider">
                    Merchandise
                  </span>
                </div>
              </div>

              {/* 2A. METODE TRANSFER BANK */}
              <div className="p-4 rounded-xl bg-[#1E1C2E]/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Metode Transfer Bank</span>
                    <span className="text-[11px] text-zinc-400">Transfer manual ke rekening resmi merch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${paymentMerchTransferActive ? 'text-[#24C6F5]' : 'text-zinc-500'}`}>
                      {paymentMerchTransferActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleMerchTransfer}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none ${
                        paymentMerchTransferActive ? 'bg-[#24C6F5] shadow-[0_0_10px_rgba(36,198,245,0.4)]' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                          paymentMerchTransferActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 ${!paymentMerchTransferActive ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Nama Bank / E-Wallet
                    </label>
                    <input
                      type="text"
                      value={paymentMerchBank}
                      onChange={(e) => setPaymentMerchBank(e.target.value)}
                      className="w-full px-3 py-2 bg-[#13121D] border border-white/10 rounded-xl focus:border-[#24C6F5] focus:outline-none transition-colors text-white font-bold text-xs"
                      placeholder="Contoh: BCA, Seabank"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Nomor Rekening / Akun
                    </label>
                    <input
                      type="text"
                      value={paymentMerchRekening}
                      onChange={(e) => setPaymentMerchRekening(e.target.value)}
                      className="w-full px-3 py-2 bg-[#13121D] border border-white/10 rounded-xl focus:border-[#24C6F5] focus:outline-none transition-colors text-white font-mono font-bold text-xs"
                      placeholder="Contoh: 0902683273"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Nama Pemilik (A/N)
                    </label>
                    <input
                      type="text"
                      value={paymentMerchAtasNama}
                      onChange={(e) => setPaymentMerchAtasNama(e.target.value)}
                      className="w-full px-3 py-2 bg-[#13121D] border border-white/10 rounded-xl focus:border-[#24C6F5] focus:outline-none transition-colors text-white font-bold text-xs"
                      placeholder="Contoh: Natasya Angelina Putri"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Label / Keterangan
                    </label>
                    <input
                      type="text"
                      value={paymentMerchMethod}
                      onChange={(e) => setPaymentMerchMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-[#13121D] border border-white/10 rounded-xl focus:border-[#24C6F5] focus:outline-none transition-colors text-white font-bold text-xs"
                      placeholder="Contoh: Manual TF"
                    />
                  </div>
                </div>
              </div>

              {/* 2B. METODE QRIS */}
              <div className="p-4 rounded-xl bg-[#1E1C2E]/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaQrcode className="text-[#24C6F5] text-sm" />
                    <div>
                      <span className="text-xs font-bold text-white block">Metode QRIS</span>
                      <span className="text-[11px] text-zinc-400">Scan barcode QRIS untuk checkout merch</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${paymentMerchQrisActive ? 'text-[#24C6F5]' : 'text-zinc-500'}`}>
                      {paymentMerchQrisActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleMerchQris}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none ${
                        paymentMerchQrisActive ? 'bg-[#24C6F5] shadow-[0_0_10px_rgba(36,198,245,0.4)]' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                          paymentMerchQrisActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Upload / Preview Area */}
                <input
                  type="file"
                  ref={merchQrisInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleQrisFileChange(e, 'merch')}
                  className="hidden"
                />

                {paymentMerchQrisImage ? (
                  <div className="flex items-center gap-4 p-3 bg-[#13121D] rounded-xl border border-white/10">
                    <div 
                      onClick={() => setPreviewModalImg(paymentMerchQrisImage)}
                      className="w-20 h-20 bg-white rounded-lg p-1.5 flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-[#24C6F5] transition-all shadow-md group relative"
                      title="Klik untuk perbesar"
                    >
                      <img src={paymentMerchQrisImage} alt="QRIS Merch" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity text-white text-xs">
                        <FaEye />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <span className="text-xs font-bold text-white block">Gambar QRIS Terpasang</span>
                        <span className="text-[10px] text-zinc-400 block truncate">Klik gambar untuk melihat preview penuh</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={uploadingMerchQris}
                          onClick={() => merchQrisInputRef.current?.click()}
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                          {uploadingMerchQris ? <FaSpinner className="animate-spin text-xs" /> : <FaUpload className="text-[10px]" />}
                          <span>Ganti</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQris('merch')}
                          className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                          <FaTrash className="text-[10px]" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadingMerchQris && merchQrisInputRef.current?.click()}
                    className="p-5 border-2 border-dashed border-white/15 hover:border-[#24C6F5]/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[#13121D]/50 hover:bg-[#13121D]"
                  >
                    {uploadingMerchQris ? (
                      <div className="flex items-center gap-2 text-[#24C6F5] text-xs font-bold">
                        <FaSpinner className="animate-spin" />
                        <span>Mengunggah QRIS...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-full bg-[#24C6F5]/10 flex items-center justify-center text-[#24C6F5]">
                          <FaUpload className="text-sm" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold text-white block">Upload Gambar QRIS Merch</span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">PNG, JPG, WebP (Maksimal 2MB)</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. LINK MEDIA SOSIAL RESMI (OFFICIAL SOCIAL LINKS)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#13121D]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <FaShareAlt className="text-[#9D26FF]" />
              <span>Kontak & Media Sosial Resmi <span className="text-[#9D26FF]">(Contact & Socials)</span></span>
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Email resmi manajemen dan URL media sosial untuk seluruh website (Footer, About Us, Mobile Menu). Jika medsos belum diisi, otomatis dialihkan ke Instagram resmi (<code className="text-[#24C6F5] font-mono">https://www.instagram.com/info_noize/</code>).
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveSocialLinks}
            disabled={configLoading}
            className="self-start sm:self-auto bg-[#9D26FF] text-white py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(157,38,255,0.3)] hover:bg-[#8215db] transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            <FaSave className="text-xs" />
            <span>{configLoading ? 'Menyimpan...' : 'Simpan Kontak & Medsos'}</span>
          </button>
        </div>

        {/* Info Banner Fallback */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#1E1C2E] border border-[#272438] text-xs text-zinc-300">
          <FaInfoCircle className="text-[#24C6F5] text-base shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">Aturan Direct Otomatis:</span> Setiap icon media sosial di website yang link-nya belum diisi atau dikosongkan akan secara otomatis membuka{' '}
            <a 
              href="https://www.instagram.com/info_noize/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#9D26FF] hover:underline font-mono inline-flex items-center gap-1 font-bold"
            >
              https://www.instagram.com/info_noize/ <FaExternalLinkAlt size={9} />
            </a>.
          </div>
        </div>

        {/* Grid Inputs for Social Platforms & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Resmi Manajemen */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-[#272438] hover:border-[#9D26FF]/40 transition-colors space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#9D26FF]/10 border border-[#9D26FF]/30 flex items-center justify-center text-[#9D26FF]">
                  <FaEnvelope size={14} />
                </span>
                <span>Email Resmi Kontak & Manajemen (Official Email)</span>
              </label>
              {officialEmail && (
                <a 
                  href={`mailto:${officialEmail}`}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  Kirim tes email <FaExternalLinkAlt size={8} />
                </a>
              )}
            </div>
            <input
              type="email"
              value={officialEmail || ''}
              onChange={(e) => setOfficialEmail(e.target.value)}
              onBlur={handleBlurEmail}
              placeholder="contact@noize.official"
              className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-[#9D26FF] focus:outline-none transition-colors text-white text-xs font-mono placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-500">
              Alamat email resmi NOIZE. Otomatis tersinkronisasi ke Footer website dan kontak manajemen di halaman Tentang Kami.
            </p>
          </div>
          {/* 1. Instagram */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-[#272438] hover:border-[#E1306C]/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#E1306C]/10 border border-[#E1306C]/30 flex items-center justify-center text-[#E1306C]">
                  <FaInstagram size={14} />
                </span>
                <span>Instagram Resmi</span>
              </label>
              {socialLinks?.instagram && (
                <a 
                  href={socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  Buka link <FaExternalLinkAlt size={8} />
                </a>
              )}
            </div>
            <input
              type="text"
              value={socialLinks?.instagram || ''}
              onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
              onBlur={handleBlurSocialLink}
              placeholder="https://www.instagram.com/info_noize/"
              className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-[#E1306C] focus:outline-none transition-colors text-white text-xs font-mono placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-500">
              Kosongkan jika ingin memakai default (<span className="text-zinc-400">@info_noize</span>)
            </p>
          </div>

          {/* 2. TikTok */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-[#272438] hover:border-[#00F2FE]/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#00F2FE]/10 border border-[#00F2FE]/30 flex items-center justify-center text-[#00F2FE]">
                  <FaTiktok size={14} />
                </span>
                <span>TikTok Resmi</span>
              </label>
              {socialLinks?.tiktok && (
                <a 
                  href={socialLinks.tiktok} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  Buka link <FaExternalLinkAlt size={8} />
                </a>
              )}
            </div>
            <input
              type="text"
              value={socialLinks?.tiktok || ''}
              onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
              onBlur={handleBlurSocialLink}
              placeholder="https://www.tiktok.com/@noize.official"
              className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-[#00F2FE] focus:outline-none transition-colors text-white text-xs font-mono placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-500">
              Jika kosong, otomatis dialihkan ke Instagram resmi
            </p>
          </div>

          {/* 3. YouTube */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-[#272438] hover:border-[#FF0000]/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000]">
                  <FaYoutube size={14} />
                </span>
                <span>YouTube Channel</span>
              </label>
              {socialLinks?.youtube && (
                <a 
                  href={socialLinks.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  Buka link <FaExternalLinkAlt size={8} />
                </a>
              )}
            </div>
            <input
              type="text"
              value={socialLinks?.youtube || ''}
              onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
              onBlur={handleBlurSocialLink}
              placeholder="https://www.youtube.com/@noize"
              className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-[#FF0000] focus:outline-none transition-colors text-white text-xs font-mono placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-500">
              Jika kosong, otomatis dialihkan ke Instagram resmi
            </p>
          </div>

          {/* 4. Twitter / X */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-[#272438] hover:border-[#1DA1F2]/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 flex items-center justify-center text-[#1DA1F2]">
                  <FaTwitter size={14} />
                </span>
                <span>Twitter / X</span>
              </label>
              {socialLinks?.twitter && (
                <a 
                  href={socialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  Buka link <FaExternalLinkAlt size={8} />
                </a>
              )}
            </div>
            <input
              type="text"
              value={socialLinks?.twitter || ''}
              onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
              onBlur={handleBlurSocialLink}
              placeholder="https://x.com/noize_official"
              className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-[#1DA1F2] focus:outline-none transition-colors text-white text-xs font-mono placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-500">
              Jika kosong, otomatis dialihkan ke Instagram resmi
            </p>
          </div>

          {/* 5. Discord (Opsional) */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-[#272438] hover:border-[#5865F2]/40 transition-colors space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
                  <FaDiscord size={14} />
                </span>
                <span>Discord / Komunitas Server (Opsional)</span>
              </label>
              {socialLinks?.discord && (
                <a 
                  href={socialLinks.discord} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  Buka link <FaExternalLinkAlt size={8} />
                </a>
              )}
            </div>
            <input
              type="text"
              value={socialLinks?.discord || ''}
              onChange={(e) => setSocialLinks(prev => ({ ...prev, discord: e.target.value }))}
              onBlur={handleBlurSocialLink}
              placeholder="https://discord.gg/..."
              className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-[#5865F2] focus:outline-none transition-colors text-white text-xs font-mono placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-500">
              Jika kosong, otomatis dialihkan ke Instagram resmi
            </p>
          </div>

          {/* 6. Channel WhatsApp (Opsional untuk Nota & Pengumuman) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
                  <FaWhatsapp size={14} />
                </span>
                <span>Channel WhatsApp (Opsional untuk Nota & Pengumuman)</span>
              </label>
              {socialLinks?.whatsapp_channel && (
                <a 
                  href={socialLinks.whatsapp_channel} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  Buka link <FaExternalLinkAlt size={8} />
                </a>
              )}
            </div>
            <input
              type="text"
              value={socialLinks?.whatsapp_channel || ''}
              onChange={(e) => setSocialLinks(prev => ({ ...prev, whatsapp_channel: e.target.value }))}
              onBlur={handleBlurSocialLink}
              placeholder="https://whatsapp.com/channel/..."
              className="w-full px-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-[#25D366] focus:outline-none transition-colors text-white text-xs font-mono placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-500">
              Jika diisi, link Channel WhatsApp akan tampil di nota pesanan dan tombol bergabung. Jika kosong, tidak akan ditampilkan di nota.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MODE PEMELIHARAAN WEBSITE (Collapsible)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#13121D]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Mode Pemeliharaan Website (MT Barrier)</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
              maintenanceMode 
                ? 'bg-[#9D26FF]/20 text-[#9D26FF] border border-[#9D26FF]/30 shadow-[0_0_10px_rgba(7,145,8,0.2)]' 
                : 'bg-zinc-800 text-zinc-400 border border-white/10'
            }`}>
              {maintenanceMode ? 'Aktif' : 'Website Live'}
            </span>
          </div>

          {/* Instant Toggle Switch */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${maintenanceMode ? 'text-[#9D26FF]' : 'text-zinc-400'}`}>
              {maintenanceMode ? 'MT Aktif' : 'MT Nonaktif'}
            </span>
            <button
              type="button"
              disabled={configLoading}
              onClick={handleToggleMaintenance}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none disabled:opacity-50 ${
                maintenanceMode ? 'bg-[#9D26FF] shadow-[0_0_15px_rgba(157,38,255,0.5)]' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                  maintenanceMode ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Detail Inputs (Hanya Render saat MT Aktif) */}
        <AnimatePresence>
          {maintenanceMode && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-white/10 pt-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                    Pesan Pengumuman untuk Pengunjung
                  </label>
                  <textarea
                    rows={3}
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    onBlur={handleBlurMaintenanceDetails}
                    placeholder="Contoh: Website sedang dalam pemeliharaan sementara..."
                    className="w-full px-4 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-[#9D26FF] focus:outline-none transition-colors text-white text-xs resize-none placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                    Estimasi Waktu Selesai (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={maintenanceEstimatedEnd}
                    onChange={(e) => setMaintenanceEstimatedEnd(e.target.value)}
                    onBlur={handleBlurMaintenanceDetails}
                    className="w-full px-4 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl focus:border-[#9D26FF] focus:outline-none transition-colors text-white text-xs [color-scheme:dark]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MANAJEMEN DATA & PEMBERSIHAN STORAGE (Border Luar Netral)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#13121D]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 space-y-5">
        <div className="pb-4 border-b border-white/10">
          <h3 className="text-base font-bold text-white uppercase tracking-tight">
            Manajemen Data & <span className="text-red-400">Pembersihan Storage</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Purge Bukti Pembayaran Lama (Aksi Rutin - Border Netral) */}
          <div className="bg-[#161f33] rounded-xl p-5 border border-white/10 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></span>
                <h4 className="text-sm font-bold text-white">Auto-Purge Bukti Bayar (&gt; 1 Bulan)</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pembersihan file foto bukti transfer lama di Supabase Storage agar kuota storage tetap hemat.
              </p>
            </div>

            <button
              type="button"
              onClick={onPurgeOldPayments}
              className="w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <FaWrench className="text-xs" />
              <span>Bersihkan Bukti Bayar &gt; 1 Bulan</span>
            </button>
          </div>

          {/* Card 2: Hapus Data Pembelian (Destruktif - Border Merah) */}
          <div className="bg-[#161f33] rounded-xl p-5 border border-red-500/30 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                <h4 className="text-sm font-bold text-white">Hapus Data Pembelian</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hapus transaksi order beserta file bukti bayar di Storage (full reset 0 atau filter per event).
              </p>
            </div>

            <button
              type="button"
              onClick={onShowBulkDeleteModal}
              className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 hover:text-red-300 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <FaTrash className="text-xs" />
              <span>Buka Opsi Hapus Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Preview QRIS Full Size */}
      <AnimatePresence>
        {previewModalImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewModalImg(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center gap-4 cursor-default"
            >
              <div className="w-full flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Preview Barcode QRIS</span>
                <button
                  type="button"
                  onClick={() => setPreviewModalImg(null)}
                  className="text-zinc-500 hover:text-zinc-800 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="w-full bg-white rounded-xl flex items-center justify-center p-2">
                <img
                  src={previewModalImg}
                  alt="QRIS Preview"
                  className="w-full max-h-[65vh] object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SettingsTab

