import React, { useState, useEffect } from 'react'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'
import Swal from 'sweetalert2'
import HeroTab from './HeroTab'
import { updateCachedFooterSettings } from '../../../hooks/useFooterSettings'
import {
  FaEye,
  FaInfoCircle,
  FaQuestionCircle,
  FaStream,
  FaSave,
  FaPlus,
  FaTrash,
  FaEdit,
  FaArrowUp,
  FaArrowDown,
  FaCheck,
  FaTimes,
  FaGripVertical,
  FaSync
} from 'react-icons/fa'

const DEFAULT_WHO_IS_NOIZE = {
  badge: 'ABOUT US',
  title: 'WHO IS NOIZE',
  description: 'NOIZE adalah entitas musik dan performa panggung modern yang menghadirkan energi frekuensi tinggi, memadukan visual panggung dinamis dengan performa audio solid untuk menghubungkan panggung dan komunitas dalam satu frekuensi.',
  button_text: 'LEARN MORE'
}

const DEFAULT_FAQ_HEADER = {
  badge: 'FREQUENTLY ASKED',
  title: 'HELP CENTER',
  subtitle: 'Pertanyaan umum seputar jadwal, pemesanan tiket Cheki, dan merchandise NOIZE.'
}

const DEFAULT_FOOTER = {
  description: 'Situs resmi NOIZE. Musik, merchandise resmi, dan sesi Cheki.',
  small_text: 'ノイズ • NOIZE',
  location: 'Jakarta Selatan, Indonesia',
  email: 'contact@noize.official',
  copyright: '© 2026 NOIZE. ALL RIGHTS RESERVED.'
}

