<div align="left">

简体中文 | [English](https://github.com/troyeguo/koodo-reader/blob/master/README.md)

</div>

<div align="center">
  <img src="https://i.loli.net/2021/07/30/ZKNMmz54Q3uqlrW.png" width="96px" height="96px"/>
</div>

<h1 align="center">
  Koodo Reader
</h1>

<h3 align="center">
  一个跨平台的电子书阅读器
</h3>

<div align="center">

[下载客户端](https://koodo.960960.xyz/zh) | [在线预览](https://reader.960960.xyz) | [开发计划](https://troyeguo.notion.site/215baeda57804fd29dbb0e91d1e6a021?v=360c00183d944b598668f34c255edfd7) | [帮助文档](https://troyeguo.notion.site/Koodo-Reader-0c9c7ccdc5104a54825dfc72f1c84bea)

</div>

## 预览

<div align="center">
  <img src="https://i.loli.net/2021/08/08/I37WPYFJcC1jltn.png" >
  <img src="https://i.loli.net/2021/08/08/G7WvUQFTrEpSCKg.png" >
</div>

## 特色

- 支持阅读格式：
  - EPUB (**.epub**)
  - 扫描文档 (**.pdf**, **.djvu**)
  - Kindle (**.azw3**, **.mobi**)
  - 纯文本 (**.txt**)
  - 漫画 (**.cbr**, **.cbz**, **.cbt**)
  - 富文本 (**.md**, **.docx**, **.rtf**)
  - FB2 (**.fb2**)
  - 超文本 (**.html**, **.xml**, **.xhtml**, **.htm**)
- 支持 **Windows**，**macOS**，**Linux** 和 **网页版**
- 备份数据到 **Dropbox** 和 **Webdav**
- 自定义源文件夹，利用 OneDrive、百度网盘、iCloud、Dropbox 等进行多设备同步
- 双页模式，单页模式，滚动模式
- 听书功能，翻译功能，触控屏支持，批量导入图书
- 支持目录，书签，笔记，高亮，书架，标签
- 自定义字体，字体大小，行间距，段落间距，阅读背景色，文字颜色，屏幕亮度，文字下划线、斜体、文字阴影、字体粗细
- 黑夜模式和主题色设置

## 使用方法

- 桌面端：
  - 稳定版 (推荐下载)：[官网](https://koodo.960960.xyz/zh)（感谢 [@Stille](https://www.ioiox.com/donate.html) 提供下载加速服务）
  - 开发版：[Github Release](https://github.com/troyeguo/koodo-reader/releases/latest) （包含新功能和 bug 修复，但也可能引入更多未知 bug）
- 网页版：[前往](https://reader.960960.xyz)
- 使用 Scoop 安装：

```shell
scoop bucket add dorado https://github.com/chawyehsu/dorado
scoop install dorado/koodo-reader
```

- 使用 Homebrew 安装：

```shell
brew install --cask koodo-reader
```

- 使用 Docker 安装：

```bash
docker-compose up -d
```

## 截图

<div align="center">
  <b>列表模式</b>
  <img src="https://i.loli.net/2021/08/08/JyNHfThMs184Um2.png" >
  <b>封面模式</b>
  <img src="https://i.loli.net/2021/08/08/76zkDEAobd4qsmR.png" >
  <b>阅读菜单</b>
  <img src="https://i.loli.net/2021/08/08/LeEN9gnOvFmfVWA.png" >
  <b>备份和恢复</b>
  <img src="https://i.loli.net/2021/08/08/aRIAiYT2dGJQhC1.png" >
  <b>黑夜模式和主题色</b>
  <img src="https://i.loli.net/2021/08/08/ynqUNpX93xZefdw.png" >
  <b>笔记管理</b>
  <img src="https://i.loli.net/2021/08/09/sARQBoefvGklHwC.png" >
</div>

## 运行源码

请确保您电脑的 node 的版本大于 10.0.0，已配置好 yarn，git 的运行环境。

1. 将项目源码下载到本地

   ```
   git clone https://github.com/troyeguo/koodo-reader.git
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
