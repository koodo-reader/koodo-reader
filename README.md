<div align="left">

[**简体中文**](https://github.com/troyeguo/koodo-reader/blob/master/README_cn.md) | **English**

</div>

<div align="center" >
<img src="https://i.loli.net/2021/07/30/ZKNMmz54Q3uqlrW.png" width="96px" height="96px"/>
</div>

<h2 align="center">
  Koodo Reader
</h2>

<div align="center">
  A cross-platform ebook reader
</div>
<div align="center">

[Download](https://koodo.960960.xyz/download) | [Preview](https://reader.960960.xyz) | [Feedback](https://koodo.960960.xyz/support) | [Document](https://www.notion.so/troyeguo/01aaa516687c418499f713d34793b9ad?v=54d51fe1688a4f8ab5784b17e4df3308)

</div>

## Preview

<div align="center">
  <a href="https://github.com/troyeguo/koodo-reader/releases/latest">
    <img src="https://i.loli.net/2021/07/30/p7RlUIBv2LVtTPq.png" >
  </a>
  <br/>
</div>

## Feature

- Format support: **epub**, **pdf**, **mobi**, **azw3**, **txt**, **md**, **djvu**, **docx**, **rtf**, **cbz**, **cbr**, **cbt**, **fb2**, **html** and **xml**

- Platform support: **Windows** , **macOS**, **Linux** and **Web**

- Save your data to **Dropbox** or **Webdav**

- Customize the source folder and synchronize among multiple devices using OneDrive, iCloud, Dropbox, etc.

- Single-column, two-column, or continuous scrolling layouts

- Text-to-speech, translation, progress slider, touch screen support, batch import

- Add bookmarks, notes, highlights to your books

- Origanize your books and notes with shelf and tag

- Adjust font size, font family, line-spacing, paragraph spacing, background color, text color, margins, and brightness

- Night mode and theme color

- Text highlight, underline, boldness, italics and shadow

## Installation

- Desktop Version: [Download](https://koodo.960960.xyz/download)

- Web Version：[Preview](https://reader.960960.xyz)

- Install with [Homebrew](https://brew.sh/):

```shell
brew install --cask koodo-reader
```

- Install with Docker:

```bash
docker-compose up -d
```

## Develop

Make sure node's version on your computer is larger than 10.0.0, yarn and git is in place.

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

## License

This project is generally licensed under AGPL3.0, but any kind of modification of source code for commercial projects or any forms of alternation on logo or name are forbidden.
