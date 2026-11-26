import React, { useState, useEffect } from 'react'
import {
  FaBookOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaShoppingCart,
  FaCalendar,
  FaUsers,
  FaBox,
  FaHome,
  FaInfoCircle,
  FaChartBar,
  FaEdit,
  FaArrowRight,
  FaArrowLeft,
  FaLightbulb,
  FaExclamationTriangle
} from 'react-icons/fa'

const MUST_DO = [
  'Cek Bukti Pembayaran dulu sebelum mengubah status PO jadi Checked agar hitungan di Recap dan Export sesuai.',
  'Pilih event yang sesuai di filter Orders sebelum mencatat Order OTS supaya masuk ke event yang benar.',
  'Cek Live Preview (Desktop & Mobile) setelah mengatur foto Hero atau konten halaman depan sebelum menekan Simpan.'
]

const DO_NOT = [
  'Jangan hapus Event atau Member yang masih punya transaksi. Tandai selesai atau nonaktifkan agar data Recap tidak hilang.',
  'Jangan unggah foto terlalu kecil atau rasio salah (3:4 profil, 4:5 Shop) agar gambar di website tidak pecah atau terpotong.',
  'Jangan lupa mematikan Maintenance setelah selesai mengedit, karena pengunjung tidak bisa membuka website selama mode ini aktif.'
]

