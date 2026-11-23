import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaChevronDown, FaCheck } from 'react-icons/fa'

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...', 
  className = '',
  variant = 'filter' // 'filter', 'form', or 'status'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const containerRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target) &&
        !e.target.closest('.custom-dropdown-portal-menu')
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close the dropdown on window/container scroll to prevent floating effect, but ignore scrolls inside dropdown menu
  useEffect(() => {
    if (!isOpen) return
    const handleScroll = (e) => {
      if (e.target && (e.target.closest?.('.custom-dropdown-portal-menu') || e.target.classList?.contains('custom-dropdown-portal-menu'))) {
        return
      }
      setIsOpen(false)
    }
    window.addEventListener('scroll', handleScroll, { capture: true })
    
    // Also listen to horizontal scroll on the table container if present
    const tableContainers = document.querySelectorAll('.overflow-x-auto')
    tableContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll)
    })

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
      tableContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll)
      })
    }
  }, [isOpen])

  // Calculate coordinates synchronously before painting to prevent flickering
  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const menuHeight = 160 // Estimated max height
      const shouldOpenUp = spaceBelow < menuHeight
      setOpenUp(shouldOpenUp)

      setCoords({
        top: shouldOpenUp 
          ? rect.top + window.scrollY 
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  const handleOpen = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const menuHeight = 160 // Estimated max height
      const shouldOpenUp = spaceBelow < menuHeight
      setOpenUp(shouldOpenUp)

      setCoords({
        top: shouldOpenUp 
          ? rect.top + window.scrollY 
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
    setIsOpen(!isOpen)
  }

  const handleSelect = (val) => {
    onChange({ target: { value: val } })
    setIsOpen(false)
  }

  const safeOptions = Array.isArray(options) ? options : []
  const selectedOption = safeOptions.find(opt => String(opt.value) === String(value))

  // Helper for status styling in dark mode
  const getStatusStyle = (statusVal) => {
    switch (statusVal) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
      case 'checked':
        return 'bg-[#24C6F5]/10 text-[#24C6F5] border-[#24C6F5]/30 hover:bg-[#24C6F5]/20'
      case 'completed':
        return 'bg-[#9D26FF]/10 text-[#9D26FF] border-[#9D26FF]/30 hover:bg-[#9D26FF]/20'
      default:
        return 'bg-white/10 text-zinc-300 border-white/10 hover:bg-white/15'
    }
  }

  return (
    <div className="relative inline-block w-full custom-dropdown-container" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-2 transition-all border outline-none cursor-pointer ${
          isOpen ? 'border-[#9D26FF] ring-2 ring-[#9D26FF]/20 shadow-lg' : ''
        } ${
          variant === 'search'
            ? 'h-[44px] px-4 rounded-xl text-sm font-normal bg-[#1E1C2E] text-white border-white/10 hover:border-white/20'
            : variant === 'form'
            ? 'h-[42px] px-3.5 py-2.5 rounded-xl text-xs font-normal bg-[#1E1C2E] text-white border-white/10 hover:border-white/20'
            : variant === 'status'
            ? `px-3 py-1.5 rounded-xl text-xs font-bold ${getStatusStyle(value)}`
            : 'px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1E1C2E] text-white border-white/10 hover:bg-white/10 hover:border-white/20 min-w-[140px]'
        } ${className}`}
      >
        <span className={`truncate text-left ${!value && value !== 0 ? (variant === 'form' || variant === 'search' ? 'text-zinc-500' : 'text-zinc-400') : 'text-white'}`}>
          {selectedOption?.label || (value ? value : placeholder)}
        </span>
        <FaChevronDown className={`${variant === 'form' || variant === 'search' ? 'text-xs text-zinc-400' : 'text-[10px] text-zinc-400'} transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#9D26FF]' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div 
          className={`absolute bg-[#13121D] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.85)] border border-[#272438] p-1.5 z-[9999] custom-dropdown-portal-menu animate-in fade-in slide-in-from-${openUp ? 'bottom' : 'top'}-2 duration-150 backdrop-blur-xl`}
          style={{
            position: 'absolute',
            top: `${openUp ? coords.top - 6 : coords.top + 6}px`,
            left: `${coords.left}px`,
            width: `${Math.max(coords.width, 160)}px`,
            transform: openUp ? 'translateY(-100%)' : 'none',
          }}
        >
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-0.5">
            {safeOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#9D26FF]/20 text-[#9D26FF] font-bold' 
                      : 'text-zinc-300 hover:bg-[#1E1C2E] hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <FaCheck className="text-[10px] text-[#9D26FF] shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default CustomSelect
