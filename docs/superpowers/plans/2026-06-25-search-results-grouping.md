# 阅读器搜索结果按章节分组与选中高亮 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将阅读器内电子书全文搜索结果按章节分组展示（命中数 + 可折叠 + 目录序），并给点击选中的结果项加持久选中态（背景高亮 + 左侧色条）。

**Architecture:** 改造集中在 `NavigationPanel` 组件。分组与稳定 key 生成抽成纯函数模块 `searchResultUtil`（可独立验证）；`NavigationPanel` 新增 `activeSearchKey` 与 `collapsedChapters` 状态，`renderSearchList` 改为分组渲染；CSS 新增组标题、折叠箭头、选中态样式，复用项目主题变量 `--color-theme-color` / `--color-hover`。

**Tech Stack:** React class component、TypeScript、react-i18next (`Trans`)、html-react-parser + dompurify、CSS（无预处理器）、Create React App (`react-scripts test`，但项目无测试基建，本计划用 node 脚本验证纯函数 + 手动验证 UI）。

**Spec:** `docs/superpowers/specs/2026-06-25-search-results-grouping-design.md`

## Global Constraints

- 项目无测试框架与测试文件基建；不引入测试库（YAGNI）。纯函数用一次性 node 断言脚本验证，UI 用手动验证。
- 主题色复用 CSS 变量 `var(--color-theme-color, #0179ca)`、`var(--color-hover, rgba(128,128,128,0.12))`，不硬编码颜色值。
- 响应中文界面；用户全局指令要求中文回复（实现无关，仅供执行者知晓）。
- 不改 `searchList` 数据来源、`highlightSearchNode`、`goToPosition` 逻辑；不改 store；不改书架/笔记搜索。
- 频繁提交，每个任务结束一次 commit。

---

## 文件结构

- **Create** `src/utils/reader/searchResultUtil.ts` — 搜索结果分组与稳定 key 生成的纯函数。单一职责：把 `doSearch` 返回的扁平列表转成按 `chapterDocIndex` 升序分组的结构。无 React 依赖，可独立验证。
- **Create** `src/utils/reader/searchResultUtil.verify.js` — 一次性 node 断言脚本，验证纯函数行为。验证后保留（作为逻辑示例），不纳入 build（`src` 下 `.js` verify 脚本 CRA 不会当作入口，且不被 import）。
- **Modify** `src/containers/panels/navigationPanel/interface.tsx` — `NavigationPanelState` 新增 `activeSearchKey`、`collapsedChapters` 字段。
- **Modify** `src/containers/panels/navigationPanel/component.tsx` — constructor 初值；`handleNavSearchState`、关闭面板、`handleNavTabToggle` 的清空时机；`renderSearchList` 改为分组渲染 + 选中态；新增 `toggleChapter`、`handleSearchItemClick`。
- **Modify** `src/containers/panels/navigationPanel/navigationPanel.css` — 组标题、折叠箭头、组内列表、选中态样式。

---

## Task 1: 纯函数 — 稳定 key 生成与按章节分组

**Files:**
- Create: `src/utils/reader/searchResultUtil.ts`
- Create: `src/utils/reader/searchResultUtil.verify.js`

**Interfaces:**
- Consumes: `doSearch` 返回的 item 结构 —— `{ excerpt: string; cfi: string; text: string }`，其中 `cfi` 是 JSON 字符串，解析后含 `{ chapterTitle: string; chapterDocIndex: number | string; chapterHref: string; ... }`。
- Produces:
  - `buildSearchItemKey(item: any, index: number): string` — 返回稳定 key `${chapterDocIndex}:${cfi}`，重复时追加 index。
  - `groupSearchResults(searchList: any[]): SearchResultGroup[]`
  - `SearchResultGroup` 类型：`{ docIndex: number; title: string; items: Array<{ key: string; item: any; index: number }> }`，按 `docIndex` 升序。

- [ ] **Step 1: 写 `searchResultUtil.ts` 实现**

```ts
// src/utils/reader/searchResultUtil.ts

export interface SearchItemWithKey {
  key: string;
  item: any;
  index: number;
}

export interface SearchResultGroup {
  docIndex: number;
  title: string;
  items: SearchItemWithKey[];
}

// 解析单条 search item 的 cfi（JSON 字符串），安全容错
const parseLocation = (item: any): { chapterTitle: string; chapterDocIndex: number } => {
  let bookLocation: any = {};
  try {
    bookLocation = JSON.parse(item.cfi) || {};
  } catch {
    bookLocation = {};
  }
  const rawIndex = bookLocation.chapterDocIndex;
  const docIndex =
    typeof rawIndex === "number"
      ? rawIndex
      : parseInt(rawIndex, 10);
  return {
    chapterTitle: bookLocation.chapterTitle || "",
    chapterDocIndex: Number.isFinite(docIndex) ? docIndex : 0,
  };
};

// 生成稳定 key：同章同位置可能 cfi 重复，追加 index 兜底保证唯一
export const buildSearchItemKey = (item: any, index: number): string => {
  const { chapterDocIndex } = parseLocation(item);
  return `${chapterDocIndex}:${item.cfi}:${index}`;
};

// 按 chapterDocIndex 升序分组，组内保留搜索返回顺序
export const groupSearchResults = (searchList: any[]): SearchResultGroup[] => {
  const map = new Map<number, SearchResultGroup>();
  for (let i = 0; i < searchList.length; i++) {
    const item = searchList[i];
    const { chapterDocIndex, chapterTitle } = parseLocation(item);
    let group = map.get(chapterDocIndex);
    if (!group) {
      group = {
        docIndex: chapterDocIndex,
        title: chapterTitle,
        items: [],
      };
      map.set(chapterDocIndex, group);
    }
    group.items.push({
      key: buildSearchItemKey(item, i),
      item,
      index: i,
    });
  }
  return Array.from(map.values()).sort(
    (a, b) => a.docIndex - b.docIndex
  );
};
```

- [ ] **Step 2: 写一次性 node 验证脚本**

```js
// src/utils/reader/searchResultUtil.verify.js
const {
  buildSearchItemKey,
  groupSearchResults,
} = require("./searchResultUtil");

const assert = (cond, msg) => {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("PASS:", msg);
};

const list = [
  { excerpt: "b", cfi: JSON.stringify({ chapterTitle: "Ch2", chapterDocIndex: 1 }) },
  { excerpt: "a", cfi: JSON.stringify({ chapterTitle: "Ch1", chapterDocIndex: 0 }) },
  { excerpt: "c", cfi: JSON.stringify({ chapterTitle: "Ch1", chapterDocIndex: 0 }) },
  { excerpt: "d", cfi: JSON.stringify({ chapterTitle: "Ch2", chapterDocIndex: 1 }) },
  { excerpt: "e", cfi: "not-json" }, // 容错：落到 docIndex 0
];

const groups = groupSearchResults(list);

assert(groups.length === 2, "按 chapterDocIndex 分成 2 组");
assert(groups[0].docIndex === 0, "第一组 docIndex=0（目录序）");
assert(groups[1].docIndex === 1, "第二组 docIndex=1");
assert(groups[0].title === "Ch1", "第一组标题取首条 chapterTitle");
assert(groups[0].items.length === 3, "第一组含 2 条 Ch1 + 1 条容错条目 = 3");
assert(groups[1].items.length === 2, "第二组 2 条");
// 组内顺序保留搜索返回顺序：Ch1 的第一条是 list[1]（excerpt 'a'）
assert(groups[0].items[0].item.excerpt === "a", "组内保留返回顺序");
// 稳定 key 唯一
const keys = groups.flatMap((g) => g.items.map((it) => it.key));
assert(new Set(keys).size === keys.length, "所有 key 唯一");
assert(buildSearchItemKey(list[0], 0).includes(":0:"), "key 含 docIndex 与 index");

console.log("ALL PASSED");
```

- [ ] **Step 3: 运行验证脚本，确认通过**

Run: `node src/utils/reader/searchResultUtil.verify.js`
Expected: 输出 8 行 `PASS: ...` 与 `ALL PASSED`，退出码 0。

- [ ] **Step 4: 提交**

```bash
git add src/utils/reader/searchResultUtil.ts src/utils/reader/searchResultUtil.verify.js
git commit -m "feat(search): 新增搜索结果按章节分组的纯函数"
```

---

## Task 2: 状态扩展与清空时机

**Files:**
- Modify: `src/containers/panels/navigationPanel/interface.tsx:18-25`
- Modify: `src/containers/panels/navigationPanel/component.tsx`（constructor、`handleNavSearchState`、`nav-close-icon` onClick、`handleNavTabToggle`）

**Interfaces:**
- Consumes: 无。
- Produces: `NavigationPanelState` 含 `activeSearchKey: string | null` 与 `collapsedChapters: Set<number>`；`handleNavSearchState` 在 `"searching"` 时清空 `activeSearchKey`。

- [ ] **Step 1: 扩展 state 类型**

修改 `src/containers/panels/navigationPanel/interface.tsx`，在 `NavigationPanelState` 末尾新增两个字段：

```ts
export interface NavigationPanelState {
  currentTab: string;
  chapters: any;
  searchState: string;
  searchList: any;
  cover: string;
  isCoverExist: boolean;
  activeSearchKey: string | null;
  collapsedChapters: Set<number>;
}
```

- [ ] **Step 2: constructor 初值**

修改 `src/containers/panels/navigationPanel/component.tsx` 的 constructor（约 27-34 行），在 `isCoverExist: false,` 后追加：

```ts
    this.state = {
      currentTab: "contents",
      chapters: [],
      searchState: "",
      searchList: null,
      cover: "",
      isCoverExist: false,
      activeSearchKey: null,
      collapsedChapters: new Set<number>(),
    };
```

- [ ] **Step 3: 新搜索开始时清空选中态**

修改 `handleNavSearchState`（约 36-50 行），在 `if (state === "searching")` 块内追加清空 `activeSearchKey`：

```ts
  handleNavSearchState = (state: string) => {
    this.setState({ searchState: state });
    if (state === "searching") {
      this.setState({
        searchList: null,
        activeSearchKey: null,
      });
    }
    if (state) {
      this.props.handleSearch(true);
    } else {
      if (ConfigService.getReaderConfig("isNavLocked") !== "yes") {
        this.props.handleSearch(false);
      }
    }
  };
```

- [ ] **Step 4: 关闭面板按钮清空选中态与折叠**

修改 `render` 中 `nav-close-icon` 的 onClick（约 200-209 行）：

```ts
              onClick={() => {
                this.handleNavSearchState("");
                this.props.handleSearch(false);
                this.setState({
                  searchList: null,
                  activeSearchKey: null,
                  collapsedChapters: new Set<number>(),
                });
              }}
```

- [ ] **Step 5: 切换 Tab 时清空**

修改 `handleNavTabToggle`（约 80-100 行）中清空 `searchList` 处（约第 86 行 `this.setState({ searchList: null });`），改为同时清空选中态与折叠：

```ts
    if (this.state.searchState) {
      this.handleNavSearchState("");
      this.props.handleSearch(false);
      this.setState({
        searchList: null,
        activeSearchKey: null,
        collapsedChapters: new Set<number>(),
      });
    }
```

- [ ] **Step 6: 类型检查**

Run: `npx tsc --noEmit -p tsconfig.json`（若项目无独立 typecheck 脚本，用 `npx tsc --noEmit`）
Expected: 无新增类型错误（`Set<number>` 与 `string | null` 已是合法类型）。若 tsc 因既有代码报错，确认本任务新增字段无错即可。

- [ ] **Step 7: 提交**

```bash
git add src/containers/panels/navigationPanel/interface.tsx src/containers/panels/navigationPanel/component.tsx
git commit -m "feat(search): NavigationPanel 新增选中态与折叠状态字段及清空时机"
```

---

## Task 3: 分组渲染与选中态交互

**Files:**
- Modify: `src/containers/panels/navigationPanel/component.tsx`（`renderSearchList` 重写；新增 `toggleChapter`、`handleSearchItemClick`；顶部 import）

**Interfaces:**
- Consumes: `groupSearchResults`、`SearchResultGroup` from `src/utils/reader/searchResultUtil.ts`（Task 1）。
- Produces: `renderSearchList` 渲染按章节分组结构；点击结果项设置 `activeSearchKey` 并跳转+正文高亮；点击组标题切换该组折叠态。

- [ ] **Step 1: 顶部 import 分组函数**

修改 `src/containers/panels/navigationPanel/component.tsx` 顶部 import 区，在 `import { buildSearchHighlightStyle } from ...` 后新增一行：

```ts
import {
  groupSearchResults,
  type SearchResultGroup,
} from "../../../utils/reader/searchResultUtil";
```

- [ ] **Step 2: 新增 `toggleChapter` 与 `handleSearchItemClick` 方法**

在 `renderSearchList` 方法**之前**插入两个方法（约第 115 行前）：

```ts
  toggleChapter = (docIndex: number) => {
    this.setState((prevState) => {
      const next = new Set(prevState.collapsedChapters);
      if (next.has(docIndex)) {
        next.delete(docIndex);
      } else {
        next.add(docIndex);
      }
      return { collapsedChapters: next };
    });
  };
  handleSearchItemClick = async (item: any) => {
    let bookLocation = JSON.parse(item.cfi) || {};
    await this.props.htmlBook.rendition.goToPosition(
      JSON.stringify({
        text: bookLocation.text,
        chapterTitle: bookLocation.chapterTitle,
        chapterDocIndex: bookLocation.chapterDocIndex,
        chapterHref: bookLocation.chapterHref,
        count: bookLocation.hasOwnProperty("cfi")
          ? "ignore"
          : bookLocation.count,
        percentage: bookLocation.percentage,
        cfi: bookLocation.cfi,
        page: bookLocation.page,
      })
    );
    let style = buildSearchHighlightStyle(
      this.props.currentBook.format === "PDF" &&
        !ConfigService.getAllListConfig("convertPDFBooks").includes(
          this.props.currentBook.key
        )
    );
    this.props.htmlBook.rendition.highlightSearchNode(
      bookLocation.keyword,
      style
    );
  };
```

- [ ] **Step 3: 重写 `renderSearchList` 为分组渲染**

用以下内容整体替换现有 `renderSearchList`（约 115-170 行）：

```ts
  renderSearchList = () => {
    if (!this.state.searchList[0]) {
      return (
        <div className="navigation-panel-empty-bookmark">
          <Trans>Empty</Trans>
        </div>
      );
    }
    const groups: SearchResultGroup[] = groupSearchResults(
      this.state.searchList
    );
    return groups.map((group: SearchResultGroup) => {
      const collapsed = this.state.collapsedChapters.has(group.docIndex);
      return (
        <li className="nav-search-group" key={`group-${group.docIndex}`}>
          <div
            className="nav-search-group-title"
            onClick={() => {
              this.toggleChapter(group.docIndex);
            }}
          >
            <span
              className={
                collapsed
                  ? "nav-search-group-arrow nav-search-group-arrow-collapsed"
                  : "nav-search-group-arrow"
              }
            ></span>
            <span className="nav-search-group-name">{group.title}</span>
            <span className="nav-search-group-count">
              ({group.items.length})
            </span>
          </div>
          {!collapsed && (
            <ul className="nav-search-group-items">
              {group.items.map((entry) => {
                const isActive =
                  this.state.activeSearchKey === entry.key;
                return (
                  <li
                    className={
                      isActive
                        ? "nav-search-list-item nav-search-list-item-active"
                        : "nav-search-list-item"
                    }
                    key={entry.key}
                    onClick={() => {
                      this.setState({ activeSearchKey: entry.key });
                      this.handleSearchItemClick(entry.item);
                    }}
                  >
                    <div>{Parser(DOMPurify.sanitize(entry.item.excerpt))}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    });
  };
```

注意：去掉了原每条项底部的 `chapterTitle` `<div>`（已由组标题承担）；`key` 由 `item.text` 改为稳定 `entry.key`；`onClick` 先 `setState` 选中态再调跳转（选中态即时反馈）。

- [ ] **Step 4: 确认 `ul.nav-search-list` 容器不变**

`render` 中（约 220-228 行）外层 `<ul className="nav-search-list">` 与 `searching`/`searchList` 分支保持不变，`renderSearchList()` 调用点不变。无需改动，仅确认。

- [ ] **Step 5: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无新增类型错误。注意 `groupSearchResults` 入参 `any[]` 与 `this.state.searchList`（`any`）兼容；`SearchResultGroup` 导入用于显式标注。

- [ ] **Step 6: 手动验证（UI）**

Run: `npm run dev`（或 `npm start` + `npm run ele`）
验证步骤：
1. 打开一本 epub，进入阅读。
2. 在导航面板搜索一个跨多章出现的关键词（如常见词 "the"）。
3. 确认结果按章节分组，章节按目录顺序排列，每组标题右侧显示 `(N)` 命中数。
4. 确认每条结果项底部不再重复显示章节标题。
5. 点击某条结果：跳转到该位置、正文高亮关键词、该条列表项出现背景高亮 + 左侧色条。
6. 点击同组或他组的另一条：选中态转移到新条目，原条目恢复。
7. 点击某组标题：该组折叠/展开，箭头方向变化，仅该组受影响。
8. 关闭搜索面板（×）后重新搜索：选中态与折叠状态已清空，默认全展开。

Expected: 全部符合。若样式未生效（色条/背景未出现），进入 Task 4 检查 CSS。

- [ ] **Step 7: 提交**

```bash
git add src/containers/panels/navigationPanel/component.tsx
git commit -m "feat(search): 搜索结果按章节分组渲染并支持选中态与折叠"
```

---

## Task 4: 样式 — 组标题、折叠箭头、选中态

**Files:**
- Modify: `src/containers/panels/navigationPanel/navigationPanel.css`（文件末尾追加）

**Interfaces:**
- Consumes: Task 3 渲染的 class 名：`nav-search-group`、`nav-search-group-title`、`nav-search-group-arrow`、`nav-search-group-arrow-collapsed`、`nav-search-group-name`、`nav-search-group-count`、`nav-search-group-items`、`nav-search-list-item-active`。
- Produces: 上述 class 的视觉样式，复用主题变量。

- [ ] **Step 1: 追加样式到 css 末尾**

在 `src/containers/panels/navigationPanel/navigationPanel.css` 末尾追加：

```css
.nav-search-group {
  margin-bottom: 6px;
}
.nav-search-group-title {
  display: flex;
  align-items: center;
  padding: 6px 4px;
  cursor: pointer;
  font-size: 13px;
  opacity: 0.7;
  border-radius: 4px;
  transition: background 0.15s ease;
}
.nav-search-group-title:hover {
  background: var(--color-hover, rgba(128, 128, 128, 0.12));
}
.nav-search-group-arrow {
  display: inline-block;
  width: 0;
  height: 0;
  margin-right: 6px;
  border-left: 5px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transition: transform 0.15s ease;
}
.nav-search-group-arrow-collapsed {
  transform: rotate(-90deg);
}
.nav-search-group-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.nav-search-group-count {
  margin-left: 6px;
  opacity: 0.8;
}
.nav-search-group-items {
  list-style: none;
  padding: 0 0 0 10px;
  margin: 2px 0 0;
}
.nav-search-list-item-active {
  background: var(--color-hover, rgba(128, 128, 128, 0.12));
  border-left: 3px solid var(--color-theme-color, #0179ca);
  padding-left: 5px;
}
```

注意：`.nav-search-list-item` 已有 `padding: 8px;`（见现有 css 178-183 行）。`.nav-search-list-item-active` 覆盖左 padding 为 `5px` 以补偿 3px 左色条，保持内容不偏移。

- [ ] **Step 2: 手动验证（UI 样式）**

Run: `npm run dev`
验证步骤：
1. 搜索跨章关键词，确认组标题小号灰色（opacity 0.7）、加粗、与结果项区分。
2. 组标题悬停有浅色背景反馈。
3. 展开组箭头指向右，折叠组箭头旋转 -90°（指向下）。
4. 点击结果项后，选中项有浅色背景 + 左侧蓝色（主题色）3px 竖条，内容未整体偏移。
5. 切换浅色/深色主题（如有），确认 `--color-theme-color`/`--color-hover` 跟随主题变化，无硬编码违和。

Expected: 全部符合。

- [ ] **Step 3: 提交**

```bash
git add src/containers/panels/navigationPanel/navigationPanel.css
git commit -m "style(search): 搜索结果分组标题、折叠箭头与选中态样式"
```

---

## Task 5: 整体回归验证

**Files:**
- 无新增改动；仅验证。

- [ ] **Step 1: 类型检查全量**

Run: `npx tsc --noEmit`
Expected: 无新增错误（与改动前基线一致）。

- [ ] **Step 2: 纯函数脚本回归**

Run: `node src/utils/reader/searchResultUtil.verify.js`
Expected: `ALL PASSED`。

- [ ] **Step 3: 手动回归**

Run: `npm run dev`
验证清单：
1. **多章命中**：搜索跨多章关键词 → 分组、目录序、命中数、折叠/展开、选中转移均正常。
2. **单章命中**：搜索只在一个章节出现的词 → 单个组，组标题与命中数正确。
3. **空结果**：搜索不存在的词 → 显示 "Empty"（保持原行为）。
4. **加载态**：搜索过程中显示加载动画（`searching`），不报错。
5. **PDF 书籍**：打开 PDF（未加入 convertPDFBooks）→ 搜索点击跳转与正文高亮走 PDF 分支，不报错（`buildSearchHighlightStyle(true)`）。
6. **关闭重开**：关闭搜索面板后重新搜索 → 选中态、折叠状态均已清空，默认全展开。
7. **书架/笔记搜索不受影响**：书架页搜索框、导航面板的书签/笔记 tab 内搜索 → 行为不变（本改动未触及）。

Expected: 全部符合。任一项异常则回到对应 Task 修复。

- [ ] **Step 4: 完成确认**

无新增提交（本任务仅验证）。若验证中发现问题并修复，则相应提交修复。

---

## Self-Review 结果

- **Spec 覆盖**：分组（Task 1+3）、命中数（Task 3 渲染 + Task 4 样式）、可折叠默认展开（Task 3 `toggleChapter` + Task 4 箭头）、组标题样式区分（Task 4）、去项底部章标（Task 3）、持久选中态背景+左色条点击转移（Task 2 状态 + Task 3 交互 + Task 4 样式）、清空时机（Task 2）、保持不变项（Task 3 不改数据流/正文高亮 + Task 5 回归 PDF 分支与书架搜索）—— 全覆盖。
- **Placeholder 扫描**：无 TBD/TODO；每步含完整代码或确切命令。
- **类型一致性**：`buildSearchItemKey`、`groupSearchResults`、`SearchResultGroup`、`activeSearchKey`、`collapsedChapters`、`toggleChapter`、`handleSearchItemClick`、class 名跨任务一致。
- **测试基建说明**：项目无测试框架，Task 1 用 node 脚本验证纯函数（已含完整脚本），Task 3/4/5 用手动验证（已含确切步骤与期望）。未引入测试库，符合 YAGNI。
