# Panduan publish Primpaii's Way

## 1. Jalankan database (wajib, satu kali)

1. Buka dashboard Supabase untuk project `vflgcsubicihvmzetyjk`.
2. Pilih **SQL Editor** → **New query**.
3. Buka file `supabase/migrations/0001_init.sql` dari ZIP ini.
4. Salin seluruh isinya ke SQL Editor, lalu tekan **Run**.
5. Pastikan query selesai tanpa error. Jangan menghapus tabel yang sudah ada.

## 2. Atur URL autentikasi Supabase

Di **Authentication → URL Configuration**:

- Site URL: `https://primpaiisways.netlify.app`
- Redirect URLs: tambahkan `https://primpaiisways.netlify.app/**`

Jika nama domain Netlify kamu berbeda, ganti URL di atas dengan domain yang benar dan ubah `VITE_SITE_URL` pada Netlify.

## 3. Deploy melalui GitHub ke Netlify

ZIP ini berisi source code, bukan folder hasil build. Cara yang benar:

1. Ekstrak ZIP.
2. Upload isi folder proyek ke repository GitHub baru.
3. Di Netlify pilih **Add new site → Import an existing project → GitHub**.
4. Pilih repository tadi. Build command: `pnpm build`. Publish directory: `dist/client` (sudah ditulis di `netlify.toml`).
5. Deploy. File `.env.production` sudah disertakan untuk domain dan Supabase project yang dipakai.

Jika lebih suka mengatur environment variable di Netlify, isi:

- `VITE_SUPABASE_URL` = URL project Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` = Supabase publishable key (`sb_publishable_…`)
- `VITE_SITE_URL` = domain Netlify milikmu

Setelah mengubah environment variable, lakukan **Trigger deploy → Clear cache and deploy site**.

## 4. Tes sebelum dipakai sungguhan

1. Buka website, pilih **Buat akun baru**.
2. Daftar dengan email dan password milikmu. Konfirmasi email dari inbox.
3. Login.
4. Tambahkan satu pesanan percobaan.
5. Refresh halaman. Pastikan pesanan masih tampil.
6. Hapus pesanan percobaan.
7. Tes tambah/edit/hapus garansi dan pilihan dropdown.

Jangan masukkan data pelanggan sungguhan sebelum tes refresh berhasil. Jika gagal, lihat pesan **Data belum berhasil dimuat** di aplikasi dan periksa apakah SQL migration sudah dijalankan.

## Keamanan

Gunakan hanya Supabase **Publishable Key** di browser. Jangan pernah menaruh `service_role` atau `sb_secret` ke file `VITE_` maupun mengirimkannya lewat chat. Tabel memakai Row Level Security agar akun hanya dapat mengakses datanya sendiri.
