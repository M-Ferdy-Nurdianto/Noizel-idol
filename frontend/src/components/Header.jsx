import { Link, useLocation } from 'react-router-dom'
import { FaShoppingBag } from 'react-icons/fa'
import { HiHome, HiUserGroup, HiBuildingStorefront } from 'react-icons/hi2'
import { motion } from 'framer-motion'
import { getAssetPath } from '../lib/pathUtils'
import { useTheme } from '../context/ThemeContext'

const Header = ({ cartCount = 0, onCartClick }) => {
  const location = useLocation()
  const { theme } = useTheme()

  const navLinks = [
    { name: 'HOME', href: '/', icon: HiHome },
    { name: 'ABOUT US', href: '/story', icon: HiUserGroup },
    { name: 'SHOP', href: '/shop', icon: HiBuildingStorefront },
  ]

  // Primary links featured on the mobile bottom bar (synchronized with top nav)
  const mobilePrimaryLinks = [
    { name: 'Home', href: '/', icon: HiHome },
    { name: 'About Us', href: '/story', icon: HiUserGroup },
    { name: 'Shop', href: '/shop', icon: HiBuildingStorefront },
  ]

  const isActive = (href) => {
    const [path] = href.split('#')
    if (href === '/') return location.pathname === '/'
    if (path === '/') return location.pathname === '/' && (location.hash === href.split('#')[1] || !href.includes('#'))
    return location.pathname.startsWith(path)
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

            {/* 2. Right Logo (links to Login) */}
            <Link
              to="/admin/login"
              aria-label="Noize"
              className="flex items-center justify-center shrink-0 select-none group"
            >
              <img 
                src={getAssetPath('/noize-logo.png')} 
                alt="Noize Logo" 
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform group-hover:scale-105" 
              />
            </Link>
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

          </div>
        </nav>
    </>
  )
}

export default Header

