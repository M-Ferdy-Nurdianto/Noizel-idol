# PANDUAN DESAIN DAN ATURAN VISUAL NOIZE

Dokumen ini merupakan aturan baku desain UI/UX untuk seluruh website NOIZE (baik halaman publik/user maupun dashboard admin). Aturan ini WAJIB dipatuhi oleh seluruh developer dan AI assistant agar kualitas visual tetap bersih, profesional, modern, dan bebas dari ornamen generik ("AI slop").

---

## 1. LARANGAN KERAS ELEMEN "AI SLOP"

Dilarang keras menyematkan elemen-elemen klise generik berikut di seluruh halaman website:

1. **Dilarang Pill Badge / Kapsul Mengambang di Atas Judul**
   - ❌ **Dilarang**: Menyematkan kapsul mengambang (pill badge dengan `rounded-full border`) yang diletakkan di atas judul section (contoh: `[ ● ABOUT NOIZE ]`, `[ 🛍️ OFFICIAL MERCHANDISE ]`, `[ ● OFFICIAL STORE ]`, `[ 🎫 JADWAL & TIKET ]`).
   - ✔️ **Aturan Benar**: Judul section harus bersih, tegas, dan langsung (*direct heading*). Jangan menduplikasi teks judul ke dalam pill badge kecil di atasnya.

2. **Dilarang Dot Bulat Berkedip / Glowing Dots**
   - ❌ **Dilarang**: Titik bulat kecil berwarna ungu/cyan (`w-2 h-2 rounded-full bg-[#9D26FF]` atau `w-1.5 h-1.5 rounded-full`) yang berkedip (`animate-pulse`, `animate-ping`) yang ditaruh di samping label, teks eyebrow, atau sidebar.
   - ✔️ **Aturan Benar**: Gunakan tipografi bersih tanpa ornamen titik berkedip. Status aktif cukup ditandai dengan warna teks atau indikator fungsional yang relevan.

3. **Dilarang Micro-Eyebrows Berlebihan & Redundan**
   - ❌ **Dilarang**: Teks kecil kapital dengan spasi renggang berlebihan (seperti `tracking-[0.3em]` atau `tracking-[0.35em] font-mono`) yang mengulang isi judul di bawahnya (contoh: teks kecil "OFFICIAL STORE" tepat di atas judul besar "OFFICIAL MERCH", atau "2-SHOT & GROUP" di atas "MEMBER & GROUP CHEKI").
   - ✔️ **Aturan Benar**: Hirarki teks harus langsung to the point: Judul utama yang proporsional, diikuti subjudul/deskripsi fungsional satu baris jika memang diperlukan.

4. **Dilarang Efek Glitch / Chromatic Aberration / 3D Offset**
   - ❌ **Dilarang**: Efek bayangan teks bergeser merah-biru / cyan-magenta yang membuat teks buram dan tampak seperti template generator murahan.
   - ✔️ **Aturan Benar**: Teks harus tajam, kontras tinggi, dan mudah dibaca (*high legibility*).

5. **Dilarang Teks Slogan / Paragraf Promosi Buatan**
   - ❌ **Dilarang**: Menambah-nambahkan kalimat promosi berbunga-bunga buatan sendiri (contoh: "Koleksi merchandise resmi untuk melengkapi dukunganmu di setiap panggung pertunjukan").
   - ✔️ **Aturan Benar**: Teks murni label fungsional atau data nyata yang diinput admin via database/CMS.

---

## 2. PRINSIP DESAIN RESMI NOIZE

1. **Palet Warna Utama**:
   - Background: Dark Obsidian / Space Black (`#070B14`, `#09090B`, `#13121D`).
   - Aksen Utama: Ungu Elektrik (`#9D26FF`), Cyan Tajam (`#24C6F5`).
   - Aksen Event Spesial: Sesuai `theme_color` yang diinput admin.
2. **Layout & Ruang Visual**:
   - Ruang kosong lega (*ample breathing room*), grid simetris dan rapi, sudut membulat proporsional (`rounded-2xl` atau `rounded-xl`).
   - Tanpa banner promosi palsu di bawah halaman katalog.
   - Konten katalog dan event mendapat porsi lebar penuh (*full-width*) tanpa terdesak oleh widget statis permanen.
3. **Komponen Fungsional**:
   - Switcher sub-halaman: Segmented control sederhana (`Merch` | `Cheki`) yang sticky di mobile dan tersinkronisasi dengan query URL `?tab=merch` / `?tab=cheki`.
   - Data murni dari database/CMS, tanpa hardcode.
