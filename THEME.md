# NOIZE Official Color Palette & Design System

Panduan resmi identitas visual dan sistem warna untuk portal web pengguna dan panel administrasi **NOIZE**.

---

## 1. Core Color Palette

| Token / Peran | Hex Code | RGB | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas Utama (Background)** | `#09090B` | `rgb(9, 9, 11)` | Latar belakang dasar web (`nz-bg`, `bg-dark`) |
| **Surface / Card** | `#13121D` | `rgb(19, 18, 29)` | Kontainer kartu, modal, header, sidebar (`nz-surface`) |
| **Surface Hover** | `#1E1C2E` | `rgb(30, 28, 46)` | State hover pada baris tabel, tombol sekunder, card hover |
| **Primary (Electric Violet)** | `#9D26FF` | `rgb(157, 38, 255)` | Warna brand utama, tombol aksi utama, link aktif, neon glow |
| **Accent 1 (Neon Magenta)** | `#FF1CE3` | `rgb(255, 28, 227)` | Aksen sekunder, gradien neon, badge highlight |
| **Accent 2 (Electric Cyan)** | `#24C6F5` | `rgb(36, 198, 245)` | Status aktif/sukses, subtitle neon, icon highlight |
| **Text Primary** | `#F8FAFC` | `rgb(248, 250, 252)` | Teks heading, label tombol, teks prioritas tinggi |
| **Text Secondary / Muted** | `#94A3B8` | `rgb(148, 163, 184)` | Teks deskripsi, placeholder input, subtitle pendukung |
| **Border / Divider** | `#272438` | `rgb(39, 36, 56)` | Garis pembatas kartu, separator tabel, ring border input |

---

## 2. Gradient Styles

- **Gradient Primary (Violet to Magenta):**
  `linear-gradient(135deg, #9D26FF 0%, #FF1CE3 100%)`
  *Digunakan pada: Tombol checkout, banner utama, kartu sorotan.*

- **Gradient Cyan (Cyan to Violet):**
  `linear-gradient(135deg, #24C6F5 0%, #9D26FF 100%)`
  *Digunakan pada: Teks heading gradien, logo accent, badge spesial.*

- **Gradient Dark Surface:**
  `linear-gradient(180deg, #09090B 0%, #13121D 100%)`
  *Digunakan pada: Background header, hero section overlay.*

---

## 3. UI Component Mapping

### A. Tombol (Buttons)
- **Primary Button:** `bg-[#9D26FF] hover:bg-[#8215db] text-white shadow-lg shadow-[#9D26FF]/30`
- **Secondary Button:** `bg-[#1E1C2E] border border-[#272438] text-white hover:border-[#9D26FF]`
- **Accent Cyan Button:** `bg-[#24C6F5] hover:bg-[#1bb3de] text-black font-bold`

### B. Badge & Status
- **Active / Published:** `bg-[#9D26FF]/15 text-[#24C6F5] border border-[#9D26FF]/30`
- **Pending / Warning:** `bg-amber-500/15 text-amber-300 border border-amber-500/30`
- **Completed / Success:** `bg-[#24C6F5]/15 text-[#24C6F5] border border-[#24C6F5]/30`
- **Cancelled / Danger:** `bg-red-500/15 text-red-400 border border-red-500/30`

### C. Input & Form Fields
- **Background:** `#1E1C2E`
- **Border Default:** `#272438`
- **Border Focus:** `#9D26FF` (Focus ring: `rgba(157, 38, 255, 0.25)`)
- **Text:** `#F8FAFC`, Placeholder: `#94A3B8`

### D. SweetAlert2 & Toast Notifikasi
- **Toast Background:** `#13121D`
- **Toast Border:** `#272438`
- **Toast Text:** `#F8FAFC`
- **Toast Icon Success:** `#24C6F5` (Electric Cyan)
- **Toast Icon Error:** `#FF1CE3` / `#EF4444`

---

## 4. Peraturan Desain (Design Rules)
1. **Zero Green Legacy:** Tidak menggunakan warna hijau peninggalan lawas (`#079108`, `#10B981`, `emerald-*`).
2. **High Contrast:** Semua teks putih `#F8FAFC` di atas permukaan gelap (`#13121D` / `#09090B`) wajib mempertahankan rasio kontras WCAG AA.
3. **Cyber Glow:** Elemen interaktif memanfaatkan *box-shadow* berbasis `rgba(157, 38, 255, 0.25)` untuk mempertegas identitas visual NOIZE.
