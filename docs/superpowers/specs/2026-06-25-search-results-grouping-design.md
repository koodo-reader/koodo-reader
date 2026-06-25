# 阅读器搜索结果按章节分组与选中高亮

日期：2026-06-25
范围：阅读器内电子书全文搜索结果列表
影响组件：`src/containers/panels/navigationPanel/component.tsx`、`src/containers/panels/navigationPanel/interface.tsx`、`src/containers/panels/navigationPanel/navigationPanel.css`

## 1. 目标与范围

改造阅读器内电子书全文搜索的结果展示。当前 `NavigationPanel.renderSearchList` 把搜索结果拍平为一个列表，每条项底部显示章节标题，点击后跳转并在正文高亮关键词，但没有按章节分组，点击后列表项也没有视觉选中态。

### 目标

- 搜索结果按章节分组展示，按书本目录顺序排列章节组。
- 每个章节组显示命中数、可折叠（默认展开）、组标题样式与结果项区分。
- 去掉每条结果项底部重复的章节标题。
- 点击某条结果后，列表中该条获得持久选中态（背景高亮 + 左侧色条），点击另一条后选中态转移。

### 不在范围

- 书架搜索、笔记搜索、高亮搜索（`SearchBox` 非阅读模式、`navList` 的书签/笔记搜索）。
- 全局状态/store 改动。
- 搜索数据来源与正文高亮逻辑（`highlightSearchNode`、`goToPosition`）保持不变。

## 2. 现状

`renderSearchList`（`component.tsx:115`）将 `state.searchList` 映射为 `<ul class="nav-search-list">` 下的若干 `<li class="nav-search-list-item">`。每条 li：

- 顶部 `<div>` 渲染 `Parser(DOMPurify.sanitize(item.excerpt))`，excerpt 已含 `<span class="content-search-text">` 包裹的关键词高亮。
- 底部 `<div>` 右对齐显示 `JSON.parse(item.cfi).chapterTitle`。
- `onClick`：解析 `item.cfi` → `goToPosition` 跳转 → `buildSearchHighlightStyle` → `highlightSearchNode(bookLocation.keyword, style)` 在正文高亮关键词。
- `key={item.text}`，同一关键词多处文本相同时不唯一。

`state.searchList` 来自 `SearchBox.search`（`searchBox/component.tsx:85`）经 `handleSearchList` 传入；每条 item 含 `excerpt`、`cfi`（JSON 字符串，含 `chapterTitle`、`chapterDocIndex`、`chapterHref`、`keyword` 等）、`text`。

清空/重置搜索的入口：`handleNavSearchState("searching")`、`nav-close-icon` 点击、`handleNavTabToggle`。

## 3. 设计

### 3.1 状态扩展

`NavigationPanelState`（`interface.tsx:18`）新增：

```ts
activeSearchKey: string | null;   // 当前选中结果项的稳定标识
collapsedChapters: Set<number>;   // 折叠的章节 chapterDocIndex 集合
```

constructor 初值：`activeSearchKey: null`、`collapsedChapters: new Set<number>()`。

**选中标识用稳定 key 而非数组 index**：分组排序后顺序会变，index 不可靠。每条结果生成稳定 key `${chapterDocIndex}:${cfi}`；若极端情况下仍重复，追加全局 index 兜底（`${chapterDocIndex}:${cfi}:${index}`）。`activeSearchKey` 存该 key，同时作为 li 的 `key`。

清空时机：
- 新搜索开始：`handleNavSearchState("searching")` 时 `activeSearchKey` 置 null。
- 关闭搜索面板：`nav-close-icon` 点击、`handleNavTabToggle` 中清空 `searchList` 处，同时置 `activeSearchKey: null` 与 `collapsedChapters: new Set()`。

### 3.2 分组逻辑

`renderSearchList` 内对 `searchList` 做一次派生分组（纯计算，不存 state）：

