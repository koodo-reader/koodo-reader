import { isElectron } from "react-device-detect";
import Word from "../../models/DictHistory";
import { getStorageLocation } from "../common";
declare var window: any;

class WordService {
  static async getAllWords(): Promise<Word[]> {
    if (isElectron) {
      let words = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getAllStatement",
          statementType: "string",
          executeType: "all",
          dbName: "words",
          storagePath: getStorageLocation(),
        });
      return words;
    } else {
      const words = (await window.localforage.getItem("words")) || [];
      return words;
    }
  }
  static async saveAllWords(words: Word[]) {
    if (isElectron) {
      for (let word of words) {
        await window
          .require("electron")
          .ipcRenderer.invoke("database-command", {
            statement: "saveStatement",
            statementType: "string",
            executeType: "run",
            dbName: "words",
            data: word,
            storagePath: getStorageLocation(),
          });
      }
    } else {
      await window.localforage.setItem("words", words);
    }
  }
  static async deleteAllWords() {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteAllStatement",
        statementType: "string",
        executeType: "run",
        dbName: "words",
        storagePath: getStorageLocation(),
      });
    } else {
      await window.localforage.removeItem("words");
    }
  }
  static async saveWord(word: Word) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "saveStatement",
        statementType: "string",
        executeType: "run",
        dbName: "words",
        data: word,
        storagePath: getStorageLocation(),
      });
    } else {
      let words = await this.getAllWords();
      words.push(word);
      await this.saveAllWords(words);
    }
  }
  static async deleteWord(key: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteStatement",
        statementType: "string",
        executeType: "run",
        dbName: "words",
        data: key,
        storagePath: getStorageLocation(),
      });
    } else {
      let words = await this.getAllWords();
      words = words.filter((b) => b.key !== key);
      if (words.length === 0) {
        await this.deleteAllWords();
      } else {
        await this.saveAllWords(words);
      }
    }
  }
  static async updateWord(word: Word) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "updateStatement",
        statementType: "string",
        executeType: "run",
        dbName: "words",
        data: word,
        storagePath: getStorageLocation(),
      });
    } else {
      let words = await this.getAllWords();
      words = words.map((b) => {
        if (b.key === word.key) {
          return word;
        }
        return b;
      });
      await this.saveAllWords(words);
    }
  }
  static async getWord(key: string): Promise<Word | null> {
    if (isElectron) {
      let word = window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getStatement",
          statementType: "string",
          executeType: "get",
          dbName: "words",
          data: key,
          storagePath: getStorageLocation(),
        });
      return word;
    } else {
      let words = await this.getAllWords();
      for (let word of words) {
        if (word.key === key) {
          return word;
        }
      }
      return null;
    }
  }
  static async getWordsByBookKey(bookKey: string): Promise<Word[]> {
    if (isElectron) {
      let words = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getStatement",
          statementType: "string",
          executeType: "all",
          dbName: "words",
          data: bookKey,
          storagePath: getStorageLocation(),
        });
      return words;
    } else {
      let words = await this.getAllWords();
      return words.filter((word) => word.bookKey === bookKey);
    }
  }
  static async getWordsByBookKeys(bookKeys: string[]): Promise<Word[]> {
    if (isElectron) {
      let words = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getByBookKeysStatement",
          statementType: "function",
          executeType: "all",
          dbName: "words",
          data: bookKeys,
          storagePath: getStorageLocation(),
        });
      return words;
    } else {
      let words = await this.getAllWords();
      return words.filter((word) => bookKeys.includes(word.bookKey));
    }
  }
}

export default WordService;
