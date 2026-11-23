import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'

const AboutSection = ({ aboutSettings, navigate }) => {
  const badge = aboutSettings?.badge || 'ABOUT US'
  const title = aboutSettings?.title || 'WHO IS NOIZE'
  const description = aboutSettings?.description || 'NOIZE adalah entitas musik dan performa panggung modern yang menghadirkan energi frekuensi tinggi, memadukan visual panggung dinamis dengan performa audio solid untuk menghubungkan panggung dan komunitas dalam satu frekuensi.'
  const buttonText = aboutSettings?.button_text || 'LEARN MORE'

  return (
    <section id="about" className="py-20 md:py-32 bg-pattern-noize-text text-white relative z-40 overflow-hidden border-t border-[#272438]">
      <div className="container mx-auto max-w-5xl px-4 relative z-10 flex flex-col items-center">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#9D26FF]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Heading */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#F8FAFC] uppercase mb-6 leading-tight"
        >
          {/NOIZE/i.test(title) ? (
            <>
              {title.split(/NOIZE/i)[0]}
              <span className="text-[#9D26FF]">NOIZE</span>
              {title.split(/NOIZE/i)[1] || ''}
            </>
          ) : (
            title
          )}
        </motion.h2>

        {/* Short & Concise Description */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-[#94A3B8] leading-relaxed font-normal mb-10 max-w-2xl"
        >
          {description}
        </motion.p>

        {/* Learn More Button -> Links to /story (ABOUT US) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link 
            to="/story" 
            className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#9D26FF] hover:bg-[#8A1AD6] text-white text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(157,38,255,0.35)] hover:shadow-[0_0_25px_rgba(157,38,255,0.55)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>{buttonText}</span>
            <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </div>
  </section>
  )
}

export default AboutSection
