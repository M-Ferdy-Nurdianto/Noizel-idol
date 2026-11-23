import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaYoutube, FaPlay, FaExternalLinkAlt, FaTimes } from 'react-icons/fa'

const DEFAULT_VIDEOS = [
  {
    id: 'yt-1',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'NOIZE - Stage Debut Showcase & Intro Video',
    video_id: 'dQw4w9WgXcQ',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
  },
  {
    id: 'yt-2',
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    title: 'NOIZE - Distortion of Harmony Official Teaser',
    video_id: 'kJQP7kiw5Fk',
    thumbnail_url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg'
  }
]

const YouTubeSection = ({ videos = [], customText = {} }) => {
  const displayVideos = (videos && videos.length > 0) ? videos : DEFAULT_VIDEOS
  const [activeVideoModal, setActiveVideoModal] = useState(null)

  return (
    <section className="py-14 sm:py-20 container mx-auto max-w-5xl px-4 relative z-20 border-t border-[#272438]">
      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-12">
        {customText.youtube_badge && (
          <p className="text-xs font-semibold text-[#FF0000] mb-2 uppercase">
            {customText.youtube_badge}
          </p>
        )}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
          {(() => {
            const title = customText.youtube_title || 'OFFICIAL VIDEOS'
            const parts = title.trim().split(' ')
            if (parts.length > 1) {
              const last = parts.pop()
              return <>{parts.join(' ')} <span className="text-[#FF0000]">{last}</span></>
            }
            return title
          })()}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-lg mx-auto">
          {customText.youtube_subtitle || 'Tonton dokumentasi panggung, visualizer single, dan video musik resmi NOIZE.'}
        </p>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayVideos.map((video, idx) => (
          <motion.div
            key={video.id || idx}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#13121D] rounded-2xl border border-[#272438] hover:border-[#FF0000] transition-all overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
          >
            <div>
              {/* Thumbnail with Play Trigger */}
              <div 
                onClick={() => setActiveVideoModal(video)}
                className="relative aspect-video w-full bg-[#09090B] overflow-hidden cursor-pointer"
              >
                <img 
                  src={video.thumbnail_url} 
                  alt={video.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="w-14 h-14 rounded-full bg-[#FF0000] text-white flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-2xl pl-1">
                    <FaPlay size={18} />
                  </span>
                </div>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-white border border-white/10">
                  HD
                </span>
              </div>

              {/* Info */}
              <div className="p-4 sm:p-5">
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#FF0000] transition-colors line-clamp-2 mb-1">
                  {video.title}
                </h3>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                  YouTube ID: {video.video_id}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-[#272438] flex items-center justify-between">
              <button
                onClick={() => setActiveVideoModal(video)}
                className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <FaPlay size={10} className="text-[#FF0000]" />
                <span>Putar Video</span>
              </button>
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF0000]/10 hover:bg-[#FF0000]/20 border border-[#FF0000]/30 text-[#FF0000] text-xs font-bold transition-all"
              >
                <span>Buka di YouTube</span>
                <FaExternalLinkAlt size={9} />
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Video Modal Player */}
      <AnimatePresence>
        {activeVideoModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#13121D] border border-[#272438] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 bg-[#09090B] border-b border-[#272438] flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-md">
                  {activeVideoModal.title}
                </span>
                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.video_id}?autoplay=1`}
                  title={activeVideoModal.title}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default YouTubeSection
