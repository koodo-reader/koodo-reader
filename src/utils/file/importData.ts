import toast from "react-hot-toast";
import i18n from "../../i18n";
import { isElectron } from "react-device-detect";
import DatabaseService from "../storage/databaseService";
import { vexComfirmAsync } from "../common";
declare var window: any;

export type ImportResult =
  | "success"
  | "failed"
  | "cancel"
  | (ImportSummary & { result: "success" });

type ImportedType = "note" | "highlight" | "dictionaryHistory";

interface ImportSummary {
  imported: number;
  skipped: number;
}

const VALID_EXPORT_TYPES: ImportedType[] = [
  "note",
  "highlight",
  "dictionaryHistory",
];

interface PreparedRecord {
  dbName: "notes" | "words";
  record: any;
  bookMd5?: string;
  bookName?: string;
}

// 提示 CSV / JSON 文件（Electron 走 IPC，Web 走隐藏 file input）
const selectImportFiles = async (): Promise<
  { name: string; content: string }[] | null
> => {
  if (isElectron) {
    const ipcRenderer = window.electronAPI;
    const filePaths: string[] = await ipcRenderer.invoke("select-import-file");
    if (!filePaths || filePaths.length === 0) {
      return null;
    }
    const fs = window.electronAPI.fs;
    return filePaths.map((filePath: string) => ({
      name: filePath,
      content: fs.readFileSync(filePath, "utf-8"),
    }));
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.json";
    input.multiple = true;
    input.onchange = async (e: any) => {
      const fileList: FileList | null = e.target.files;
      if (!fileList || fileList.length === 0) {
        resolve(null);
        return;
      }
      try {
        const files = await Promise.all(
          Array.from(fileList).map(async (file) => ({
            name: file.name,
            content: await file.text(),
          }))
        );
        resolve(files);
      } catch (error) {
        console.error("Failed to read import files:", error);
        resolve([]);
      }
    };
    input.click();
  });
};

// 轻量 CSV 解析：支持 BOM、引号包裹、"" 转义、内嵌逗号/换行
const parseCsvText = (text: string): string[][] => {
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ",") {
      row.push(field);
      field = "";
      i++;
    } else if (ch === "\r") {
      i++;
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else {
      field += ch;
      i++;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
};

const parseCsvRecords = (content: string): any[] | null => {
  const rows = parseCsvText(content);
  if (rows.length < 2) {
    return null;
  }
  const headers = rows[0].map((h) => h.trim());
  if (!headers.includes("key")) {
    return null;
  }
  return rows.slice(1).map((row) => {
    const record: any = {};
    headers.forEach((header, index) => {
      if (header) {
        record[header] = row[index] !== undefined ? row[index] : "";
      }
    });
    return record;
  });
};

const parseJsonRecords = (content: string): any[] | null => {
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      return data.every((item) => item && typeof item === "object")
        ? data
        : null;
    }
    return null;
  } catch {
    return null;
  }
};

const parseFileRecords = (name: string, content: string): any[] | null => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "json") {
    return parseJsonRecords(content);
  }
  if (ext === "csv") {
    return parseCsvRecords(content);
  }
  return null;
};

// 依据 exportType 或特有字段判定数据类型
const detectRecordType = (record: any): ImportedType | null => {
  if (VALID_EXPORT_TYPES.includes(record.exportType)) {
    return record.exportType as ImportedType;
  }
  if (typeof record.word === "string" && record.word.trim()) {
    return "dictionaryHistory";
  }
  if (typeof record.notes === "string" && record.notes.trim()) {
    return "note";
  }
  if (typeof record.text === "string" && record.text.trim()) {
    return "highlight";
  }
  return null;
};

// "YYYY-MM-DD" 字符串还原为 {year, month, day} 对象
const parseDate = (value: any) => {
  if (value && typeof value === "object" && value.year) {
    const year = Number(value.year);
    const month = Number(value.month);
    const day = Number(value.day);
    if (year && month && day) {
      return { year, month, day };
    }
  }
  const match = String(value || "")
    .trim()
    .match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
};

// 逗号分隔的字符串还原为标签数组
const parseTag = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.map(String).filter((tag) => tag.trim());
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

// styleType + 色值还原为数据库存储的 "styleType-color" 格式
const parseColor = (record: any): string => {
  const styleType = record.styleType ? String(record.styleType) : "";
  const color = record.color ? String(record.color) : "";
  if (styleType && color) {
    return `${styleType}-${color}`;
  }
  if (color.includes("-")) {
    return color;
  }
  return "background-#FEF3CD";
};

