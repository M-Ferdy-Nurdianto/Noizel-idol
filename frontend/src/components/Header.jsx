import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FaBars, FaTimes, FaShoppingCart, FaShoppingBag, FaHome, FaUsers, FaMusic, FaCalendarAlt, FaCamera, FaStore, FaInfoCircle, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaDiscord } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { getAssetPath } from '../lib/pathUtils'
import { useTheme } from '../context/ThemeContext'
import { useSocialLinks } from '../hooks/useSocialLinks'

const Header = ({ cartCount = 0, onCartClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { getLink } = useSocialLinks()

  const navLinks = [
    { name: 'HOME', href: '/', icon: FaHome },
    { name: 'ABOUT US', href: '/story', icon: FaInfoCircle },
    { name: 'SHOP', href: '/shop', icon: FaStore },
  ]

  // Primary links featured on the mobile bottom bar (synchronized with top nav)
  const mobilePrimaryLinks = [
    { name: 'Home', href: '/', icon: FaHome },
    { name: 'About Us', href: '/story', icon: FaInfoCircle },
    { name: 'Shop', href: '/shop', icon: FaStore },
  ]

  const socialLinks = [
    { icon: FaInstagram, href: getLink('instagram'), label: 'Instagram' },
    { icon: FaTwitter, href: getLink('twitter'), label: 'Twitter / X' },
    { icon: FaYoutube, href: getLink('youtube'), label: 'YouTube' },
    { icon: FaTiktok, href: getLink('tiktok'), label: 'TikTok' },
    { icon: FaDiscord, href: getLink('discord'), label: 'Discord' },
  ]

  const isActive = (href) => {
    const [path] = href.split('#')
    if (href === '/') return location.pathname === '/'
    if (path === '/') return location.pathname === '/' && (location.hash === href.split('#')[1] || !href.includes('#'))
    return location.pathname.startsWith(path)
  }

  const handleNavLinkClick = (e, link) => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Floating Stadium / Pill Navbar */}
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none">
        <nav className={`pointer-events-auto w-full max-w-6xl rounded-full px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between transition-all duration-300 border shadow-[0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl ${
          theme === 'dark'
            ? 'bg-[#13121D]/90 border-white/10 text-white'
            : 'bg-white/95 border-[#272438]/15 text-gray-900 shadow-zinc-300/50'
        }`}>
          {/* LEFT: Logo + Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group shrink-0 select-none"
          >
            <img 
              src={getAssetPath('/noize-logo.png')} 
              alt="Noize Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform group-hover:scale-105" 
            />
            <span className={`text-base sm:text-lg font-black tracking-tight uppercase ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              NOI<span className="text-[#9D26FF]">ZE</span>
            </span>
          </Link>

          {/* CENTER: Segmented Inner Capsule Nav */}
          <div className={`hidden md:flex items-center p-1 rounded-full border transition-colors ${
            theme === 'dark'
              ? 'bg-[#09090B]/80 border-white/5'
              : 'bg-zinc-100 border-zinc-200'
          }`}>
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={(e) => handleNavLinkClick(e, link)}
                  className={`relative px-4 sm:px-5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-200 select-none ${
                    active
                      ? 'bg-[#9D26FF] text-white shadow-[0_0_15px_rgba(157,38,255,0.35)]'
                      : theme === 'dark'
                        ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/5'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          {/* RIGHT: Circular Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* 1. Cart Button with count badge */}
            <button
              onClick={onCartClick}
              aria-label="Shopping Cart"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all relative border select-none group ${
                theme === 'dark'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 hover:text-black'
              }`}
            >
              <div className="relative" data-cart-icon>
                <FaShoppingBag className="text-sm transition-transform group-hover:scale-110" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                    {cartCount}
                  </span>
                )}
              </div>
            </button>

            {/* 2. Avatar / Staff Profile Button */}
            <Link
              to="/admin"
              aria-label="Staff Portal / Profile"
              title="Admin & Staff Portal"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-[#9D26FF] transition-all flex items-center justify-center bg-[#1E1C2E] shadow-sm select-none group"
            >
              <img 
                src={getAssetPath('/noize-logo.png')} 
                alt="Profile" 
                className="w-full h-full object-cover p-1 group-hover:scale-110 transition-transform" 
              />
            </Link>

            {/* Mobile Menu Button (screens < md) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Menu"
              className={`md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-all border select-none ${
                theme === 'dark'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
              }`}
            >
              <FaBars className="text-xs" />
            </button>
          </div>
        </nav>
      </header>

      {/* Floating Bottom Navbar for Mobile */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-3 inset-x-0 z-50 lg:hidden px-3 pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
          <div className={`mx-auto max-w-md w-full pointer-events-auto rounded-3xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300 border flex items-center justify-between ${
            theme === 'dark'
              ? 'bg-[#0b101d]/90 border-white/15 text-white shadow-black/80'
              : 'bg-white/90 border-[#272438] text-gray-800 shadow-black/20'
          }`}>
            {/* Main Quick Nav Items */}
            {mobilePrimaryLinks.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl select-none transition-all duration-300 ${
                    active
                      ? 'text-white'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {/* Active Highlight Glow Pill with layout animation */}
                  {active && (
                    <motion.div
                      layoutId="activeBottomNavPill"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-[#9D26FF] rounded-2xl shadow-[0_4px_15px_rgba(157,38,255,0.35)] -z-0"
                    />
                  )}

                  {/* Animated Icon & Label */}
                  <motion.div
                    animate={{
                      scale: active ? 1.15 : 1,
                      y: active ? -2 : 0,
                    }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="relative z-10 flex flex-col items-center justify-center gap-0.5"
                  >
                    <Icon className={`text-base transition-transform duration-200 ${active ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]' : ''}`} />
                    <span className={`text-[10px] font-black tracking-tight leading-none uppercase ${
                      active 
                        ? 'text-white' 
                        : theme === 'dark' 
                          ? 'text-gray-400 font-semibold' 
                          : 'text-gray-500 font-semibold'
                    }`}>
                      {item.name}
                    </span>
                  </motion.div>
                </Link>
              )
            })}

            {/* More / Menu Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Full Menu"
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl select-none transition-all duration-300 ${
                mobileMenuOpen
                  ? 'text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {mobileMenuOpen && (
                <motion.div
                  layoutId="activeBottomNavPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-[#9D26FF] rounded-2xl shadow-[0_4px_15px_rgba(157,38,255,0.35)] -z-0"
                />
              )}
              <motion.div
                animate={{
                  scale: mobileMenuOpen ? 1.15 : 1,
                  y: mobileMenuOpen ? -2 : 0,
                }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="relative z-10 flex flex-col items-center justify-center gap-0.5"
              >
                <FaBars className={`text-base transition-transform duration-200 ${mobileMenuOpen ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]' : ''}`} />
                <span className={`text-[10px] font-semibold tracking-tight leading-none uppercase ${
                  mobileMenuOpen ? 'text-white font-black' : ''
                }`}>
                  Menu
                </span>
              </motion.div>
            </button>
          </div>
        </nav>

      {/* Mobile Bottom Sheet Menu (Drawer for complete navigation & socials) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className={`fixed inset-0 backdrop-blur-sm z-[100] lg:hidden ${
                theme === 'dark' ? 'bg-black/70' : 'bg-black/50'
              }`}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[101] lg:hidden shadow-2xl ${
                theme === 'dark'
                  ? 'bg-[#0e1424] text-white border-t border-white/15'
                  : 'bg-white text-gray-900 border-t border-gray-100'
              }`}
              style={{ 
                paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)',
                maxHeight: '85vh'
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />
              </div>

              {/* Header */}
              <div className={`flex items-center justify-between px-6 pb-4 border-b ${
                theme === 'dark' ? 'border-white/10' : 'border-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <img src={getAssetPath('/noize-logo.png')} alt="Logo" className="w-8 h-8 object-contain" />
                  <div>
                    <span className={`font-black text-sm tracking-widest block leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      NOIZE
                    </span>
                    <span className="text-[9px] font-bold text-[#9D26FF] uppercase tracking-widest">Navigation & Links</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                      theme === 'dark'
                        ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Navigation Links Grid */}
              <div className="px-4 py-4 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                {navLinks.map((link, idx) => {
                  const Icon = link.icon
                  const active = isActive(link.href)
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Link
                        to={link.href}
                        onClick={(e) => handleNavLinkClick(e, link)}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${
                          active 
                            ? 'bg-[#9D26FF] text-white shadow-md shadow-[#9D26FF]/25 font-bold' 
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-white/5'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          active 
                            ? 'bg-white/20 text-white' 
                            : theme === 'dark' 
                              ? 'bg-white/5 text-[#9D26FF]' 
                              : 'bg-gray-100 text-[#9D26FF]'
                        }`}>
                          <Icon className="text-base" />
                        </div>
                        <span className="font-bold tracking-wider text-xs sm:text-sm">{link.name}</span>
                        {active && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-sm" />
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Social Links */}
              <div className={`px-6 py-3.5 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Follow Official Socials</p>
                <div className="flex items-center gap-3">
                  {socialLinks.map((social, idx) => {
                    const Icon = social.icon
                    return (
                      <motion.a
                        key={idx}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + idx * 0.04 }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          theme === 'dark'
                            ? 'bg-white/5 border border-white/10 text-gray-400 hover:bg-[#9D26FF] hover:border-[#9D26FF] hover:text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-[#9D26FF] hover:text-white'
                        }`}
                      >
                        <Icon className="text-xs" />
                      </motion.a>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header

