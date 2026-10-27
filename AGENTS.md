## Architecture Overview

Koodo Reader 是一个跨平台电子书阅读器（Electron + Vite + React 19 + Zustand）。

### 四层架构

| 层              | 位置                                  | 职责                                                    |
| --------------- | ------------------------------------- | ------------------------------------------------------- |
| Electron 主进程 | `main.js`                             | IPC handlers, SQLite (better-sqlite3), 云同步, 原生集成 |
| React 渲染进程  | `src/`                                | UI, Zustand 状态管理, 书籍渲染                          |
| 阅读引擎        | `src/assets/lib/kookit-extra.min.mjs` | 闭源 ESM — 书籍解析、SQL 语句、同步工具                 |
| Go HTTP 服务    | `httpserver/`                         | 可选的 KOReader / OPDS 集成                             |

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

### Zustand Store

唯一状态源是 `src/store/useAppStore.ts`，保留 8 个命名空间：

`manager`, `book`, `reader`, `progressPanel`, `viewArea`, `sidebar`, `backupPage`, `collection`

组件使用字段级 selector，禁止整 store 订阅：

```ts
const books = useAppStore((s) => s.manager.books);
const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
```

非组件代码使用 `useAppStore.getState().handleXxx()`。不再使用 `connect` / `mapStateToProps` / `src/store/actions` / `src/store/reducers`。

### State 类型

`AppState` 定义在 `src/store/useAppStore.ts`。不要新增 CRA / Redux 时代的 `stateType` 导入。

### Container 模式

`index.tsx` 仅做 `export { default } from "./component";`；`component.tsx` 是函数组件，使用 hooks 读取状态、翻译和路由；组件自身 Props / State 直接定义在 `component.tsx`，跨文件共享的类型放在同目录 `types.ts`。新增组件一律使用函数组件 + hooks，不要新增 `connect` / `withRouter` / `withTranslation`。

### 页面路由

使用 `react-router-dom` v7（`HashRouter` + `Routes` + `Route element`）。

- `/manager/*` — 主界面（书库、笔记、回收站等）
- `/epub/*`, `/pdf/*`, `/mobi/*`, `/txt/*`, `/md/*` 等格式路径 — 阅读器
- `/login`, `/stats`
- `/` — 重定向入口

注意：v7 默认精确匹配，带子路径的路由必须使用 `/*` 通配符。

### 支持的电子书格式

EPUB, PDF, MOBI, AZW3, AZW, TXT, FB2, CBR/CBZ/CBT/CB7, PPTX/PPT, XPS/OXPS, DJVU/DJV, OFD, MD, DOCX/DOC, RTF, CAJ, HTML/XML/XHTML/MHTML/HTM

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

# 类型检查
yarn typecheck

# 单元测试（Vitest）
yarn test

# 监听模式
yarn test:watch

# 分析产物体积
yarn analyze

# 打包分发
yarn release

# 重新编译原生模块
yarn rebuild
```

## 开发规范

- **编码任务开始前必须先加载 `karpathy-guidelines` skill**：任何涉及写代码、改代码、review 的会话，动手前先用 skill 工具加载 `karpathy-guidelines`（先想后写、最小实现、外科手术式修改、目标驱动验证）。
- **不要主动提交代码**：修改完代码后，只展示改动内容和说明，由用户自行决定是否提交。除非用户明确要求提交，否则不要执行 `git commit`、`git push` 等操作。
- **写新代码前先查现有实现**：动手前先在当前文件和代码库中搜索同类逻辑（事件监听、工具函数、ref 模式等），优先复用而不是新增。例如已有节流的 window `mousemove` 监听时，不要为同一事件再挂第二个监听器，而是把新逻辑合并进现有 handler。
- **高频事件必须节流**：`mousemove` / `scroll` / `resize` 等事件统一使用 `src/utils/common.ts` 的 `throttle`（leading + trailing，鼠标停下后最后位置仍会处理）；handler 内避免每次触发都重置定时器或 setState，重复的状态更新应先用 ref 判断值是否变化。
- 用户可见文本必须使用 `react-i18next` 的 `useTranslation()` + `t("key")`，不得硬编码
- TypeScript 避免 `any`；组件局部 Props / State 定义在 `component.tsx`，跨文件共享类型放在同目录 `types.ts`
- 状态统一使用 `useAppStore` 字段级 selector；禁止新增 Redux / connect 相关代码
- 翻译统一使用 `useTranslation`；路由统一使用 `useNavigate` / `useLocation`，禁止新增 `withTranslation` / `withRouter` HOC
- 组件 CSS 必须在 `component.tsx` 或 `index.tsx` 中显式导入，不要依赖其他路由文件的副作用导入
- 不要从渲染进程直接操作 SQLite，所有数据库操作通过 `database-command` IPC
- 新增 i18n key 需在 `src/assets/locales/en.json` 中添加
- Reader 工具函数（`src/utils/reader/`）会影响 iframe 中书籍渲染，修改后需手动回归测试
- 添加窗口打开通道时需遵循 `new-tab` → `WebContentsView` / `open-book` → `BrowserWindow` 模式
- 所有 IPC 参数需校验后再执行文件系统/数据库/Shell 操作
- 不要将令牌、密码或完整书籍路径记录到 info 级别日志
- 单元测试使用 Vitest（`src/**/*.test.ts`）；E2E 后续使用 Playwright

## 项目结构

```
.
├── main.js                 # Electron 主进程
├── httpserver/             # Go HTTP 服务 (KOReader/OPDS)
├── public/                 # 静态资源 + WASM 库 (7z, unrar, pdfjs)
├── index.html              # Vite HTML 入口
├── vite.config.mts         # Vite 配置
├── vitest.config.ts        # Vitest 配置
├── src/
│   ├── assets/
│   │   ├── lib/            # 阅读引擎 (kookit-extra.min.mjs) + 类型定义
│   │   ├── locales/        # 多语言翻译 JSON (40+ 语言)
│   │   ├── styles/         # 全局 CSS
│   │   └── images/         # 图片资源
│   ├── components/         # 可复用 UI 组件 (函数组件)
│   ├── constants/          # 常量定义
│   ├── containers/         # 容器组件 (函数组件 + hooks)
│   │   ├── lists/          # 列表 (bookList, cardList, noteList, navList, contentList)
│   │   ├── panels/         # 面板 (navigationPanel, operationPanel, progressPanel, settingPanel)
│   │   ├── settings/       # 设置页面各选项卡
│   │   ├── sidebar/        # 侧边栏
│   │   └── viewer/         # 书籍阅读视图
│   ├── models/             # 数据模型 (Book, Bookmark, Note, HtmlBook, Plugin)
│   ├── pages/              # 页面级组件 (manager, reader, login, redirect, stats)
│   ├── router/             # React Router v7 路由配置
│   ├── store/              # Zustand (useAppStore.ts)
│   └── utils/              # 工具函数
│       ├── file/           # 文件操作 (bookUtil, coverUtil, fontUtil, sqlUtil, export, backup, restore)
│       ├── reader/         # 阅读器逻辑 (highlightUtil, noteUtil, styleUtil, ttsUtil, themeUtil, etc.)
│       ├── request/        # HTTP 请求
│       └── storage/        # 存储服务 (databaseService, syncService)
├── scripts/                # 构建脚本
└── assets/                 # 构建资源 (图标、安装配置)
```