1. 遍历 `searchList`，解析每条 `cfi` 取 `chapterDocIndex`，生成稳定 key。
2. 按 `chapterDocIndex` 升序分组，保持书本目录顺序。
3. 每组内保留搜索返回顺序。

输出结构：`Array<{ docIndex: number; title: string; items: Array<{ key: string; item: any; index: number }> }>`，`title` 取组内首条的 `chapterTitle`。

### 3.3 渲染结构

```
<ul class="nav-search-list">
  各章节组:
    <li class="nav-search-group">
      <div class="nav-search-group-title" onClick={toggleChapter(docIndex)}>
        <span class="nav-search-group-arrow {collapsed ? 'collapsed' : ''}"></span>
        <span class="nav-search-group-name">{chapterTitle}</span>
        <span class="nav-search-group-count">({items.length})</span>
      </div>
      {!collapsed && (
        <ul class="nav-search-group-items">
          各结果项:
            <li class="nav-search-list-item {isActive ? 'active' : ''}" key={key} onClick={...}>
              <div>{Parser(DOMPurify.sanitize(item.excerpt))}</div>
            </li>
        </ul>
      )}
    </li>
</ul>
```

折叠交互：`toggleChapter = (docIndex: number) => this.setState(prev => { const next = new Set(prev.collapsedChapters); next.has(docIndex) ? next.delete(docIndex) : next.add(docIndex); return { collapsedChapters: next }; })`。

每条结果项去掉底部章节标题 `<div>`（已由组标题承担）。

### 3.4 点击与选中态

结果项 `onClick` 在原有跳转 + 正文高亮逻辑外层先设置选中态：

```ts
onClick={async () => {
  this.setState({ activeSearchKey: key });
  const bookLocation = JSON.parse(item.cfi) || {};
  await this.props.htmlBook.rendition.goToPosition(/* 同现有 */);
  const style = buildSearchHighlightStyle(/* 同现有 */);
  this.props.htmlBook.rendition.highlightSearchNode(bookLocation.keyword, style);
}}
```

选中态为纯本地 UI，`setState` 即时响应，不等跳转完成。

### 3.5 样式

`navigationPanel.css` 新增（复用项目主题变量 `--color-theme-color` 默认 `#0179ca`、`--color-hover`、`--color-card-bg`，带 fallback）：

- `.nav-search-list-item.active`：选中背景（`var(--color-hover, rgba(128,128,128,0.12))`）+ 左侧 3px 色条（`var(--color-theme-color, #0179ca)`）。
- `.nav-search-group-title`：小号、灰色、带 hover 反馈、cursor pointer。
- `.nav-search-group-items`：相对组标题缩进，与组标题层级区分。
- `.nav-search-group-arrow`：折叠箭头，展开/折叠状态旋转过渡。
- 保持 `.nav-search-list-item` 现有 padding/word-break 行为；`active` 仅叠加背景与左色条。

## 4. 边界与保持不变

- 空结果（`searchList[0]` 不存在）保持现有 "Empty" 提示。
- `searchState === "searching"` 加载动画不变。
- 正文高亮 `highlightSearchNode`、跳转 `goToPosition` 逻辑不变。
- `searchList` 数据来源不变。
- PDF 书籍分支（`currentBook.format === "PDF"` 与 `convertPDFBooks` 判断）不变。

## 5. 验证

手动验证：
- 打开 epub，搜索一个跨多章出现的关键词 → 验证按章分组、目录序、命中数正确。
- 折叠/展开某章节组 → 仅该组收起，箭头方向变化。
- 点击某条结果 → 跳转、正文高亮关键词、该条列表项出现背景高亮 + 左侧色条。
- 点击另一条 → 选中态转移到新条目，原条目恢复。
- 关闭搜索面板后重开 → 选中态与折叠状态已清空。
- 回归：单章命中、空结果、PDF 书籍搜索路径。
