import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FaWhatsapp, 
  FaEnvelope, 
  FaCopy, 
  FaCheck, 
  FaExternalLinkAlt, 
  FaInstagram 
} from 'react-icons/fa'
import { useSocialLinks } from '../../hooks/useSocialLinks'

const ManagerContactSection = ({ customText = {} }) => {
  const { links } = useSocialLinks()
  const [copiedField, setCopiedField] = useState(null)

  const cpBadge = customText.cp_badge?.trim() || 'MANAGEMENT & BOOKING'
  const cpTitle = customText.cp_title?.trim() || 'OFFICIAL CONTACT PERSON'
  const cpSubtitle = customText.cp_subtitle?.trim() || 'Hubungi manajemen resmi NOIZE untuk jadwal panggung, kolaborasi event, sponsorship, atau urusan kerja sama lainnya.'
  const managerName = customText.cp_manager_name?.trim() || 'NOIZE Official Management'
  const noteText = customText.cp_note?.trim() || 'Kontak untuk penawaran live stage, sponsorship, dan kerja sama.'

  // WhatsApp check & sanitization
  const whatsappNumber = typeof customText.cp_whatsapp === 'string' ? customText.cp_whatsapp.trim() : ''
  const cleanDigits = whatsappNumber.replace(/\D/g, '')
  const hasWhatsApp = Boolean(whatsappNumber && cleanDigits.length >= 7 && whatsappNumber !== '-')

  const getWhatsAppLink = (rawNumber) => {
    let clean = String(rawNumber || '').replace(/\D/g, '')
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1)
    }
    return `https://wa.me/${clean}`
  }

  // Email check
  const emailAddress = typeof customText.cp_email === 'string' ? customText.cp_email.trim() : ''
  const hasEmail = Boolean(emailAddress && emailAddress.includes('@') && emailAddress !== '-')

  // Instagram check (prioritas customText.cp_instagram, fallback links.instagram)
  const rawInstagram = (customText.cp_instagram || links?.instagram || '').trim()
  const hasInstagram = Boolean(rawInstagram && rawInstagram !== '#' && rawInstagram !== '-')

  const getInstagramLink = (raw) => {
    if (!raw) return ''
    const clean = raw.trim()
    if (/^https?:\/\//i.test(clean)) return clean
    const handle = clean.replace(/^@/, '')
    return `https://www.instagram.com/${handle}/`
  }

  const handleCopy = (text, fieldName) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    }).catch(() => {})
  }

  // Sembunyikan seluruh card jika semua kontak kosong
  if (!hasWhatsApp && !hasEmail && !hasInstagram) {
    return null
  }

  return (
    <section className="py-14 sm:py-20 container mx-auto max-w-5xl px-4 relative z-20 border-t border-[#272438]">
      {/* Header Section */}
      <div className="text-center mb-10 sm:mb-12">
        {cpBadge && (
          <p className="text-xs font-semibold text-[#24C6F5] mb-2 uppercase">
            {cpBadge}
          </p>
        )}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
          {(() => {
            const parts = cpTitle.trim().split(' ')
            if (parts.length > 1) {
              const last = parts.pop()
              return <>{parts.join(' ')} <span className="text-[#9D26FF]">{last}</span></>
            }
            return cpTitle
          })()}
        </h2>
        {cpSubtitle && (
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl mx-auto leading-relaxed">
            {cpSubtitle}
          </p>
        )}
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-[#13121D] rounded-3xl border border-[#272438] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Ambient Corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#9D26FF]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#24C6F5]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          {/* Kolom Kiri: Judul & Satu Kalimat Pendek (5 Kolom di desktop) */}
          <div className="md:col-span-5 space-y-2 text-left">
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {managerName}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              {noteText}
            </p>
          </div>

          {/* Kolom Kanan: Kontak (7 Kolom di desktop) */}
          <div className="md:col-span-7 space-y-3.5">
            
            {/* Baris 1: WhatsApp */}
            {hasWhatsApp && (
              <div className="p-4 sm:p-4.5 rounded-2xl bg-[#09090B] border border-[#272438] hover:border-[#25D366]/40 transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366] text-xl shrink-0 group-hover:scale-105 transition-transform">
                      <FaWhatsapp />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold text-[#25D366] uppercase tracking-wider block">
                        WhatsApp
                      </span>
                      <span className="text-base sm:text-lg font-black text-white font-mono tracking-tight truncate block">
                        {whatsappNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      onClick={() => handleCopy(whatsappNumber, 'wa')}
                      type="button"
                      title="Salin Nomor WhatsApp"
                      className="px-3 py-2 rounded-xl bg-[#1E1C2E] border border-white/10 text-zinc-300 hover:text-white hover:border-[#25D366] transition-all text-xs flex items-center gap-1.5"
                    >
                      {copiedField === 'wa' ? <FaCheck className="text-[#25D366]" /> : <FaCopy />}
                      <span className="text-[11px] font-bold">{copiedField === 'wa' ? 'Tersalin' : 'Salin'}</span>
                    </button>

                    <a
                      href={getWhatsAppLink(whatsappNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-[#25D366]/20 active:scale-95"
                    >
                      <span>Chat WA</span>
                      <FaExternalLinkAlt size={10} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Baris 2: Email */}
            {hasEmail && (
              <div className="p-4 sm:p-4.5 rounded-2xl bg-[#09090B] border border-[#272438] hover:border-[#9D26FF]/40 transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#9D26FF]/10 border border-[#9D26FF]/20 flex items-center justify-center text-[#9D26FF] text-xl shrink-0 group-hover:scale-105 transition-transform">
                      <FaEnvelope />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold text-[#9D26FF] uppercase tracking-wider block">
                        Email
                      </span>
                      <span className="text-sm sm:text-base font-black text-white font-mono tracking-tight truncate block">
                        {emailAddress}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      onClick={() => handleCopy(emailAddress, 'email')}
                      type="button"
                      title="Salin Alamat Email"
                      className="px-3 py-2 rounded-xl bg-[#1E1C2E] border border-white/10 text-zinc-300 hover:text-white hover:border-[#9D26FF] transition-all text-xs flex items-center gap-1.5"
                    >
                      {copiedField === 'email' ? <FaCheck className="text-[#9D26FF]" /> : <FaCopy />}
                      <span className="text-[11px] font-bold">{copiedField === 'email' ? 'Tersalin' : 'Salin'}</span>
                    </button>

                    <a
                      href={`mailto:${emailAddress}?subject=${encodeURIComponent('Booking & Inquiry NOIZE')}`}
                      className="px-4 py-2 rounded-xl bg-[#9D26FF] hover:bg-[#8A1AD6] text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-[#9D26FF]/20 active:scale-95"
                    >
                      <span>Kirim Email</span>
                      <FaExternalLinkAlt size={10} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Baris 3: DM Instagram (Hanya muncul jika ada) */}
            {hasInstagram && (
              <div className="flex justify-start sm:justify-end pt-1">
                <a
                  href={getInstagramLink(rawInstagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-mono group"
                >
                  <FaInstagram className="text-[#E1306C] group-hover:scale-110 transition-transform text-sm" />
                  <span className="font-bold">DM Instagram</span>
                  <FaExternalLinkAlt size={10} className="text-zinc-500 group-hover:text-zinc-300" />
                </a>
              </div>
            )}

          </div>

        </div>
      </motion.div>
    </section>
  )
}

export default ManagerContactSection
