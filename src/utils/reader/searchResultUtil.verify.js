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
assert(buildSearchItemKey(list[0], 0).includes(":0"), "key 含 docIndex 与 index");

console.log("ALL PASSED");
