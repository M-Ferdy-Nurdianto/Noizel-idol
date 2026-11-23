import { Link } from 'react-router-dom'
import { FaInstagram, FaTwitter, FaYoutube, FaMapMarkerAlt, FaEnvelope, FaTiktok, FaDiscord } from 'react-icons/fa'
import { getAssetPath } from '../lib/pathUtils'
import { useFooterSettings } from '../hooks/useFooterSettings'
import { useSocialLinks } from '../hooks/useSocialLinks'

const Footer = () => {
  const { footerSettings } = useFooterSettings()
  const { links: socialData } = useSocialLinks()

  const formatHref = (url) => {
    if (!url || typeof url !== 'string') return null
    const clean = url.trim()
    if (!clean || clean === '#') return null
    return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`
  }

  const socialLinks = [
    { icon: <FaInstagram />, href: formatHref(socialData?.instagram), title: 'Instagram' },
    { icon: <FaTwitter />, href: formatHref(socialData?.twitter), title: 'Twitter / X' },
    { icon: <FaYoutube />, href: formatHref(socialData?.youtube), title: 'YouTube' },
    { icon: <FaTiktok />, href: formatHref(socialData?.tiktok), title: 'TikTok' },
    { icon: <FaDiscord />, href: formatHref(socialData?.discord), title: 'Discord' },
  ].filter(s => Boolean(s.href))

  const hasContactInfo = Boolean(
    (footerSettings.location && footerSettings.location.trim()) ||
    (footerSettings.email && footerSettings.email.trim()) ||
    socialLinks.length > 0
  )

  return (
    <footer className="bg-[#13121D] text-[#F8FAFC] py-12 sm:py-16 px-4 border-t border-[#272438] font-sans">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-20">
          
          {/* COL 1: IDENTITY */}
          <div className="space-y-4 md:space-y-5">
            <div className="flex items-center gap-3">
              <img src={getAssetPath('/noize-logo.png')} alt="Noize Logo" className="w-8 h-8 object-contain" />
              <h3 className="text-xl sm:text-2xl font-black tracking-widest uppercase text-white">
                NOIZE
              </h3>
            </div>
            {footerSettings.description && footerSettings.description.trim() && (
              <p className="text-[#94A3B8] text-sm font-medium leading-relaxed max-w-md">
                {footerSettings.description}
              </p>
            )}
            {footerSettings.small_text && footerSettings.small_text.trim() && (
              <p className="text-[#9D26FF] font-bold text-xs tracking-widest uppercase font-mono">
                {footerSettings.small_text}
              </p>
            )}
          </div>

          {/* COL 2: QUICK LINKS */}
          <div className="space-y-4 md:space-y-5">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { name: 'Home', href: '/' },
                { name: 'About Us', href: '/story' },
                { name: 'Shop & Cheki', href: '/shop' }
              ].map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="text-[#94A3B8] hover:text-[#9D26FF] text-sm font-medium transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COL 3: GET IN TOUCH */}
          {hasContactInfo && (
            <div className="space-y-4 md:space-y-5">
              <h4 className="text-base font-bold text-white uppercase tracking-wider">Connect With Us</h4>
              <div className="space-y-3">
                {footerSettings.location && footerSettings.location.trim() && (
                  <div className="flex items-start gap-3 text-[#94A3B8] text-sm">
                    <div className="mt-1 text-[#24C6F5] shrink-0"><FaMapMarkerAlt /></div>
                    <span>{footerSettings.location}</span>
                  </div>
                )}
                {footerSettings.email && footerSettings.email.trim() && (
                  <div className="flex items-center gap-3 text-[#94A3B8] text-sm">
                    <div className="text-[#24C6F5] shrink-0"><FaEnvelope /></div>
                    <a href={`mailto:${footerSettings.email}`} className="hover:text-white transition-colors truncate">
                      {footerSettings.email}
                    </a>
                  </div>
                )}
              </div>

              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {socialLinks.map((social, idx) => (
                    <a 
                      key={idx}
                      href={social.href} 
                      title={social.title}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-9 h-9 rounded-xl bg-[#1E1C2E] border border-[#272438] flex items-center justify-center text-[#94A3B8] hover:bg-[#9D26FF] hover:border-[#9D26FF] hover:text-white transition-all duration-300"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        <div className="mt-12 pt-8 border-t border-[#272438] flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#94A3B8] font-medium font-mono">
          <p>{footerSettings.copyright || '© 2026 NOIZE. ALL RIGHTS RESERVED.'}</p>
          <div className="flex gap-6">
            <Link to="/admin/login" className="hover:text-[#9D26FF] transition-colors">Staff / Admin Login</Link>
            <a href="/#faq" className="hover:text-[#9D26FF] transition-colors">FAQ</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
