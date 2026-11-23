import { motion } from 'framer-motion'
import { getAssetPath } from '../../lib/pathUtils'
import { Link } from 'react-router-dom'
import { FaMusic, FaStore, FaCalendarAlt } from 'react-icons/fa'
import { DEFAULT_HERO_MEMBERS } from '../../lib/heroDefaults'

const HeroSection = ({ 
  members = [], 
  activeMemberId, 
  setActiveMemberId, 
  navigate,
  heroTitle,
  heroSubtitle,
  heroTagline,
  heroTitleColor = '#FFFFFF',
  heroSubtitleColor = '#24C6F5',
  heroTaglineColor = '#94A3B8',
  isPreview = false,
  previewMode = 'desktop',
  previewHeight,
  previewWidth,
}) => {
  const getMemberStyle = (member) => {
    const posX = member.posX ?? 50
    const posY = member.posY ?? 50
    const scale = member.scale ?? 1
    const tx = member.translateX ?? 0
    const ty = member.translateY ?? 0
    const isFlipped = Boolean(member.flipX)

    return {
      objectPosition: `${posX}% ${posY}%`,
      transform: `scale(${scale}) translate(${tx}px, ${ty}px) ${isFlipped ? 'scaleX(-1)' : ''}`
    }
  }

  const getMobileMemberStyle = (member) => {
    const posX = member.mobilePosX ?? member.posX ?? 50
    const posY = member.mobilePosY ?? member.posY ?? 25
    const scale = member.mobileScale ?? member.scale ?? 1.4
    const baseTx = (posX - 50) * 3.5
    const offsetTx = member.mobileTranslateX ?? member.translateX ?? 0
    const totalTx = baseTx + offsetTx
    const offsetTy = member.mobileTranslateY ?? member.translateY ?? 0
    const isFlipped = Boolean(member.mobileFlipX ?? member.flipX)

    return {
      objectPosition: `50% ${posY}%`,
      transform: `translate(${totalTx}px, ${offsetTy}px) scale(${scale}) ${isFlipped ? 'scaleX(-1)' : ''}`,
      transformOrigin: `50% ${posY}%`
    }
  }

  const titleText = heroTitle || "NOIZE"
  const subtitleText = (heroSubtitle && heroSubtitle !== 'MUSIC PROJECT' && heroSubtitle !== 'ノイズ • MUSIC PROJECT') ? heroSubtitle : "PRODUCTION"
  const taglineText = heroTagline || ""

  const handleMemberClick = (memberId) => {
    if (isPreview) {
      if (setActiveMemberId) setActiveMemberId(activeMemberId === memberId ? null : memberId)
      return
    }
    if (navigate) navigate('/members')
  }

  const getOverlayStyle = (colorVal) => {
    if (!colorVal) return {}
    if (colorVal.startsWith('#') || colorVal.startsWith('rgb') || colorVal.startsWith('hsl')) {
      return { backgroundColor: colorVal }
    }
    return {}
  }

  const getOverlayClass = (colorVal) => {
    if (!colorVal) return 'bg-[#9D26FF]'
    if (colorVal.startsWith('bg-')) return colorVal
    return ''
  }

  const showDesktop = isPreview ? previewMode === 'desktop' : true
  const showMobile = isPreview ? previewMode === 'mobile' : true

  // Fallback to default 4 members so hero always displays member photos immediately
  const displayMembers = (members && members.length > 0) ? members : DEFAULT_HERO_MEMBERS

  return (
    <>
      {/* Desktop Hero */}
      {showDesktop && (
        <section 
          className={`relative w-full overflow-hidden ${isPreview ? 'flex' : 'h-[100vh] hidden md:flex'}`}
          style={isPreview ? { height: previewHeight || 460 } : undefined}
        >
          {displayMembers.map((member, idx) => (
            <motion.div 
              key={member.id || idx}
              initial={isPreview ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: Math.abs(idx - 3) * 0.1, ease: "easeOut" }}
              className="hero-column min-w-0 flex-1 relative group cursor-pointer"
              onClick={() => handleMemberClick(member.id)}
            >
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={member.photo || getAssetPath('/images/members/placeholder.svg')} 
                  alt={member.name} 
                  fetchpriority={idx < 3 ? "high" : "auto"}
                  loading="eager"
                  className={`w-full h-full object-cover ${
                    activeMemberId === member.id ? 'grayscale-0 opacity-100' : 'grayscale opacity-70'
                  } group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 ${
                    isPreview ? 'transition-none' : 'transition-all duration-700'
                  }`}
                  style={getMemberStyle(member)}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getAssetPath('/images/members/placeholder.svg')
                  }}
                />
                <div 
                  className={`absolute inset-0 ${getOverlayClass(member.color)} mix-blend-multiply opacity-30 group-hover:opacity-0 transition-opacity duration-700`}
                  style={getOverlayStyle(member.color)}
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className={`absolute inset-x-0 flex justify-center z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-500 ${isPreview ? 'bottom-8' : 'bottom-24'}`}>
                <span className={`vertical-rl text-orientation-mixed text-white font-black tracking-[0.15em] opacity-80 drop-shadow-2xl ${isPreview ? 'text-xs sm:text-sm' : 'text-xl md:text-2xl'}`}>
                  {member.name}
                </span>
              </div>
            </motion.div>
          ))}

          <div className="absolute inset-x-0 bottom-[26%] sm:bottom-[24%] md:bottom-[22%] lg:bottom-[22%] flex flex-col items-center justify-center z-20 pointer-events-none px-4">
            <motion.div 
              initial={isPreview ? false : "hidden"} 
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.8 } } }}
              className="text-center w-full max-w-full flex flex-col items-center"
            >
              <motion.img 
                variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 0.9, scale: 1 } }}
                src={getAssetPath('/noize-logo.png')} 
                alt="NOIZE Logo" 
                className={`object-contain mb-2 drop-shadow-[0_0_35px_rgba(157,38,255,0.85)] ${isPreview ? 'w-10 h-10 sm:w-14 sm:h-14 opacity-85' : 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 opacity-90'}`} 
              />
              {taglineText ? (
                <motion.div 
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 0.85, y: 0 } }} 
                  className={`mb-1 font-bold uppercase tracking-[0.3em] truncate ${isPreview ? 'text-[8px] sm:text-[9px]' : 'text-xs md:text-sm'}`}
                  style={{ color: heroTaglineColor || '#FFFFFF' }}
                >
                  {taglineText}
                </motion.div>
              ) : null}
              <motion.h1 
                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} 
                className={`${isPreview ? 'text-lg sm:text-2xl' : 'text-4xl md:text-6xl lg:text-7xl'} font-black tracking-[0.12em] my-1 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] uppercase truncate`}
                style={{ color: heroTitleColor || '#FFFFFF' }}
              >
                {titleText}
              </motion.h1>
              <motion.div 
                variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }} 
                className={`font-black uppercase tracking-[0.45em] truncate ${isPreview ? 'text-[9px] sm:text-[10px]' : 'text-xs md:text-sm lg:text-base'}`}
                style={{ color: heroSubtitleColor || '#24C6F5' }}
              >
                {subtitleText}
              </motion.div>
            </motion.div>
          </div>
          <div className="absolute bottom-0 w-full h-[1px] bg-[#272438] z-30"></div>
        </section>
      )}

      {/* Mobile Hero */}
      {showMobile && (
        <section className={`relative bg-[#09090B] text-white flex flex-col ${isPreview ? 'w-full' : 'md:hidden pt-16'}`}>
          <motion.div initial={isPreview ? false : { opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-5 text-center bg-[#09090B] border-b border-[#272438] flex flex-col items-center">
            <img 
              src={getAssetPath('/noize-logo.png')} 
              alt="NOIZE Logo" 
              className={`object-contain mb-2 opacity-85 drop-shadow-[0_0_20px_rgba(157,38,255,0.7)] ${isPreview ? 'w-8 h-8' : 'w-14 h-14'}`} 
            />
            {taglineText ? (
              <p className="text-[8px] tracking-[0.5em] font-black text-white/70 uppercase mb-1" style={{ color: heroTaglineColor || 'rgba(255,255,255,0.7)' }}>
                {taglineText}
              </p>
            ) : null}
            <h1 className="text-3xl font-black tracking-tight text-[#9D26FF] mb-0.5 uppercase" style={{ color: heroTitleColor || '#9D26FF' }}>
              {titleText}
            </h1>
            <p className="text-xs font-black tracking-[0.4em] text-[#24C6F5]" style={{ color: heroSubtitleColor || '#24C6F5' }}>
              {subtitleText}
            </p>
          </motion.div>
          <div className="flex flex-col relative bg-pattern-dots">
            {displayMembers.map((member, idx) => (
              <motion.div
                key={member.id || idx}
                initial={isPreview ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setActiveMemberId && setActiveMemberId(member.id)}
                className={`relative h-20 overflow-hidden cursor-pointer group border-b border-[#272438] ${
                  isPreview && activeMemberId === member.id
                    ? 'ring-2 ring-[#9D26FF] z-20 shadow-[0_0_15px_rgba(157,38,255,0.6)]'
                    : ''
                }`}
              >
                <img 
                  src={member.photo || getAssetPath('/images/members/placeholder.svg')} 
                  alt={member.name}
                  fetchpriority={idx < 2 ? "high" : "auto"}
                  loading="eager"
                  className={`absolute inset-0 w-full h-full object-cover z-0 ${
                    isPreview ? 'transition-none' : 'transition-all duration-500'
                  } ${
                    activeMemberId === member.id 
                      ? 'grayscale-0 opacity-100 brightness-105' 
                      : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'
                  }`}
                  style={getMobileMemberStyle(member)}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getAssetPath('/images/members/placeholder.svg')
                  }}
                />
                <div 
                  className={`absolute inset-0 ${getOverlayClass(member.color)} transition-opacity duration-500 z-10 ${
                    activeMemberId === member.id ? 'opacity-0' : 'opacity-40 mix-blend-multiply group-hover:opacity-0'
                  }`}
                  style={getOverlayStyle(member.color)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center z-20 px-4 pointer-events-none">
                  <span className={`text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                    activeMemberId === member.id 
                      ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] translate-x-1' 
                      : 'text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-white group-hover:translate-x-1'
                  }`}>
                    {member.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default HeroSection
