import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AboutCarousel from '../components/about/AboutCarousel'
import MemberKtpCard from '../components/about/MemberKtpCard'
import SpotifySection from '../components/about/SpotifySection'
import YouTubeSection from '../components/about/YouTubeSection'
import StoryNewsSection from '../components/about/StoryNewsSection'
import ManagerContactSection from '../components/about/ManagerContactSection'
import JoinTheNoizeBanner from '../components/about/JoinTheNoizeBanner'
import api from '../lib/api'

// Fallback members if network/API fails (Urut dari Gen 1)
const DEFAULT_MEMBERS = [
  {
    member_id: 'iu',
    nama_panggung: 'Iu',
    tagline: '1st Generation',
    tanggal_lahir: '23 Juli',
    hobi: 'Modelling & Watching Korean dramas',
    instagram: '@ttreshy',
    jikoshoukai: 'Visual & Center of NOIZE (1st Generation).',
    image_url: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269664212_image_processing20260824_4000925_1cs3o3m_png.webp'
  },
  {
    member_id: 'shin',
    nama_panggung: 'Shin',
    tagline: '3rd Generation',
    tanggal_lahir: '14 September',
    hobi: 'Singing, Dancing, Drawing, Editing',
    instagram: '@ss.shin_',
    jikoshoukai: '3rd Generation of NOIZE. Singing, Dancing, Drawing, Editing.',
    image_url: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269529780_image_processing20260824_4009109_122is0d_png.webp'
  },
  {
    member_id: 'chivy',
    nama_panggung: 'Chivy',
    tagline: '4th Generation',
    tanggal_lahir: '25 Januari',
    hobi: 'Listening music, Wotagei, Watching Concert',
    instagram: '@catieffy',
    jikoshoukai: 'Lead Vocal of NOIZE (4th Generation).',
    image_url: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269698071_image_processing20260824_4011149_1iezoq8_png.webp'
  },
  {
    member_id: 'yuna',
    nama_panggung: 'Yuna',
    tagline: '5th Generation',
    tanggal_lahir: '9 Februari',
    hobi: 'Gaming',
    instagram: '@fyuninaa09',
    jikoshoukai: '"Dancing In The Moonlight" Hallo kims!! it\'s Yuna or Nina!!',
    image_url: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269425434_image_processing20260824_4008041_bjfgi1_png.webp'
  }
]

const DEFAULT_STORY_TEXT = {
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
  youtube_badge: 'YOUTUBE SHOWCASE',
  youtube_title: 'OFFICIAL VIDEOS',
  youtube_subtitle: 'Saksikan video musik resmi, dokumentasi panggung, dan konten visual terbaru NOIZE.',
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
}

