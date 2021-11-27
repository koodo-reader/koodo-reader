<div align="left">

[简体中文](https://github.com/troyeguo/koodo-reader/blob/master/README_cn.md) | English

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

[Download](https://koodo.960960.xyz/en/download) | [Preview](https://reader.960960.xyz) | [Roadmap](https://troyeguo.notion.site/d1c19a132932465bae1d89dd963c92ea?v=ca8aa69cf25849c18c92b92ba868663b) | [Document](https://troyeguo.notion.site/Koodo-Reader-Document-9c767af3d66c459db996bdd08a34c34b)

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
  - Kindle (**.azw3**) and Mobipocket (**.mobi**)
  - Plain text (**.txt**)
  - FictionBook (**.fb2**)
  - Comic book archive (**.cbr**, **.cbz**, **.cbt**)
  - Rich text (**.md**, **.docx**, **.rtf**)
  - Hyper Text (**.html**, **.xml**)
- Platform support: **Windows** , **macOS**, **Linux** and **Web**
- Save your data to **Dropbox** or **Webdav**
- Customize the source folder and synchronize among multiple devices using OneDrive, iCloud, Dropbox, etc.
- Single-column, two-column, or continuous scrolling layouts
- Text-to-speech, translation, progress slider, touch screen support, batch import
- Add bookmarks, notes, highlights to your books
- Adjust font size, font family, line-spacing, paragraph spacing, background color, text color, margins, and brightness
- Night mode and theme color
- Text highlight, underline, boldness, italics and shadow

## Installation

- Desktop Version:
  - Stable Version (Recommended): [Download](https://koodo.960960.xyz/en/download)
  - Developer Version: [Download](https://github.com/troyeguo/koodo-reader/releases/latest) ( With new feature and bug fix, but may induce some unknown bugs)
- Web Version：[Preview](https://reader.960960.xyz)
- Install with Scoop:

```shell
scoop bucket add dorado https://github.com/chawyehsu/dorado
scoop install dorado/koodo-reader
```

- Install with Homebrew:

```shell
brew install --cask koodo-reader
```

- Install with Docker:

```bash
docker-compose up -d
```

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

Make sure that you have installed yarn and git, node's version on your computer is larger than 14.0.0.

1. Download the repo

   ```
   git clone https://github.com/troyeguo/koodo-reader.git
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
