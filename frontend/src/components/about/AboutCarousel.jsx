import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { getAssetPath } from '../../lib/pathUtils'

const DEFAULT_SLIDES = [
  {
    id: 'slide-1',
    image_url: '/noize-logo.png',
    title: 'NOIZE Official Stage',
    caption: 'Stage Performance & Music Project'
  },
  {
    id: 'slide-2',
    image_url: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269425434_image_processing20260824_4008041_bjfgi1_png.webp',
    title: 'Yuna • 5th Generation',
    caption: 'Dancing In The Moonlight'
  },
  {
    id: 'slide-3',
    image_url: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269529780_image_processing20260824_4009109_122is0d_png.webp',
    title: 'Shin • 3rd Generation',
    caption: 'Singing, Dancing & Stage Energy'
  },
  {
    id: 'slide-4',
    image_url: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269664212_image_processing20260824_4000925_1cs3o3m_png.webp',
    title: 'Iu • 1st Generation',
    caption: 'Visual Center of NOIZE'
  },
  {
    id: 'slide-5',
    image_url: 'http://127.0.0.1:54421/storage/v1/object/public/members/avatars/1795269698071_image_processing20260824_4011149_1iezoq8_png.webp',
    title: 'Chivy • 4th Generation',
    caption: 'Lead Vocal & Stage Presence'
  }
]

// Bersihkan glitch encoding karakter jika ada
const cleanText = (str) => {
  if (!str) return ''
  return str
    .replace(/Â€¢|â€¢|Ã¢â‚¬Â¢/g, '•')
    .replace(/Â/g, '')
    .trim()
}

