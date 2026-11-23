import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowRight, FaTimes } from 'react-icons/fa'
import { getAssetPath } from '../../lib/pathUtils'

const DEFAULT_NEWS = [
  {
    id: 1,
    category: 'LIVE',
    date: '2026.11.21',
    title: 'NOIZE Stage Debut: First Frequency Showcase 2026',
    summary: 'Penampilan panggung perdana NOIZE menghadirkan full lineup member dan setlist orisinal.',
    content: 'Kami dengan bangga mengumumkan debut penampilan live resmi NOIZE! Menampilkan seluruh member dengan kostum panggung khas dan aransemen musik bertenaga tinggi. Tiket panggung dan sesi Cheki tersedia untuk umum.',
    image: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269664212_image_processing20260824_4000925_1cs3o3m_png.webp',
    badgeBg: 'bg-[#24C6F5]/10 text-[#24C6F5] border-[#24C6F5]/30'
  },
  {
    id: 2,
    category: 'RELEASE',
    date: '2026.11.18',
    title: 'Debut Single "Distortion of Harmony" Segera Dirilis',
    summary: 'Eksplorasi musikalitas elektronik berenergi tinggi dengan vokal khas 4 member NOIZE.',
    content: 'Single perdana bertajuk "Distortion of Harmony" akan segera hadir di seluruh platform streaming digital (Spotify, Apple Music, YouTube Music). Nantikan premiere official visualizer di channel YouTube NOIZE.',
    image: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269425434_image_processing20260824_4008041_bjfgi1_png.webp',
    badgeBg: 'bg-[#9D26FF]/10 text-[#9D26FF] border-[#9D26FF]/30'
  },
  {
    id: 3,
    category: 'GOODS',
    date: '2026.11.15',
    title: 'Official Cheki & Merchandise Eksklusif Vol. 1',
    summary: 'Koleksi 2-Shot Cheki individual member dan Group Cheki edisi terbatas dapat dipesan melalui Shop resmi.',
    content: 'Katalog merchandise resmi pertama NOIZE kini telah dibuka! Dapatkan polaroid 2-shot bertandatangan member serta tiket Cheki pre-order sebelum slot kuota per sesi terpenuhi.',
    image: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269529780_image_processing20260824_4009109_122is0d_png.webp',
    badgeBg: 'bg-[#FF1CE3]/10 text-[#FF1CE3] border-[#FF1CE3]/30'
  },
  {
    id: 4,
    category: 'NOTICE',
    date: '2026.11.10',
    title: 'Panduan Sesi Interaksi, Cheki & Tata Tertib Stage',
    summary: 'Informasi lengkap mengenai alur antrean 2-Shot, aturan pose foto, dan kenyamanan fans selama acara.',
    content: 'Demi kenyamanan bersama saat live stage dan sesi Cheki, mohon perhatikan aturan interaksi: dilarang kontak fisik berlebihan, durasi per sesi mengikuti nomor antrean tiket, dan dilarang merekam selama sesi Cheki berlangsung.',
    image: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269698071_image_processing20260824_4011149_1iezoq8_png.webp',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  }
]

const StoryNewsSection = ({ customText = {} }) => {
  const [selectedNews, setSelectedNews] = useState(null)

  return (
    <section className="py-14 sm:py-20 container mx-auto max-w-5xl px-4 relative z-20 border-t border-[#272438]">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-12">
        {customText.news_badge && (
          <p className="text-xs font-semibold text-[#9D26FF] mb-2 uppercase">
            {customText.news_badge}
          </p>
        )}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
          {(() => {
            const title = customText.news_title || 'NOIZE NEWS'
            const parts = title.trim().split(' ')
            if (parts.length > 1) {
              const last = parts.pop()
              return <>{parts.join(' ')} <span className="text-[#9D26FF]">{last}</span></>
            }
            return title
          })()}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-lg mx-auto">
          {customText.news_subtitle || 'Kabar dan pengumuman resmi mengenai aktivitas, jadwal, dan rilisan NOIZE.'}
        </p>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {DEFAULT_NEWS.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
            onClick={() => setSelectedNews(item)}
            className="group bg-[#13121D] rounded-2xl border border-[#272438] hover:border-[#9D26FF] transition-all overflow-hidden flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
          >
            <div>
              <div className="relative h-40 w-full overflow-hidden bg-[#09090B]">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getAssetPath('/noize-logo.png')
                    e.target.className = "w-full h-full object-contain p-6 opacity-60"
                  }}
                />
                <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border backdrop-blur-md ${item.badgeBg}`}>
                  {item.category}
                </span>
              </div>
              <div className="p-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                  {item.date}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#9D26FF] transition-colors leading-snug line-clamp-2 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>

            <div className="px-4 pb-4 pt-2 border-t border-[#272438]/60 flex items-center justify-between text-xs font-bold text-zinc-400 group-hover:text-[#9D26FF] transition-colors">
              <span className="text-[11px]">Baca Berita</span>
              <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* News Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#13121D] border border-[#272438] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="relative h-44 w-full bg-[#09090B]">
                <img 
                  src={selectedNews.image} 
                  alt={selectedNews.title} 
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getAssetPath('/noize-logo.png')
                  }}
                />
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all border border-white/10"
                >
                  <FaTimes size={13} />
                </button>
                <span className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${selectedNews.badgeBg}`}>
                  {selectedNews.category}
                </span>
              </div>
              <div className="p-5 sm:p-6 space-y-3">
                <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest block">
                  {selectedNews.date}
                </span>
                <h3 className="text-lg font-black text-white leading-snug">
                  {selectedNews.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                  {selectedNews.content}
                </p>
                <div className="pt-4 border-t border-[#272438] flex justify-end">
                  <button 
                    onClick={() => setSelectedNews(null)}
                    className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default StoryNewsSection
