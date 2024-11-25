import Word from "../../models/DictHistory";
declare var window: any;

class WordService {
  static async getAllWords(): Promise<Word[]> {
    const words = (await window.localforage.getItem("words")) || [];
    return words;
  }
  static async saveAllWords(words: Word[]) {
    await window.localforage.setItem("words", words);
  }
  static async deleteAllWords() {
    await window.localforage.removeItem("words");
  }
  static async saveWord(word: Word) {
    let words = await this.getAllWords();
    words.push(word);
    await this.saveAllWords(words);
  }
  static async deleteWord(key: string) {
    let words = await this.getAllWords();
    words = words.filter((b) => b.key !== key);
    if (words.length === 0) {
      await this.deleteAllWords();
    } else {
      await this.saveAllWords(words);
    }
  }
  static async updateWord(word: Word) {
    let words = await this.getAllWords();
    words = words.map((b) => {
      if (b.key === word.key) {
        return word;
      }
      return b;
    });
    await this.saveAllWords(words);
  }
  static async getWord(key: string): Promise<Word | null> {
    let words = await this.getAllWords();
    for (let word of words) {
      if (word.key === key) {
        return word;
      }
    }
    return null;
  }
  static async getWordsByBookKey(bookKey: string): Promise<Word[]> {
    let words = await this.getAllWords();
    return words.filter((word) => word.bookKey === bookKey);
  }
  static async getWordsByBookKeys(bookKeys: string[]): Promise<Word[]> {
    let words = await this.getAllWords();
    return words.filter((word) => bookKeys.includes(word.bookKey));
  }
}

export default WordService;
