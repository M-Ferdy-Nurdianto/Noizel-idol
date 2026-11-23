import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaMapMarkerAlt, FaClock, FaArrowRight, FaCalendarAlt, FaTimes, FaCamera, FaStar } from 'react-icons/fa'
import { getAssetPath } from '../../lib/pathUtils'
import { formatMemberName } from '../../lib/memberUtils'

const DEFAULT_NEWS = [
  {
    id: 1,
    category: 'LIVE',
    categoryColor: '#24C6F5',
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
    categoryColor: '#9D26FF',
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
    categoryColor: '#FF1CE3',
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
    categoryColor: '#F59E0B',
    date: '2026.11.10',
    title: 'Panduan Sesi Interaksi, Cheki & Tata Tertib Stage',
    summary: 'Informasi lengkap mengenai alur antrean 2-Shot, aturan pose foto, dan kenyamanan fans selama acara.',
    content: 'Demi kenyamanan bersama saat live stage dan sesi Cheki, mohon perhatikan aturan interaksi: dilarang kontak fisik berlebihan, durasi per sesi mengikuti nomor antrean tiket, dan dilarang merekam selama sesi Cheki berlangsung.',
    image: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269698071_image_processing20260824_4011149_1iezoq8_png.webp',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  }
]

const ScheduleSection = ({ loading = false, events = [], navigate }) => {
  const [selectedNews, setSelectedNews] = useState(null)

  const currentYear = new Date().getFullYear()
  const monthMap = { 
    'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 
    'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingList = (events || [])
    .filter(e => {
      if (e.is_past) return false
      const mIdx = monthMap[e.bulan] !== undefined ? monthMap[e.bulan] : 0
      const eventDate = new Date(e.tahun || currentYear, mIdx, e.tanggal || 1)
      return eventDate >= today
    })
    .sort((a, b) => {
      const mA = monthMap[a.bulan] !== undefined ? monthMap[a.bulan] : 0
      const mB = monthMap[b.bulan] !== undefined ? monthMap[b.bulan] : 0
      const dateA = new Date(a.tahun || currentYear, mA, a.tanggal || 1)
      const dateB = new Date(b.tahun || currentYear, mB, b.tanggal || 1)
      return dateA - dateB
    })
    .slice(0, 3)

  return (
    <section className="py-16 md:py-24 bg-pattern-lines-a text-white relative overflow-hidden border-t border-[#272438]">
      <div className="container mx-auto max-w-7xl px-4 relative z-10">

        {/* 1. LATEST NEWS SECTION (4 Kotak 1x4) */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                LATEST <span className="text-[#9D26FF]">NEWS</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-lg">
                Informasi resmi, rilisan karya musik, dan kabar terbaru seputar NOIZE.
              </p>
            </div>

            <button 
              onClick={() => setSelectedNews(DEFAULT_NEWS[0])}
              className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#272438] hover:border-[#9D26FF] bg-[#13121D] transition-all"
            >
              <span>Semua Berita</span>
              <FaArrowRight size={10} />
            </button>
          </div>

          {/* 4 Kotak Berjejer 1x4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {DEFAULT_NEWS.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => setSelectedNews(item)}
                className="group bg-[#13121D] rounded-2xl border border-[#272438] hover:border-[#9D26FF] transition-all duration-300 overflow-hidden flex flex-col cursor-pointer shadow-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
              >
                {/* Thumbnail Image */}
                <div className="relative h-44 w-full overflow-hidden bg-[#09090B] shrink-0">
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
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  
                  {/* Category Badge */}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${item.badgeBg}`}>
                    {item.category}
                  </span>
                </div>

                {/* Card Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                      {item.date}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#9D26FF] transition-colors leading-snug line-clamp-2 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-normal">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#272438]/60 flex items-center justify-between text-xs font-bold text-zinc-400 group-hover:text-[#9D26FF] transition-colors">
                    <span>Baca Detail</span>
                    <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 2. UPCOMING EVENTS (Desain Simple & Rapi) */}
        <div className="mt-14 sm:mt-18 pt-10 border-t border-[#272438]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-3">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                UPCOMING <span className="text-[#9D26FF]">EVENTS</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Jadwal penampilan live dan panggung NOIZE berikutnya.
              </p>
            </div>

            <button 
              onClick={() => navigate('/schedule')}
              className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-xl border border-[#272438] hover:border-[#9D26FF] bg-[#13121D] transition-all"
            >
              <span>Lihat Kalender Lengkap</span>
              <FaArrowRight size={10} />
            </button>
          </div>

          {upcomingList.length > 0 ? (
            <div className="flex flex-col gap-3 sm:gap-3.5">
              {upcomingList.map((event) => {
                const isSpecial = Boolean(event.is_special || event.type === 'special' || event.theme_name)
                const themeColor = event.theme_color || '#9D26FF'
                const isCurrentYear = !event.tahun || event.tahun === currentYear
                const hasInfo = Boolean(
                  (event.lokasi && event.lokasi.trim()) || 
                  (event.event_time && event.event_time.trim()) || 
                  (event.cheki_time && event.cheki_time.trim())
                )

                const lineupList = (event.event_lineup || [])
                  .map(el => {
                    const m = el.members || el
                    return {
                      id: m.id || el.member_id,
                      name: formatMemberName(m.nama_panggung || m.name || ''),
                      image: m.image_url || null,
                      color: m.color || '#9D26FF'
                    }
                  })
                  .filter(m => m.name)

                return (
                  <div 
                    key={event.id}
                    onClick={() => navigate('/schedule')}
                    className={`group relative p-3.5 sm:p-4 rounded-2xl bg-[#13121D] border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-5 shadow-sm hover:-translate-y-0.5 ${
                      isSpecial 
                        ? 'border-opacity-60 hover:shadow-lg' 
                        : 'border-[#272438] hover:border-[#9D26FF]/60 hover:shadow-[0_8px_25px_rgba(157,38,255,0.12)]'
                    }`}
                    style={isSpecial ? {
                      borderColor: `${themeColor}60`,
                      boxShadow: `0 4px 20px -2px ${themeColor}15`
                    } : {}}
                    onMouseEnter={(e) => {
                      if (isSpecial) {
                        e.currentTarget.style.borderColor = themeColor
                        e.currentTarget.style.boxShadow = `0 8px 30px -4px ${themeColor}35`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isSpecial) {
                        e.currentTarget.style.borderColor = `${themeColor}60`
                        e.currentTarget.style.boxShadow = `0 4px 20px -2px ${themeColor}15`
                      }
                    }}
                  >
                    {/* 1. Kiri: Blok Tanggal */}
                    <div 
                      className="w-12 sm:w-16 h-12 sm:h-16 min-w-[48px] sm:min-w-[64px] rounded-xl border flex flex-col items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: isSpecial ? `${themeColor}15` : '#181625',
                        borderColor: isSpecial ? `${themeColor}40` : '#272438'
                      }}
                    >
                      <span className="text-lg sm:text-2xl font-black text-white leading-none font-mono">
                        {event.tanggal}
                      </span>
                      <span 
                        className="text-[9px] sm:text-[11px] font-extrabold uppercase mt-1 leading-none tracking-wider font-mono"
                        style={{ color: isSpecial ? themeColor : '#9D26FF' }}
                      >
                        {String(event.bulan || '').slice(0, 3)}
                      </span>
                      {!isCurrentYear && (
                        <span className="text-[8px] sm:text-[9px] font-bold text-zinc-500 mt-0.5 leading-none font-mono">
                          {event.tahun}
                        </span>
                      )}
                    </div>

                    {/* 2. Tengah: Info, Meta, dan Lineup */}
                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6">
                      {/* Sub-kiri: Nama & Meta Info */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <h4 className="font-bold text-sm sm:text-base md:text-lg text-white group-hover:text-white transition-colors truncate">
                            {event.nama}
                          </h4>
                          {isSpecial && (
                            <span 
                              className="px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider font-mono shrink-0"
                              style={{ 
                                backgroundColor: `${themeColor}15`,
                                borderColor: `${themeColor}40`,
                                color: themeColor,
                                border: `1px solid ${themeColor}40`
                              }}
                            >
                              {event.theme_name || 'Spesial'}
                            </span>
                          )}
                        </div>

                        {hasInfo && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                            {event.lokasi && (
                              <span className="flex items-center gap-1.5 min-w-0">
                                <FaMapMarkerAlt size={10} className="text-zinc-500 shrink-0" />
                                <span className="truncate">{event.lokasi}</span>
                              </span>
                            )}
                            {event.event_time && (
                              <span className="flex items-center gap-1.5 shrink-0">
                                <FaClock size={10} className="text-zinc-500 shrink-0" />
                                <span>{event.event_time}</span>
                              </span>
                            )}
                            {event.cheki_time && (
                              <span className="flex items-center gap-1.5 shrink-0">
                                <FaCamera size={10} className="text-[#9D26FF] shrink-0" />
                                <span className="text-zinc-300 font-medium">Cheki: {event.cheki_time}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Sub-kanan: Lineup Member */}
                      {lineupList.length > 0 && (
                        <div className="flex items-center gap-2.5 shrink-0 pt-1.5 md:pt-0 border-t border-white/5 md:border-t-0">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:inline">
                            LINEUP:
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {lineupList.map(member => (
                              <div 
                                key={member.id}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-white/20 bg-[#181625] shrink-0 shadow-sm"
                                title={member.name}
                              >
                                {member.image ? (
                                  <img 
                                    src={getAssetPath(member.image)} 
                                    alt={member.name}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      const fallback = e.target.nextElementSibling
                                      if (fallback) fallback.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="w-full h-full items-center justify-center text-[8px] sm:text-[9px] font-black text-white shrink-0"
                                  style={{ 
                                    backgroundColor: member.color || '#9D26FF',
                                    display: member.image ? 'none' : 'flex' 
                                  }}
                                >
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-zinc-300 font-medium truncate max-w-[180px] sm:max-w-xs">
                            {lineupList.map(m => m.name).join(' · ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 3. Kanan: Tombol Aksi */}
                    <div 
                      className="px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-[#9D26FF] group-hover:bg-[#9D26FF] text-xs font-bold text-zinc-300 group-hover:text-white transition-all shrink-0 flex items-center gap-2"
                    >
                      <span className="hidden sm:inline">Jadwal</span>
                      <FaArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-[#13121D] border border-[#272438] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1E1C2E] flex items-center justify-center text-[#9D26FF] shrink-0">
                  <FaCalendarAlt size={15} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Belum Ada Jadwal Event Mendatang</p>
                  <p className="text-[11px] text-zinc-400">Jadwal panggung berikutnya akan diumumkan melalui News & Media sosial.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/schedule')}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all shrink-0"
              >
                Lihat Riwayat Jadwal
              </button>
            </div>
          )}
        </div>

      </div>

      {/* News Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#13121D] border border-[#272438] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header Image */}
              <div className="relative h-48 w-full bg-[#09090B]">
                <img 
                  src={selectedNews.image} 
                  alt={selectedNews.title} 
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getAssetPath('/noize-logo.png')
                    e.target.className = "w-full h-full object-contain p-8 opacity-60"
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

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-3">
                <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest block">
                  {selectedNews.date}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
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

export default ScheduleSection
