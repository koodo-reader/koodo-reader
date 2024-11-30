
const createTableStatement = {
  notes: `
      CREATE TABLE IF NOT EXISTS "notes" (
        "key" text PRIMARY KEY,
        "bookKey" text,
        "date" object,
        "chapter" text,
        "chapterIndex" integer,
        "text" text,
        "cfi" text,
        "range" text,
        "notes" text,
        "percentage" text,
        "color" integer,
        "tag" array
      )
    `,
  bookmarks: `
      CREATE TABLE IF NOT EXISTS "bookmarks" (
        "key" text PRIMARY KEY,
        "bookKey" text,
        "cfi" text,
        "label" text,
        "percentage" text,
        "chapter" text
      );
    `,
  books: `
      CREATE TABLE IF NOT EXISTS "books" (
        "key" text PRIMARY KEY,
        "name" text,
        "author" text,
        "description" text,
        "md5" text,
        "cover" text,
        "format" text,
        "publisher" text,
        "size" integer,
        "page" integer,
        "path" text,
        "charset" text
      );
    `,
  plugins: `
      CREATE TABLE IF NOT EXISTS "plugins" (
        "identifier" text PRIMARY KEY,
        "type" text,
        "displayName" text,
        "icon" text,
        "version" text,
        "config" object,
        "autoValue" string,
        "langList" text,
        "voiceList" text,
        "scriptSHA256" text,
        "script" text
      );
    `,
  words: `
      CREATE TABLE IF NOT EXISTS "words" (
        "key" text PRIMARY KEY,
        "bookKey" text,
        "date" object,
        "word" text,
        "chapter" text
      );
    `,
}
const getAllStatement = {
  notes: 'SELECT * FROM notes',
  bookmarks: 'SELECT * FROM bookmarks',
  books: 'SELECT * FROM books',
  plugins: 'SELECT * FROM plugins',
  words: 'SELECT * FROM words',
}
const saveStatement = {
  notes: 'INSERT INTO notes (key, bookKey, chapter, chapterIndex, text, cfi, range, notes, date, percentage, color, tag) VALUES (@key, @bookKey, @chapter, @chapterIndex, @text, @cfi, @range, @notes, @date, @percentage, @color, @tag)',
  bookmarks: 'INSERT INTO bookmarks (key, bookKey, cfi, label, percentage, chapter) VALUES (@key, @bookKey, @cfi, @label, @percentage, @chapter)',
  books: 'INSERT INTO books (key, name, author, description, md5, cover, format, publisher, size, page, path, charset) VALUES (@key, @name, @author, @description, @md5, @cover, @format, @publisher, @size, @page, @path, @charset)',
  plugins: 'INSERT INTO plugins (identifier, type, displayName, icon, version, config, autoValue, langList, voiceList, scriptSHA256, script) VALUES (@identifier, @type, @displayName, @icon, @version, @config, @autoValue, @langList, @voiceList, @scriptSHA256, @script)',
  words: 'INSERT INTO words (key, bookKey, date, word, chapter) VALUES (@key, @bookKey, @date, @word, @chapter)',
}
const deleteAllStatement = {
  notes: 'DELETE FROM notes',
  bookmarks: 'DELETE FROM bookmarks',
  books: 'DELETE FROM books',
  plugins: 'DELETE FROM plugins',
  words: 'DELETE FROM words',
}
const updateStatement = {
  notes: 'UPDATE notes SET bookKey = @bookKey, chapter = @chapter, chapterIndex = @chapterIndex, text = @text, cfi = @cfi, range = @range, notes = @notes, date = @date, percentage = @percentage, color = @color, tag = @tag WHERE key = @key',
  bookmarks: 'UPDATE bookmarks SET bookKey = @bookKey, cfi = @cfi, label = @label, percentage = @percentage, chapter = @chapter WHERE key = @key',
  books: 'UPDATE books SET name = @name, author = @author, description = @description, md5 = @md5, cover = @cover, format = @format, publisher = @publisher, size = @size, page = @page, path = @path, charset = @charset WHERE key = @key',
  plugins: 'UPDATE plugins SET type = @type, displayName = @displayName, icon = @icon, version = @version, config = @config, autoValue = @autoValue, langList = @langList, voiceList = @voiceList, scriptSHA256 = @scriptSHA256, script = @script WHERE identifier = @identifier',
  words: 'UPDATE words SET bookKey = @bookKey, date = @date, word = @word, chapter = @chapter WHERE key = @key',
}
const deleteStatement = {
  notes: 'DELETE FROM notes WHERE key = ?',
  bookmarks: 'DELETE FROM bookmarks WHERE key = ?',
  books: 'DELETE FROM books WHERE key = ?',
  plugins: 'DELETE FROM plugins WHERE identifier = ?',
  words: 'DELETE FROM words WHERE key = ?',
}
const getStatement = {
  notes: `SELECT * FROM notes WHERE key = ?`,
  bookmarks: 'SELECT * FROM bookmarks WHERE key = ?',
  books: 'SELECT * FROM books WHERE key = ?',
  plugins: 'SELECT * FROM plugins WHERE identifier = ?',
  words: 'SELECT * FROM words WHERE key = ?',
}
const getByBookKeyStatement = {
  notes: `SELECT * FROM notes WHERE bookKey = ?`,
  bookmarks: 'SELECT * FROM bookmarks WHERE bookKey = ?',
  words: 'SELECT * FROM words WHERE bookKey = ?',
  books: 'SELECT * FROM books WHERE key = ?',
}
const deleteByBookKeyStatement = {
  notes: `DELETE FROM notes WHERE bookKey = ?`,
  bookmarks: 'DELETE FROM bookmarks WHERE bookKey = ?',
  words: 'DELETE FROM words WHERE bookKey = ?',
}
const getByBookKeysStatement = {
  notes: (bookKeys) => `SELECT * FROM notes WHERE bookKey IN (${bookKeys.map(() => '?').join(',')})`,
  bookmarks: (bookKeys) => `SELECT * FROM bookmarks WHERE bookKey IN (${bookKeys.map(() => '?').join(',')})`,
  words: (bookKeys) => `SELECT * FROM words WHERE bookKey IN (${bookKeys.map(() => '?').join(',')})`,
  books: (bookKeys) => `SELECT * FROM books WHERE key IN (${bookKeys.map(() => '?').join(',')})`,
}
const sqlStatement = {
  createTableStatement,
  getAllStatement,
  saveStatement,
  deleteAllStatement,
  updateStatement,
  deleteStatement,
  getStatement,
  getByBookKeyStatement,
  getByBookKeysStatement,
  deleteByBookKeyStatement
}
const jsonToSqlite = {
  notes: (note) => {
    let noteRaw = { ...note };
    noteRaw.date = JSON.stringify(note.date);
    noteRaw.tag = JSON.stringify(note.tag);
    return noteRaw;
  },
  bookmarks: (bookmark) => {
    return bookmark;
  },
  books: (book) => {
    return book;
  },
  plugins: (plugin) => {
    let pluginRaw = { ...plugin };
    if (!plugin.autoValue) { pluginRaw.autoValue = null }
    if (!plugin.langList) { pluginRaw.langList = null } else {
      pluginRaw.langList = JSON.stringify(plugin.langList);
    }
    if (!plugin.voiceList) { pluginRaw.voiceList = null } else {
      pluginRaw.voiceList = JSON.stringify(plugin.voiceList);
    }
    pluginRaw.config = JSON.stringify(plugin.config);
    return pluginRaw;
  },
  words: (word) => {
    let wordRaw = { ...word };
    wordRaw.date = JSON.stringify(word.date);
    return wordRaw;
  },
}
const sqliteToJson = {
  notes: (note) => {
    let noteRaw = { ...note };
    noteRaw.date = JSON.parse(note.date);
    noteRaw.tag = JSON.parse(note.tag);
    return noteRaw;
  },
  bookmarks: (bookmark) => {
    return bookmark;
  },
  books: (book) => {
    return book;
  },
  plugins: (plugin) => {
    let pluginRaw = { ...plugin };
    if (!plugin.autoValue) { delete pluginRaw.autoValue }
    if (!plugin.langList) { delete pluginRaw.langList } else {
      pluginRaw.langList = JSON.parse(plugin.langList);
    }
    if (!plugin.voiceList) { delete pluginRaw.voiceList } else {
      pluginRaw.voiceList = JSON.parse(plugin.voiceList);
    }
    pluginRaw.config = JSON.parse(plugin.config);
    return pluginRaw;
  },
  words: (word) => {
    let wordRaw = { ...word };
    wordRaw.date = JSON.parse(word.date);
    return wordRaw;
  },
}


module.exports = { sqlStatement, jsonToSqlite, sqliteToJson };