const AboutCarousel = ({ slides = [] }) => {
  const activeSlides = (slides && slides.length >= 3) ? slides : DEFAULT_SLIDES
  const n = activeSlides.length

  const [currentIndex, setCurrentIndex] = useState(0)
  const prevIndexRef = useRef(0)
  const [isPaused, setIsPaused] = useState(false)
  const autoPlayRef = useRef(null)
  const touchStartXRef = useRef(null)

  // Track previous index untuk menghindari glide melintas layar saat wrap-around
  useEffect(() => {
    prevIndexRef.current = currentIndex
  }, [currentIndex])

  // Auto-scroll loop setiap 4s dengan momentum smooth
  useEffect(() => {
    if (isPaused) return
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % n)
    }, 4000)
    return () => clearInterval(autoPlayRef.current)
  }, [isPaused, n])

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + n) % n)
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % n)
  }

  // Touch Swipe untuk gesture mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX
    setIsPaused(true)
  }

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current !== null) {
      const deltaX = touchStartXRef.current - e.changedTouches[0].clientX
      if (deltaX > 40) {
        handleNext()
      } else if (deltaX < -40) {
        handlePrev()
      }
      touchStartXRef.current = null
    }
    setIsPaused(false)
  }

  // Hitung circular offset
  const getDiff = (idx, targetIdx) => {
    let diff = idx - targetIdx
    while (diff > n / 2) diff -= n
    while (diff < -n / 2) diff += n
    return diff
  }

  // Parameter visual untuk 16:9 Widescreen cards
  const getVisuals = (diff) => {
    if (diff === 0) {
      return {
        x: '0%',
        scale: 1,
        rotateY: 0,
        zIndex: 30,
        opacity: 1,
        filter: 'brightness(100%)',
        pointerEvents: 'auto',
        cursor: 'default'
      }
    }
    if (diff === -1) {
      return {
        x: '-60%',
        scale: 0.82,
        rotateY: 16,
        zIndex: 20,
        opacity: 0.45,
        filter: 'brightness(50%)',
        pointerEvents: 'auto',
        cursor: 'pointer'
      }
    }
    if (diff === 1) {
      return {
        x: '60%',
        scale: 0.82,
        rotateY: -16,
        zIndex: 20,
        opacity: 0.45,
        filter: 'brightness(50%)',
        pointerEvents: 'auto',
        cursor: 'pointer'
      }
    }
    if (diff <= -2) {
      return {
        x: '-120%',
        scale: 0.65,
        rotateY: 30,
        zIndex: 10,
        opacity: 0,
        filter: 'brightness(20%)',
        pointerEvents: 'none',
        cursor: 'default'
      }
    }
    return {
      x: '120%',
      scale: 0.65,
      rotateY: -30,
      zIndex: 10,
      opacity: 0,
      filter: 'brightness(20%)',
      pointerEvents: 'none',
      cursor: 'default'
    }
  }

  return (
    <div 
      className="relative w-full max-w-6xl mx-auto py-4 sm:py-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Perspective Stage (Ukuran 16:9 Responsif) */}
      <div 
        className="relative h-60 sm:h-80 md:h-[400px] lg:h-[440px] flex items-center justify-center overflow-hidden"
        style={{ perspective: '1300px' }}
      >
        {activeSlides.map((slide, idx) => {
          const currDiff = getDiff(idx, currentIndex)
          const prevDiff = getDiff(idx, prevIndexRef.current)
          
          // Lompatan tak terlihat di balik layar saat wrap-around
          const isJumpingAcross = (prevDiff <= -2 && currDiff >= 2) || (prevDiff >= 2 && currDiff <= -2)
          const visuals = getVisuals(currDiff)
          const isCenter = currDiff === 0

          return (
            <motion.div
              key={slide.id || idx}
              initial={false}
              animate={{
                x: visuals.x,
                scale: visuals.scale,
                rotateY: visuals.rotateY,
                zIndex: visuals.zIndex,
                opacity: visuals.opacity,
                filter: visuals.filter
              }}
              transition={
                isJumpingAcross 
                  ? { duration: 0 } 
                  : { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
              }
              onClick={() => {
                if (currDiff === -1) handlePrev()
                else if (currDiff === 1) handleNext()
              }}
              style={{
                transformStyle: 'preserve-3d',
                pointerEvents: visuals.pointerEvents,
                cursor: visuals.cursor
              }}
              className={`absolute w-[88vw] sm:w-[520px] md:w-[650px] lg:w-[720px] aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-shadow duration-500 bg-[#09090B] ${
                isCenter 
                  ? 'border-2 border-[#9D26FF] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(157,38,255,0.45)]' 
                  : 'border border-white/10 hover:border-[#9D26FF]/50'
              }`}
            >
              {/* Slide Image (16:9 Cover) */}
              <img 
                src={slide.image_url} 
                alt={slide.title} 
                className="w-full h-full object-cover object-center select-none pointer-events-none"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = getAssetPath('/noize-logo.png')
                  e.target.className = "w-full h-full object-contain p-10 opacity-70 bg-[#13121D]"
                }}
              />

              {/* Tint overlay untuk side slides */}
              {!isCenter && (
                <div className="absolute inset-0 bg-black/45 hover:bg-black/20 transition-colors duration-300"></div>
              )}

              {/* Center Active Information Overlay (Widescreen layout) */}
              <div 
                className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8 text-left transition-opacity duration-500 ${
                  isCenter ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <h4 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight line-clamp-1 drop-shadow-md">
                  {cleanText(slide.title)}
                </h4>

                {slide.caption && (
                  <p className="text-xs sm:text-sm md:text-base text-zinc-300 font-medium line-clamp-1 mt-0.5 sm:mt-1">
                    {cleanText(slide.caption)}
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-2 sm:left-4 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#09090B]/85 hover:bg-[#9D26FF] text-white border border-[#272438] hover:border-[#9D26FF] flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 group backdrop-blur-md"
        >
          <FaChevronLeft className="text-xs sm:text-sm transition-transform group-hover:-translate-x-0.5" />
        </button>
        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-2 sm:right-4 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#09090B]/85 hover:bg-[#9D26FF] text-white border border-[#272438] hover:border-[#9D26FF] flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 group backdrop-blur-md"
        >
          <FaChevronRight className="text-xs sm:text-sm transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Pagination Indicators */}
      <div className="flex justify-center items-center gap-2.5 mt-4 sm:mt-6">
        {activeSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-500 rounded-full ${
              currentIndex === idx 
                ? 'w-8 h-2 bg-[#9D26FF] shadow-[0_0_12px_#9D26FF]' 
                : 'w-2 h-2 bg-white/20 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default AboutCarousel
