<div align="center">

[簡體中文](https://github.com/troyeguo/koodo-reader/blob/master/README_cn.md) | 繁體中文 | [English](https://github.com/troyeguo/koodo-reader/blob/master/README.md)

</div>

<div align="center" width="128px" height="128px">
<img src="https://i.loli.net/2020/04/26/wrO8EPokvUQWaf5.png" />
</div>

<h1 align="center">
  Koodo Reader
</h1>
<h3 align="center">
  壹個跨平臺的電子書閱讀器
</h3>
<div align="center">

[下載](https://koodo.960960.xyz/download) | [官網](https://koodo.960960.xyz)

</div>

<div align="center">
  <a href="https://github.com/troyeguo/koodo-reader/releases/latest">
    <img src="https://img.shields.io/github/release/troyeguo/koodo-reader.svg?style=flat-square" alt="">
  </a>

  <a href="https://github.com/troyeguo/koodo-reader/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/troyeguo/koodo-reader.svg?style=flat-square" alt="">
  </a>
</div>

## 預覽

<div align="center">
  <a href="https://github.com/troyeguo/koodo-reader/releases/latest">
    <img src="https://i.loli.net/2020/07/18/5NhQZfxXRs8VO7c.png" >
  </a>
  <a href="https://github.com/troyeguo/koodo-reader/releases/latest">
    <img src="https://i.loli.net/2020/07/18/QHGNJStXsiLTvf3.png" >
  </a>
  <br/>
</div>

## 特色

支持閱讀 **epub** , **pdf**, **mobi**, **azw3** 和 **txt** 格式的圖書

支持 **Windows** ， **macOS**， **Linux** 和 **網頁版**

備份數據到 **Dropbox** 和 **Webdav**

自定義源文件夾，利用 OneDrive、百度網盤、iCloud、Dropbox 等進行多設備同步

雙頁模式，單頁模式，滾動模式

聽書功能，翻譯功能

目錄，書簽，筆記，書摘，書架，標簽

自定義字體，字體大小，行間距，閱讀背景色，文字顏色

觸控屏手勢支持

文字高亮和下劃線標記

## 使用方法

桌面端：[點我前往](https://koodo.960960.xyz/download)

網頁版：[點我前往](https://reader.960960.xyz)

使用 [Homebrew](https://brew.sh/) 安裝：

```shell
brew install --cask koodo-reader
```

## 運行源碼

請確保您電腦的 node 的版本大於 10.0.0，已配置好 yarn，git 的運行環境。

1. 將項目源碼下載到本地

   ```
   git clone https://github.com/troyeguo/koodo-reader.git
   ```

2. cd 到項目文件夾，運行以下代碼進入客戶端模式

   ```
   yarn
   yarn dev
   ```

3. 運行以下代碼進入網頁模式

   ```
   yarn
   yarn start
   ```

## Docker

可以使用 `docker compose` 運行本項目

```bash
docker-compose up -d
```

## 開發計劃

前往 [Trello](https://trello.com/b/dJ51EgHV/koodo-reader-开发路线图) 了解更多

## 貢獻

| 貢獻          | 感謝                                                                                       |
| :------------ | :----------------------------------------------------------------------------------------- |
| 繁體中文翻譯  | [TobySkarting](https://github.com/TobySkarting), [playercd8](https://github.com/playercd8) |
| 俄語翻譯      | [vanja-san](https://github.com/vanja-san)                                                  |
| Homebrew 安裝 | [singularitti](https://github.com/singularitti)                                            |
| Docker 安裝   | [yanickxia](https://github.com/yanickxia)                                                  |
| 其他貢獻者    | [bamlan](https://github.com/bamlan)                                                        |

## 幫助

您可以在[issue](https://github.com/troyeguo/koodo-reader/issues)提問，或者前往[這裏](https://koodo.960960.xyz/support)了解更多。

## 支持

如果您覺得本項目對您有幫助的話，請隨手打賞壹個 star。