const StoryPage = () => {
  const [members, setMembers] = useState(DEFAULT_MEMBERS)
  const [spotifyTracks, setSpotifyTracks] = useState([])
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [carouselSlides, setCarouselSlides] = useState([])
  const [storyText, setStoryText] = useState(DEFAULT_STORY_TEXT)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [membersRes, configRes] = await Promise.allSettled([
        api.get(`/members?t=${Date.now()}`),
        api.get(`/config?t=${Date.now()}`)
      ])

      if (membersRes.status === 'fulfilled' && membersRes.value.data.success) {
        const dbMembers = (membersRes.value.data.data || [])
          .filter(m => m.member_id !== 'group' && m.hadir !== false)
          .sort((a, b) => {
            const genA = parseInt((a.tagline || '').match(/\d+/)?.[0] || '999', 10)
            const genB = parseInt((b.tagline || '').match(/\d+/)?.[0] || '999', 10)
            if (genA !== genB) return genA - genB
            return (a.order_index ?? 0) - (b.order_index ?? 0)
          })
        if (dbMembers.length > 0) {
          setMembers(dbMembers)
        }
      }

      if (configRes.status === 'fulfilled' && configRes.value.data.success) {
        const cfg = configRes.value.data.data || {}
        if (cfg.spotify_tracks) {
          try {
            const parsed = typeof cfg.spotify_tracks === 'string' ? JSON.parse(cfg.spotify_tracks) : cfg.spotify_tracks
            if (Array.isArray(parsed) && parsed.length > 0) setSpotifyTracks(parsed)
          } catch (_) {}
        }
        if (cfg.youtube_videos) {
          try {
            const parsed = typeof cfg.youtube_videos === 'string' ? JSON.parse(cfg.youtube_videos) : cfg.youtube_videos
            if (Array.isArray(parsed) && parsed.length > 0) setYoutubeVideos(parsed)
          } catch (_) {}
        }
        if (cfg.about_carousel) {
          try {
            const parsed = typeof cfg.about_carousel === 'string' ? JSON.parse(cfg.about_carousel) : cfg.about_carousel
            if (Array.isArray(parsed) && parsed.length > 0) setCarouselSlides(parsed)
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
      }
    } catch (err) {
      console.warn('Error loading story page data:', err)
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-white overflow-x-hidden relative selection:bg-[#9D26FF] selection:text-white">
      <Header />

      {/* ── 1. TOP CENTER HEADER & 3D CAROUSEL & DESKRIPSI PANJANG ── */}
      <section className="pt-32 pb-16 md:pb-24 container mx-auto max-w-5xl px-4 relative z-10 text-center">
        
        {/* Top Center Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase leading-tight">
            {(() => {
              const title = storyText.header_title || 'ABOUT NOIZE'
              const parts = title.trim().split(' ')
              if (parts.length > 1) {
                const last = parts.pop()
                return <>{parts.join(' ')} <span className="text-[#9D26FF]">{last}</span></>
              }
              return title
            })()}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-zinc-400 max-w-lg mx-auto tracking-widest uppercase mt-2">
            {storyText.header_subtitle || 'OFFICIAL MUSIC PROJECT & STAGE PERFORMANCE'}
          </p>
        </motion.div>

        {/* 3D Coverflow Carousel (16:9 Landscape) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <AboutCarousel slides={carouselSlides} />
        </motion.div>

        {/* Deskripsi Panjang (Rata Tengah / Align Center) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="max-w-3xl mx-auto space-y-5 text-zinc-300 text-sm sm:text-base md:text-lg leading-relaxed font-normal text-center"
        >
          {storyText.p1 && <p>{storyText.p1}</p>}
          {storyText.p2 && <p>{storyText.p2}</p>}
          {storyText.p3 && <p>{storyText.p3}</p>}
        </motion.div>
      </section>

      {/* ── 2. MEMBER PROFILES (KTP IDOL CYBER CARDS - ALIGN CENTER - NO MODAL) ── */}
      <section className="py-14 sm:py-20 container mx-auto max-w-5xl px-4 relative z-20 border-t border-[#272438]">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            {(() => {
              const title = storyText.members_title || 'MEMBER PROFILES'
              const parts = title.trim().split(' ')
              if (parts.length > 1) {
                const last = parts.pop()
                return <>{parts.join(' ')} <span className="text-[#9D26FF]">{last}</span></>
              }
              return title
            })()}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-lg mx-auto">
            {storyText.members_subtitle || 'Kartu identitas resmi seluruh idol NOIZE. Seluruh data biodata langsung tertera di kartu identitas resmi.'}
          </p>
        </div>

        {/* 1x1 Single-Column Layout of Member Identity Cards */}
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
          {members.map((member, idx) => (
            <MemberKtpCard key={member.id || member.member_id || idx} member={member} index={idx} />
          ))}
        </div>
      </section>

      {/* ── 3. LAGU-LAGU NOIZE (SPOTIFY SHOWCASE) ── */}
      <SpotifySection tracks={spotifyTracks} customText={storyText} />

      {/* ── 4. VIDEO RESMI NOIZE (YOUTUBE SHOWCASE) ── */}
      <YouTubeSection videos={youtubeVideos} customText={storyText} />

      {/* ── 5. NEWS SECTION ── */}
      <StoryNewsSection customText={storyText} />

      {/* ── 6. CONTACT PERSON MANAGER / BOOKING INQUIRY ── */}
      <ManagerContactSection customText={storyText} />

      {/* ── 7. BANNER JOIN THE NOIZE (MATCHING LAMPIRAN USER) ── */}
      <JoinTheNoizeBanner customText={storyText} />

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default StoryPage
