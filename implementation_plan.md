# Implementation Plan: JurnFourteen Updates

## Proposed Changes

### 1. Form Pendaftaran (Registrasi)
- **Teks & Pilihan**: Mengganti teks "Kelas" menjadi "Divisi" khusus untuk halaman pendaftaran.
- **Opsi Divisi**: 
  - Korespoden
  - Berita
  - Media
  - Dokumentasi - Photografi
  - Dokumentasi - Videografi
- Pilihan ini akan disimpan ke dalam kolom `kelas` di database (agar tidak merusak struktur tabel, hanya label dan opsinya yang berubah di UI).
- **Fungsi Daftar**: Memastikan alur pendaftaran (tombol "Daftar Sekarang") berjalan mulus hingga masuk ke database dengan status `menunggu_verifikasi`.

### 2. Halaman Verifikasi Anggota Baru (Khusus Superadmin)
- **Halaman Terpisah**: Membuat halaman baru di dashboard `src/app/(dashboard)/members/verification/page.js`.
- **Fungsi**: Menampilkan daftar anggota yang baru mendaftar (berstatus `menunggu_verifikasi`).
- **Aksi**: Superadmin dapat mengklik "Terima" (aktif) atau "Tolak" (menghapus atau menolak data tersebut). 
- Halaman ini akan berdiri sendiri, terpisah dari verifikasi kehadiran kegiatan.

### 3. Pembaruan Halaman Umum (Landing Page & Tentang)
- **Statistik Klik**: Membuat angka "Edisi Terbit" dan "Liputan" di halaman utama bisa diklik (akan diarahkan sementara ke tautan tertentu atau dibiarkan aktif secara visual).
- **Animasi Marquee Foto (Album)**: 
  - Menambahkan baris foto yang bergerak otomatis dari kanan ke kiri (infinite scrolling / marquee) di bagian "Tentang".
  - Transisi akan dibuat sangat mulus menggunakan animasi CSS (`@keyframes`).
  - Foto akan diulang secara *seamless* (jika hanya 1, akan masuk dari kanan lagi setelah hilang di kiri).
- **Linktree (Sosmed)**: Menambahkan 1 tombol khusus di bagian "Tentang" yang mengarah ke Linktree Jurnalistik (sementara diisi *link* kosong `#`).

## User Review Required

> [!IMPORTANT]
> Kolom `kelas` di database tetap akan digunakan untuk menyimpan pilihan "Divisi" ini (contoh: di database tertulis 'Media' di dalam kolom `kelas`). Apakah ini bisa diterima, atau haruskah label di seluruh dashboard Admin dan halaman profil juga diubah menjadi "Divisi" (bukan "Kelas")?

> [!TIP]
> Untuk foto-foto animasi *marquee*, saya akan menggunakan foto-*placeholder* (gambar kosong / bawaan) sementara ini. Nanti kamu bisa mengganti URL gambarnya sendiri di kode. 

Silakan berikan persetujuan atau revisi jika ada yang kurang sesuai, Bos!