const GUIDE_SECTIONS = [
  {
    id: 'orders',
    tabId: 'orders',
    title: '1. Orders',
    icon: FaShoppingCart,
    summary: 'Mengelola daftar pesanan Cheki dan Merch serta mencatat Order OTS.',
    steps: [
      'Pilih filter tab di atas: All, OTS, PO, Special, atau Merch untuk melihat jenis pesanan tertentu.',
      'Pada pesanan PO, klik "Lihat Bukti" untuk membuka foto bukti transfer atau QRIS yang diunggah pembeli.',
      'Ubah status pesanan di dropdown: Unchecked (baru masuk) → Checked (lunas) → Completed (selesai).',
      'Untuk mencatat Order OTS, pilih event di filter dulu lalu klik "+ Order OTS". Isi nama pembeli, pilih Cash atau QRIS, pilih member, lalu klik Simpan.',
      'Klik "Export Data" untuk mengunduh laporan pesanan dalam format PDF atau Excel.'
    ],
    tips: 'Status Checked dan Completed otomatis terhitung rapi di halaman Recap dan file Export PDF/Excel.',
    caution: 'Menghapus pesanan bersifat permanen dan langsung mengurangi total di Recap. Gunakan hanya untuk data ganda atau uji coba.'
  },
  {
    id: 'events',
    tabId: 'events',
    title: '2. Events',
    icon: FaCalendar,
    summary: 'Mengatur jadwal acara yang tampil di beranda dan halaman Shop.',
    steps: [
      'Klik "+ Tambah Event", lalu isi nama event, tanggal, lokasi, jam event, dan jam cheki.',
      'Di bagian Lineup, centang member yang ikut. Member yang tidak dicentang otomatis tampil "Not Attending" di Shop dan tidak muncul di form OTS.',
      'Untuk acara khusus, aktifkan "Special Event", isi nama tema, warna, serta atur apakah OTS dan harga khusus diaktifkan.',
      'Jika acara sudah lewat, ubah statusnya menjadi selesai agar tidak lagi muncul sebagai pilihan aktif di Shop.'
    ],
    tips: 'Jadwal yang aktif di sini otomatis tampil di bagian Schedule halaman depan dan dropdown pilih event di halaman Shop.',
    caution: 'Jangan menghapus event yang sudah memiliki pesanan. Tandai selesai saja agar riwayat transaksi dan Recap tetap aman.'
  },
  {
    id: 'members',
    tabId: 'members',
    title: '3. Members',
    icon: FaUsers,
    summary: 'Mengatur data grup NOIZE dan profil tiap member di website.',
    steps: [
      'Pada kartu NOIZE (grup) di atas, atur foto grup, foto Shop, tagline, Instagram resmi, dan saklar aktif/nonaktif Group Cheki.',
      'Klik "Edit" pada member atau "+ Tambah Member" untuk mengisi nama panggung, tanggal lahir, hobi, jikoshoukai, Instagram, dan angka urutan.',
      'Unggah Foto Profil (rasio 3:4) untuk halaman About Us / daftar member dan Foto Shop (rasio 4:5) untuk kartu Cheki.'
    ],
    tips: 'Angka urutan menentukan posisi member dari kiri ke kanan di halaman About Us dan Shop. Matikan saklar Group Cheki jika sesi grup sedang tidak dibuka.',
    caution: 'Menonaktifkan status hadir member lebih aman daripada menghapus member, karena data pesanan lama tetap utuh.'
  },
  {
    id: 'merch',
    tabId: 'merch',
    title: '4. Merchandise',
    icon: FaBox,
    summary: 'Mengatur batch PO, katalog produk, stok, dan foto merch di Shop.',
    steps: [
      'Buat atau aktifkan Batch Merch terlebih dahulu untuk mengelompokkan produk berdasarkan periode rilis.',
      'Klik "+ Tambah Merch", lalu isi nama produk, harga, stok, kategori, deskripsi, dan pilihan varian atau ukuran.',
      'Unggah foto utama produk dan foto size chart (jika ada).',
      'Gunakan tombol "Duplikat" untuk membuat produk baru dengan format yang mirip.'
    ],
    tips: 'Jika stok diisi 0 atau Batch Merch ditutup, produk otomatis berubah menjadi SOLD OUT di halaman Shop.',
    caution: 'Jangan menghapus Batch Merch yang masih memiliki pesanan aktif karena data pesanan terkait bisa ikut terdampak.'
  },
  {
    id: 'home',
    tabId: 'home',
    title: '5. Home',
    icon: FaHome,
    summary: 'Mengatur foto Hero, teks perkenalan, dan daftar FAQ di beranda.',
    steps: [
      'Buka bagian Hero untuk mengganti foto desktop dan mobile tiap member, lalu atur posisi atau zoom lewat Live Preview.',
      'Edit bagian "Who Is Noize" untuk mengubah teks perkenalan grup di halaman utama.',
      'Buka bagian FAQ untuk menambah, mengubah, atau menghapus daftar tanya-jawab di halaman depan.'
    ],
    tips: 'Gunakan tombol switch Desktop dan Mobile di Live Preview agar posisi wajah member tidak terpotong di layar HP maupun komputer.',
    caution: 'Perubahan posisi foto di Hero belum tersimpan ke website sebelum tombol Simpan diklik.'
  },
  {
    id: 'about',
    tabId: 'about',
    title: '6. About Us',
    icon: FaInfoCircle,
    summary: 'Mengatur cerita grup, galeri foto, tautan media, dan kontak.',
    steps: [
      'Ubah teks cerita, judul bagian, dan info kontak manager yang tampil di halaman About Us.',
      'Pada bagian Media, tambahkan atau perbarui foto carousel, link video YouTube, dan link lagu/album Spotify.',
      'Klik "Simpan Perubahan" di masing-masing bagian setelah selesai.'
    ],
    tips: 'Gunakan link YouTube dan Spotify yang bersifat publik agar pemutar media bisa langsung tampil di halaman About Us.',
    caution: 'Link video atau lagu yang berstatus private tidak akan muncul di website.'
  },
  {
    id: 'recap',
    tabId: 'recap',
    title: '7. Recap',
    icon: FaChartBar,
    summary: 'Melihat grafik dan ringkasan pemasukan Cheki serta Merch.',
    steps: [
      'Pilih mode tampilan Cheki atau Merch di bagian atas halaman.',
      'Gunakan filter Event untuk melihat total pemasukan dan jumlah tiket terjual pada acara tertentu.',
      'Lihat grafik perbandingan PO vs OTS untuk memantau jumlah penjualan per member.'
    ],
    tips: 'Angka di Recap dihitung otomatis dari data pesanan di tab Orders, sehingga akan langsung ikut berubah saat ada order baru atau status diperbarui.',
    caution: 'Pesanan yang masih berstatus Unchecked atau dibatalkan tetap memengaruhi tampilan jika belum dibersihkan.'
  },
  {
    id: 'settings',
    tabId: 'settings',
    title: '8. Settings',
    icon: FaEdit,
    summary: 'Mengatur harga default, QRIS, rekening, sosmed, dan Maintenance.',
    steps: [
      'Atur harga default untuk PO Member, PO Grup, OTS Member, dan OTS Grup.',
      'Unggah gambar QRIS dan isi nomor rekening bank yang ditampilkan saat pembeli melakukan Checkout.',
      'Perbarui tautan Instagram, TikTok, YouTube, X, Discord, dan WhatsApp yang muncul di footer dan halaman kontak.',
      'Aktifkan saklar Maintenance saat website sedang diperbaiki (pengunjung melihat halaman perbaikan, admin yang login tetap bisa membuka website).'
    ],
    tips: 'Harga default ini otomatis dipakai untuk semua event reguler, kecuali event spesial yang memakai harga khusus sendiri.',
    caution: 'Pastikan gambar QRIS terbaca jelas saat diuji di halaman Checkout, dan matikan Maintenance jika perbaikan sudah selesai.'
  }
]

