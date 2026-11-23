import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaMusic, FaPlay, FaExternalLinkAlt, FaCompactDisc } from 'react-icons/fa'

const DEFAULT_TRACKS = [
  {
    id: 'sp-1',
    url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    title: 'Distortion of Harmony',
    artist: 'NOIZE',
    cover_url: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02baf89eb11ec7c657805d2da0',
    embed_url: 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT'
  },
  {
    id: 'sp-2',
    url: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3',
    title: 'Cyber Frequency (Stage Debut Mix)',
    artist: 'NOIZE',
    cover_url: '/noize-logo.png',
    embed_url: 'https://open.spotify.com/embed/track/7qiZfU4dY1lWllzX7mPBI3'
  },
  {
    id: 'sp-3',
    url: 'https://open.spotify.com/track/0VjIjW4GlULA7GV4y9a4yU',
    title: 'Future Soul Collector',
    artist: 'NOIZE',
    cover_url: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e028b52c6b9bc4e43d873869699',
    embed_url: 'https://open.spotify.com/embed/track/0VjIjW4GlULA7GV4y9a4yU'
  }
]

const SpotifySection = ({ tracks = [], customText = {} }) => {
  const displayTracks = (tracks && tracks.length > 0) ? tracks : DEFAULT_TRACKS
  const [activeEmbedTrackId, setActiveEmbedTrackId] = useState(null)

  return (
    <section className="py-14 sm:py-20 container mx-auto max-w-5xl px-4 relative z-20 border-t border-[#272438]">
      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-12">
        {customText.spotify_badge && (
          <p className="text-xs font-semibold text-[#1DB954] mb-2 uppercase">
            {customText.spotify_badge}
          </p>
        )}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
          {(() => {
            const title = customText.spotify_title || 'NOIZE TRACKS'
            const parts = title.trim().split(' ')
            if (parts.length > 1) {
              const last = parts.pop()
              return <>{parts.join(' ')} <span className="text-[#1DB954]">{last}</span></>
            }
            return title
          })()}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-lg mx-auto">
          {customText.spotify_subtitle || 'Dengarkan karya audio orisinal, single panggung, dan aransemen resmi NOIZE di Spotify.'}
        </p>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {displayTracks.map((track, idx) => {
          const isPlayingEmbed = activeEmbedTrackId === track.id
          return (
            <motion.div
              key={track.id || idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="bg-[#13121D] rounded-2xl border border-[#272438] hover:border-[#1DB954] transition-all p-4 flex flex-col justify-between group shadow-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
            >
              <div>
                {/* Cover Art Box with Play overlay */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#09090B] border border-white/10 mb-3.5 group/cover">
                  {track.cover_url ? (
                    <img 
                      src={track.cover_url} 
                      alt={track.title} 
                      onError={(e) => { e.currentTarget.src = '/noize-logo.png' }}
                      className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#1DB954] bg-[#1E1C2E]">
                      <FaCompactDisc size={48} className="animate-spin-slow opacity-60" />
                    </div>
                  )}

                  {/* Play Button Trigger */}
                  <button
                    onClick={() => setActiveEmbedTrackId(isPlayingEmbed ? null : track.id)}
                    className="absolute inset-0 bg-black/40 group-hover/cover:bg-black/20 flex items-center justify-center transition-colors"
                    title={isPlayingEmbed ? 'Tutup Player' : 'Putar Player Spotify'}
                  >
                    <span className="w-12 h-12 rounded-full bg-[#1DB954] text-black flex items-center justify-center transform group-hover/cover:scale-110 transition-transform shadow-lg pl-0.5">
                      <FaPlay size={14} />
                    </span>
                  </button>
                </div>

                {/* Info */}
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#1DB954] transition-colors truncate mb-0.5">
                  {track.title}
                </h3>
                <p className="text-xs text-zinc-400 font-mono font-medium truncate">
                  {track.artist || 'NOIZE'}
                </p>

                {/* Spotify Embed Player (Optional Inline View) */}
                {isPlayingEmbed && track.embed_url && (
                  <div className="mt-3 rounded-xl overflow-hidden shadow-inner">
                    <iframe
                      src={track.embed_url}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-xl"
                      title={track.title}
                    ></iframe>
                  </div>
                )}
              </div>

              {/* Action Button: Open in Spotify */}
              <div className="pt-3 mt-3 border-t border-[#272438] flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  OFFICIAL SINGLE
                </span>
                <a
                  href={track.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/30 text-[#1DB954] text-xs font-bold transition-all"
                >
                  <span>Open Spotify</span>
                  <FaExternalLinkAlt size={9} />
                </a>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default SpotifySection
