import React from 'react'
import { motion } from 'framer-motion'
import { FaPlus, FaLock } from 'react-icons/fa'
import { getMemberColor, formatMemberName } from '../../lib/memberUtils'
import { useFlyToCart } from '../../context/FlyToCartContext'

const MemberCard = ({
  member,
  idx = 0,
  addToCart,
  getMemberImage,
  hargaMember = 25000,
  inLineup = true
}) => {
  const accentColor = member?.color || getMemberColor(member?.nama_panggung) || '#9D26FF'
  const { triggerFly } = useFlyToCart()

  const handleClick = (e) => {
    if (!inLineup) return
    const rect = e.currentTarget.getBoundingClientRect()
    const startPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
    addToCart('member', member, startPos)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.05, 0.3) }}
      whileHover={inLineup ? { y: -4 } : {}}
      onClick={handleClick}
      className={`group relative aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 ${
        inLineup
          ? 'cursor-pointer hover:border-[#9D26FF]/60 hover:shadow-[0_10px_25px_rgba(157,38,255,0.25)]'
          : 'cursor-not-allowed opacity-50'
      }`}
      style={{
        backgroundColor: '#13121D',
        border: `1px solid ${inLineup ? accentColor + '35' : '#272438'}`
      }}
    >
      {/* Photo */}
      <div className={`absolute inset-0 ${!inLineup ? 'grayscale' : ''}`}>
        <img
          src={getMemberImage(member)}
          alt={member.nama_panggung}
          className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Soft bottom gradient overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 40%, rgba(13, 8, 20, 0.85) 80%, #0D0814 100%)`
          }}
        />
      </div>

      {/* Info section at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 space-y-1">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: inLineup ? accentColor : '#64748b' }}
          />
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-[#F8FAFC] truncate">
            {member.is_secret ? 'Secret Member' : formatMemberName(member.nama_panggung)}
          </h4>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs sm:text-sm font-bold text-[#F8FAFC] font-mono">
            IDR {Number(hargaMember).toLocaleString('id-ID')}
          </span>

          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
              inLineup
                ? 'bg-[#1E1C2E] border border-[#272438] text-white group-hover:bg-[#9D26FF] group-hover:border-[#9D26FF] shadow-sm'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {inLineup ? <FaPlus className="text-[10px]" /> : <FaLock className="text-[10px]" />}
          </div>
        </div>
      </div>

      {/* Lineup Indicator Overlay */}
      {!inLineup && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40">
          <span className="text-[10px] font-bold text-zinc-400 bg-black/70 px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
            Tidak Tampil
          </span>
        </div>
      )}
    </motion.div>
  )
}

export default MemberCard