const GuideTab = ({ setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState(null)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedSection(null)
    }
    if (selectedSection) {
      window.addEventListener('keydown', handleEsc)
    }
    return () => window.removeEventListener('keydown', handleEsc)
  }, [selectedSection])

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredSections = GUIDE_SECTIONS.filter((sec) => {
    if (!normalizedQuery) return true
    const haystack = [
      sec.title,
      sec.summary,
      ...sec.steps,
      sec.tips,
      sec.caution
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-[#13121D]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#9D26FF]/20 border border-[#9D26FF]/40 flex items-center justify-center text-[#9D26FF] shrink-0">
              <FaBookOpen className="text-lg" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Panduan Website & Dashboard
              </h2>
              <p className="text-[15px] text-zinc-300 mt-1 leading-relaxed">
                Panduan singkat cara kerja dan pengaturan isi website NOIZE.
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (selectedSection) setSelectedSection(null)
              }}
              placeholder="Cari panduan, mis: OTS, QRIS, stok..."
              className="w-full pl-10 pr-4 py-3 bg-[#1E1C2E] border border-white/10 rounded-xl text-[15px] text-white placeholder-zinc-500 focus:outline-none focus:border-[#9D26FF]"
            />
          </div>
        </div>
      </div>

      {/* Wajib Dilakukan & Jangan Dilakukan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#13121D]/90 border border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <FaCheckCircle />
            <span>Wajib Dilakukan</span>
          </div>
          <ul className="space-y-2.5 text-[15px] text-zinc-200 leading-relaxed">
            {MUST_DO.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#13121D]/90 border border-rose-500/25 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
            <FaTimesCircle />
            <span>Jangan Dilakukan</span>
          </div>
          <ul className="space-y-2.5 text-[15px] text-zinc-200 leading-relaxed">
            {DO_NOT.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Area Konten: Daftar 1 Kolom ATAU Halaman Detail Inline */}
      {selectedSection ? (
        <div className="bg-[#13121D]/90 border border-[#9D26FF]/40 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
          {/* Tombol Kembali + Header Detail */}
          <div className="space-y-4 pb-4 border-b border-white/10">
            <button
              type="button"
              onClick={() => setSelectedSection(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-zinc-200 hover:text-white transition"
            >
              <FaArrowLeft className="text-xs" />
              <span>Kembali ke Panduan</span>
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#9D26FF]/20 border border-[#9D26FF]/40 flex items-center justify-center text-[#9D26FF] shrink-0">
                <selectedSection.icon className="text-lg" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {selectedSection.title}
                </h3>
                <p className="text-[15px] text-zinc-300 mt-1 leading-relaxed">
                  {selectedSection.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Bagian 1: Langkah (Angka dalam Lingkaran) */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white">Langkah</h4>
            <ol className="space-y-3">
              {selectedSection.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] text-zinc-200 leading-relaxed">
                  <span className="w-7 h-7 rounded-full bg-[#9D26FF]/20 border border-[#9D26FF]/40 text-[#9D26FF] font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Bagian 2 & 3: Tips (Hijau) & Hati-hati (Merah Lembut) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-[15px]">
                <FaLightbulb />
                <span>Tips</span>
              </div>
              <p className="text-[15px] text-zinc-200 leading-relaxed">
                {selectedSection.tips}
              </p>
            </div>

            <div className="bg-rose-500/5 border border-rose-500/25 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-[15px]">
                <FaExclamationTriangle />
                <span>Hati-hati</span>
              </div>
              <p className="text-[15px] text-zinc-200 leading-relaxed">
                {selectedSection.caution}
              </p>
            </div>
          </div>

          {/* Tombol Buka Menu di Bawah */}
          {setActiveTab && (
            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab(selectedSection.tabId)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9D26FF] hover:bg-[#8215db] text-white text-sm font-bold transition shadow-lg shadow-[#9D26FF]/25"
              >
                <span>Buka Menu {selectedSection.title.replace(/^\d+\.\s*/, '')}</span>
                <FaArrowRight className="text-xs" />
              </button>
            </div>
          )}
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="bg-[#13121D]/80 border border-white/10 rounded-2xl p-8 text-center text-zinc-400 text-[15px] space-y-2">
          <FaExclamationTriangle className="text-amber-400 text-xl mx-auto" />
          <p>Tidak ada panduan yang cocok dengan &ldquo;{searchQuery}&rdquo;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setSelectedSection(section)}
                className="w-full text-left bg-[#13121D]/90 border border-white/10 hover:border-[#9D26FF]/60 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shadow-md transition-all hover:bg-[#181624] group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#9D26FF]/15 border border-[#9D26FF]/35 flex items-center justify-center text-[#9D26FF] shrink-0">
                    <Icon className="text-sm" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5 min-w-0">
                    <span className="text-base font-bold text-white group-hover:text-[#9D26FF] transition-colors shrink-0">
                      {section.title}
                    </span>
                    <span className="hidden sm:inline text-zinc-600">—</span>
                    <span className="text-[15px] text-zinc-300 leading-snug">
                      {section.summary}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#9D26FF] shrink-0 self-end sm:self-center group-hover:translate-x-0.5 transition-transform">
                  <span>Lihat panduan</span>
                  <FaArrowRight className="text-xs" />
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Catatan Kecil di Paling Bawah */}
      <div className="bg-[#13121D]/75 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2 text-[15px] text-zinc-300 leading-relaxed">
        <p>
          Perubahan di Events, Members, Merchandise, Home, About Us, dan Settings langsung tampil di website publik. Selalu Logout setelah selesai, apalagi di perangkat bersama, dan jangan bagikan login admin ke orang lain.
        </p>
        <p className="text-zinc-400">
          <strong className="text-zinc-200">Retensi Data (Data lama dihapus otomatis):</strong> foto bukti bayar PO dihapus setelah 1 bulan (30 hari). Event beserta semua data pesanannya dihapus setelah 2 bulan (60 hari) sejak tanggal event. Unduh laporan (PDF/Excel) sebelum waktu itu.
        </p>
      </div>
    </div>
  )
}

export default GuideTab
