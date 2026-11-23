import { motion } from 'framer-motion'
import { FaInstagram } from 'react-icons/fa'
import { formatInstagramUrl, formatInstagramDisplay } from '../../lib/instagramUtils'
import { getAssetPath } from '../../lib/pathUtils'

const MemberKtpCard = ({ member, index = 0 }) => {
  const memberName = member.nama_panggung || member.name || 'MEMBER'
  const memberTagline = member.tagline || 'NOIZE RESIDENT IDOL'
  const birthDate = member.tanggal_lahir || '-'
  const hobbies = member.hobi || '-'
  const instagram = member.instagram || ''
  const igUrl = formatInstagramUrl(instagram)
  const igDisplay = formatInstagramDisplay(instagram)
  const bio = member.jikoshoukai || ''
  const photo = member.image_url || getAssetPath('/noize-logo.png')

  // Nomor urut member: 01, 02, 03, dst
  const displayNumber = String(index + 1).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="w-full bg-[#13121D] rounded-2xl sm:rounded-3xl border border-[#272438] hover:border-[#9D26FF]/60 transition-all duration-300 p-5 sm:p-6 shadow-lg group overflow-hidden"
    >
      {/* ── CARD HEADER (NOMOR & TAGLINE) ── */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#272438]">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#1E1C2E] border border-white/10 flex items-center justify-center font-mono font-black text-sm text-[#9D26FF]">
            {displayNumber}
          </span>
          <div>
            <span className="text-xs font-black tracking-wider uppercase text-white block">
              NOIZE IDOL
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">
              BIODATA MEMBER
            </span>
          </div>
        </div>

        {memberTagline && (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#9D26FF]/15 text-[#9D26FF] border border-[#9D26FF]/30">
            {memberTagline}
          </span>
        )}
      </div>

      {/* ── CARD BODY (FOTO DI KIRI, DATA DI KANAN) ── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Foto Idol */}
        <div className="relative w-36 h-48 sm:w-40 sm:h-52 rounded-xl overflow-hidden bg-[#09090B] border border-[#272438] shrink-0 shadow-md">
          <img 
            src={photo} 
            alt={memberName} 
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = getAssetPath('/noize-logo.png')
              e.target.className = "w-full h-full object-contain p-6 opacity-60"
            }}
          />
        </div>

        {/* Biodata Member */}
        <div className="flex-1 min-w-0 space-y-3 text-left w-full">
          {/* Baris Nama & Instagram di Samping Kanan (Agak Jauh) */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                NAMA PANGGUNG
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-[#9D26FF] transition-colors leading-tight truncate">
                {memberName}
              </h3>
            </div>

            {/* Instagram Pill di Kanan Sejajar */}
            {igUrl && (
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 text-xs font-bold transition-all shrink-0 hover:scale-105 active:scale-95 shadow-sm mt-1"
              >
                <FaInstagram size={14} />
                <span>{igDisplay}</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#272438]/60 text-xs">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase block">Tanggal Lahir</span>
              <span className="font-bold text-zinc-200 block">{birthDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase block">Peran / Role</span>
              <span className="font-bold text-zinc-200 block">Idol, Singer</span>
            </div>
          </div>

          <div className="pt-1 text-xs">
            <span className="text-[10px] font-mono text-zinc-400 uppercase block">Hobi</span>
            <span className="font-medium text-zinc-300 block">{hobbies}</span>
          </div>

          {bio && (
            <div className="pt-1 text-xs">
              <span className="text-[10px] font-mono text-zinc-400 uppercase block">Jikoshoukai / Catchphrase</span>
              <p className="text-xs text-zinc-300 italic leading-relaxed">
                "{bio}"
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MemberKtpCard
