<div align="left">

简体中文 | [हिंदी](https://github.com/koodo-reader/koodo-reader/blob/master/README_hi.md) |[Português](https://github.com/koodo-reader/koodo-reader/blob/master/README_pt.md) | [English](https://github.com/koodo-reader/koodo-reader/blob/master/README.md)

</div>

<div align="center">
  <img src="https://dl.koodoreader.com/screenshots/logo.png" width="96px" height="96px"/>
</div>

<h1 align="center">
  Koodo Reader
</h1>

<h3 align="center">
  一个跨平台的电子书阅读器
</h3>

<div align="center">

[下载客户端](https://koodoreader.com/zh) | [在线预览](https://web.koodoreader.com) | [开发计划](https://koodoreader.com/zh/roadmap) | [帮助文档](https://koodoreader.com/zh/document) | [插件列表](https://koodoreader.com/zh/plugin)

</div>

## 预览

<div align="center">
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/1.png" width="800px"></kbd>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/5.png" width="800px"></kbd>
  <br/>
  <br/>
</div>

## 特色

- 支持阅读格式：
  - EPUB (**.epub**)
  - PDF (**.pdf**)
  - Kindle (**.azw3**, **.mobi**, **.azw**)
  - 纯文本 (**.txt**)
  - 漫画 (**.cbr**, **.cbz**, **.cbt**, **.cb7**)
  - 富文本 (**.md**, **.docx**)
  - FB2 (**.fb2**)
  - 超文本 (**.html**, **.xml**, **.xhtml**, **.mhtml**, **.htm**)
- 支持 **Windows**，**macOS**，**Linux** 和 **网页版**
- 备份数据到 **OneDrive**, **Google Drive**, **Dropbox**, **FTP**, **SFTP**, **WebDAV**, **S3**, **S3 Compatible**
- 自定义源文件夹，利用 OneDrive、百度网盘、iCloud、Dropbox 等进行多设备同步
- 双页模式，单页模式，滚动模式
- 听书功能，翻译功能，词典功能，触控屏支持，批量导入图书
- 支持目录，书签，笔记，高亮，书架，标签
- 自定义字体，字体大小，行间距，段落间距，阅读背景色，文字颜色，屏幕亮度，文字下划线、斜体、文字阴影、字体粗细
- 黑夜模式和主题色设置

## 使用方法

- 桌面端：
  - 稳定版 (推荐下载)：[官网](https://koodoreader.com/zh)
  - 开发版：[GitHub Release](https://github.com/koodo-reader/koodo-reader/releases/latest) （包含新功能和 bug 修复，但也可能引入更多未知 bug）
- 网页版：[前往](https://web.koodoreader.com)
- 使用 Scoop 安装：

```shell
scoop bucket add extras
scoop install extras/koodo-reader
```

- 使用 Homebrew 安装：

```shell
brew install --cask koodo-reader
```

- 使用 Docker 安装：

```bash
docker run -d -p 80:80 --name koodo-reader ghcr.io/koodo-reader/koodo-reader:master
```

## 截图

<div align="center">
  <b>列表模式</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/2.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>封面模式</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/3.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>阅读菜单</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/6.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>黑夜模式</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/4.png" width="800px"></kbd>
  <br/>
  <br/>
</div>

## 运行源码

请确保您电脑已配置好 yarn，git 的运行环境。

1. 将项目源码下载到本地

   ```
   git clone https://github.com/koodo-reader/koodo-reader.git
   ```

2. cd 到项目文件夹，运行以下代码进入客户端模式

   ```
   yarn
   yarn dev
   ```

3. 运行以下代码进入网页模式

   ```
   yarn
   yarn start
   ```
