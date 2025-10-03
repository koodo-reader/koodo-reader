<div align="left">

[简体中文](https://github.com/koodo-reader/koodo-reader/blob/master/README_cn.md) | [हिंदी](https://github.com/koodo-reader/koodo-reader/blob/master/README_hi.md) |[Português](https://github.com/koodo-reader/koodo-reader/blob/master/README_pt.md) | [English](https://github.com/koodo-reader/koodo-reader/blob/master/README.md) | Indonesian

</div>

<div align="center">
  <img src="https://dl.koodoreader.com/screenshots/logo.png" width="96px" height="96px"/>
</div>

<h1 align="center">
  Koodo Reader
</h1>

<h3 align="center">
  Pembaca buku digital lintas platform
</h3>

<div align="center">

[Unduh](https://koodoreader.com/en) | [Pratinjau](https://web.koodoreader.com) | [Roadmap](https://koodoreader.com/en/roadmap) | [Dokumentasi](https://koodoreader.com/en/document)

</div>

## Pratinjau

<div align="center">
  <br/>
  <br/>
  <img src="https://dl.koodoreader.com/screenshots/7.png" width="800px">
  <br/>
  <br/>
  <img src="https://dl.koodoreader.com/screenshots/8.png" width="800px">
  <br/>
  <br/>
</div>

## Fitur

- Format yang didukung:
  - EPUB (**.epub**)
  - PDF (**.pdf**)
  - Format bebas DRM (**.mobi**) dan Kindle (**.azw3**, **.azw**)
  - Teks biasa (**.txt**)
  - FictionBook (**.fb2**)
  - Arsip komik (**.cbr**, **.cbz**, **.cbt**, **.cb7**)
  - Teks kaya (**.md**, **.docx**)
  - Hiperteks (**.html**, **.xml**, **.xhtml**, **.mhtml**, **.htm**)
- Platform yang didukung: **Windows**, **macOS**, **Linux**, dan **Web**
- Simpan data Anda di **OneDrive**, **Google Drive**, **Dropbox**, **Yandex Disk**, **FTP**, **SFTP**, **WebDAV**, **SMB**, **S3**, **S3 Compatible**
- Sesuaikan folder sumber dan sinkronkan antar perangkat menggunakan OneDrive, iCloud, Dropbox, dll.
- Tata letak satu kolom, dua kolom, atau gulir kontinu
- Text-to-speech, terjemahan, bilah kemajuan, dukungan layar sentuh, impor massal
- Tambahkan penanda, catatan, dan sorotan ke buku Anda
- Sesuaikan ukuran font, jenis font, jarak baris, jarak paragraf, warna latar belakang, warna teks, margin, dan kecerahan
- Mode malam dan tema warna
- Sorotan teks, garis bawah, tebal, miring, dan bayangan

## Instalasi

- Versi Desktop:
  - Versi stabil (Disarankan): [Unduh](https://koodoreader.com/en)
  - Versi pengembang: [Unduh](https://github.com/koodo-reader/koodo-reader/releases/latest) (Memiliki fitur baru dan perbaikan bug, tetapi mungkin masih mengandung beberapa masalah yang belum diketahui)
- Versi Web: [Pratinjau](https://web.koodoreader.com)
- Instal dengan Scoop:

```shell
scoop bucket add extras
scoop install extras/koodo-reader
```

- Instal dengan Homebrew:

```shell
brew install --cask koodo-reader
```

- Instal dengan Docker:

```bash
docker run -d -p 80:80 --name koodo-reader ghcr.io/koodo-reader/koodo-reader:master
```

## Tangkapan Layar

<div align="center">
  <b>Daftar buku</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/1.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>tampilan buku</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/5.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>Mode daftar</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/2.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>Mode sampul</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/3.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>Opsi membaca</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/6.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>Mode gelap dan warna tema</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/4.png" width="800px"></kbd>
  <br/>
  <br/>
</div>

## Pengembangan

Pastikan Anda telah menginstal yarn dan git.

1. Unduh repositori:

   ```
   git clone https://github.com/koodo-reader/koodo-reader.git
   ```

2. Masuk ke mode desktop:

   ```
   yarn
   yarn dev
   ```

3. Masuk ke mode web:

   ```
   yarn
   yarn start
   ```
