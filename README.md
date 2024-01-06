<div align="left">

[简体中文](https://github.com/koodo-reader/koodo-reader/blob/master/README_cn.md) | [Português](https://github.com/koodo-reader/koodo-reader/blob/master/README_pt.md) | English

</div>

<div align="center" >
  <img src="https://i.loli.net/2021/07/30/ZKNMmz54Q3uqlrW.png" width="96px" height="96px"/>
</div>

<h1 align="center">
  Koodo Reader
</h1>

<h3 align="center">
  A cross-platform ebook reader
</h3>
<div align="center">

[Download](https://koodo.960960.xyz/en) | [Preview](https://reader.960960.xyz) | [Roadmap](https://troyeguo.notion.site/d1c19a132932465bae1d89dd963c92ea?v=ca8aa69cf25849c18c92b92ba868663b) | [Document](https://troyeguo.notion.site/Koodo-Reader-Document-9c767af3d66c459db996bdd08a34c34b)

</div>

## Preview

<div align="center">
  <img src="https://i.loli.net/2021/08/08/I37WPYFJcC1jltn.png" >
  <img src="https://i.loli.net/2021/08/08/G7WvUQFTrEpSCKg.png" >
</div>

## Feature

- Format support:
  - EPUB (**.epub**)
  - Scanned document (**.pdf**, **.djvu**)
  - DRM-free Mobipocket (**.mobi**) and Kindle (**.azw3**, **.azw**)
  - Plain text (**.txt**)
  - FictionBook (**.fb2**)
  - Comic book archive (**.cbr**, **.cbz**, **.cbt**, **.cb7**)
  - Rich text (**.md**, **.docx**)
  - Hyper Text (**.html**, **.xml**, **.xhtml**, **.mhtml**, **.htm**, **.htm**)
- Platform support: **Windows**, **macOS**, **Linux** and **Web**
- Save your data to **OneDrive**, **Google Drive**, **Dropbox**, **FTP**, **SFTP**, **WebDAV**, **S3**, **S3 compatible**
- Customize the source folder and synchronize among multiple devices using OneDrive, iCloud, Dropbox, etc.
- Single-column, two-column, or continuous scrolling layouts
- Text-to-speech, translation, dictionary, touch screen support, batch import
- Add bookmarks, notes, highlights to your books
- Adjust font size, font family, line-spacing, paragraph spacing, background color, text color, margins, and brightness
- Night mode and theme color
- Text highlight, underline, boldness, italics and shadow

## Installation

- Desktop Version:
  - Stable Version (Recommended): [Download](https://koodo.960960.xyz/en)
  - Developer Version: [Download](https://github.com/koodo-reader/koodo-reader/releases/latest) ( With new feature and bug fix, but may induce some unknown bugs)
- Web Version：[Preview](https://reader.960960.xyz)
- Install with Scoop:

```shell
scoop bucket add extras
scoop install extras/koodo-reader
```

- Install with Winget:

```shell
winget install -e AppbyTroye.KoodoReader
```

- Install with Homebrew:

```shell
brew install --cask koodo-reader
```

- Install with Docker:

```bash
docker-compose up -d
```

- Install with Flathub:

```shell
flatpak install flathub io.github.troyeguo.koodo-reader
flatpak run io.github.troyeguo.koodo-reader
```

<a href="https://flathub.org/apps/details/io.github.troyeguo.koodo-reader"><img height="50" alt="Download on Flathub" src="https://flathub.org/assets/badges/flathub-badge-en.png"/></a>

## Screenshot

<div align="center">
  <b>List mode</b>
  <img src="https://i.loli.net/2021/08/08/JyNHfThMs184Um2.png" >
  <b>Cover mode</b>
  <img src="https://i.loli.net/2021/08/08/76zkDEAobd4qsmR.png" >
  <b>Reader menu</b>
  <img src="https://i.loli.net/2021/08/08/LeEN9gnOvFmfVWA.png" >
  <b>Backup and restore</b>
  <img src="https://i.loli.net/2021/08/08/aRIAiYT2dGJQhC1.png" >
  <b>Dark mode and theme color</b>
  <img src="https://i.loli.net/2021/08/08/ynqUNpX93xZefdw.png" >
  <b>Note management</b>
  <img src="https://i.loli.net/2021/08/09/sARQBoefvGklHwC.png" >

</div>

</div>

## Develop

Make sure that you have installed yarn and git

1. Download the repo

   ```
   git clone https://github.com/koodo-reader/koodo-reader.git
   ```

2. Enter desktop mode

   ```
   yarn
   yarn dev
   ```

3. Enter web mode

   ```
   yarn
   yarn start
   ```

## Translation

### Edit current language

1. Select your target language from the following list.

2. Click the view button to examine the source file. The untranslated terms are listed at the bottom of each file.

3. Translate the terms to your target language based on the given English reference

4. Sumbit the translation file or just translation snippets based on the amount of your translation to [this link](https://github.com/koodo-reader/koodo-reader/issues/new?assignees=&labels=submit+translation&projects=&template=3_submit_translation.yml). Pull request is also welcomed.

| Language        | Code  | View                                                |
| --------------- | ----- | --------------------------------------------------- |
| Arabic          | ar    | [View](./src/assets/locales/ar/translation.json)    |
| Bengali         | bn    | [View](./src/assets/locales/bn/translation.json)    |
| Tibetan         | bo    | [View](./src/assets/locales/bo/translation.json)    |
| Bulgarian       | bg    | [View](./src/assets/locales/bg/translation.json)    |
| Czech           | cs    | [View](./src/assets/locales/cs/translation.json)    |
| Danish          | da    | [View](./src/assets/locales/da/translation.json)    |
| German          | de    | [View](./src/assets/locales/de/translation.json)    |
| Greek           | el    | [View](./src/assets/locales/el/translation.json)    |
| English         | en    | [View](./src/assets/locales/en/translation.json)    |
| Esperanto       | eo    | [View](./src/assets/locales/eo/translation.json)    |
| Spanish         | es    | [View](./src/assets/locales/es/translation.json)    |
| Persian         | fa    | [View](./src/assets/locales/fa/translation.json)    |
| Finnish         | fi    | [View](./src/assets/locales/fi/translation.json)    |
| French          | fr    | [View](./src/assets/locales/fr/translation.json)    |
| Armenian        | hy    | [View](./src/assets/locales/hy/translation.json)    |
| Indonesian      | id    | [View](./src/assets/locales/id/translation.json)    |
| Interlingue     | ie    | [View](./src/assets/locales/ie/translation.json)    |
| Italian         | it    | [View](./src/assets/locales/it/translation.json)    |
| Japanese        | ja    | [View](./src/assets/locales/ja/translation.json)    |
| Korean          | ko    | [View](./src/assets/locales/ko/translation.json)    |
| Dutch           | nl    | [View](./src/assets/locales/nl/translation.json)    |
| Polish          | pl    | [View](./src/assets/locales/pl/translation.json)    |
| Portuguese      | pt    | [View](./src/assets/locales/pt/translation.json)    |
| Portuguese (BR) | pt-BR | [View](./src/assets/locales/pt-BR/translation.json) |
| Romanian        | ro    | [View](./src/assets/locales/ro/translation.json)    |
| Russian         | ru    | [View](./src/assets/locales/ru/translation.json)    |
| Slovenian       | sl    | [View](./src/assets/locales/sl/translation.json)    |
| Swedish         | sv    | [View](./src/assets/locales/sv/translation.json)    |
| Tamil           | ta    | [View](./src/assets/locales/ta/translation.json)    |
| Thai            | th    | [View](./src/assets/locales/th/translation.json)    |
| Turkish         | tr    | [View](./src/assets/locales/tr/translation.json)    |
| Ukrainian       | uk    | [View](./src/assets/locales/uk/translation.json)    |
| Vietnamese      | vi    | [View](./src/assets/locales/vi/translation.json)    |
| Chinese (CN)    | zh-CN | [View](./src/assets/locales/zh-CN/translation.json) |
| Chinese (TW)    | zh-TW | [View](./src/assets/locales/zh-TW/translation.json) |
| Chinese (MO)    | zh-MO | [View](./src/assets/locales/zh-MO/translation.json) |

### Add new language

1. If you can't find your target language from the above list, Download the Engish source file from [this link](./src/assets/locales/en/translation.json)

2. When you finish translation, submit the source file to [this link](https://github.com/koodo-reader/koodo-reader/issues/new?assignees=&labels=submit+translation&projects=&template=3_submit_translation.yml). Pull request is also welcomed.