const buildNoteRecord = (record: any, bookKey: string) => ({
  key: String(record.key),
  bookKey,
  date: parseDate(record.date),
  chapter: record.chapter ? String(record.chapter) : "",
  chapterIndex: Number(record.chapterIndex) || 0,
  text: record.text ? String(record.text) : "",
  cfi: record.cfi ? String(record.cfi) : "",
  range: record.range ? String(record.range) : "",
  notes: record.notes ? String(record.notes) : "",
  percentage: record.percentage ? String(record.percentage) : "0",
  color: parseColor(record),
  tag: parseTag(record.tag),
});

const buildWordRecord = (record: any, bookKey: string) => ({
  key: String(record.key),
  bookKey,
  date: parseDate(record.date),
  word: record.word ? String(record.word) : "",
  chapter: record.chapter ? String(record.chapter) : "",
  sentence: record.sentence ? String(record.sentence) : "",
});

export const importNotesData = async (): Promise<ImportResult> => {
  const files = await selectImportFiles();
  if (!files) {
    return "cancel";
  }
  if (files.length === 0) {
    toast.error(i18n.t("Failed to import"));
    return "failed";
  }

  // 解析全部文件，任何一个无效则中断
  const rawRecords: any[] = [];
  for (const file of files) {
    const records = parseFileRecords(file.name, file.content);
    if (!records || records.length === 0) {
      toast.error(i18n.t("Invalid data"));
      return "failed";
    }
    rawRecords.push(...records);
  }

  // 判定类型并还原为数据库原始格式
  const preparedRecords: PreparedRecord[] = [];
  for (const record of rawRecords) {
    const type = detectRecordType(record);
    if (!type || !record.key) {
      toast.error(i18n.t("Invalid data"));
      return "failed";
    }
    const dbName = type === "dictionaryHistory" ? "words" : "notes";
    // bookKey 占位，图书匹配阶段统一修正
    const prepared: PreparedRecord = {
      dbName,
      record:
        type === "dictionaryHistory"
          ? buildWordRecord(record, record.bookKey ? String(record.bookKey) : "")
          : buildNoteRecord(record, record.bookKey ? String(record.bookKey) : ""),
    };
    if (record.bookMd5) {
      prepared.bookMd5 = String(record.bookMd5);
    }
    if (record.bookName) {
      prepared.bookName = String(record.bookName);
    }
    preparedRecords.push(prepared);
  }

  // 图书匹配：优先 bookKey，其次按 bookMd5 找原书并改写 bookKey
  const books = await DatabaseService.getAllRecords("books");
  const bookByKey = new Map<string, any>(books.map((book: any) => [book.key, book]));
  const bookByMd5 = new Map<string, any>(books.map((book: any) => [book.md5, book]));
  const missingBookNames = new Set<string>();
  for (const item of preparedRecords) {
    const bookMd5 = item.bookMd5;
    if (bookByKey.has(item.record.bookKey)) {
      continue;
    }
    const matchedBook = bookMd5 ? bookByMd5.get(bookMd5) : null;
    if (matchedBook) {
      item.record.bookKey = matchedBook.key;
    } else {
      missingBookNames.add(item.bookName || "Unknown book");
    }
  }

  if (missingBookNames.size > 0) {
    await vexComfirmAsync(
      i18n.t(
        "The book {{name}} is not found in the library, please import the original book before importing",
        { name: Array.from(missingBookNames).join(", ") }
      )
    );
    return "failed";
  }

  // 按 key 去重后写入数据库
  let imported = 0;
  let skipped = 0;
  const savedKeys = new Map<string, Set<string>>();
  for (const item of preparedRecords) {
    const dbName = item.dbName;
    if (!savedKeys.has(dbName)) {
      const keys = await DatabaseService.getAllRecordKeys(dbName);
      savedKeys.set(
        dbName,
        new Set(keys.filter((key) => typeof key === "string"))
      );
    }
    const existingKeys = savedKeys.get(dbName)!;
    if (existingKeys.has(item.record.key)) {
      skipped++;
      continue;
    }
    await DatabaseService.saveRecord(item.record, dbName);
    existingKeys.add(item.record.key);
    imported++;
  }

  return {
    result: "success",
    imported,
    skipped,
  } as ImportResult;
};
