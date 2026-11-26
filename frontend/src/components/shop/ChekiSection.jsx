import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FaPlus, FaMinus, FaChevronDown, FaCheck } from 'react-icons/fa'
import Skeleton from '../Skeleton'
import { useFlyToCart } from '../../context/FlyToCartContext'
import { getChekiUnitPrice, getChekiOtsPrice } from '../../lib/chekiPricing'

const MONTH_MAP = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agustus: 7, august: 7,
  sep: 8, september: 8,
  okt: 9, oktober: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, december: 11
}

const parseEventDate = (ev) => {
  if (!ev) return 0
  const year = parseInt(ev.tahun, 10) || new Date().getFullYear()
  const monthKey = String(ev.bulan || '').toLowerCase().trim()
  const month = MONTH_MAP[monthKey] ?? 0
  const day = parseInt(ev.tanggal, 10) || 1
  return new Date(year, month, day).getTime()
}

const getEventDateParts = (ev) => {
  if (!ev) return { day: '01', month: 'DES' }
  const day = String(ev.tanggal || '01').padStart(2, '0')
  const month = String(ev.bulan || '').slice(0, 3).toUpperCase() || 'DES'
  return { day, month }
}

const getInitials = (name) => {
  if (!name) return 'NZ'
  const trimmed = name.trim().toUpperCase()
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`
  return trimmed.slice(0, 2)
}

/* ─────────────────────────────────────────────────────────────
   KARTU MEMBER (Produk Utama)
   ───────────────────────────────────────────────────────────── */
const ChekiCard = ({
  name,
  imageUrl,
  price,
  otsPrice,
  inCartQty = 0,
  accentColor = '#9D26FF',
  isAttending = true,
  onAdd,
  onUpdateQty
}) => {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = getInitials(name)
  const hasValidImage = Boolean(imageUrl && !imageUrl.includes('placeholder.svg') && !imgFailed)

  return (
    <div
      className={`group relative bg-[#13121D] rounded-2xl border p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-300 overflow-hidden ${
        !isAttending
          ? 'border-[#272438]/50 opacity-75'
          : inCartQty > 0
          ? 'border-[#9D26FF]/60 shadow-[0_0_15px_rgba(157,38,255,0.15)] hover:-translate-y-1 hover:shadow-xl'
          : 'border-[#272438] hover:border-[#9D26FF]/40 hover:-translate-y-1 hover:shadow-xl'
      }`}
      style={isAttending && inCartQty > 0 && accentColor ? { borderColor: `${accentColor}80` } : {}}
    >
      <div>
        {/* Foto rasio 1:1 (aspect-square) dengan object-position top */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0A0F1D] mb-2.5 sm:mb-3 flex items-center justify-center">
          {hasValidImage ? (
            <img
              src={imageUrl}
              alt={name}
              onError={() => setImgFailed(true)}
              className={`w-full h-full object-cover object-top transition-transform duration-500 ease-out ${
                isAttending ? 'group-hover:scale-105' : 'opacity-40 grayscale-[40%]'
              }`}
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center bg-[#070B14] ${!isAttending ? 'opacity-40' : ''}`}>
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-sm sm:text-base font-black shadow-inner"
                style={{
                  backgroundColor: `${accentColor}25`,
                  border: `2px solid ${accentColor}60`,
                  color: accentColor
                }}
              >
                {initials}
              </div>
            </div>
          )}

          {/* Badge "Not Attending" jika member tidak hadir di lineup */}
          {!isAttending && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/85 border border-white/20 text-zinc-300 text-[10px] font-bold font-mono tracking-wider backdrop-blur-md shadow-lg select-none">
              Not Attending
            </div>
          )}
        </div>

        {/* Info Member: Nama minimal 16px bold */}
        <h4 className={`text-base sm:text-[17px] font-bold uppercase tracking-tight truncate leading-snug transition-colors ${
          isAttending ? 'text-white group-hover:text-[#9D26FF]' : 'text-zinc-400'
        }`}>
          {name}
        </h4>

        {/* Blok Harga 2 Baris: PO & OTS */}
        <div className={`mt-1.5 mb-3 space-y-1 ${!isAttending ? 'opacity-40' : ''}`}>
          {/* Baris 1: PO */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono leading-none">
              PO
            </span>
            <span
              className="text-[15px] sm:text-[16px] font-bold leading-none"
              style={{ color: isAttending ? accentColor : '#a1a1aa' }}
            >
              IDR {Number(price).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Baris 2: OTS (Hanya tampil jika ada di CMS) */}
          {otsPrice && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-[#24C6F5]/15 text-[#24C6F5] border border-[#24C6F5]/30 font-mono leading-none">
                OTS
              </span>
              <span className="text-[13px] sm:text-[14px] font-semibold text-[#24C6F5] leading-none">
                IDR {Number(otsPrice).toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tombol Selebar Kartu (+ Tambah / Stepper / Disabled Not Attending) */}
      <div>
        {!isAttending ? (
          <button
            type="button"
            disabled
            className="w-full h-10 rounded-xl bg-white/[0.03] border border-white/10 text-zinc-500 flex items-center justify-center font-bold text-xs uppercase tracking-wider cursor-not-allowed select-none"
          >
            Not Attending
          </button>
        ) : inCartQty > 0 ? (
          <div className="w-full h-10 rounded-xl bg-[#1E1C2E] border border-[#272438] flex items-center justify-between p-1">
            <button
              type="button"
              onClick={() => onUpdateQty(-1)}
              className="w-10 h-full flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Kurangi"
            >
              <FaMinus className="text-[9px]" />
            </button>
            <span className="text-sm font-bold text-white font-mono px-2">
              {inCartQty}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty(1)}
              className="w-10 h-full flex items-center justify-center rounded-lg hover:bg-white/10 text-[#9D26FF] hover:text-white transition-colors cursor-pointer"
              style={accentColor ? { color: accentColor } : {}}
              title="Tambah"
            >
              <FaPlus className="text-[9px]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Tambah Cheki ${name}`}
            onClick={onAdd}
            className="w-full h-10 rounded-xl bg-[#1E1C2E] border border-[#272438] hover:border-[#9D26FF] hover:bg-[#9D26FF] hover:text-white text-zinc-200 flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer shadow-sm"
          >
            <FaPlus className="text-[10px]" />
            <span>Tambah</span>
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   KARTU GROUP CHEKI (Horizontal Card Selebar Grid)
   ───────────────────────────────────────────────────────────── */
const GroupChekiHorizontalCard = ({
  name = 'Group Cheki',
  imageUrl,
  price,
  otsPrice,
  inCartQty = 0,
  accentColor = '#9D26FF',
  onAdd,
  onUpdateQty
}) => {
  const [imgFailed, setImgFailed] = useState(false)
  const hasValidImage = Boolean(imageUrl && !imageUrl.includes('placeholder.svg') && !imgFailed)

  return (
    <div
      className={`w-full group bg-[#13121D] rounded-2xl border p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 ${
        inCartQty > 0
          ? 'border-[#9D26FF]/60 shadow-[0_0_20px_rgba(157,38,255,0.15)]'
          : 'border-[#272438] hover:border-[#9D26FF]/40'
      }`}
      style={inCartQty > 0 && accentColor ? { borderColor: `${accentColor}80` } : {}}
    >
      {/* Kiri: Foto grup rasio lebar, ukuran lebih besar & proporsional */}
      <div className="w-full sm:w-72 md:w-80 lg:w-96 h-48 sm:h-40 md:h-44 lg:h-[200px] rounded-xl overflow-hidden bg-[#0A0F1D] shrink-0 flex items-center justify-center">
        {hasValidImage ? (
          <img
            src={imageUrl}
            alt={name}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#070B14]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shadow-inner"
              style={{
                backgroundColor: `${accentColor}25`,
                border: `2px solid ${accentColor}60`,
                color: accentColor
              }}
            >
              NZ
            </div>
          </div>
        )}
      </div>

      {/* Tengah: "GROUP CHEKI" info */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tight truncate group-hover:text-[#9D26FF] transition-colors">
          {name}
        </h4>
        <p className="text-xs text-zinc-400 mt-1 hidden sm:block">
          Tiket Cheki bersama seluruh member NOIZE dalam satu sesi
        </p>
      </div>

      {/* Kanan: Harga (PO & OTS) + Tombol Tambah / Stepper */}
      <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto shrink-0">
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1">
          {/* Baris 1: PO */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono leading-none">
              PO
            </span>
            <span
              className="text-[15px] sm:text-[16px] font-bold leading-none"
              style={{ color: accentColor }}
            >
              IDR {Number(price).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Baris 2: OTS (Hanya jika ada di CMS) */}
          {otsPrice && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-[#24C6F5]/15 text-[#24C6F5] border border-[#24C6F5]/30 font-mono leading-none">
                OTS
              </span>
              <span className="text-[13px] sm:text-[14px] font-semibold text-[#24C6F5] leading-none">
                IDR {Number(otsPrice).toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>

        {/* Stepper / Tombol + Tambah (Tinggi min 40px) */}
        <div className="w-full sm:w-44">
          {inCartQty > 0 ? (
            <div className="w-full h-10 rounded-xl bg-[#1E1C2E] border border-[#272438] flex items-center justify-between p-1">
              <button
                type="button"
                onClick={() => onUpdateQty(-1)}
                className="w-10 h-full flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Kurangi"
              >
                <FaMinus className="text-[9px]" />
              </button>
              <span className="text-sm font-bold text-white font-mono px-2">
                {inCartQty}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(1)}
                className="w-10 h-full flex items-center justify-center rounded-lg hover:bg-white/10 text-[#9D26FF] hover:text-white transition-colors cursor-pointer"
                style={accentColor ? { color: accentColor } : {}}
                title="Tambah"
              >
                <FaPlus className="text-[9px]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label={`Tambah ${name}`}
              onClick={onAdd}
              className="w-full h-10 rounded-xl bg-[#1E1C2E] border border-[#272438] hover:border-[#9D26FF] hover:bg-[#9D26FF] hover:text-white text-zinc-200 flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer shadow-sm"
            >
              <FaPlus className="text-[10px]" />
              <span>Tambah</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   KOMPONEN UTAMA CHEKI SECTION
   ───────────────────────────────────────────────────────────── */
const ChekiSection = ({
  loading = false,
  events = [],
  selectedEventId = '',
  onSelectEvent = () => {},
  members = [],
  groupMember = null,
  config = {},
  cart = [],
  addToCart,
  updateQuantity,
  getMemberImage,
  getAssetPath
}) => {
  const { triggerFly } = useFlyToCart()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Urutkan event dari tanggal terdekat
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => parseEventDate(a) - parseEventDate(b))
  }, [events])

  // Event terpilih (default: event terdekat)
  const currentEvent = useMemo(() => {
    if (selectedEventId) {
      const found = sortedEvents.find(e => String(e.id) === String(selectedEventId))
      if (found) return found
    }
    return sortedEvents[0] || null
  }, [selectedEventId, sortedEvents])

  // Set member ID yang hadir pada lineup event aktif (jika lineup dikonfigurasi)
  const attendingMemberIds = useMemo(() => {
    if (!currentEvent) return null

    const rawLineup = currentEvent.event_lineup || currentEvent.lineup || currentEvent.lineup_member_ids
    if (Array.isArray(rawLineup) && rawLineup.length > 0) {
      return new Set(
        rawLineup.map(item => {
          if (!item) return null
          if (typeof item === 'string') return item.toLowerCase()
          return (item.member_id || item.id || item.members?.id || item.members?.member_id || '').toLowerCase()
        }).filter(Boolean)
      )
    }

    if (Array.isArray(rawLineup) && rawLineup.length === 0) {
      return new Set()
    }

    return null // Lineup tidak dibatasi / semua hadir
  }, [currentEvent])

  if (loading && events.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-20 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-[#13121D] border border-[#272438] p-3">
              <Skeleton className="w-full h-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Jika tidak ada event
  if (sortedEvents.length === 0) {
    return (
      <div className="w-full py-16 text-center text-zinc-500 font-medium">
        Belum ada event cheki.
      </div>
    )
  }

  // Cek apakah event ini Spesial
  const isSpecial = Boolean(
    currentEvent && (currentEvent.is_special || currentEvent.type === 'special' || currentEvent.theme_name || currentEvent.theme_color)
  )
  const themeColor = isSpecial && currentEvent.theme_color ? currentEvent.theme_color : '#9D26FF'

  // Hitung harga PO & OTS per member dan group
  const memberPrice = getChekiUnitPrice(currentEvent, 'member', 'po', config)
  const memberOtsPrice = getChekiOtsPrice(currentEvent, 'member', config)

  const groupPrice = getChekiUnitPrice(currentEvent, 'group', 'po', config)
  const groupOtsPrice = getChekiOtsPrice(currentEvent, 'group', config)

  // Tanggal & Meta untuk Event Bar
  const dateParts = getEventDateParts(currentEvent)

  const metaParts = []
  if (currentEvent?.lokasi) metaParts.push(currentEvent.lokasi)
  if (currentEvent?.jam_event) metaParts.push(`Event ${currentEvent.jam_event}`)
  if (currentEvent?.jam_cheki) metaParts.push(`Cheki ${currentEvent.jam_cheki}`)


  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ─────────────────────────────────────────────────────────────
          EVENT BAR: SATU BAR SELEBAR GRID (Tanggal + Info + Selector)
          ───────────────────────────────────────────────────────────── */}
      {currentEvent && (
        <div ref={dropdownRef} className="relative w-full">
          <div className="w-full bg-[#13121D] border border-[#272438] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            {/* Kiri & Tengah: Blok Tanggal + Info Event */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Blok Tanggal (Angka Tanggal Besar, Bulan Singkat di Bawah) */}
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1E1C2E] border flex flex-col items-center justify-center shrink-0 shadow-inner"
                style={{ borderColor: isSpecial ? `${themeColor}50` : '#272438' }}
              >
                <span className="text-base sm:text-lg font-black text-white leading-none font-mono">
                  {dateParts.day}
                </span>
                <span 
                  className="text-[10px] font-black uppercase tracking-wider font-mono mt-0.5 leading-none"
                  style={{ color: isSpecial ? themeColor : '#9D26FF' }}
                >
                  {dateParts.month}
                </span>
              </div>

              {/* Tengah: Nama Event + Baris Meta */}
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-white truncate leading-snug">
                  {currentEvent.nama}
                </h3>
                {metaParts.length > 0 && (
                  <div className="flex items-center text-xs sm:text-[13px] text-zinc-300 font-medium flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                    {metaParts.map((part, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && <span className="text-zinc-600">·</span>}
                        <span>{part}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Kanan: Badge Spesial (Hanya untuk Event Spesial) + Tombol Ganti Event (jika > 1) */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              {isSpecial && (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono shrink-0"
                  style={{
                    backgroundColor: `${themeColor}20`,
                    color: themeColor,
                    border: `1px solid ${themeColor}40`
                  }}
                >
                  {currentEvent.theme_name || 'Spesial'}
                </span>
              )}

              {/* Kalau ada lebih dari 1 event, tambahkan tombol ganti event */}
              {sortedEvents.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E1C2E] border border-[#272438] hover:border-white/20 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                  aria-label="Ganti Jadwal Event"
                >
                  <span className="hidden sm:inline">Ganti Event</span>
                  <FaChevronDown className={`text-[10px] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Dropdown Menu Popover (Jika Tombol Ganti Event Diklik) */}
          {isDropdownOpen && sortedEvents.length > 1 && (
            <div
              role="listbox"
              className="absolute z-40 top-full mt-2 left-0 right-0 bg-[#13121D] border border-[#272438] rounded-xl shadow-2xl p-1.5 max-h-64 overflow-y-auto space-y-1 backdrop-blur-md"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-[#272438]/80 mb-1">
                Pilih Jadwal Event Lain
              </div>
              {sortedEvents.map((ev) => {
                const isSelected = String(currentEvent?.id) === String(ev.id)
                const isEvSpecial = Boolean(ev.is_special || ev.type === 'special' || ev.theme_name || ev.theme_color)
                const evThemeColor = isEvSpecial && ev.theme_color ? ev.theme_color : '#9D26FF'
                const cartCount = cart
                  ?.filter(item => String(item.event_id) === String(ev.id))
                  .reduce((sum, item) => sum + (item.quantity || 1), 0) || 0
                const evDateParts = getEventDateParts(ev)

                return (
                  <button
                    key={ev.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectEvent(ev.id)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#9D26FF]/20 text-white border border-[#9D26FF]/50'
                        : 'hover:bg-white/5 text-zinc-300 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-xs text-zinc-300 shrink-0">
                        {evDateParts.day} {evDateParts.month}
                      </span>
                      <span className="text-zinc-600">|</span>
                      <span className="font-bold text-white truncate max-w-[150px] sm:max-w-[220px]">
                        {ev.nama}
                      </span>
                      {isEvSpecial && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0"
                          style={{
                            backgroundColor: `${evThemeColor}20`,
                            color: evThemeColor,
                            border: `1px solid ${evThemeColor}40`
                          }}
                        >
                          {ev.theme_name || 'Spesial'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {cartCount > 0 && (
                        <span 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-black text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: evThemeColor }}
                          title={`${cartCount} item di keranjang`}
                        >
                          {cartCount}
                        </span>
                      )}
                      {isSelected && <FaCheck className="text-[10px] text-[#9D26FF]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          GRID KARTU MEMBER (Produk Utama: 4 Kolom Desktop, 2 Mobile)
          Member yang tidak hadir di lineup tetap mengisi posisinya
          ───────────────────────────────────────────────────────────── */}
      {members.length === 0 ? (
        <div className="w-full py-12 text-center text-zinc-500 font-medium bg-[#13121D] border border-[#272438] rounded-2xl">
          Belum ada member tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {members.map((member) => {
            const imgUrl = getMemberImage(member)
            const isAttending = attendingMemberIds
              ? (
                  Boolean(member.id && attendingMemberIds.has(String(member.id).toLowerCase())) ||
                  Boolean(member.member_id && attendingMemberIds.has(String(member.member_id).toLowerCase()))
                )
              : true

            const inCartItem = cart?.find(
              (item) => String(item.event_id) === String(currentEvent?.id) && (item.member_id === member.id || item.member_id === member.member_id)
            )
            const inCartQty = inCartItem?.quantity || 0

            return (
              <ChekiCard
                key={`${currentEvent?.id}_${member.id}`}
                name={member.nama_panggung}
                imageUrl={imgUrl}
                price={memberPrice}
                otsPrice={memberOtsPrice}
                inCartQty={inCartQty}
                accentColor={themeColor}
                isAttending={isAttending}
                onAdd={(e) => {
                  if (!isAttending) return
                  if (triggerFly && imgUrl) {
                    const rect = e?.currentTarget?.getBoundingClientRect?.()
                    if (rect) triggerFly({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, imgUrl)
                  }
                  addToCart('member', member, currentEvent, getMemberImage)
                }}
                onUpdateQty={(delta) => {
                  if (!isAttending && delta > 0) return
                  if (inCartItem && updateQuantity) {
                    updateQuantity(inCartItem.id, delta)
                  }
                }}
              />
            )
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          GROUP CHEKI (Kartu Horizontal Selebar Grid di Bawah Member)
          ───────────────────────────────────────────────────────────── */}
      {(() => {
        if (!currentEvent || groupMember?.hadir === false) return null
        const inCartGroup = cart?.find(
          (item) => String(item.event_id) === String(currentEvent?.id) && item.type === 'group'
        )
        const grpQty = inCartGroup?.quantity || 0
        const grpImg = groupMember?.image_url
          ? (groupMember.image_url.startsWith('http') ? groupMember.image_url : getAssetPath(groupMember.image_url))
          : getAssetPath('/images/members/group.webp')

        return (
          <div className="pt-2 sm:pt-3">
            <GroupChekiHorizontalCard
              key={`${currentEvent.id}_group`}
              name="Group Cheki"
              imageUrl={grpImg}
              price={groupPrice}
              otsPrice={groupOtsPrice}
              inCartQty={grpQty}
              accentColor={themeColor}
              onAdd={(e) => {
                if (triggerFly && grpImg) {
                  const rect = e?.currentTarget?.getBoundingClientRect?.()
                  if (rect) triggerFly({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, grpImg)
                }
                addToCart('group', groupMember, currentEvent, getMemberImage)
              }}
              onUpdateQty={(delta) => {
                if (inCartGroup && updateQuantity) {
                  updateQuantity(inCartGroup.id, delta)
                }
              }}
            />
          </div>
        )
      })()}
    </div>
  )
}

export default ChekiSection
