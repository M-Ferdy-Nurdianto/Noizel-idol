import { motion } from 'framer-motion'
import { FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaDiscord } from 'react-icons/fa'
import { useSocialLinks } from '../../hooks/useSocialLinks'

const JoinTheNoizeBanner = ({ customText = {} }) => {
  const { getLink } = useSocialLinks()
  const socials = [
    { icon: FaInstagram, href: getLink('instagram'), label: 'Instagram' },
    { icon: FaTwitter, href: getLink('twitter'), label: 'Twitter / X' },
    { icon: FaYoutube, href: getLink('youtube'), label: 'YouTube' },
    { icon: FaTiktok, href: getLink('tiktok'), label: 'TikTok' },
    { icon: FaDiscord, href: getLink('discord'), label: 'Discord' },
  ]

  return (
    <section className="py-14 sm:py-20 container mx-auto max-w-4xl px-4 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-[#13121D] border border-[#272438] rounded-3xl p-8 sm:p-12 md:p-14 text-white shadow-xl relative overflow-hidden"
      >
        <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase mb-3">
          {(() => {
            const title = customText.join_title || 'JOIN THE NOIZE'
            const parts = title.trim().split(' ')
            if (parts.length > 1) {
              const last = parts.pop()
              return <>{parts.join(' ')} <span className="text-[#9D26FF]">{last}</span></>
            }
            return title
          })()}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed font-normal">
          {customText.join_subtitle || 'Ikuti rilisan lagu terbaru dan agenda panggung NOIZE melalui media sosial resmi kami.'}
        </p>

        {/* 4 Social Icon Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
          {socials.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.a
                key={idx}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1E1C2E] border border-[#272438] hover:border-[#9D26FF] rounded-2xl flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-sm"
              >
                <Icon size={18} />
              </motion.a>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}

export default JoinTheNoizeBanner
