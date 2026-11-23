import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaMinus } from 'react-icons/fa'

const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    tanya: 'Apa itu sesi Cheki di NOIZE?',
    jawab: 'Cheki adalah sesi foto polaroid instan (2-Shot bersama member idola pilihan Anda atau 1 frame seluruh member). Setiap foto ditandatangani langsung oleh member dengan pesan personal eksklusif saat event.'
  },
  {
    id: 'faq-2',
    tanya: 'Bagaimana cara memesan tiket Cheki dan Merchandise?',
    jawab: 'Buka menu Shop resmi, pilih kategori Cheki atau Apparel yang Anda inginkan, masukkan ke keranjang, lalu selesaikan pembayaran melalui transfer bank terverifikasi.'
  },
  {
    id: 'faq-3',
    tanya: 'Setelah checkout berhasil, apa yang harus dilakukan saat hari acara?',
    jawab: 'Anda akan menerima bukti konfirmasi digital / nomor pesanan. Tunjukkan bukti tersebut ke booth resmi NOIZE di venue untuk ditukar dengan tiket antrean fisik.'
  },
  {
    id: 'faq-4',
    tanya: 'Apakah menerima pembelian tiket Cheki langsung di lokasi (OTS)?',
    jawab: 'Ya, tiket Cheki dan merchandise tersedia untuk pembelian On The Spot (OTS) di venue selama slot kuota sesi per member masih tersedia.'
  },
  {
    id: 'faq-5',
    tanya: 'Bagaimana jika berhalangan hadir setelah memesan?',
    jawab: 'Pesanan tiket yang telah dibayar tidak dapat dibatalkan, namun Anda dapat menghubungi admin kami melalui Instagram @noize.official sebelum event untuk konfirmasi delegasi.'
  }
]

const FAQSection = ({ faqSettings, faqs = [], openFaq, setOpenFaq }) => {
  const activeFaqs = (faqs && faqs.length > 0)
    ? faqs.filter(f => f.is_active !== false)
    : DEFAULT_FAQS.filter(f => f.is_active !== false)

  if (!activeFaqs || activeFaqs.length === 0) {
    return null
  }

  const badge = faqSettings?.badge || 'FREQUENTLY ASKED'
  const title = faqSettings?.title || 'HELP CENTER'
  const subtitle = faqSettings?.subtitle || 'Pertanyaan umum seputar jadwal, pemesanan tiket Cheki, dan merchandise NOIZE.'

  return (
    <section id="faq" className="py-14 sm:py-18 md:py-24 bg-pattern-lines-b text-white relative z-40 border-t border-[#272438]">
      <div className="container mx-auto max-w-3xl px-4 relative z-10">
        <div className="text-center mb-10 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase text-white">
          {/CENTER/i.test(title) ? (
            <>
              {title.split(/CENTER/i)[0]}
              <span className="text-[#9D26FF]">CENTER</span>
              {title.split(/CENTER/i)[1] || ''}
            </>
          ) : (
            title
          )}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {subtitle}
        </p>
      </div>

      <div className="space-y-3.5">
        {activeFaqs.map((faq, idx) => (
          <motion.div 
            key={faq.id || idx} 
            initial={{ opacity: 0, y: 10 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: idx * 0.05 }}
            className={`transition-all duration-300 border border-[#272438] hover:border-[#9D26FF] bg-[#13121D] rounded-2xl overflow-hidden shadow-sm ${openFaq === idx ? 'border-[#9D26FF]' : ''}`}
          >
            <button 
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
              className="w-full py-4 sm:py-5 px-5 sm:px-6 text-left flex items-center justify-between gap-4 group relative overflow-hidden"
            >
              <span className={`text-sm sm:text-base font-bold transition-colors ${openFaq === idx ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                {faq.tanya}
              </span>
              <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${openFaq === idx ? 'bg-[#9D26FF] text-white rotate-180' : 'bg-[#1E1C2E] text-zinc-400 group-hover:text-white'}`}>
                {openFaq === idx ? <FaMinus size={9} /> : <FaPlus size={9} />}
              </div>
            </button>
            <AnimatePresence>
              {openFaq === idx && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  transition={{ duration: 0.25, ease: "easeInOut" }} 
                  className="overflow-hidden"
                >
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-zinc-300 text-xs sm:text-sm font-normal leading-relaxed border-t border-[#272438]/60">
                    {faq.jawab}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        </div>
      </div>
    </section>
  )
}

export default FAQSection
