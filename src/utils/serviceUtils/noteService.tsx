import Note from "../../models/Note";
declare var window: any;

class NoteService {
  static async getAllNotes(): Promise<Note[]> {
    const notes = (await window.localforage.getItem("notes")) || [];
    return notes;
  }
  static async saveAllNotes(notes: Note[]) {
    await window.localforage.setItem("notes", notes);
  }
  static async deleteAllNotes() {
    await window.localforage.removeItem("notes");
  }
  static async saveNote(note: Note) {
    let notes = await this.getAllNotes();
    notes.push(note);
    await this.saveAllNotes(notes);
  }
  static async deleteNote(key: string) {
    let notes = await this.getAllNotes();
    notes = notes.filter((b) => b.key !== key);
    if (notes.length === 0) {
      await this.deleteAllNotes();
    } else {
      await this.saveAllNotes(notes);
    }
  }
  static async updateNote(note: Note) {
    let notes = await this.getAllNotes();
    notes = notes.map((b) => {
      if (b.key === note.key) {
        return note;
      }
      return b;
    });
    await this.saveAllNotes(notes);
  }
  static async getNote(key: string): Promise<Note | null> {
    let notes = await this.getAllNotes();
    for (let note of notes) {
      if (note.key === key) {
        return note;
      }
    }
    return null;
  }
  static async getNotesByBookKey(bookKey: string): Promise<Note[]> {
    let notes = await this.getAllNotes();
    return notes.filter(
      (note) => note.bookKey === bookKey && note.notes !== ""
    );
  }
  static async getHighlightsByBookKey(bookKey: string): Promise<Note[]> {
    let notes = await this.getAllNotes();
    return notes.filter(
      (note) => note.bookKey === bookKey && note.notes === ""
    );
  }
  static async getNotesByBookKeys(bookKeys: string[]): Promise<Note[]> {
    let notes = await this.getAllNotes();
    return notes.filter(
      (note) => bookKeys.includes(note.bookKey) && note.notes !== ""
    );
  }
  static async getHighlightsByBookKeys(bookKeys: string[]): Promise<Note[]> {
    let notes = await this.getAllNotes();
    return notes.filter(
      (note) => bookKeys.includes(note.bookKey) && note.notes === ""
    );
  }
}

export default NoteService;