const HomeTab = ({ setActiveTab }) => {
  const [activeSubTab, setActiveSubTab] = useState(() => localStorage.getItem('admin_home_subtab') || 'hero')

  const handleSubTabChange = (tabId) => {
    setActiveSubTab(tabId)
    localStorage.setItem('admin_home_subtab', tabId)
  }

  // ==========================================
  // TAB 2: WHO IS NOIZE STATE
  // ==========================================
  const [whoData, setWhoData] = useState(DEFAULT_WHO_IS_NOIZE)
  const [whoLoading, setWhoLoading] = useState(false)
  const [whoSaving, setWhoSaving] = useState(false)

  // ==========================================
  // TAB 3: FAQ STATE
  // ==========================================
  const [faqHeader, setFaqHeader] = useState(DEFAULT_FAQ_HEADER)
  const [faqHeaderSaving, setFaqHeaderSaving] = useState(false)
  const [faqs, setFaqs] = useState([])
  const [faqLoading, setFaqLoading] = useState(false)
  const [faqModalOpen, setFaqModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState(null)
  const [faqFormData, setFaqFormData] = useState({ tanya: '', jawab: '', is_active: true })
  const [faqSubmitting, setFaqSubmitting] = useState(false)

  // Drag and drop sorting for FAQ
  const [draggedFaqIdx, setDraggedFaqIdx] = useState(null)
  const [dragOverFaqIdx, setDragOverFaqIdx] = useState(null)

  // ==========================================
  // TAB 4: FOOTER STATE
  // ==========================================
  const [footerData, setFooterData] = useState(DEFAULT_FOOTER)
  const [footerLoading, setFooterLoading] = useState(false)
  const [footerSaving, setFooterSaving] = useState(false)

  // Fetch initial config for tabs 2, 3, 4
  useEffect(() => {
    const fetchHomeConfigs = async () => {
      try {
        setWhoLoading(true)
        setFooterLoading(true)
        const res = await api.get('/config')
        if (res.data.success && res.data.data) {
          const cfg = res.data.data

          // Who is NOIZE
          if (cfg.home_who_is_noize) {
            try {
              const parsed = typeof cfg.home_who_is_noize === 'string'
                ? JSON.parse(cfg.home_who_is_noize)
                : cfg.home_who_is_noize
              setWhoData(prev => ({ ...prev, ...parsed }))
            } catch (_) {}
          }

          // FAQ Header
          if (cfg.faq_section_settings) {
            try {
              const parsed = typeof cfg.faq_section_settings === 'string'
                ? JSON.parse(cfg.faq_section_settings)
                : cfg.faq_section_settings
              setFaqHeader(prev => ({ ...prev, ...parsed }))
            } catch (_) {}
          }

          // Footer
          if (cfg.footer_settings) {
            try {
              const parsed = typeof cfg.footer_settings === 'string'
                ? JSON.parse(cfg.footer_settings)
                : cfg.footer_settings
              setFooterData(prev => ({ ...prev, ...parsed }))
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Failed to fetch home configs:', err)
      } finally {
        setWhoLoading(false)
        setFooterLoading(false)
      }
    }

    fetchHomeConfigs()
  }, [])

  // Fetch FAQs for Tab 3
  const fetchFaqsList = async () => {
    try {
      setFaqLoading(true)
      const res = await api.get('/faqs')
      if (res.data.success) {
        setFaqs(res.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch FAQs:', err)
    } finally {
      setFaqLoading(false)
    }
  }

  useEffect(() => {
    if (activeSubTab === 'faq') {
      fetchFaqsList()
    }
  }, [activeSubTab])

  // ==========================================
  // HANDLERS: TAB 2 - WHO IS NOIZE
  // ==========================================
  const handleSaveWho = async (e) => {
    e.preventDefault()
    setWhoSaving(true)
    try {
      await api.patch('/config', {
        home_who_is_noize: JSON.stringify(whoData)
      })
      showToast.success('Pengaturan Who is NOIZE berhasil disimpan!')
    } catch (err) {
      console.error('Error saving Who is NOIZE:', err)
      showToast.error('Gagal menyimpan: ' + (err.response?.data?.error || err.message))
    } finally {
      setWhoSaving(false)
    }
  }

  // ==========================================
  // HANDLERS: TAB 3 - FAQ
  // ==========================================
  const handleSaveFaqHeader = async (e) => {
    e.preventDefault()
    setFaqHeaderSaving(true)
    try {
      await api.patch('/config', {
        faq_section_settings: JSON.stringify(faqHeader)
      })
      showToast.success('Header section FAQ berhasil disimpan!')
    } catch (err) {
      console.error('Error saving FAQ header:', err)
      showToast.error('Gagal menyimpan header: ' + (err.response?.data?.error || err.message))
    } finally {
      setFaqHeaderSaving(false)
    }
  }

  const handleOpenAddFaq = () => {
    setEditingFaq(null)
    setFaqFormData({ tanya: '', jawab: '', is_active: true })
    setFaqModalOpen(true)
  }

  const handleOpenEditFaq = (faq) => {
    setEditingFaq(faq)
    setFaqFormData({
      tanya: faq.tanya || '',
      jawab: faq.jawab || '',
      is_active: faq.is_active !== false
    })
    setFaqModalOpen(true)
  }

  const handleSubmitFaq = async (e) => {
    e.preventDefault()
    if (!faqFormData.tanya.trim() || !faqFormData.jawab.trim()) {
      showToast.warning('Pertanyaan dan jawaban wajib diisi!')
      return
    }

    setFaqSubmitting(true)
    try {
      if (editingFaq) {
        await api.patch(`/faqs/${editingFaq.id}`, faqFormData)
        showToast.success('FAQ berhasil diperbarui!')
      } else {
        const nextOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.urutan || 0)) + 1 : 1
        await api.post('/faqs', { ...faqFormData, urutan: nextOrder })
        showToast.success('FAQ baru berhasil ditambahkan!')
      }
      setFaqModalOpen(false)
      fetchFaqsList()
    } catch (err) {
      console.error('Error submitting FAQ:', err)
      showToast.error('Gagal menyimpan FAQ: ' + (err.response?.data?.error || err.message))
    } finally {
      setFaqSubmitting(false)
    }
  }

  const handleDeleteFaq = (faq) => {
    Swal.fire({
      title: 'Hapus Pertanyaan ini?',
      text: `"${faq.tanya}" akan dihapus permanen dari daftar FAQ.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/faqs/${faq.id}`)
          showToast.success('FAQ berhasil dihapus!')
          fetchFaqsList()
        } catch (err) {
          console.error('Error deleting FAQ:', err)
          showToast.error('Gagal menghapus: ' + (err.response?.data?.error || err.message))
        }
      }
    })
  }

  const handleToggleFaqActive = async (faq) => {
    const updatedStatus = !(faq.is_active !== false)
    try {
      await api.patch(`/faqs/${faq.id}`, { is_active: updatedStatus })
      setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: updatedStatus } : f))
      showToast.success(updatedStatus ? 'FAQ diaktifkan (tampil di web)' : 'FAQ dinonaktifkan (disembunyikan)')
    } catch (err) {
      console.error('Error toggling FAQ:', err)
      showToast.error('Gagal mengubah status: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleMoveFaq = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= faqs.length) return

    const updated = [...faqs]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    // Re-assign sequential urutan
    const itemsPayload = updated.map((item, idx) => ({
      id: item.id,
      urutan: idx + 1
    }))

    setFaqs(updated)

    try {
      await api.put('/faqs/reorder', { items: itemsPayload })
      showToast.success('Urutan FAQ berhasil diperbarui!')
    } catch (err) {
      console.error('Error reordering FAQs:', err)
      showToast.error('Gagal memperbarui urutan')
      fetchFaqsList()
    }
  }

  const handleFaqDrop = async (e, targetIdx) => {
    e.preventDefault()
    if (draggedFaqIdx === null || draggedFaqIdx === targetIdx) {
      setDraggedFaqIdx(null)
      setDragOverFaqIdx(null)
      return
    }

    const updated = [...faqs]
    const [movedItem] = updated.splice(draggedFaqIdx, 1)
    updated.splice(targetIdx, 0, movedItem)

    const itemsPayload = updated.map((item, idx) => ({
      id: item.id,
      urutan: idx + 1
    }))

    setFaqs(updated)
    setDraggedFaqIdx(null)
    setDragOverFaqIdx(null)

    try {
      await api.put('/faqs/reorder', { items: itemsPayload })
      showToast.success('Urutan FAQ berhasil digeser!')
    } catch (err) {
      console.error('Error reordering FAQs:', err)
      fetchFaqsList()
    }
  }

  // ==========================================
  // HANDLERS: TAB 4 - FOOTER
  // ==========================================
  const handleSaveFooter = async (e) => {
    e.preventDefault()
    setFooterSaving(true)
    try {
      const payload = {
        description: footerData.description || '',
        small_text: footerData.small_text || '',
        location: footerData.location || '',
        email: footerData.email || '',
        copyright: footerData.copyright || ''
      }
      await api.patch('/config', {
        footer_settings: JSON.stringify(payload)
      })
      updateCachedFooterSettings(payload)
      showToast.success('Pengaturan Footer berhasil disimpan!')
    } catch (err) {
      console.error('Error saving footer:', err)
      showToast.error('Gagal menyimpan: ' + (err.response?.data?.error || err.message))
    } finally {
      setFooterSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. MAIN HEADER & TAB NAVIGATION */}
      <div className="bg-[#09090B]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            HOME
          </h1>
          <p className="text-xs font-semibold text-zinc-400 mt-1">
            Atur hero, Who is NOIZE, FAQ, dan footer.
          </p>
        </div>

        {/* 4 Tabs Selector */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          {[
            { id: 'hero', label: 'Hero', icon: FaEye },
            { id: 'who_is_noize', label: 'Who is NOIZE', icon: FaInfoCircle },
            { id: 'faq', label: 'FAQ', icon: FaQuestionCircle },
            { id: 'footer', label: 'Footer', icon: FaStream },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'bg-[#9D26FF] text-white shadow-[0_0_15px_rgba(157,38,255,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="text-sm" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. TAB CONTENT PANELS */}

      {/* ── TAB 1: HERO ── */}
      {activeSubTab === 'hero' && (
        <HeroTab embedded={true} />
      )}

      {/* ── TAB 2: WHO IS NOIZE ── */}
      {activeSubTab === 'who_is_noize' && (
        <div className="bg-[#09090B]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Pengaturan Who is NOIZE
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bagian teaser perkenalan NOIZE pada landing page utama.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveWho}
              disabled={whoSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#9D26FF] hover:bg-[#8215db] shadow-[0_0_15px_rgba(157,38,255,0.4)] transition-all disabled:opacity-50 shrink-0"
            >
              <FaSave /> {whoSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>

          <form onSubmit={handleSaveWho} className="space-y-5">
            {/* Label Kecil (Badge) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                <label>Label Kecil (Badge)</label>
                <span className={whoData.badge.length >= 50 ? 'text-red-400' : 'text-zinc-500'}>
                  {whoData.badge.length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={whoData.badge}
                onChange={(e) => setWhoData(prev => ({ ...prev, badge: e.target.value }))}
                placeholder="ABOUT US"
                className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
              />
            </div>

            {/* Judul Utama */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                <label>Judul Section</label>
                <span className={whoData.title.length >= 100 ? 'text-red-400' : 'text-zinc-500'}>
                  {whoData.title.length}/100
                </span>
              </div>
              <input
                type="text"
                maxLength={100}
                value={whoData.title}
                onChange={(e) => setWhoData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="WHO IS NOIZE"
                className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all font-bold"
              />
            </div>

            {/* Paragraf Deskripsi */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                <label>Paragraf Deskripsi</label>
                <span className={whoData.description.length >= 500 ? 'text-red-400' : 'text-zinc-500'}>
                  {whoData.description.length}/500
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                value={whoData.description}
                onChange={(e) => setWhoData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi singkat seputar NOIZE..."
                className="w-full bg-[#13121D] border border-white/10 rounded-xl p-4 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all leading-relaxed"
              />
            </div>

            {/* Teks Tombol */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                <label>Teks Tombol Aksi</label>
                <span className={whoData.button_text.length >= 50 ? 'text-red-400' : 'text-zinc-500'}>
                  {whoData.button_text.length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={whoData.button_text}
                onChange={(e) => setWhoData(prev => ({ ...prev, button_text: e.target.value }))}
                placeholder="LEARN MORE"
                className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all uppercase"
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                disabled={whoSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#9D26FF] hover:bg-[#8215db] shadow-[0_0_15px_rgba(157,38,255,0.4)] transition-all disabled:opacity-50"
              >
                <FaSave /> {whoSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: FAQ ── */}
      {activeSubTab === 'faq' && (
        <div className="space-y-6 max-w-5xl">
          {/* Header FAQ Settings */}
          <div className="bg-[#09090B]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider">
                  Header Section FAQ
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Label, judul, dan subtitle FAQ di landing page.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveFaqHeader}
                disabled={faqHeaderSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#9D26FF] hover:bg-[#8215db] shadow-[0_0_15px_rgba(157,38,255,0.4)] transition-all disabled:opacity-50 shrink-0"
              >
                <FaSave /> {faqHeaderSaving ? 'Menyimpan...' : 'Simpan Header FAQ'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                  <label>Label Kecil (Badge)</label>
                  <span className={faqHeader.badge.length >= 50 ? 'text-red-400' : 'text-zinc-500'}>
                    {faqHeader.badge.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={faqHeader.badge}
                  onChange={(e) => setFaqHeader(prev => ({ ...prev, badge: e.target.value }))}
                  placeholder="FREQUENTLY ASKED"
                  className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                  <label>Judul Section</label>
                  <span className={faqHeader.title.length >= 100 ? 'text-red-400' : 'text-zinc-500'}>
                    {faqHeader.title.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={faqHeader.title}
                  onChange={(e) => setFaqHeader(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="HELP CENTER"
                  className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all font-bold"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                  <label>Subtitle / Deskripsi Singkat</label>
                  <span className={faqHeader.subtitle.length >= 250 ? 'text-red-400' : 'text-zinc-500'}>
                    {faqHeader.subtitle.length}/250
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={250}
                  value={faqHeader.subtitle}
                  onChange={(e) => setFaqHeader(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Pertanyaan umum seputar jadwal..."
                  className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
                />
              </div>
            </div>
          </div>

          {/* FAQ Item List */}
          <div className="bg-[#09090B]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider">
                  Daftar Pertanyaan FAQ ({faqs.length})
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Atur urutan, edit konten, atau toggle aktif/sembunyi per item.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddFaq}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#9D26FF] hover:bg-[#8215db] shadow-[0_0_15px_rgba(157,38,255,0.4)] transition-all shrink-0"
              >
                <FaPlus /> Tambah Pertanyaan
              </button>
            </div>

            {faqLoading ? (
              <div className="py-12 text-center text-zinc-400 flex items-center justify-center gap-3">
                <FaSync className="animate-spin text-[#9D26FF]" />
                <span className="text-xs font-bold">Memuat daftar FAQ...</span>
              </div>
            ) : faqs.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl">
                <p className="text-xs font-bold">Belum ada pertanyaan FAQ.</p>
                <button
                  onClick={handleOpenAddFaq}
                  className="mt-3 px-4 py-2 rounded-lg bg-[#9D26FF]/20 text-[#9D26FF] hover:bg-[#9D26FF]/30 text-xs font-bold transition-all"
                >
                  + Buat FAQ Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isActive = faq.is_active !== false
                  return (
                    <div
                      key={faq.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedFaqIdx(idx)
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', idx)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (dragOverFaqIdx !== idx) setDragOverFaqIdx(idx)
                      }}
                      onDrop={(e) => handleFaqDrop(e, idx)}
                      onDragEnd={() => {
                        setDraggedFaqIdx(null)
                        setDragOverFaqIdx(null)
                      }}
                      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        dragOverFaqIdx === idx ? 'border-[#9D26FF] bg-[#1E1C2E]' : 'border-white/10 bg-[#13121D]/80 hover:border-white/20'
                      }`}
                    >
                      {/* Left: Drag grip, Order & Question Info */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5 text-zinc-500">
                          <FaGripVertical className="cursor-grab active:cursor-grabbing text-xs hover:text-white" />
                          <span className="text-[10px] font-mono font-bold text-zinc-600">
                            #{idx + 1}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                isActive 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                              }`}
                            >
                              {isActive ? 'Aktif' : 'Disembunyikan'}
                            </span>
                            <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                              {faq.tanya}
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-normal">
                            {faq.jawab}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
                        {/* Up / Down Reorder */}
                        <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-[#09090B]">
                          <button
                            type="button"
                            onClick={() => handleMoveFaq(idx, 'up')}
                            disabled={idx === 0}
                            title="Pindah ke atas"
                            className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all text-xs"
                          >
                            <FaArrowUp />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFaq(idx, 'down')}
                            disabled={idx === faqs.length - 1}
                            title="Pindah ke bawah"
                            className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all text-xs"
                          >
                            <FaArrowDown />
                          </button>
                        </div>

                        {/* Toggle Active Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleFaqActive(faq)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/20'
                          }`}
                        >
                          {isActive ? 'Aktif' : 'Sembunyi'}
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditFaq(faq)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center text-xs transition-all"
                          title="Edit FAQ"
                        >
                          <FaEdit />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 flex items-center justify-center text-xs transition-all"
                          title="Hapus FAQ"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: FOOTER ── */}
      {activeSubTab === 'footer' && (
        <div className="bg-[#09090B]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Pengaturan Footer Global
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Berlaku di seluruh halaman website. Field kosong otomatis tidak dirender.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveFooter}
              disabled={footerSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#9D26FF] hover:bg-[#8215db] shadow-[0_0_15px_rgba(157,38,255,0.4)] transition-all disabled:opacity-50 shrink-0"
            >
              <FaSave /> {footerSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>

          <form onSubmit={handleSaveFooter} className="space-y-5">
            {/* 1. Deskripsi di bawah logo */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                <label>Deskripsi Singkat (di bawah logo)</label>
                <span className={footerData.description.length >= 200 ? 'text-red-400' : 'text-zinc-500'}>
                  {footerData.description.length}/200
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={footerData.description}
                onChange={(e) => setFooterData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Situs resmi NOIZE. Musik, merchandise resmi, dan sesi Cheki."
                className="w-full bg-[#13121D] border border-white/10 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
              />
            </div>

            {/* 2. Teks kecil di bawahnya */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                <label>Teks Kecil Brand (Opsional)</label>
                <span className={footerData.small_text.length >= 50 ? 'text-red-400' : 'text-zinc-500'}>
                  {footerData.small_text.length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={footerData.small_text}
                onChange={(e) => setFooterData(prev => ({ ...prev, small_text: e.target.value }))}
                placeholder="ノイズ • NOIZE"
                className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
              />
            </div>

            {/* 3. Lokasi & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                  <label>Lokasi Venue / Base</label>
                  <span className={footerData.location.length >= 100 ? 'text-red-400' : 'text-zinc-500'}>
                    {footerData.location.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={footerData.location}
                  onChange={(e) => setFooterData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Jakarta Selatan, Indonesia"
                  className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                  <label>Email Kontak</label>
                  <span className={footerData.email.length >= 100 ? 'text-red-400' : 'text-zinc-500'}>
                    {footerData.email.length}/100
                  </span>
                </div>
                <input
                  type="email"
                  maxLength={100}
                  value={footerData.email}
                  onChange={(e) => setFooterData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@noize.official"
                  className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
                />
              </div>
            </div>

            {/* 4. Tautan Media Sosial Helper Note */}
            <div className="p-3.5 rounded-xl bg-[#1E1C2E] border border-[#272438] text-xs text-zinc-300 flex items-center justify-between gap-3">
              <span>
                Link sosial media diatur di menu{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('settings')}
                  className="text-[#9D26FF] hover:text-[#b44fff] font-bold underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Settings
                </button>
                .
              </span>
            </div>

            {/* 5. Copyright Text */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase">
                <label>Teks Copyright</label>
                <span className={footerData.copyright.length >= 100 ? 'text-red-400' : 'text-zinc-500'}>
                  {footerData.copyright.length}/100
                </span>
              </div>
              <input
                type="text"
                maxLength={100}
                value={footerData.copyright}
                onChange={(e) => setFooterData(prev => ({ ...prev, copyright: e.target.value }))}
                placeholder="© 2026 NOIZE. ALL RIGHTS RESERVED."
                className="w-full bg-[#13121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all font-mono"
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                disabled={footerSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#9D26FF] hover:bg-[#8215db] shadow-[0_0_15px_rgba(157,38,255,0.4)] transition-all disabled:opacity-50"
              >
                <FaSave /> {footerSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: TAMBAH / EDIT FAQ ── */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13121D] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingFaq ? 'Edit Pertanyaan FAQ' : 'Tambah Pertanyaan FAQ'}
              </h3>
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitFaq} className="space-y-4">
              {/* Pertanyaan */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                  <label>Pertanyaan</label>
                  <span className={faqFormData.tanya.length >= 300 ? 'text-red-400' : 'text-zinc-500'}>
                    {faqFormData.tanya.length}/300
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={300}
                  required
                  value={faqFormData.tanya}
                  onChange={(e) => setFaqFormData(prev => ({ ...prev, tanya: e.target.value }))}
                  placeholder="e.g. Bagaimana cara memesan tiket Cheki?"
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all font-semibold"
                />
              </div>

              {/* Jawaban */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                  <label>Jawaban</label>
                  <span className={faqFormData.jawab.length >= 1000 ? 'text-red-400' : 'text-zinc-500'}>
                    {faqFormData.jawab.length}/1000
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={1000}
                  required
                  value={faqFormData.jawab}
                  onChange={(e) => setFaqFormData(prev => ({ ...prev, jawab: e.target.value }))}
                  placeholder="Tuliskan jawaban yang jelas dan lengkap..."
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all leading-relaxed"
                />
              </div>

              {/* Toggle Aktif */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="faq_is_active"
                  checked={faqFormData.is_active}
                  onChange={(e) => setFaqFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded bg-[#09090B] border-white/20 text-[#9D26FF] focus:ring-[#9D26FF]"
                />
                <label htmlFor="faq_is_active" className="text-xs font-bold text-zinc-300 cursor-pointer">
                  Tampilkan di Website (Aktif)
                </label>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFaqModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={faqSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#9D26FF] hover:bg-[#8215db] shadow-[0_0_15px_rgba(157,38,255,0.4)] transition-all disabled:opacity-50"
                >
                  <FaCheck /> {faqSubmitting ? 'Menyimpan...' : (editingFaq ? 'Simpan Perubahan' : 'Tambah FAQ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeTab
