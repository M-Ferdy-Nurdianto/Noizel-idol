import React, { useState } from 'react'
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
  FaChevronDown,
  FaArrowRight,
  FaShieldAlt,
  FaExclamationTriangle
} from 'react-icons/fa'

const GUIDE_SECTIONS = [
  {
    id: 'orders',
    tabId: 'orders',
    title: 'Orders (Pesanan Cheki & Merch)',
    icon: FaShoppingCart,
    summary: 'Kelola pesanan online (PO), input pesanan langsung di venue (OTS), verifikasi bukti bayar, dan export laporan.',
    steps: [
      'Gunakan sub-tab All (Reg), OTS, PO, Special, atau Merch untuk menyaring jenis pesanan.',
      'Klik tombol "Bukti" / "Lihat Bukti" pada pesanan PO untuk memeriksa keaslian bukti transfer atau QRIS.',
      'Ubah status pesanan secara bertahap: Unchecked (baru masuk) → Checked (lunas/valid) → Completed (cheki/merch sudah diserahkan).',
      'Untuk input Order OTS: pilih Event yang sedang berlangsung di filter dropdown terlebih dahulu, lalu klik "+ Order OTS" (atau "+ Order OTS Spesial" di sub-tab Special). Event otomatis terkunci ke event yang sedang dibuka.',
      'Pada form OTS, isi nama pembeli, pilih metode bayar (Cash / Tunai atau QRIS), pilih member/grup, lalu klik Simpan.',
      'Klik "Export Data" untuk mengunduh laporan transaksi dalam format PDF atau Excel (.xlsx).'
    ],
    dos: [
      'Pastikan filter event sesuai sebelum membuka form Order OTS.',
      'Selalu cek nominal & foto bukti transfer sebelum mengubah status ke Checked.'
    ],
    donts: [
      'Jangan ubah status ke Completed jika item belum benar-benar diambil pembeli.',
      'Jangan hapus order asli kecuali duplikat atau pesanan uji coba.'
    ]
  },
  {
    id: 'events',
    tabId: 'events',
    title: 'Events (Jadwal & Lineup Member)',
    icon: FaCalendar,
    summary: 'Tambah atau ubah jadwal event reguler/spesial, atur jam event & cheki, serta tentukan lineup member yang hadir.',
    steps: [
      'Klik "+ Tambah Event" untuk membuat jadwal baru. Isi nama, tanggal, bulan, tahun, lokasi, jam event, dan jam cheki.',
      'Centang member yang hadir pada bagian Lineup. Member yang tidak dicentang akan otomatis tampil "Not Attending" di halaman Shop.',
      'Untuk Event Spesial: aktifkan opsi Special Event, isi nama tema, warna aksen, serta atur apakah fitur OTS aktif dan harga khusus bila ada.',
      'Gunakan status selesai/past untuk event yang sudah lewat agar tidak muncul di pilihan aktif.'
    ],
    dos: [
      'Perbarui lineup member minimal H-1 sebelum acara agar pembeli tidak salah memesan.',
      'Isi jam event dan jam cheki dengan jelas agar tampil rapi di halaman utama & shop.'
    ],
    donts: [
      'Jangan menghapus event yang sudah memiliki data transaksi; cukup tandai sebagai selesai.',
      'Jangan lupa menyimpan perubahan lineup sebelum menutup modal.'
    ]
  },
  {
    id: 'members',
    tabId: 'members',
    title: 'Members (Data Grup & Member)',
    icon: FaUsers,
    summary: 'Atur profil resmi grup NOIZE, tambah/edit profil member, foto KTP/Shop, dan urutan tampil.',
    steps: [
      'Kartu NOIZE (Grup) di bagian atas mengatur foto grup, foto showcase shop, tagline, Instagram resmi, dan saklar aktif/nonaktif Group Cheki.',
      'Klik "Edit" pada member atau "+ Tambah Member" untuk mengisi nama panggung, tanggal lahir, hobi, jikoshoukai, Instagram, dan urutan tampil.',
      'Unggah Foto Profil (rasio 3:4) untuk tampilan daftar member/KTP dan Foto Shop (rasio 4:5) untuk kartu Cheki.',
      'Warna identitas grup dan member otomatis mengikuti warna ungu website (#9D26FF).'
    ],
    dos: [
      'Gunakan foto dengan pencahayaan jelas dan rasio yang sesuai (3:4 profil, 4:5 shop).',
      'Atur angka urutan (order_index) untuk menentukan posisi tampil member.'
    ],
    donts: [
      'Jangan hapus data member yang masih terhubung ke riwayat order lama jika masih dibutuhkan untuk rekap.',
      'Jangan biarkan status hadir aktif jika member sedang hiatus/tidak ikut event dalam waktu lama.'
    ]
  },
  {
    id: 'merch',
    tabId: 'merch',
    title: 'Merchandise (Katalog & Batch PO)',
    icon: FaBox,
    summary: 'Kelola batch penjualan merchandise, tambah/edit produk apparel & aksesoris, serta atur stok.',
    steps: [
      'Buat atau aktifkan Batch Merch terlebih dahulu agar produk dapat dikelompokkan per periode PO/rilis.',
      'Klik "+ Tambah Merch" untuk mengisi nama produk, harga, stok, kategori, deskripsi, dan pilihan varian/ukuran.',
      'Unggah foto produk utama dan foto size chart (bila ada) pada kolom yang tersedia.',
      'Gunakan tombol Duplikat bila ingin membuat produk baru dengan format mirip dari produk sebelumnya.'
    ],
    dos: [
      'Update jumlah stok secara berkala atau set ke 0 bila sudah habis (otomatis bertanda SOLD OUT).',
      'Sertakan size chart yang jelas untuk produk pakaian seperti kaos atau hoodie.'
    ],
    donts: [
      'Jangan menghapus batch yang masih memiliki pesanan berjalan.',
      'Jangan ubah harga produk mendadak saat batch sedang ramai tanpa konfirmasi tim.'
    ]
  },
  {
    id: 'home',
    tabId: 'home',
    title: 'Home (Hero, Who Is Noize & FAQ)',
    icon: FaHome,
    summary: 'Sesuaikan foto & posisi member di Hero beranda, teks perkenalan grup, dan daftar FAQ.',
    steps: [
      'Masuk ke sub-bagian Hero untuk mengatur foto desktop dan mobile tiap member, lalu geser posisi/zoom lewat Live Preview.',
      'Edit teks "Who Is Noize" untuk memperbarui narasi pengenalan singkat di halaman depan.',
      'Kelola bagian FAQ untuk menambah, mengubah, atau menghapus pertanyaan yang sering ditanyakan pembeli.'
    ],
    dos: [
      'Selalu cek Live Preview mode Desktop dan Mobile sebelum menekan Simpan.',
      'Gunakan jawaban FAQ yang singkat, padat, dan jelas untuk pembeli baru.'
    ],
    donts: [
      'Jangan upload foto resolusi terlalu kecil agar tampilan Hero tetap tajam.',
      'Jangan lupa klik Simpan setelah menggeser posisi foto di Hero.'
    ]
  },
  {
    id: 'about',
    tabId: 'about',
    title: 'About Us (Cerita & Media)',
    icon: FaInfoCircle,
    summary: 'Perbarui cerita perjalanan NOIZE, banner ajakan, kontak manager, serta link YouTube, Spotify, dan galeri.',
    steps: [
      'Edit teks narasi About Us, judul section, dan informasi kontak manager resmi.',
      'Masuk ke bagian Media untuk memperbarui carousel galeri foto, tautan video YouTube, dan rilisan Spotify.',
      'Klik Simpan Perubahan pada masing-masing bagian setelah selesai mengedit.'
    ],
    dos: [
      'Pastikan link YouTube dan Spotify valid dan dapat dibuka publik.',
      'Gunakan foto galeri beresolusi baik dengan orientasi lanskap untuk carousel.'
    ],
    donts: [
      'Jangan mencantumkan nomor kontak pribadi di luar kontak resmi manager.',
      'Jangan memasukkan link video/lagu yang bersifat private.'
    ]
  },
  {
    id: 'recap',
    tabId: 'recap',
    title: 'Recap (Rekapitulasi & Grafik)',
    icon: FaChartBar,
    summary: 'Pantau ringkasan pemasukan Cheki & Merch, jumlah polaroid tercetak, serta grafik penjualan per member.',
    steps: [
      'Pilih mode tampilan Cheki atau Merch pada bagian atas halaman Recap.',
      'Gunakan filter Event untuk melihat total pemasukan dan jumlah tiket terjual pada event tertentu.',
      'Periksa grafik perbandingan Pre-Order vs OTS untuk membantu evaluasi penjualan per member.'
    ],
    dos: [
      'Gunakan data Recap setelah semua status pesanan selesai diverifikasi (Checked/Completed).',
      'Bandingkan angka Recap dengan hasil Export Excel/PDF saat tutup buku event.'
    ],
    donts: [
      'Jangan jadikan angka Recap sebagai patokan final jika masih banyak order berstatus Unchecked/batal.'
    ]
  },
  {
    id: 'settings',
    tabId: 'settings',
    title: 'Settings (Harga, Pembayaran, Sosmed & Maintenance)',
    icon: FaEdit,
    summary: 'Atur tarif dasar Cheki/OTS, QRIS & rekening bank, tautan media sosial, aturan fee, dan Mode Maintenance.',
    steps: [
      'Atur harga default PO Member, PO Grup, OTS Member, dan OTS Grup sesuai ketentuan terbaru.',
      'Unggah gambar QRIS dan isi detail rekening transfer bank yang akan tampil pada halaman Checkout.',
      'Perbarui link Instagram, TikTok, YouTube, X/Twitter, Discord, dan Channel WhatsApp resmi.',
      'Aktifkan Mode Maintenance bila website sedang dalam perbaikan besar (Admin yang login tetap dapat melihat preview website).'
    ],
    dos: [
      'Uji coba tampilan QRIS di halaman Checkout setelah mengganti gambar QRIS baru.',
      'Matikan kembali Mode Maintenance segera setelah perbaikan selesai.'
    ],
    donts: [
      'Jangan mengubah nominal harga atau aturan fee tanpa persetujuan penanggung jawab keuangan.',
      'Jangan tinggalkan halaman dalam Mode Maintenance tanpa pesan estimasi waktu yang jelas.'
    ]
  }
]

const GuideTab = ({ setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [openSectionId, setOpenSectionId] = useState('orders')

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredSections = GUIDE_SECTIONS.filter((sec) => {
    if (!normalizedQuery) return true
    const haystack = [
      sec.title,
      sec.summary,
      ...sec.steps,
      ...sec.dos,
      ...sec.donts
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  const toggleSection = (id) => {
    setOpenSectionId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="bg-[#13121D]/90 backdrop-blur-xl border border-[#9D26FF]/30 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#9D26FF]/20 border border-[#9D26FF]/40 flex items-center justify-center text-[#9D26FF] shrink-0">
              <FaBookOpen className="text-lg" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                Panduan Admin & Staff
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Ringkasan lengkap cara penggunaan seluruh fitur dashboard, alur kerja harian, serta aturan yang boleh dan tidak boleh dilakukan.
              </p>
            </div>
          </div>

          {/* Search Panduan */}
          <div className="relative w-full md:w-72 shrink-0">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari panduan (mis: OTS, QRIS, stok)..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#1E1C2E] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#9D26FF]"
            />
          </div>
        </div>
      </div>

      {/* Aturan Utama: Boleh vs Tidak Boleh */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#13121D]/90 border border-emerald-500/25 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
            <FaCheckCircle className="text-sm" />
            <span>Yang Wajib / Boleh Dilakukan (Do&apos;s)</span>
          </div>
          <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span>Selalu periksa <strong>Bukti Pembayaran</strong> sebelum mengubah status order PO menjadi <strong>Checked</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span>Pilih event yang sesuai di filter <strong>Orders</strong> sebelum menginput transaksi <strong>Order OTS</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span>Cek <strong>Live Preview</strong> (Desktop & Mobile) saat mengubah foto Hero atau konten halaman depan.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span>Gunakan akun <strong>Mode Tamu (GS123)</strong> jika hanya ingin mencoba fitur atau demo tanpa mengubah data asli.</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#13121D]/90 border border-rose-500/25 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider">
            <FaTimesCircle className="text-sm" />
            <span>Yang Dilarang / Hindari (Don&apos;ts)</span>
          </div>
          <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold mt-0.5">•</span>
              <span>Jangan ubah status ke <strong>Completed</strong> sebelum cheki atau merchandise diterima pembeli.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold mt-0.5">•</span>
              <span>Jangan hapus <strong>Event</strong> atau <strong>Member</strong> yang masih punya transaksi aktif; ubah statusnya menjadi selesai/tidak hadir.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold mt-0.5">•</span>
              <span>Jangan mengubah <strong>Harga Dasar</strong> atau <strong>Aturan Fee</strong> saat penjualan berlangsung tanpa persetujuan tim.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold mt-0.5">•</span>
              <span>Jangan bagikan kredensial login Admin kepada pihak yang tidak berkepentingan.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Catatan Keamanan & Akun */}
      <div className="bg-[#13121D]/80 border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3 text-xs text-zinc-300">
        <FaShieldAlt className="text-amber-400 text-base shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">Catatan Akses & Keamanan</p>
          <p className="leading-relaxed">
            Setiap perubahan di tab <strong>Events</strong>, <strong>Members</strong>, <strong>Merchandise</strong>, <strong>Home</strong>, <strong>About Us</strong>, dan <strong>Settings</strong> langsung berdampak ke website publik. Pastikan selalu logout setelah selesai menggunakan perangkat bersama.
          </p>
        </div>
      </div>

      {/* Daftar Panduan Per Tab */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Panduan Lengkap Tiap Fitur ({filteredSections.length})
          </h3>
        </div>

        {filteredSections.length === 0 ? (
          <div className="bg-[#13121D]/80 border border-white/10 rounded-2xl p-8 text-center text-zinc-400 text-xs space-y-2">
            <FaExclamationTriangle className="text-amber-400 text-xl mx-auto" />
            <p>Tidak ada panduan yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.</p>
          </div>
        ) : (
          filteredSections.map((section) => {
            const Icon = section.icon
            const isOpen = normalizedQuery ? true : openSectionId === section.id

            return (
              <div
                key={section.id}
                className={`bg-[#13121D]/90 border rounded-2xl overflow-hidden transition-all ${
                  isOpen ? 'border-[#9D26FF]/40 shadow-lg' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isOpen
                        ? 'bg-[#9D26FF]/20 border-[#9D26FF]/40 text-[#9D26FF]'
                        : 'bg-[#1E1C2E] border-white/10 text-zinc-400'
                    }`}>
                      <Icon className="text-base" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-black text-white truncate">
                        {section.title}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                        {section.summary}
                      </p>
                    </div>
                  </div>
                  <FaChevronDown
                    className={`text-zinc-400 text-xs shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#9D26FF]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-white/5 space-y-4">
                    {/* Cara Menggunakan */}
                    <div>
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-[#9D26FF] mb-2">
                        Cara Pakai & Mengubah Data
                      </h5>
                      <ol className="space-y-1.5 text-xs text-zinc-300 list-decimal list-inside leading-relaxed">
                        {section.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Boleh & Tidak Boleh Spesifik Fitur */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <FaCheckCircle /> Boleh / Disarankan
                        </div>
                        <ul className="space-y-1 text-[11px] text-zinc-300 leading-relaxed">
                          {section.dos.map((d, i) => (
                            <li key={i}>• {d}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 space-y-1.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <FaTimesCircle /> Tidak Boleh / Hindari
                        </div>
                        <ul className="space-y-1 text-[11px] text-zinc-300 leading-relaxed">
                          {section.donts.map((d, i) => (
                            <li key={i}>• {d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {setActiveTab && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab(section.tabId)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E1C2E] hover:bg-[#9D26FF] border border-white/10 hover:border-[#9D26FF] text-xs font-bold text-zinc-200 hover:text-white transition-all"
                        >
                          <span>Buka Tab {section.title.split(' ')[0]}</span>
                          <FaArrowRight className="text-[10px]" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default GuideTab
