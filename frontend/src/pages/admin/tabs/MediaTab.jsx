import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaMusic, 
  FaYoutube, 
  FaPlus, 
  FaTrash, 
  FaSave, 
  FaCheck, 
  FaExternalLinkAlt, 
  FaImages, 
  FaSpinner, 
  FaPlay,
  FaCompactDisc,
  FaEye
} from 'react-icons/fa'
import { fetchSpotifyDetails, fetchYouTubeDetails, parseSpotifyInfo, parseYouTubeId } from '../../../lib/mediaDetector'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'

const MediaTab = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('spotify') // 'spotify' | 'youtube' | 'carousel'

  // Spotify state
  const [spotifyTracks, setSpotifyTracks] = useState([])
  const [spotifyInputUrl, setSpotifyInputUrl] = useState('')
  const [spotifyDetecting, setSpotifyDetecting] = useState(false)
  const [spotifyPreview, setSpotifyPreview] = useState(null)

  // YouTube state
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [youtubeInputUrl, setYoutubeInputUrl] = useState('')
  const [youtubeDetecting, setYoutubeDetecting] = useState(false)
  const [youtubePreview, setYoutubePreview] = useState(null)

  // Carousel state
  const [carouselSlides, setCarouselSlides] = useState([])
  const [carouselInputImage, setCarouselInputImage] = useState('')
  const [carouselInputTitle, setCarouselInputTitle] = useState('')
  const [carouselInputCaption, setCarouselInputCaption] = useState('')

  useEffect(() => {
    fetchMediaConfig()
  }, [])

  const fetchMediaConfig = async () => {
    try {
      setLoading(true)
      const res = await api.get('/config')
      if (res.data.success && res.data.data) {
        const cfg = res.data.data
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
        if (cfg.about_carousel) {
          try {
            const parsed = typeof cfg.about_carousel === 'string' ? JSON.parse(cfg.about_carousel) : cfg.about_carousel
            if (Array.isArray(parsed)) setCarouselSlides(parsed)
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error('Failed to load media config:', err)
      showToast.error('Gagal memuat pengaturan musik & media')
    } finally {
      setLoading(false)
    }
  }

  // Handle Spotify URL typing & auto-detection
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

  const handleAddSpotifyTrack = () => {
    if (!spotifyPreview) return
    const newTrack = {
      id: `sp-${Date.now()}`,
      url: spotifyPreview.url,
      title: spotifyPreview.title || 'NOIZE Track',
      artist: spotifyPreview.artist || 'NOIZE',
      cover_url: spotifyPreview.cover_url,
      embed_url: spotifyPreview.embed_url
    }
    setSpotifyTracks(prev => [newTrack, ...prev])
    setSpotifyInputUrl('')
    setSpotifyPreview(null)
    showToast.success('Lagu Spotify berhasil ditambahkan ke daftar!')
  }

  const handleDeleteSpotifyTrack = (id) => {
    setSpotifyTracks(prev => prev.filter(t => t.id !== id))
  }

  // Handle YouTube URL typing & auto-detection
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

  const handleAddYouTubeVideo = () => {
    if (!youtubePreview) return
    const newVideo = {
      id: `yt-${Date.now()}`,
      url: youtubePreview.url,
      title: youtubePreview.title || 'NOIZE Official Video',
      video_id: youtubePreview.video_id,
      thumbnail_url: youtubePreview.thumbnail_url
    }
    setYoutubeVideos(prev => [newVideo, ...prev])
    setYoutubeInputUrl('')
    setYoutubePreview(null)
    showToast.success('Video YouTube berhasil ditambahkan ke daftar!')
  }

  const handleDeleteYouTubeVideo = (id) => {
    setYoutubeVideos(prev => prev.filter(v => v.id !== id))
  }

  // Handle Carousel slide add
  const handleAddCarouselSlide = () => {
    if (!carouselInputImage) {
      showToast.error('Masukkan URL gambar terlebih dahulu')
      return
    }
    const newSlide = {
      id: `car-${Date.now()}`,
      image_url: carouselInputImage,
      title: carouselInputTitle || 'NOIZE Stage Moment',
      caption: carouselInputCaption || 'Stage Performance'
    }
    setCarouselSlides(prev => [...prev, newSlide])
    setCarouselInputImage('')
    setCarouselInputTitle('')
    setCarouselInputCaption('')
    showToast.success('Slide carousel berhasil ditambahkan!')
  }

  const handleDeleteCarouselSlide = (id) => {
    setCarouselSlides(prev => prev.filter(s => s.id !== id))
  }

  // Save all to backend config
  const handleSaveAll = async () => {
    try {
      setSaving(true)
      const payload = {
        spotify_tracks: JSON.stringify(spotifyTracks),
        youtube_videos: JSON.stringify(youtubeVideos),
        about_carousel: JSON.stringify(carouselSlides)
      }

      const res = await api.patch('/config', payload)
      if (res.data.success) {
        showToast.success('Pengaturan Musik, Video & Carousel berhasil disimpan!')
      } else {
        throw new Error(res.data.message || 'Gagal menyimpan')
      }
    } catch (err) {
      console.error('Error saving media config:', err)
      showToast.error('Gagal menyimpan ke server: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400">
        <FaSpinner className="animate-spin text-2xl mr-3 text-[#9D26FF]" />
        <span>Memuat pengaturan media...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Header & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            CMS MUSIK & MEDIA NOIZE
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Kelola lagu Spotify (auto-detect cover), video YouTube, dan Carousel 3D About Us.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#9D26FF] hover:bg-[#8A1AD6] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#9D26FF]/20 transition-all disabled:opacity-50"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
          <span>{saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#13121D] border border-[#272438] rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('spotify')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'spotify'
              ? 'bg-[#1DB954] text-black shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FaMusic /> Spotify Tracks ({spotifyTracks.length})
        </button>
        <button
          onClick={() => setActiveSubTab('youtube')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'youtube'
              ? 'bg-[#FF0000] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FaYoutube /> YouTube Videos ({youtubeVideos.length})
        </button>
        <button
          onClick={() => setActiveSubTab('carousel')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'carousel'
              ? 'bg-[#9D26FF] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FaImages /> 3D Carousel ({carouselSlides.length})
        </button>
      </div>

      {/* ── 1. SPOTIFY TAB ── */}
      {activeSubTab === 'spotify' && (
        <div className="space-y-6">
          {/* Add Track Card with Auto-Detect */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#1DB954] flex items-center gap-1.5">
                <FaMusic /> Auto-Detect Link Spotify
              </span>
              <span className="text-[11px] text-zinc-400">
                Tempel link lagu/album, cover & judul otomatis terdeteksi
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={spotifyInputUrl}
                  onChange={(e) => handleSpotifyUrlChange(e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#1DB954] transition-all font-mono"
                />
                {spotifyDetecting && (
                  <span className="absolute right-3.5 top-3 text-[#1DB954]">
                    <FaSpinner className="animate-spin text-sm" />
                  </span>
                )}
              </div>
              <button
                onClick={handleAddSpotifyTrack}
                disabled={!spotifyPreview || spotifyDetecting}
                className="px-6 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#19a349] disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <FaPlus /> Tambah Lagu
              </button>
            </div>

            {/* Live Auto-Detected Preview */}
            {spotifyPreview && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-[#09090B] border border-[#1DB954]/40 flex flex-col sm:flex-row items-center gap-4"
              >
                {spotifyPreview.cover_url ? (
                  <img 
                    src={spotifyPreview.cover_url} 
                    alt="Cover Preview" 
                    className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[#1E1C2E] flex items-center justify-center text-[#1DB954] shrink-0">
                    <FaCompactDisc size={28} />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1DB954] block">
                    ✓ Link Spotify Terdeteksi
                  </span>
                  <p className="text-sm font-bold text-white truncate">{spotifyPreview.title}</p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{spotifyPreview.artist || 'NOIZE'}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* List of Spotify Tracks */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Daftar Lagu Spotify Aktif ({spotifyTracks.length})
            </h3>
            {spotifyTracks.length === 0 ? (
              <div className="p-8 text-center bg-[#13121D] rounded-2xl border border-dashed border-[#272438] text-zinc-500 text-xs">
                Belum ada lagu Spotify yang ditambahkan. Masukkan link di atas untuk menambah.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {spotifyTracks.map((track, idx) => (
                  <div 
                    key={track.id || idx}
                    className="p-3.5 rounded-xl bg-[#13121D] border border-[#272438] hover:border-[#1DB954]/50 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {track.cover_url ? (
                        <img 
                          src={track.cover_url} 
                          alt={track.title} 
                          className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#1E1C2E] flex items-center justify-center text-[#1DB954] shrink-0">
                          <FaMusic size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-mono">
                          {track.artist || 'NOIZE'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a 
                        href={track.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all text-xs"
                        title="Buka di Spotify"
                      >
                        <FaExternalLinkAlt />
                      </a>
                      <button 
                        onClick={() => handleDeleteSpotifyTrack(track.id)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all text-xs"
                        title="Hapus Lagu"
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

      {/* ── 2. YOUTUBE TAB ── */}
      {activeSubTab === 'youtube' && (
        <div className="space-y-6">
          {/* Add Video Card with Auto-Detect */}
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF0000] flex items-center gap-1.5">
                <FaYoutube /> Auto-Detect Link YouTube
              </span>
              <span className="text-[11px] text-zinc-400">
                Tempel link video YouTube, thumbnail & judul otomatis terdeteksi
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={youtubeInputUrl}
                  onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF0000] transition-all font-mono"
                />
                {youtubeDetecting && (
                  <span className="absolute right-3.5 top-3 text-[#FF0000]">
                    <FaSpinner className="animate-spin text-sm" />
                  </span>
                )}
              </div>
              <button
                onClick={handleAddYouTubeVideo}
                disabled={!youtubePreview || youtubeDetecting}
                className="px-6 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#d60000] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <FaPlus /> Tambah Video
              </button>
            </div>

            {/* Live Auto-Detected Preview */}
            {youtubePreview && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-[#09090B] border border-[#FF0000]/40 flex flex-col sm:flex-row items-center gap-4"
              >
                <img 
                  src={youtubePreview.thumbnail_url} 
                  alt="Video Thumbnail Preview" 
                  className="w-24 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF0000] block">
                    ✓ Link YouTube Terdeteksi (ID: {youtubePreview.video_id})
                  </span>
                  <p className="text-sm font-bold text-white truncate">{youtubePreview.title}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* List of YouTube Videos */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Daftar Video YouTube Aktif ({youtubeVideos.length})
            </h3>
            {youtubeVideos.length === 0 ? (
              <div className="p-8 text-center bg-[#13121D] rounded-2xl border border-dashed border-[#272438] text-zinc-500 text-xs">
                Belum ada video YouTube yang ditambahkan. Masukkan link di atas untuk menambah.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {youtubeVideos.map((video, idx) => (
                  <div 
                    key={video.id || idx}
                    className="p-3.5 rounded-xl bg-[#13121D] border border-[#272438] hover:border-[#FF0000]/50 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title} 
                        className="w-20 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#FF0000] transition-colors">
                          {video.title}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          ID: {video.video_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all text-xs"
                        title="Buka di YouTube"
                      >
                        <FaExternalLinkAlt />
                      </a>
                      <button 
                        onClick={() => handleDeleteYouTubeVideo(video.id)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all text-xs"
                        title="Hapus Video"
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

      {/* ── 3. CAROUSEL TAB ── */}
      {activeSubTab === 'carousel' && (
        <div className="space-y-6">
          <div className="bg-[#13121D] p-5 sm:p-6 rounded-2xl border border-[#272438] space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-[#9D26FF] flex items-center gap-1.5">
              <FaImages /> Tambah Slide Carousel 3D About Us
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={carouselInputImage}
                onChange={(e) => setCarouselInputImage(e.target.value)}
                placeholder="URL Gambar (https://... atau /images/...)"
                className="bg-[#09090B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
              />
              <input
                type="text"
                value={carouselInputTitle}
                onChange={(e) => setCarouselInputTitle(e.target.value)}
                placeholder="Judul Slide (opsional)"
                className="bg-[#09090B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
              />
              <input
                type="text"
                value={carouselInputCaption}
                onChange={(e) => setCarouselInputCaption(e.target.value)}
                placeholder="Caption / Subtitle (opsional)"
                className="bg-[#09090B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#9D26FF] transition-all"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAddCarouselSlide}
                className="px-6 py-2.5 rounded-xl bg-[#9D26FF] hover:bg-[#8A1AD6] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <FaPlus /> Tambah Slide
              </button>
            </div>
          </div>

          {/* List of Carousel Slides */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Daftar Slide Carousel ({carouselSlides.length})
            </h3>
            {carouselSlides.length === 0 ? (
              <div className="p-8 text-center bg-[#13121D] rounded-2xl border border-dashed border-[#272438] text-zinc-500 text-xs">
                Belum ada slide carousel. Tambahkan slide di atas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {carouselSlides.map((slide, idx) => (
                  <div 
                    key={slide.id || idx}
                    className="p-3.5 rounded-xl bg-[#13121D] border border-[#272438] hover:border-[#9D26FF]/50 transition-all space-y-2.5 group relative"
                  >
                    <div className="h-32 rounded-lg bg-[#09090B] overflow-hidden border border-white/10 relative">
                      <img 
                        src={slide.image_url} 
                        alt={slide.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = '/noize-logo.png'
                          e.target.className = "w-full h-full object-contain p-4 opacity-50"
                        }}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-black/70 text-[#9D26FF] border border-[#9D26FF]/30">
                        Slide #{idx + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate">{slide.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{slide.caption}</p>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={() => handleDeleteCarouselSlide(slide.id)}
                        className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <FaTrash size={10} /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaTab
