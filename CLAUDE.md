# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Koodo Reader 是一个跨平台电子书阅读器（Electron + React CRA + Redux）。

### 四层架构

| 层 | 位置 | 职责 |
|---|------|------|
| Electron 主进程 | `main.js` | IPC handlers, SQLite (better-sqlite3), 云同步, 原生集成 |
| React 渲染进程 | `src/` | UI, Redux 状态管理, 书籍渲染 |
| 阅读引擎 | `src/assets/lib/kookit-extra.min.mjs` | 闭源 ESM — 书籍解析、SQL 语句、同步工具 |
| Go HTTP 服务 | `httpserver/` | 可选的 KOReader / OPDS 集成 |

## 重要提醒

**不要**尝试读取 `src/assets/lib/` 下的这些文件：
- `kookit-extra.min.mjs`
- `kookit.min.js`
- `kookit-extra-browser.min.js`

这些是混淆/压缩后的产物，无法阅读。如需查阅源码，请直接读取本地源码仓库：
- `D:\Project\kookit`
- `D:\Project\kookit-extra`

## 关键 IPC 通道

- `open-book` / `new-tab` / `exit-tab` — 窗口生命周期
- `database-command` — 数据库操作（所有数据库操作必须通过此通道）
- `cloud-upload` / `cloud-download` — 云同步
- `before-reader-close` → `reader-close-ready` — 阅读器两阶段关闭

### Redux 切片

`book`, `reader`, `manager`, `viewArea`, `backupPage`, `sidebar`, `progressPanel`

每个切片在 `src/store/actions/` 和 `src/store/reducers/` 中各有一个文件。

### Redux State 类型

`stateType` 定义在 `src/store/index.tsx` 中，所有 `mapStateToProps` 应使用此类型。

### Container 模式

`index.tsx` (Redux connect) → `component.tsx` → `interface.tsx`，位于 `src/containers/` 下。

### 页面路由

- `/manager/*` — 主界面（书库、笔记、回收站等）
- `/epub`, `/pdf`, `/mobi`, `/txt`, `/md` 等格式路径 — 阅读器
- `/login`, `/stats`, `/redirect`

### 支持的电子书格式

EPUB, PDF, MOBI, AZW3, AZW, TXT, FB2, CBR/CBZ/CBT/CB7, MD, DOCX, HTML/XML/XHTML/MHTML/HTM

## 常用命令

```bash
# 安装依赖（初次）
yarn

# 桌面开发模式（Electron + React 热重载）
yarn dev

# Web 开发模式（仅浏览器）
yarn start

# 构建生产版本
yarn build

# 运行测试
yarn test

# 打包分发
yarn release

# 重新编译原生模块
yarn rebuild
```

## 开发规范

- 用户可见文本必须使用 `react-i18next` 的 `t("key")`，不得硬编码
- TypeScript 避免 `any`，在 `interface.tsx` 中定义类型
- 状态类型用 `stateType`（`src/store/index.tsx`）
- 不要从渲染进程直接操作 SQLite，所有数据库操作通过 `database-command` IPC
- 新增 i18n key 需在 `src/assets/locales/en.json` 中添加
- Reader 工具函数（`src/utils/reader/`）会影响 iframe 中书籍渲染，修改后需手动回归测试
- 添加窗口打开通道时需遵循 `new-tab` → `WebContentsView` / `open-book` → `BrowserWindow` 模式
- 所有 IPC 参数需校验后再执行文件系统/数据库/Shell 操作
- 不要将令牌、密码或完整书籍路径记录到 info 级别日志

## 项目结构

```
.
├── main.js                 # Electron 主进程
├── httpserver/             # Go HTTP 服务 (KOReader/OPDS)
├── public/                 # 静态资源 + WASM 库 (7z, unrar, pdfjs)
├── src/
│   ├── assets/
│   │   ├── lib/            # 阅读引擎 (kookit-extra.min.mjs) + 类型定义
│   │   ├── locales/        # 多语言翻译 JSON (40+ 语言)
│   │   ├── styles/         # 全局 CSS
│   │   └── images/         # 图片资源
│   ├── components/         # 可复用 UI 组件
│   ├── constants/          # 常量定义
│   ├── containers/         # 容器组件 (Redux stateful)
│   │   ├── lists/          # 列表 (bookList, cardList, noteList, navList, contentList)
│   │   ├── panels/         # 面板 (navigationPanel, operationPanel, progressPanel, settingPanel)
│   │   ├── settings/       # 设置页面各选项卡
│   │   ├── sidebar/        # 侧边栏
│   │   └── viewer/         # 书籍阅读视图
│   ├── models/             # 数据模型 (Book, Bookmark, Note, HtmlBook, Plugin)
│   ├── pages/              # 页面级组件 (manager, reader, login, redirect, stats)
│   ├── router/             # React Router 路由配置
│   ├── store/              # Redux (actions + reducers)
│   └── utils/              # 工具函数
│       ├── file/           # 文件操作 (bookUtil, coverUtil, fontUtil, sqlUtil, export, backup, restore)
│       ├── reader/         # 阅读器逻辑 (highlightUtil, noteUtil, styleUtil, ttsUtil, themeUtil, etc.)
│       ├── request/        # HTTP 请求
│       └── storage/        # 存储服务 (databaseService, syncService)
├── scripts/                # 构建脚本
└── assets/                 # 构建资源 (图标、安装配置)
```
