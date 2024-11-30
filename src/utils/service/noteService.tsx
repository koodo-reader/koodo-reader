import { isElectron } from "react-device-detect";
import Note from "../../models/Note";
import { getStorageLocation } from "../common";
import SqlUtil from "../file/sqlUtil";
declare var window: any;

class NoteService {
  static async getDbBuffer() {
    let sqlUtil = new SqlUtil();
    let notes = await this.getAllNotes();
    return sqlUtil.JsonToDbBuffer(notes, "notes");
  }
  static async getAllNotes(): Promise<Note[]> {
    if (isElectron) {
      let notes = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getAllStatement",
          statementType: "string",
          executeType: "all",
          dbName: "notes",
          storagePath: getStorageLocation(),
        });
      return notes;
    } else {
      const notes = (await window.localforage.getItem("notes")) || [];
      return notes;
    }
  }
  static async saveAllNotes(notes: Note[]) {
    if (isElectron) {
      for (let note of notes) {
        await window
          .require("electron")
          .ipcRenderer.invoke("database-command", {
            statement: "saveStatement",
            statementType: "string",
            executeType: "run",
            dbName: "notes",
            data: note,
            storagePath: getStorageLocation(),
          });
      }
    } else {
      await window.localforage.setItem("notes", notes);
    }
  }
  static async deleteAllNotes() {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteAllStatement",
        statementType: "string",
        executeType: "run",
        dbName: "notes",
        storagePath: getStorageLocation(),
      });
    }
    await window.localforage.removeItem("notes");
  }
  static async updateAllNotes(notes: Note[]) {
    if (isElectron) {
      for (let note of notes) {
        await window
          .require("electron")
          .ipcRenderer.invoke("database-command", {
            statement: "updateStatement",
            statementType: "string",
            executeType: "run",
            dbName: "notes",
            data: note,
            storagePath: getStorageLocation(),
          });
      }
    } else {
      await this.saveAllNotes(notes);
    }
  }
  static async saveNote(note: Note) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "saveStatement",
        statementType: "string",
        executeType: "run",
        dbName: "notes",
        data: note,
        storagePath: getStorageLocation(),
      });
    } else {
      let notes = await this.getAllNotes();
      notes.push(note);
      await this.saveAllNotes(notes);
    }
  }
  static async deleteNote(key: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteStatement",
        statementType: "string",
        executeType: "run",
        dbName: "notes",
        data: key,
        storagePath: getStorageLocation(),
      });
    } else {
      let notes = await this.getAllNotes();
      notes = notes.filter((b) => b.key !== key);
      if (notes.length === 0) {
        await this.deleteAllNotes();
      } else {
        await this.saveAllNotes(notes);
      }
    }
  }
  static async updateNote(note: Note) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "updateStatement",
        statementType: "string",
        executeType: "run",
        dbName: "notes",
        data: note,
        storagePath: getStorageLocation(),
      });
    } else {
      let notes = await this.getAllNotes();
      notes = notes.map((b) => {
        if (b.key === note.key) {
          return note;
        }
        return b;
      });
      await this.saveAllNotes(notes);
    }
  }
  static async getNote(key: string): Promise<Note | null> {
    if (isElectron) {
      let note = window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getStatement",
          statementType: "string",
          executeType: "get",
          dbName: "notes",
          data: key,
          storagePath: getStorageLocation(),
        });
      return note;
    } else {
      let notes = await this.getAllNotes();
      for (let note of notes) {
        if (note.key === key) {
          return note;
        }
      }
      return null;
    }
  }
  static async getNotesByBookKey(bookKey: string): Promise<Note[]> {
    if (isElectron) {
      let notes = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getByBookKeyStatement",
          statementType: "string",
          executeType: "all",
          dbName: "notes",
          data: bookKey,
          storagePath: getStorageLocation(),
        });
      return notes.filter((note) => note.notes !== "");
    } else {
      let notes = await this.getAllNotes();
      return notes.filter(
        (note) => note.bookKey === bookKey && note.notes !== ""
      );
    }
  }
  static async getHighlightsByBookKey(bookKey: string): Promise<Note[]> {
    if (isElectron) {
      let notes = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getByBookKeyStatement",
          statementType: "string",
          executeType: "all",
          dbName: "notes",
          data: bookKey,
          storagePath: getStorageLocation(),
        });
      return notes.filter((note) => note.notes === "");
    } else {
      let notes = await this.getAllNotes();
      return notes.filter(
        (note) => note.bookKey === bookKey && note.notes === ""
      );
    }
  }
  static async getNotesByBookKeys(bookKeys: string[]): Promise<Note[]> {
    if (isElectron) {
      let notes = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getByBookKeysStatement",
          statementType: "function",
          executeType: "all",
          dbName: "notes",
          data: bookKeys,
          storagePath: getStorageLocation(),
        });
      return notes.filter((note) => note.notes !== "");
    } else {
      let notes = await this.getAllNotes();
      return notes.filter(
        (note) => bookKeys.includes(note.bookKey) && note.notes !== ""
      );
    }
  }
  static async getHighlightsByBookKeys(bookKeys: string[]): Promise<Note[]> {
    if (isElectron) {
      let notes = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getByBookKeysStatement",
          statementType: "function",
          executeType: "all",
          dbName: "notes",
          data: bookKeys,
          storagePath: getStorageLocation(),
        });
      return notes.filter((note) => note.notes === "");
    } else {
      let notes = await this.getAllNotes();
      return notes.filter(
        (note) => bookKeys.includes(note.bookKey) && note.notes === ""
      );
    }
  }
  static async deleteNotesByBookKey(bookKey: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteByBookKeyStatement",
        statementType: "string",
        executeType: "run",
        dbName: "notes",
        data: bookKey,
        storagePath: getStorageLocation(),
      });
    } else {
      let notes = await this.getAllNotes();
      notes = notes.filter((note) => note.bookKey !== bookKey);
      if (notes.length === 0) {
        await this.deleteAllNotes();
      } else {
        await this.saveAllNotes(notes);
      }
    }
  }
}

export default NoteService;
