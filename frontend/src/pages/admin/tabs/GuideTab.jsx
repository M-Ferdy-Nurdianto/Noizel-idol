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
  'Cek Bukti Pembayaran dulu sebelum mengubah status PO jadi Checked.',
  'Pilih event yang benar di filter sebelum mencatat Order OTS.',
  'Cek Live Preview (Desktop & Mobile) setelah mengubah foto atau isi halaman.'
]

const DO_NOT = [
  'Jangan ubah status ke Completed sebelum cheki atau merch diterima pembeli.',
  'Jangan hapus Event atau Member yang sudah punya transaksi. Cukup nonaktifkan atau tandai selesai.',
  'Jangan ubah harga atau aturan biaya saat penjualan berjalan tanpa persetujuan tim.'
]

const GUIDE_SECTIONS = [
  {
    id: 'orders',
    tabId: 'orders',
    title: '1. Orders',
    icon: FaShoppingCart,
    summary: 'Buka ini untuk mengecek atau mencatat pesanan.',
    steps: [
      'Pilih jenis pesanan di bagian atas: All, OTS, PO, Special, atau Merch.',
      'Pada pesanan PO, klik "Lihat Bukti" untuk memastikan pembeli sudah transfer atau bayar QRIS.',
      'Ubah status bertahap: Unchecked → Checked → Completed.',
      'Untuk pesanan OTS, pilih event di filter dulu, lalu klik "+ Order OTS". Isi nama pembeli, pilih cara bayar (Cash atau QRIS) dan member, lalu klik Simpan.',
      'Klik "Export Data" untuk mengunduh laporan PDF atau Excel.'
    ],
    tips: 'Cek nominal dan foto bukti transfer sebelum status Checked. Pastikan filter event sudah benar sebelum membuka form OTS.',
    caution: 'Jangan ubah ke Completed kalau barang belum benar-benar diterima pembeli. Jangan hapus pesanan asli, kecuali pesanan ganda atau uji coba.'
  },
  {
    id: 'events',
    tabId: 'events',
    title: '2. Events',
    icon: FaCalendar,
    summary: 'Buka ini untuk mengatur jadwal event dan member yang tampil.',
    steps: [
      'Klik "+ Tambah Event". Isi nama, tanggal, lokasi, jam event, dan jam cheki.',
      'Di bagian Lineup, centang member yang hadir. Member yang tidak dicentang akan tampil "Not Attending" di halaman Shop.',
      'Untuk event spesial, aktifkan "Special Event", isi tema dan warna, lalu pilih OTS aktif atau tidak.',
      'Event yang sudah lewat: ubah statusnya jadi selesai agar hilang dari pilihan.'
    ],
    tips: 'Cek Lineup paling lambat H-1 sebelum acara. Tulis jam event dan jam cheki dengan jelas agar rapi di halaman utama dan Shop.',
    caution: 'Jangan hapus event yang sudah punya transaksi, cukup tandai selesai. Klik Simpan sebelum menutup form.'
  },
  {
    id: 'members',
    tabId: 'members',
    title: '3. Members',
    icon: FaUsers,
    summary: 'Buka ini untuk mengatur profil grup dan member.',
    steps: [
      'Di kartu NOIZE (grup) paling atas, atur foto grup, foto Shop, tagline, Instagram resmi, dan status Group Cheki.',
      'Klik "Edit" pada member, atau "+ Tambah Member". Isi nama panggilan, tanggal lahir, hobi, jikoshoukai, Instagram, dan urutan tampil.',
      'Unggah Foto Profil (rasio 3:4) dan Foto Shop (rasio 4:5).'
    ],
    tips: 'Pakai foto yang terang dan jelas. Atur angka urutan untuk menentukan posisi member di halaman.',
    caution: 'Jangan hapus member yang masih terhubung dengan pesanan lama. Kalau member sedang hiatus, nonaktifkan saja.'
  },
  {
    id: 'merch',
    tabId: 'merch',
    title: '4. Merchandise',
    icon: FaBox,
    summary: 'Buka ini untuk mengatur produk dan penjualan merch.',
    steps: [
      'Buat atau aktifkan Batch Merch dulu, supaya produk terkelompok per periode PO.',
      'Klik "+ Tambah Merch". Isi nama, harga, stok, kategori, deskripsi, dan varian atau ukuran.',
      'Unggah foto produk dan foto size chart (kalau ada).',
      'Klik "Duplikat" untuk membuat produk baru dari produk lama.'
    ],
    tips: 'Kalau stok diisi 0, produk otomatis tampil SOLD OUT. Pasang size chart yang jelas untuk kaos atau hoodie.',
    caution: 'Jangan hapus batch yang pesanannya masih berjalan. Jangan ubah harga saat penjualan ramai tanpa konfirmasi tim.'
  },
  {
    id: 'home',
    tabId: 'home',
    title: '5. Home',
    icon: FaHome,
    summary: 'Buka ini untuk mengatur tampilan halaman depan.',
    steps: [
      'Buka bagian Hero. Atur foto desktop dan mobile tiap member, lalu geser posisi atau zoom lewat Live Preview.',
      'Edit teks "Who Is Noize" untuk memperbarui pengenalan grup.',
      'Di bagian FAQ, tambah, ubah, atau hapus pertanyaan yang sering ditanyakan.'
    ],
    tips: 'Selalu cek Live Preview Desktop dan Mobile sebelum menekan Simpan. Tulis jawaban FAQ singkat dan jelas.',
    caution: 'Jangan unggah foto beresolusi terlalu kecil karena jadi pecah. Jangan lupa klik Simpan setelah menggeser foto.'
  },
  {
    id: 'about',
    tabId: 'about',
    title: '6. About Us',
    icon: FaInfoCircle,
    summary: 'Buka ini untuk mengatur cerita, media, dan kontak.',
    steps: [
      'Edit teks cerita, judul bagian, dan kontak manager resmi.',
      'Di bagian Media, atur galeri foto, video YouTube, dan rilisan Spotify.',
      'Klik "Simpan Perubahan" di tiap bagian setelah selesai.'
    ],
    tips: 'Pastikan link YouTube dan Spotify bisa dibuka publik. Pakai foto galeri berorientasi landscape.',
    caution: 'Jangan cantumkan nomor pribadi di luar kontak manager resmi. Jangan pasang link video atau lagu yang bersifat private.'
  },
  {
    id: 'recap',
    tabId: 'recap',
    title: '7. Recap',
    icon: FaChartBar,
    summary: 'Buka ini untuk melihat ringkasan penjualan.',
    steps: [
      'Pilih tampilan Cheki atau Merch di bagian atas.',
      'Pakai filter Event untuk melihat total pemasukan dan jumlah tiket di event tertentu.',
      'Lihat grafik PO vs OTS untuk membandingkan penjualan tiap member.'
    ],
    tips: 'Pakai data Recap setelah semua pesanan berstatus Checked atau Completed. Bandingkan angkanya dengan hasil Export saat event selesai.',
    caution: 'Jangan anggap angka Recap sudah final kalau masih ada pesanan Unchecked atau batal.'
  },
  {
    id: 'settings',
    tabId: 'settings',
    title: '8. Settings',
    icon: FaEdit,
    summary: 'Buka ini untuk harga, pembayaran, sosmed, dan Maintenance.',
    steps: [
      'Atur harga PO Member, PO Grup, OTS Member, dan OTS Grup.',
      'Unggah gambar QRIS dan isi rekening bank untuk halaman Checkout.',
      'Perbarui link Instagram, TikTok, YouTube, X, Discord, dan WhatsApp.',
      'Aktifkan Maintenance saat website sedang diperbaiki (admin tetap bisa melihat website).'
    ],
    tips: 'Setelah ganti QRIS, coba lihat tampilannya di halaman Checkout. Matikan Maintenance segera setelah perbaikan selesai.',
    caution: 'Jangan ubah harga atau biaya tanpa persetujuan penanggung jawab. Jangan biarkan Maintenance menyala tanpa info kapan website buka lagi.'
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
                Panduan Admin & Staff
              </h2>
              <p className="text-[15px] text-zinc-300 mt-1 leading-relaxed">
                Panduan singkat mengurus dashboard NOIZE, langkah demi langkah.
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
