class Highlighter {
  constructor(key, bookKey, cfi, range, color) {
    this.key = key;
    this.bookKey = bookKey;

    this.cfi = cfi;
    this.color = color;
    this.range = range; // Rangy.js产生的将Range对象序列化后的字符串
  }
}

export default Highlighter;
