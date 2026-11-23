import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaImages, 
  FaSpotify, 
  FaYoutube, 
  FaFileAlt, 
  FaPlus, 
  FaTrash, 
  FaEdit,
  FaSave, 
  FaUpload, 
  FaArrowUp, 
  FaArrowDown, 
  FaCheck, 
  FaExternalLinkAlt, 
  FaSpinner, 
  FaTimes,
  FaWhatsapp,
  FaPhoneAlt,
  FaHandshake
} from 'react-icons/fa'
import { fetchSpotifyDetails, fetchYouTubeDetails, parseSpotifyInfo, parseYouTubeId } from '../../../lib/mediaDetector'
import { getAssetPath } from '../../../lib/pathUtils'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'

const AboutUsTab = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('carousel') // 'carousel' | 'spotify' | 'youtube' | 'story'

  // ── 1. CAROUSEL 16:9 STATE ──
  const [carouselSlides, setCarouselSlides] = useState([])
  const [carouselInputImage, setCarouselInputImage] = useState('')
  const [carouselInputTitle, setCarouselInputTitle] = useState('')
  const [carouselInputCaption, setCarouselInputCaption] = useState('')
  const [uploadingSlide, setUploadingSlide] = useState(false)
  const carouselFileInputRef = useRef(null)

  // Edit Carousel Modal
  const [editingSlide, setEditingSlide] = useState(null)
  const [uploadingEditSlide, setUploadingEditSlide] = useState(false)
  const editSlideFileRef = useRef(null)

  // ── 2. SPOTIFY STATE ──
  const [spotifyTracks, setSpotifyTracks] = useState([])
  const [spotifyInputUrl, setSpotifyInputUrl] = useState('')
  const [spotifyDetecting, setSpotifyDetecting] = useState(false)
  const [spotifyPreview, setSpotifyPreview] = useState(null)
  const [uploadingSpotifyCover, setUploadingSpotifyCover] = useState(false)
  const spotifyCoverInputRef = useRef(null)

  // Edit Spotify Modal
  const [editingSpotify, setEditingSpotify] = useState(null)
  const [uploadingEditSpotifyCover, setUploadingEditSpotifyCover] = useState(false)
  const editSpotifyCoverRef = useRef(null)

  // ── 3. YOUTUBE STATE ──
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [youtubeInputUrl, setYoutubeInputUrl] = useState('')
  const [youtubeDetecting, setYoutubeDetecting] = useState(false)
  const [youtubePreview, setYoutubePreview] = useState(null)
  const [uploadingYouTubeCover, setUploadingYouTubeCover] = useState(false)
  const youtubeCoverInputRef = useRef(null)

  // Edit YouTube Modal
  const [editingYouTube, setEditingYouTube] = useState(null)
  const [uploadingEditYouTubeCover, setUploadingEditYouTubeCover] = useState(false)
  const editYouTubeCoverRef = useRef(null)

  // ── 4. STORY TEXT STATE ──
  const [storyText, setStoryText] = useState({
    header_title: 'ABOUT NOIZE',
    header_subtitle: 'OFFICIAL MUSIC PROJECT & STAGE PERFORMANCE',
    p1: 'NOIZE adalah entitas eksplorasi musik dan panggung kreatif yang membawakan gelombang energi berfrekuensi tinggi yang memadukan distorsi suara elektronik dengan harmoni vokal khas para member.',
    p2: 'Terlahir dari visi untuk mendobrak batas panggung konvensional, NOIZE menghadirkan pengalaman audio-visual yang imersif di setiap penampilan langsung. Menggabungkan aransemen audio solid, koreografi panggung dinamis, dan identitas visual yang tegas, NOIZE mengajak setiap penonton untuk merasakan detak musik yang lebih dalam.',
    p3: 'Melalui karya musik orisinal, perilisan merchandise eksklusif, serta sesi interaksi personal Cheki, NOIZE mendedikasikan panggungnya untuk membangun koneksi sejati antara idol dan komunitas pendengar dalam satu resonansi yang tak terpisahkan.',
    members_badge: 'RESIDENT IDOLS',
    members_title: 'MEMBER PROFILES',
    members_subtitle: 'Kartu identitas resmi seluruh idol NOIZE. Seluruh data biodata langsung tertera di kartu identitas resmi.',
    spotify_badge: 'SPOTIFY RELEASES',
    spotify_title: 'NOIZE TRACKS',
    spotify_subtitle: 'Dengarkan karya audio orisinal, single panggung, dan aransemen resmi NOIZE di Spotify.',
    youtube_badge: 'YOUTUBE CHANNEL',
    youtube_title: 'OFFICIAL VIDEOS',
    youtube_subtitle: 'Tonton dokumentasi panggung, visualizer single, dan video musik resmi NOIZE.',
    news_badge: 'LATEST UPDATES',
    news_title: 'NOIZE NEWS',
    news_subtitle: 'Kabar dan pengumuman resmi mengenai aktivitas, jadwal, dan rilisan NOIZE.',
    join_title: 'JOIN THE NOIZE',
    join_subtitle: 'Ikuti rilisan lagu terbaru dan agenda panggung NOIZE melalui media sosial resmi kami.',
    cp_badge: 'MANAGEMENT & BOOKING',
    cp_title: 'OFFICIAL CONTACT PERSON',
    cp_subtitle: 'Hubungi manajemen resmi NOIZE untuk jadwal panggung, kolaborasi event, sponsorship, atau urusan kerja sama lainnya.',
    cp_manager_name: 'NOIZE Official Management',
    cp_whatsapp: '+62 812-3456-7890',
    cp_email: 'contact@noize.official',
    cp_instagram: '',
    cp_note: 'Kontak untuk penawaran live stage, sponsorship, dan kerja sama.'
  })

  const isLoadedStoryText = useRef(false)
  const [textSaving, setTextSaving] = useState(false)

  // Debounced auto-save untuk storyText
  useEffect(() => {
    if (!isLoadedStoryText.current) return
    const timer = setTimeout(async () => {
      try {
        setTextSaving(true)
        await api.patch('/config', {
          about_story_text: JSON.stringify(storyText)
        })
      } catch (e) {
        console.error('Debounce auto-save text error:', e)
      } finally {
        setTextSaving(false)
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [storyText])

  useEffect(() => {
    fetchAboutUsConfig()
  }, [])

  const fetchAboutUsConfig = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/config?t=${Date.now()}`)
      if (res.data.success && res.data.data) {
        const cfg = res.data.data
        if (cfg.about_carousel) {
          try {
            const parsed = typeof cfg.about_carousel === 'string' ? JSON.parse(cfg.about_carousel) : cfg.about_carousel
            if (Array.isArray(parsed)) setCarouselSlides(parsed)
          } catch (_) {}
        }
        if (cfg.spotify_tracks) {
          try {
            const parsed = typeof cfg.spotify_tracks === 'string' ? JSON.parse(cfg.spotify_tracks) : cfg.spotify_tracks
            if (Array.isArray(parsed)) setSpotifyTracks(parsed)
          } catch (_) {}
        }
        if (cfg.youtube_videos) {
          try {
            const parsed = typeof cfg.youtube_videos === 'string' ? JSON.parse(cfg.youtube_videos) : cfg.youtube_videos
            if (Array.isArray(parsed)) setYoutubeVideos(parsed)
          } catch (_) {}
        }
        if (cfg.about_story_text) {
          try {
            const parsed = typeof cfg.about_story_text === 'string' ? JSON.parse(cfg.about_story_text) : cfg.about_story_text
            if (parsed && typeof parsed === 'object') {
              setStoryText(prev => ({ ...prev, ...parsed }))
            }
          } catch (_) {}
        }
        setTimeout(() => { isLoadedStoryText.current = true }, 600)
      }
    } catch (err) {
      console.error('Failed to load about us config:', err)
      showToast.error('Gagal memuat pengaturan About Us')
    } finally {
      setLoading(false)
    }
  }

  // ── AUTO SAVE HELPER ──
  const autoSaveKey = async (key, value, successMsg = 'Tersimpan otomatis!') => {
    try {
      const payload = {
        [key]: typeof value === 'string' ? value : JSON.stringify(value)
      }
      await api.patch('/config', payload)
      showToast.success(successMsg)
    } catch (err) {
      console.error(`Auto-save error for ${key}:`, err)
      showToast.error('Gagal auto-save ke server: ' + (err.message || ''))
    }
  }

  // ── UPLOAD HELPER ──
  const uploadImageFile = async (file, type = 'banner') => {
    if (!file) return null
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post(`/upload/member-image?type=${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data.success && res.data.data?.url) {
      return res.data.data.url
    }
    throw new Error(res.data.error || 'Upload gagal')
  }

  // ── 1. CAROUSEL HANDLERS & EDIT ──
  const handleCarouselFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingSlide(true)
      const uploadedUrl = await uploadImageFile(file, 'banner')
      setCarouselInputImage(uploadedUrl)
      showToast.success('Foto slide berhasil diupload!')
    } catch (err) {
      showToast.error('Gagal upload foto slide: ' + err.message)
    } finally {
      setUploadingSlide(false)
    }
  }

  const handleAddCarouselSlide = async () => {
    if (!carouselInputImage) {
      showToast.error('Pilih foto slide terlebih dahulu (upload atau masukkan URL)')
      return
    }
    const newSlide = {
      id: `car-${Date.now()}`,
      image_url: carouselInputImage,
      title: carouselInputTitle || 'NOIZE Official Stage',
      caption: carouselInputCaption || 'Stage Performance'
    }
    const updated = [...carouselSlides, newSlide]
    setCarouselSlides(updated)
    setCarouselInputImage('')
    setCarouselInputTitle('')
    setCarouselInputCaption('')
    if (carouselFileInputRef.current) carouselFileInputRef.current.value = ''
    
    // Auto save langsung ke database
    await autoSaveKey('about_carousel', updated, 'Slide carousel berhasil ditambahkan & tersimpan!')
  }

  const handleDeleteCarouselSlide = async (id) => {
    const updated = carouselSlides.filter(s => s.id !== id)
    setCarouselSlides(updated)
    await autoSaveKey('about_carousel', updated, 'Slide berhasil dihapus & tersimpan!')
  }

  const handleMoveCarouselSlide = async (index, direction) => {
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= carouselSlides.length) return
    const updated = [...carouselSlides]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    setCarouselSlides(updated)
    await autoSaveKey('about_carousel', updated, 'Urutan slide tersimpan!')
  }

  // Update Carousel Slide dari Modal Edit
  const handleSaveEditSlide = async () => {
    if (!editingSlide) return
    const updated = carouselSlides.map(s => s.id === editingSlide.id ? editingSlide : s)
    setCarouselSlides(updated)
    setEditingSlide(null)
    await autoSaveKey('about_carousel', updated, 'Perubahan slide berhasil disimpan!')
  }

  const handleEditSlideFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editingSlide) return
    try {
      setUploadingEditSlide(true)
      const uploadedUrl = await uploadImageFile(file, 'banner')
      setEditingSlide(prev => ({ ...prev, image_url: uploadedUrl }))
      showToast.success('Foto slide baru berhasil diupload!')
    } catch (err) {
      showToast.error('Gagal upload foto slide: ' + err.message)
    } finally {
      setUploadingEditSlide(false)
    }
  }

  // ── 2. SPOTIFY HANDLERS & EDIT (AUTO-SAVE) ──
  const handleSpotifyUrlChange = async (url) => {
    setSpotifyInputUrl(url)
    if (!url || !parseSpotifyInfo(url)) {
      setSpotifyPreview(null)
      return
    }

    try {
      setSpotifyDetecting(true)
      const details = await fetchSpotifyDetails(url)
      setSpotifyPreview(details)
    } catch (err) {
      console.warn('Spotify detection error:', err)
    } finally {
      setSpotifyDetecting(false)
    }
  }

  const handleSpotifyCoverManualUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingSpotifyCover(true)
      const uploadedUrl = await uploadImageFile(file, 'avatars')
      if (spotifyPreview) {
        setSpotifyPreview(prev => ({ ...prev, cover_url: uploadedUrl }))
      } else {
        setSpotifyPreview({
          url: spotifyInputUrl,
          title: 'NOIZE Track',
          artist: 'NOIZE',
          cover_url: uploadedUrl,
          embed_url: parseSpotifyInfo(spotifyInputUrl)?.embedUrl || ''
        })
      }
      showToast.success('Cover Spotify manual berhasil diupload!')
    } catch (err) {
      showToast.error('Gagal upload cover: ' + err.message)
    } finally {
      setUploadingSpotifyCover(false)
    }
  }

  const handleAddSpotifyTrack = async () => {
    if (!spotifyPreview) return
    const newTrack = {
      id: `sp-${Date.now()}`,
      url: spotifyPreview.url,
      title: spotifyPreview.title || 'NOIZE Track',
      artist: spotifyPreview.artist || 'NOIZE',
      cover_url: spotifyPreview.cover_url,
      embed_url: spotifyPreview.embed_url
    }
    const updated = [newTrack, ...spotifyTracks]
    setSpotifyTracks(updated)
    setSpotifyInputUrl('')
    setSpotifyPreview(null)
    if (spotifyCoverInputRef.current) spotifyCoverInputRef.current.value = ''
    
    // Auto save langsung ke database
    await autoSaveKey('spotify_tracks', updated, 'Lagu Spotify berhasil ditambahkan & tersimpan!')
  }

  const handleDeleteSpotifyTrack = async (id) => {
    const updated = spotifyTracks.filter(t => t.id !== id)
    setSpotifyTracks(updated)
    await autoSaveKey('spotify_tracks', updated, 'Lagu Spotify berhasil dihapus & tersimpan!')
  }

  // Update Spotify dari Modal Edit
  const handleSaveEditSpotify = async () => {
    if (!editingSpotify) return
    const updated = spotifyTracks.map(t => t.id === editingSpotify.id ? editingSpotify : t)
    setSpotifyTracks(updated)
    setEditingSpotify(null)
    await autoSaveKey('spotify_tracks', updated, 'Perubahan lagu Spotify berhasil disimpan!')
  }

  const handleEditSpotifyCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editingSpotify) return
    try {
      setUploadingEditSpotifyCover(true)
      const uploadedUrl = await uploadImageFile(file, 'avatars')
      setEditingSpotify(prev => ({ ...prev, cover_url: uploadedUrl }))
      showToast.success('Cover baru berhasil diupload!')
    } catch (err) {
      showToast.error('Gagal upload cover: ' + err.message)
    } finally {
      setUploadingEditSpotifyCover(false)
    }
  }

  // ── 3. YOUTUBE HANDLERS & EDIT (AUTO-SAVE) ──
  const handleYouTubeUrlChange = async (url) => {
    setYoutubeInputUrl(url)
    if (!url || !parseYouTubeId(url)) {
      setYoutubePreview(null)
      return
    }

    try {
      setYoutubeDetecting(true)
      const details = await fetchYouTubeDetails(url)
      setYoutubePreview(details)
    } catch (err) {
      console.warn('YouTube detection error:', err)
    } finally {
      setYoutubeDetecting(false)
    }
  }

  const handleYouTubeCoverManualUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingYouTubeCover(true)
      const uploadedUrl = await uploadImageFile(file, 'banner')
      if (youtubePreview) {
        setYoutubePreview(prev => ({ ...prev, thumbnail_url: uploadedUrl }))
      } else {
        setYoutubePreview({
          url: youtubeInputUrl,
          title: 'NOIZE Official Video',
          video_id: parseYouTubeId(youtubeInputUrl) || '',
          thumbnail_url: uploadedUrl
        })
      }
      showToast.success('Thumbnail YouTube manual berhasil diupload!')
    } catch (err) {
      showToast.error('Gagal upload thumbnail: ' + err.message)
    } finally {
      setUploadingYouTubeCover(false)
    }
  }

  const handleAddYouTubeVideo = async () => {
    if (!youtubePreview) return
    const newVideo = {
      id: `yt-${Date.now()}`,
      url: youtubePreview.url,
      title: youtubePreview.title || 'NOIZE Official Video',
      video_id: youtubePreview.video_id,
      thumbnail_url: youtubePreview.thumbnail_url
    }
    const updated = [newVideo, ...youtubeVideos]
    setYoutubeVideos(updated)
    setYoutubeInputUrl('')
    setYoutubePreview(null)
    if (youtubeCoverInputRef.current) youtubeCoverInputRef.current.value = ''
    
    // Auto save langsung ke database
    await autoSaveKey('youtube_videos', updated, 'Video YouTube berhasil ditambahkan & tersimpan!')
  }

  const handleDeleteYouTubeVideo = async (id) => {
    const updated = youtubeVideos.filter(v => v.id !== id)
    setYoutubeVideos(updated)
    await autoSaveKey('youtube_videos', updated, 'Video YouTube berhasil dihapus & tersimpan!')
  }

  // Update YouTube dari Modal Edit
  const handleSaveEditYouTube = async () => {
    if (!editingYouTube) return
    const updated = youtubeVideos.map(v => v.id === editingYouTube.id ? editingYouTube : v)
    setYoutubeVideos(updated)
    setEditingYouTube(null)
    await autoSaveKey('youtube_videos', updated, 'Perubahan video YouTube berhasil disimpan!')
  }

  const handleEditYouTubeCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editingYouTube) return
    try {
      setUploadingEditYouTubeCover(true)
      const uploadedUrl = await uploadImageFile(file, 'banner')
      setEditingYouTube(prev => ({ ...prev, thumbnail_url: uploadedUrl }))
      showToast.success('Thumbnail baru berhasil diupload!')
    } catch (err) {
      showToast.error('Gagal upload thumbnail: ' + err.message)
    } finally {
      setUploadingEditYouTubeCover(false)
    }
  }

  // ── SAVE ALL TO BACKEND CONFIG (MANUAL TRIGGER) ──
  const handleSaveAll = async () => {
    try {
      setSaving(true)
      const payload = {
        about_carousel: JSON.stringify(carouselSlides),
        spotify_tracks: JSON.stringify(spotifyTracks),
        youtube_videos: JSON.stringify(youtubeVideos),
        about_story_text: JSON.stringify(storyText)
      }

      const res = await api.patch('/config', payload)
      if (res.data.success) {
        showToast.success('Seluruh data About Us berhasil disimpan ke server!')
      } else {
        throw new Error(res.data.message || 'Gagal menyimpan')
      }
    } catch (err) {
      console.error('Error saving about us config:', err)
      showToast.error('Gagal menyimpan: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400">
        <FaSpinner className="animate-spin text-3xl text-[#9D26FF] mb-3" />
        <span className="text-xs font-mono uppercase tracking-widest">Memuat Pengaturan About Us...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER CMS ABOUT US ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Pengaturan <span className="text-[#9D26FF]">About Us & Media</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Setiap penambahan, pengeditan, atau penghapusan data otomatis tersimpan langsung ke database.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#9D26FF] hover:bg-[#8A1AD6] text-white text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-[0_0_20px_rgba(157,38,255,0.4)] transition-all disabled:opacity-50 shrink-0"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
          <span>{saving ? 'Menyimpan...' : 'Simpan Semua'}</span>
        </button>
      </div>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 p-1.5 bg-[#13121D] rounded-xl border border-[#272438] overflow-x-auto">
        {[
          { id: 'carousel', label: 'Carousel (16:9)', icon: FaImages, count: carouselSlides.length },
          { id: 'spotify', label: 'Spotify Tracks', icon: FaSpotify, count: spotifyTracks.length },
          { id: 'youtube', label: 'YouTube Videos', icon: FaYoutube, count: youtubeVideos.length },
          { id: 'story', label: 'Teks Deskripsi', icon: FaFileAlt, count: null }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-[#9D26FF] text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: CAROUSEL 16:9 ── */}
      {activeSubTab === 'carousel' && (
        <div className="space-y-6">
          {/* Form Tambah Slide */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FaPlus className="text-[#9D26FF]" />
              <span>Tambah Slide Carousel (Rasio 16:9)</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Preview Box 16:9 */}
              <div className="lg:col-span-5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Preview Foto (16:9)
                </span>
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#09090B] border-2 border-dashed border-[#272438] flex flex-col items-center justify-center group shadow-inner">
                  {carouselInputImage ? (
                    <>
                      <img 
                        src={carouselInputImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <button
                          onClick={() => setCarouselInputImage('')}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold uppercase"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-zinc-500">
                      <FaImages className="text-3xl mx-auto mb-2 opacity-50" />
                      <span className="text-xs font-mono block">Rasio Widescreen 16:9</span>
                      <span className="text-[10px] text-zinc-600 block mt-1">Upload file atau tempel URL gambar</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Input Data Slide */}
              <div className="lg:col-span-7 space-y-3.5">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                    Upload Foto Slide (16:9)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E1C2E] border border-[#272438] hover:border-[#9D26FF] text-white text-xs font-bold cursor-pointer transition-all">
                      {uploadingSlide ? <FaSpinner className="animate-spin text-[#9D26FF]" /> : <FaUpload className="text-[#9D26FF]" />}
                      <span>{uploadingSlide ? 'Mengunggah...' : 'Pilih File Foto'}</span>
                      <input 
                        ref={carouselFileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleCarouselFileUpload}
                        disabled={uploadingSlide}
                      />
                    </label>
                    <span className="text-xs text-zinc-500">atau</span>
                    <input 
                      type="text"
                      placeholder="https://... URL gambar"
                      value={carouselInputImage}
                      onChange={(e) => setCarouselInputImage(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                    Judul Slide
                  </label>
                  <input 
                    type="text"
                    placeholder="Contoh: Yuna • 5th Generation"
                    value={carouselInputTitle}
                    onChange={(e) => setCarouselInputTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                    Caption / Subjudul Slide
                  </label>
                  <input 
                    type="text"
                    placeholder="Contoh: Dancing In The Moonlight"
                    value={carouselInputCaption}
                    onChange={(e) => setCarouselInputCaption(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleAddCarouselSlide}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9D26FF] hover:bg-[#8A1AD6] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md"
                  >
                    <FaPlus />
                    <span>Tambahkan ke Carousel (Auto-Save)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Daftar Slide Saat Ini (Dengan Fitur Edit) */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Daftar Slide Carousel ({carouselSlides.length})
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">
                Klik ikon pensil untuk mengedit slide
              </span>
            </div>

            {carouselSlides.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Belum ada slide carousel. Tambahkan slide di form atas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carouselSlides.map((slide, idx) => (
                  <div 
                    key={slide.id || idx}
                    className="flex gap-4 p-3 bg-[#09090B] rounded-xl border border-[#272438] hover:border-[#9D26FF]/50 transition-all items-center group"
                  >
                    {/* Thumbnail 16:9 */}
                    <div className="w-32 aspect-[16/9] rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                      <img 
                        src={slide.image_url} 
                        alt={slide.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    {/* Data Slide */}
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-[9px] font-mono text-[#9D26FF] uppercase font-bold block">
                        SLIDE #{idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">
                        {slide.title}
                      </h4>
                      {slide.caption && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {slide.caption}
                        </p>
                      )}
                    </div>

                    {/* Aksi Slide: Edit, Move Up, Move Down, Delete */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => setEditingSlide({ ...slide })}
                        title="Edit slide"
                        className="p-1.5 rounded-lg bg-[#9D26FF]/15 hover:bg-[#9D26FF]/30 text-[#9D26FF] text-xs transition-colors"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleMoveCarouselSlide(idx, -1)}
                        disabled={idx === 0}
                        title="Geser ke atas"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 text-xs transition-colors"
                      >
                        <FaArrowUp />
                      </button>
                      <button
                        onClick={() => handleMoveCarouselSlide(idx, 1)}
                        disabled={idx === carouselSlides.length - 1}
                        title="Geser ke bawah"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 text-xs transition-colors"
                      >
                        <FaArrowDown />
                      </button>
                      <button
                        onClick={() => handleDeleteCarouselSlide(slide.id)}
                        title="Hapus slide"
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: SPOTIFY TRACKS (AUTO-SAVE & EDIT) ── */}
      {activeSubTab === 'spotify' && (
        <div className="space-y-6">
          {/* Header Text Kustomisasi Spotify (Sesuai Lampiran) */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Header Bagian Spotify Releases</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Ubah judul, badge, dan deskripsi yang tampil di atas daftar lagu Spotify di /story.
                </p>
              </div>
              <button
                onClick={() => autoSaveKey('about_story_text', storyText, 'Header Spotify tersimpan!')}
                className="px-3 py-1.5 rounded-lg bg-[#1DB954] hover:bg-[#1AA34A] text-black text-xs font-bold uppercase transition-all"
              >
                Simpan Header
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Pill Badge
                </label>
                <input 
                  type="text"
                  placeholder="SPOTIFY RELEASES"
                  value={storyText.spotify_badge || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, spotify_badge: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Utama
                </label>
                <input 
                  type="text"
                  placeholder="NOIZE TRACKS"
                  value={storyText.spotify_title || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, spotify_title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Deskripsi / Subtitle Spotify
              </label>
              <textarea 
                rows={2}
                placeholder="Dengarkan karya audio orisinal, single panggung..."
                value={storyText.spotify_subtitle || ''}
                onChange={(e) => setStoryText(prev => ({ ...prev, spotify_subtitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954] resize-none"
              />
            </div>
          </div>

          {/* Form Tambah Track Spotify */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FaSpotify className="text-[#1DB954]" />
              <span>Tambah Lagu Spotify (Auto-Detect + Upload Cover Manual)</span>
            </h3>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Link Lagu Spotify
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="https://open.spotify.com/track/..."
                  value={spotifyInputUrl}
                  onChange={(e) => handleSpotifyUrlChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954] pr-10"
                />
                {spotifyDetecting && (
                  <div className="absolute right-3.5 top-3.5">
                    <FaSpinner className="animate-spin text-[#1DB954] text-sm" />
                  </div>
                )}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Cukup tempel link Spotify, judul lagu & cover otomatis terdeteksi. Klik "Tambahkan" dan data langsung tersimpan otomatis.
              </span>
            </div>

            {/* Preview Box & Manual Edit */}
            {spotifyPreview && (
              <div className="p-4 rounded-xl bg-[#09090B] border border-[#272438] flex flex-col sm:flex-row items-center gap-4">
                {/* Cover Frame */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 group">
                  <img 
                    src={spotifyPreview.cover_url || getAssetPath('/noize-logo.png')} 
                    alt="Spotify Cover" 
                    className="w-full h-full object-cover" 
                  />
                  {uploadingSpotifyCover && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <FaSpinner className="animate-spin text-[#1DB954]" />
                    </div>
                  )}
                </div>

                {/* Details & Manual Cover Upload */}
                <div className="flex-1 min-w-0 space-y-2 text-left w-full">
                  <div>
                    <span className="text-[9px] font-mono text-[#1DB954] uppercase font-bold block">
                      COVER & LAGU TERDETEKSI
                    </span>
                    <h4 className="text-sm font-bold text-white truncate">
                      {spotifyPreview.title}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">
                      {spotifyPreview.artist}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium cursor-pointer transition-colors">
                      <FaUpload size={11} className="text-[#1DB954]" />
                      <span>{uploadingSpotifyCover ? 'Mengunggah...' : 'Ganti Cover Manual'}</span>
                      <input 
                        ref={spotifyCoverInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleSpotifyCoverManualUpload}
                        disabled={uploadingSpotifyCover}
                      />
                    </label>

                    <button
                      onClick={handleAddSpotifyTrack}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#1DB954] hover:bg-[#1AA34A] text-black text-xs font-black uppercase tracking-wider transition-all shadow-md ml-auto"
                    >
                      <FaPlus />
                      <span>Tambahkan (Auto-Save)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Daftar Lagu Spotify (Dengan Fitur Edit) */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Daftar Lagu Spotify ({spotifyTracks.length})
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">
                Klik ikon pensil untuk mengedit detail lagu
              </span>
            </div>

            {spotifyTracks.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Belum ada lagu Spotify yang terdaftar. Masukkan link di atas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spotifyTracks.map((track) => (
                  <div 
                    key={track.id}
                    className="flex items-center gap-3.5 p-3.5 bg-[#09090B] rounded-xl border border-[#272438] hover:border-[#1DB954]/50 transition-all text-left"
                  >
                    <img 
                      src={track.cover_url || getAssetPath('/noize-logo.png')} 
                      alt={track.title} 
                      className="w-14 h-14 rounded-lg object-cover bg-black shrink-0 border border-white/10" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {track.artist}
                      </p>
                      {track.url && (
                        <a 
                          href={track.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-[10px] text-[#1DB954] hover:underline mt-1"
                        >
                          <span>Buka di Spotify</span>
                          <FaExternalLinkAlt size={8} />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingSpotify({ ...track })}
                        title="Edit lagu"
                        className="p-2 rounded-lg bg-[#1DB954]/15 hover:bg-[#1DB954]/30 text-[#1DB954] text-xs transition-colors"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteSpotifyTrack(track.id)}
                        title="Hapus lagu"
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: YOUTUBE VIDEOS (AUTO-SAVE & EDIT) ── */}
      {activeSubTab === 'youtube' && (
        <div className="space-y-6">
          {/* Header Text Kustomisasi YouTube */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Header Bagian YouTube Videos</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Ubah judul, badge, dan deskripsi yang tampil di atas daftar video YouTube di /story.
                </p>
              </div>
              <button
                onClick={() => autoSaveKey('about_story_text', storyText, 'Header YouTube tersimpan!')}
                className="px-3 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold uppercase transition-all"
              >
                Simpan Header
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Pill Badge
                </label>
                <input 
                  type="text"
                  placeholder="YOUTUBE CHANNEL"
                  value={storyText.youtube_badge || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, youtube_badge: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Utama
                </label>
                <input 
                  type="text"
                  placeholder="OFFICIAL VIDEOS"
                  value={storyText.youtube_title || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, youtube_title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Deskripsi / Subtitle YouTube
              </label>
              <textarea 
                rows={2}
                placeholder="Tonton dokumentasi panggung, visualizer single..."
                value={storyText.youtube_subtitle || ''}
                onChange={(e) => setStoryText(prev => ({ ...prev, youtube_subtitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000] resize-none"
              />
            </div>
          </div>

          {/* Form Tambah Video YouTube */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FaYoutube className="text-[#FF0000]" />
              <span>Tambah Video YouTube (Auto-Detect + Upload Thumbnail Manual)</span>
            </h3>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Link Video YouTube
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                  value={youtubeInputUrl}
                  onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000] pr-10"
                />
                {youtubeDetecting && (
                  <div className="absolute right-3.5 top-3.5">
                    <FaSpinner className="animate-spin text-[#FF0000] text-sm" />
                  </div>
                )}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Cukup tempel link YouTube, thumbnail & judul otomatis terdeteksi. Klik "Tambahkan" dan data langsung tersimpan otomatis.
              </span>
            </div>

            {/* Preview Box & Manual Edit */}
            {youtubePreview && (
              <div className="p-4 rounded-xl bg-[#09090B] border border-[#272438] flex flex-col sm:flex-row items-center gap-4">
                {/* Thumbnail Frame (16:9) */}
                <div className="relative w-36 aspect-[16/9] rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 group">
                  <img 
                    src={youtubePreview.thumbnail_url || getAssetPath('/noize-logo.png')} 
                    alt="YouTube Thumbnail" 
                    className="w-full h-full object-cover" 
                  />
                  {uploadingYouTubeCover && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <FaSpinner className="animate-spin text-[#FF0000]" />
                    </div>
                  )}
                </div>

                {/* Details & Manual Thumbnail Upload */}
                <div className="flex-1 min-w-0 space-y-2 text-left w-full">
                  <div>
                    <span className="text-[9px] font-mono text-[#FF0000] uppercase font-bold block">
                      THUMBNAIL & VIDEO TERDETEKSI
                    </span>
                    <h4 className="text-sm font-bold text-white truncate">
                      {youtubePreview.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium cursor-pointer transition-colors">
                      <FaUpload size={11} className="text-[#FF0000]" />
                      <span>{uploadingYouTubeCover ? 'Mengunggah...' : 'Ganti Thumbnail Manual'}</span>
                      <input 
                        ref={youtubeCoverInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleYouTubeCoverManualUpload}
                        disabled={uploadingYouTubeCover}
                      />
                    </label>

                    <button
                      onClick={handleAddYouTubeVideo}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md ml-auto"
                    >
                      <FaPlus />
                      <span>Tambahkan (Auto-Save)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Daftar Video YouTube (Dengan Fitur Edit) */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Daftar Video YouTube ({youtubeVideos.length})
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">
                Klik ikon pensil untuk mengedit judul atau thumbnail video
              </span>
            </div>

            {youtubeVideos.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Belum ada video YouTube yang terdaftar. Masukkan link di atas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {youtubeVideos.map((video) => (
                  <div 
                    key={video.id}
                    className="flex items-center gap-3.5 p-3.5 bg-[#09090B] rounded-xl border border-[#272438] hover:border-[#FF0000]/50 transition-all text-left"
                  >
                    <div className="w-24 aspect-[16/9] rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                      <img 
                        src={video.thumbnail_url || getAssetPath('/noize-logo.png')} 
                        alt={video.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {video.title}
                      </h4>
                      {video.url && (
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-[10px] text-[#FF0000] hover:underline mt-1"
                        >
                          <span>Tonton di YouTube</span>
                          <FaExternalLinkAlt size={8} />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingYouTube({ ...video })}
                        title="Edit video"
                        className="p-2 rounded-lg bg-[#FF0000]/15 hover:bg-[#FF0000]/30 text-[#FF0000] text-xs transition-colors"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteYouTubeVideo(video.id)}
                        title="Hapus video"
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: TEKS DESKRIPSI ABOUT US ── */}
      {activeSubTab === 'story' && (
        <div className="space-y-6">
          {/* Header Action */}
          <div className="flex items-center justify-between bg-[#13121D] p-5 rounded-2xl border border-[#272438]">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FaFileAlt className="text-[#9D26FF]" />
                  <span>Kustomisasi Seluruh Teks Halaman About Us</span>
                </h3>
                {textSaving ? (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30 animate-pulse">
                    Menyimpan otomatis...
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    ✓ Auto-Save Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Ubah judul, badge, dan deskripsi seluruh section pada halaman /story secara dinamis (otomatis tersimpan ke database).
              </p>
            </div>

            <button
              onClick={() => autoSaveKey('about_story_text', storyText, 'Seluruh teks berhasil disimpan!')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9D26FF] hover:bg-[#8A1AD6] text-white text-xs font-black uppercase tracking-wider shadow-md transition-all shrink-0"
            >
              <FaSave />
              <span>Simpan Manual</span>
            </button>
          </div>

          {/* 1. Header Member Profiles (Sesuai Lampiran User) */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Header Bagian Member Profiles</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Teks judul dan deskripsi yang tampil di atas kartu profil member.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Pill Badge Member
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: RESIDENT IDOLS"
                  value={storyText.members_badge || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, members_badge: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Utama Section
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: MEMBER PROFILES"
                  value={storyText.members_title || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, members_title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Deskripsi / Subtitle Member Profiles
              </label>
              <textarea 
                rows={2}
                placeholder="Contoh: Kartu identitas resmi seluruh idol NOIZE..."
                value={storyText.members_subtitle || ''}
                onChange={(e) => setStoryText(prev => ({ ...prev, members_subtitle: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF] resize-none"
              />
            </div>
          </div>

          {/* 2. Header Atas & Paragraf Cerita NOIZE */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="border-b border-[#272438] pb-3">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Cerita & Deskripsi Utama NOIZE</span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Tampil di bagian atas halaman /story di bawah carousel 16:9.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Halaman
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: ABOUT NOIZE"
                  value={storyText.header_title || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, header_title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Subjudul Header
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: OFFICIAL MUSIC PROJECT & STAGE PERFORMANCE"
                  value={storyText.header_subtitle || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, header_subtitle: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Paragraf 1 (Pengenalan Entitas NOIZE)
                </label>
                <textarea 
                  rows={2}
                  value={storyText.p1 || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, p1: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF] resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Paragraf 2 (Visi & Penampilan Audio Visual)
                </label>
                <textarea 
                  rows={2}
                  value={storyText.p2 || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, p2: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF] resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Paragraf 3 (Karya Musik, Merchandise & Komunitas)
                </label>
                <textarea 
                  rows={2}
                  value={storyText.p3 || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, p3: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF] resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Header Section Spotify & YouTube */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Spotify Text Settings */}
            <div className="bg-[#13121D] p-5 rounded-2xl border border-[#272438] space-y-3.5">
              <h4 className="text-xs font-black text-[#1DB954] uppercase tracking-wider flex items-center gap-2">
                <FaSpotify />
                <span>Header Bagian Spotify</span>
              </h4>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Badge Spotify
                </label>
                <input 
                  type="text"
                  placeholder="SPOTIFY RELEASES"
                  value={storyText.spotify_badge || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, spotify_badge: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Section Spotify
                </label>
                <input 
                  type="text"
                  placeholder="NOIZE TRACKS"
                  value={storyText.spotify_title || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, spotify_title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Deskripsi Spotify
                </label>
                <textarea 
                  rows={2}
                  placeholder="Dengarkan karya audio orisinal..."
                  value={storyText.spotify_subtitle || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, spotify_subtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954] resize-none"
                />
              </div>
            </div>

            {/* YouTube Text Settings */}
            <div className="bg-[#13121D] p-5 rounded-2xl border border-[#272438] space-y-3.5">
              <h4 className="text-xs font-black text-[#FF0000] uppercase tracking-wider flex items-center gap-2">
                <FaYoutube />
                <span>Header Bagian YouTube</span>
              </h4>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Badge YouTube
                </label>
                <input 
                  type="text"
                  placeholder="YOUTUBE CHANNEL"
                  value={storyText.youtube_badge || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, youtube_badge: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Section YouTube
                </label>
                <input 
                  type="text"
                  placeholder="OFFICIAL VIDEOS"
                  value={storyText.youtube_title || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, youtube_title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Deskripsi YouTube
                </label>
                <textarea 
                  rows={2}
                  placeholder="Tonton dokumentasi panggung..."
                  value={storyText.youtube_subtitle || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, youtube_subtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000] resize-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Header Section News & Banner Join The Noize */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* News Updates Text Settings */}
            <div className="bg-[#13121D] p-5 rounded-2xl border border-[#272438] space-y-3.5">
              <h4 className="text-xs font-black text-[#9D26FF] uppercase tracking-wider flex items-center gap-2">
                <span>Header Bagian Berita / News</span>
              </h4>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Pill Badge Berita
                </label>
                <input 
                  type="text"
                  placeholder="LATEST UPDATES"
                  value={storyText.news_badge || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, news_badge: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Section Berita
                </label>
                <input 
                  type="text"
                  placeholder="NOIZE NEWS"
                  value={storyText.news_title || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, news_title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Deskripsi Berita
                </label>
                <textarea 
                  rows={2}
                  placeholder="Kabar dan pengumuman resmi..."
                  value={storyText.news_subtitle || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, news_subtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF] resize-none"
                />
              </div>
            </div>

            {/* Banner Join The Noize Text Settings */}
            <div className="bg-[#13121D] p-5 rounded-2xl border border-[#272438] space-y-3.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Banner Bawah (Join The Noize)</span>
              </h4>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Banner
                </label>
                <input 
                  type="text"
                  placeholder="JOIN THE NOIZE"
                  value={storyText.join_title || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, join_title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#24C6F5]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Deskripsi / Subtitle Banner
                </label>
                <textarea 
                  rows={4}
                  placeholder="Ikuti rilisan lagu terbaru dan agenda panggung NOIZE..."
                  value={storyText.join_subtitle || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, join_subtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#24C6F5] resize-none"
                />
              </div>
            </div>
          </div>

          {/* 5. Kontak Manager & Booking (CP) */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="border-b border-[#272438] pb-3">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaHandshake className="text-[#24C6F5]" />
                <span>Kontak Manager & Booking (CP Inquiry)</span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Kontak resmi perwakilan manajemen NOIZE untuk panggilan perform, konser/festival, kolaborasi, dan kerja sama bisnis.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Pill Badge
                </label>
                <input 
                  type="text"
                  placeholder="MANAGEMENT & BOOKING"
                  value={storyText.cp_badge || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, cp_badge: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#24C6F5]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Section
                </label>
                <input 
                  type="text"
                  placeholder="OFFICIAL CONTACT PERSON"
                  value={storyText.cp_title || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, cp_title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#24C6F5]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Nama PIC / Manajemen
                </label>
                <input 
                  type="text"
                  placeholder="NOIZE Official Management"
                  value={storyText.cp_manager_name || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, cp_manager_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#24C6F5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Nomor WhatsApp
                </label>
                <input 
                  type="text"
                  placeholder="+62 812-3456-7890"
                  value={storyText.cp_whatsapp || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, cp_whatsapp: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#25D366] font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Alamat Email
                </label>
                <input 
                  type="email"
                  placeholder="contact@noize.official"
                  value={storyText.cp_email || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, cp_email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF] font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Instagram CP (Opsional)
                </label>
                <input 
                  type="text"
                  placeholder="Default: ikut menu Settings"
                  value={storyText.cp_instagram || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, cp_instagram: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#E1306C] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Subjudul / Keterangan Header
                </label>
                <textarea 
                  rows={2}
                  placeholder="Hubungi manajemen resmi NOIZE untuk jadwal panggung..."
                  value={storyText.cp_subtitle || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, cp_subtitle: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#24C6F5] resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Kalimat Keterangan di Bawah Judul
                </label>
                <textarea 
                  rows={2}
                  placeholder="Kontak untuk penawaran live stage, sponsorship, dan kerja sama."
                  value={storyText.cp_note || ''}
                  onChange={(e) => setStoryText(prev => ({ ...prev, cp_note: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#24C6F5] resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: EDIT SLIDE CAROUSEL ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#13121D] rounded-2xl border border-[#272438] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaEdit className="text-[#9D26FF]" />
                <span>Edit Slide Carousel</span>
              </h3>
              <button 
                onClick={() => setEditingSlide(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Preview 16:9 */}
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                Foto Slide (16:9)
              </label>
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black border border-white/10 mb-2">
                <img 
                  src={editingSlide.image_url} 
                  alt="Slide Edit" 
                  className="w-full h-full object-cover" 
                />
                {uploadingEditSlide && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <FaSpinner className="animate-spin text-[#9D26FF] text-xl" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1E1C2E] border border-[#272438] hover:border-[#9D26FF] text-white text-xs font-bold cursor-pointer transition-all">
                  <FaUpload size={12} className="text-[#9D26FF]" />
                  <span>{uploadingEditSlide ? 'Mengunggah...' : 'Upload Foto Baru'}</span>
                  <input 
                    ref={editSlideFileRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleEditSlideFileUpload}
                    disabled={uploadingEditSlide}
                  />
                </label>
                <input 
                  type="text"
                  placeholder="Atau ganti URL foto"
                  value={editingSlide.image_url}
                  onChange={(e) => setEditingSlide(prev => ({ ...prev, image_url: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Judul Slide
              </label>
              <input 
                type="text"
                value={editingSlide.title}
                onChange={(e) => setEditingSlide(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Caption / Subjudul
              </label>
              <input 
                type="text"
                value={editingSlide.caption}
                onChange={(e) => setEditingSlide(prev => ({ ...prev, caption: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#9D26FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#272438]">
              <button
                onClick={() => setEditingSlide(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditSlide}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#9D26FF] hover:bg-[#8A1AD6] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                <FaCheck />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: EDIT SPOTIFY TRACK ── */}
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {editingSpotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#13121D] rounded-2xl border border-[#272438] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaEdit className="text-[#1DB954]" />
                <span>Edit Lagu Spotify</span>
              </h3>
              <button 
                onClick={() => setEditingSpotify(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Cover & Upload */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                <img 
                  src={editingSpotify.cover_url || getAssetPath('/noize-logo.png')} 
                  alt="Spotify Cover" 
                  className="w-full h-full object-cover" 
                />
                {uploadingEditSpotifyCover && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <FaSpinner className="animate-spin text-[#1DB954]" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E1C2E] border border-[#272438] hover:border-[#1DB954] text-white text-xs font-bold cursor-pointer transition-all">
                  <FaUpload size={11} className="text-[#1DB954]" />
                  <span>{uploadingEditSpotifyCover ? 'Mengunggah...' : 'Upload Cover Baru'}</span>
                  <input 
                    ref={editSpotifyCoverRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleEditSpotifyCoverUpload}
                    disabled={uploadingEditSpotifyCover}
                  />
                </label>
                <input 
                  type="text"
                  placeholder="URL cover gambar"
                  value={editingSpotify.cover_url || ''}
                  onChange={(e) => setEditingSpotify(prev => ({ ...prev, cover_url: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Judul Lagu
              </label>
              <input 
                type="text"
                value={editingSpotify.title}
                onChange={(e) => setEditingSpotify(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954]"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Artis
              </label>
              <input 
                type="text"
                value={editingSpotify.artist}
                onChange={(e) => setEditingSpotify(prev => ({ ...prev, artist: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954]"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Link URL Spotify
              </label>
              <input 
                type="text"
                value={editingSpotify.url}
                onChange={(e) => setEditingSpotify(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#1DB954]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#272438]">
              <button
                onClick={() => setEditingSpotify(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditSpotify}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1DB954] hover:bg-[#1AA34A] text-black text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                <FaCheck />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 3: EDIT YOUTUBE VIDEO ── */}
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {editingYouTube && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#13121D] rounded-2xl border border-[#272438] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaEdit className="text-[#FF0000]" />
                <span>Edit Video YouTube</span>
              </h3>
              <button 
                onClick={() => setEditingYouTube(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Thumbnail (16:9) & Upload */}
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                Thumbnail Video (16:9)
              </label>
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black border border-white/10 mb-2">
                <img 
                  src={editingYouTube.thumbnail_url || getAssetPath('/noize-logo.png')} 
                  alt="YouTube Thumbnail Edit" 
                  className="w-full h-full object-cover" 
                />
                {uploadingEditYouTubeCover && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <FaSpinner className="animate-spin text-[#FF0000] text-xl" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1E1C2E] border border-[#272438] hover:border-[#FF0000] text-white text-xs font-bold cursor-pointer transition-all">
                  <FaUpload size={12} className="text-[#FF0000]" />
                  <span>{uploadingEditYouTubeCover ? 'Mengunggah...' : 'Upload Thumbnail Baru'}</span>
                  <input 
                    ref={editYouTubeCoverRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleEditYouTubeCoverUpload}
                    disabled={uploadingEditYouTubeCover}
                  />
                </label>
                <input 
                  type="text"
                  placeholder="Atau ganti URL thumbnail"
                  value={editingYouTube.thumbnail_url || ''}
                  onChange={(e) => setEditingYouTube(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Judul Video
              </label>
              <input 
                type="text"
                value={editingYouTube.title}
                onChange={(e) => setEditingYouTube(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000]"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Link URL YouTube
              </label>
              <input 
                type="text"
                value={editingYouTube.url}
                onChange={(e) => {
                  const val = e.target.value
                  const vidId = parseYouTubeId(val)
                  setEditingYouTube(prev => ({ 
                    ...prev, 
                    url: val,
                    video_id: vidId || prev.video_id
                  }))
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-[#09090B] border border-[#272438] text-white text-xs focus:outline-none focus:border-[#FF0000]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#272438]">
              <button
                onClick={() => setEditingYouTube(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditYouTube}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                <FaCheck />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AboutUsTab
