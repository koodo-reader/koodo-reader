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
