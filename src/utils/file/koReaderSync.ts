import SparkMD5 from "spark-md5";
import {
  ConfigService,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import Book from "../../models/Book";
import DatabaseService from "../storage/databaseService";

const KO_READER_DEVICE_NAME = "Koodo Reader";
const KO_READER_SYNC_CONFIG_KEY = "koReaderSyncConfig";
const KO_READER_RECENT_BOOKS_KEY = "koReaderRecentBooks";
const KO_READER_ACCEPT = "application/vnd.koreader.v1+json";
const EPSILON = 0.00001;

export interface KOReaderSyncConfig {
  serverUrl: string;
  username: string;
  passwordHash: string;
}

export interface KOReaderSyncSummary {
  checkedBooks: number;
  matchedBooks: number;
  pulledBooks: number;
  pushedBooks: number;
  skippedBooks: number;
}

interface KOReaderProgressRecord {
  document: string;
  percentage: number;
  progress: string;
  device?: string;
  device_id?: string;
}

interface LocalRecordLocation {
  percentage?: string;
  cfi?: string;
  text?: string;
  count?: string;
  chapterTitle?: string;
  chapterDocIndex?: string;
  chapterHref?: string;
  page?: string;
  koReader?: {
    document: string;
    percentage: string;
    progress: string;
    device?: string;
    deviceId?: string;
    syncedAt: number;
  };
  [key: string]: any;
}

class KOReaderRequestError extends Error {
  status?: number;
  code?: number;
  body?: any;

  constructor(message: string, status?: number, code?: number, body?: any) {
    super(message);
    this.name = "KOReaderRequestError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

const normalizeServerUrl = (url: string) => {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    return "";
  }
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
};

const normalizePercentage = (value: any) => {
  const parsed =
    typeof value === "number" ? value : parseFloat((value || "0") + "");
  if (!isFinite(parsed) || isNaN(parsed)) {
    return 0;
  }
  if (parsed > 1 && parsed <= 100) {
    return Math.min(Math.max(parsed / 100, 0), 1);
  }
  return Math.min(Math.max(parsed, 0), 1);
};

const getKOReaderSyncConfig = (): KOReaderSyncConfig | null => {
  const raw = ConfigService.getReaderConfig(KO_READER_SYNC_CONFIG_KEY);
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const serverUrl = normalizeServerUrl(raw.serverUrl || "");
  const username = (raw.username || "").trim();
  const passwordHash = (raw.passwordHash || "").trim();
  if (!serverUrl || !username || !passwordHash) {
    return null;
  }
  return {
    serverUrl,
    username,
    passwordHash,
  };
};

const getLocalRecordLocation = (bookKey: string): LocalRecordLocation => {
  return ConfigService.getObjectConfig(bookKey, "recordLocation", {}) || {};
};

const getKOReaderRecentBooks = (): string[] => {
  const raw = ConfigService.getReaderConfig(KO_READER_RECENT_BOOKS_KEY);
  return Array.isArray(raw) ? raw : [];
};

const setKOReaderRecentBooks = (bookKeys: string[]) => {
  ConfigService.setReaderConfig(KO_READER_RECENT_BOOKS_KEY, bookKeys);
};

const pushKOReaderRecentBook = (bookKey: string) => {
  const next = getKOReaderRecentBooks().filter((item) => item !== bookKey);
  next.unshift(bookKey);
  setKOReaderRecentBooks(next);
};

const persistKOReaderMetadata = (
  bookKey: string,
  localRecord: LocalRecordLocation,
  payload: KOReaderProgressRecord,
  overrideLocalPercentage: boolean
) => {
  const nextRecord: LocalRecordLocation = {
    ...localRecord,
    percentage: overrideLocalPercentage
      ? payload.percentage.toString()
      : (localRecord.percentage || payload.percentage.toString()).toString(),
    koReader: {
      document: payload.document,
      percentage: payload.percentage.toString(),
      progress: payload.progress,
      device: payload.device || "",
      deviceId: payload.device_id || "",
      syncedAt: Date.now(),
    },
  };
  ConfigService.setObjectConfig(bookKey, nextRecord, "recordLocation");
  pushKOReaderRecentBook(bookKey);
};

const extractErrorMessage = async (response: Response) => {
  let body: any = null;
  try {
    body = await response.json();
  } catch (_error) {
    try {
      body = await response.text();
    } catch (_innerError) {
      body = null;
    }
  }
  const message =
    body?.message ||
    body?.error ||
    body?.msg ||
    (typeof body === "string" ? body : "") ||
    response.statusText ||
    "Request failed";
  throw new KOReaderRequestError(
    message,
    response.status,
    body?.code,
    body
  );
};

const requestJSON = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(url, options);
  if (!response.ok) {
    await extractErrorMessage(response);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return (await response.json()) as T;
};

const getAuthHeaders = (config: KOReaderSyncConfig) => {
  return {
    Accept: KO_READER_ACCEPT,
    "Content-Type": "application/json",
    "x-auth-user": config.username,
    "x-auth-key": config.passwordHash,
  };
};

const authUser = async (config: KOReaderSyncConfig) => {
  return await requestJSON<any>(`${config.serverUrl}/users/auth`, {
    method: "GET",
    headers: getAuthHeaders(config),
  });
};

const createUser = async (config: KOReaderSyncConfig) => {
  return await requestJSON<any>(`${config.serverUrl}/users/create`, {
    method: "POST",
    headers: {
      Accept: KO_READER_ACCEPT,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: config.username,
      password: config.passwordHash,
    }),
  });
};

const isUserExistsError = (error: any) => {
  return (
    error instanceof KOReaderRequestError &&
    (error.code === 2002 ||
      (error.message || "").toLowerCase().includes("already exists"))
  );
};

const getBookProgress = async (
  config: KOReaderSyncConfig,
  document: string
): Promise<KOReaderProgressRecord | null> => {
  const response = await requestJSON<any>(
    `${config.serverUrl}/syncs/progress/${encodeURIComponent(document)}`,
    {
      method: "GET",
      headers: getAuthHeaders(config),
    }
  );
  if (!response || Object.keys(response).length === 0) {
    return null;
  }
  return {
    document,
    percentage: normalizePercentage(response.percentage),
    progress: response.progress || "",
    device: response.device || "",
    device_id: response.device_id || "",
  };
};

const updateBookProgress = async (
  config: KOReaderSyncConfig,
  payload: KOReaderProgressRecord
) => {
  await requestJSON<any>(`${config.serverUrl}/syncs/progress`, {
    method: "PUT",
    headers: getAuthHeaders(config),
    body: JSON.stringify({
      document: payload.document,
      percentage: payload.percentage,
      progress: payload.progress,
      device: payload.device || KO_READER_DEVICE_NAME,
      device_id: payload.device_id || "",
    }),
  });
};

const buildLocalUploadPayload = (
  book: Book,
  localRecord: LocalRecordLocation,
  deviceId: string
): KOReaderProgressRecord | null => {
  const percentage = normalizePercentage(localRecord.percentage);
  if (percentage <= EPSILON) {
    return null;
  }
  const cachedProgress =
    localRecord.koReader && typeof localRecord.koReader.progress === "string"
      ? localRecord.koReader.progress
      : "";
  const fallbackProgress = JSON.stringify({
    source: "koodo-reader",
    bookKey: book.key,
    cfi: localRecord.cfi || "",
    text: localRecord.text || "",
    count: localRecord.count || "",
    chapterTitle: localRecord.chapterTitle || "",
    chapterDocIndex: localRecord.chapterDocIndex || "",
    chapterHref: localRecord.chapterHref || "",
    page: localRecord.page || "",
  });
  return {
    document: book.md5,
    percentage,
    progress: cachedProgress || fallbackProgress,
    device: KO_READER_DEVICE_NAME,
    device_id: deviceId,
  };
};

const resolveDeviceId = async () => {
  try {
    return (await TokenService.getFingerprint()) || "koodo-reader";
  } catch (_error) {
    return "koodo-reader";
  }
};

export const isKOReaderSyncEnabled = () => {
  return ConfigService.getReaderConfig("isEnableKoReaderSync") === "yes";
};

export const verifyAndBuildKOReaderSyncConfig = async (params: {
  serverUrl: string;
  username: string;
  password?: string;
  passwordHash?: string;
}) => {
  const config: KOReaderSyncConfig = {
    serverUrl: normalizeServerUrl(params.serverUrl),
    username: (params.username || "").trim(),
    passwordHash: (params.password || "").trim()
      ? SparkMD5.hash((params.password || "").trim())
      : (params.passwordHash || "").trim(),
  };
  if (!config.serverUrl || !config.username || !config.passwordHash) {
    throw new Error("Please fill in all fields");
  }

  try {
    await authUser(config);
    return config;
  } catch (authError) {
    try {
      await createUser(config);
      await authUser(config);
      return config;
    } catch (createError) {
      if (isUserExistsError(createError)) {
        throw authError;
      }
      throw createError;
    }
  }
};

export const syncKOReaderProgress = async (): Promise<KOReaderSyncSummary> => {
  const config = getKOReaderSyncConfig();
  if (!config) {
    throw new Error("Please configure the KOReader sync server first");
  }

  await authUser(config);

  const deviceId = await resolveDeviceId();
  const books = ((await DatabaseService.getAllRecords("books")) || []) as Book[];
  const summary: KOReaderSyncSummary = {
    checkedBooks: 0,
    matchedBooks: 0,
    pulledBooks: 0,
    pushedBooks: 0,
    skippedBooks: 0,
  };

  for (const book of books) {
    if (!book.md5) {
      summary.skippedBooks++;
      continue;
    }

    summary.checkedBooks++;
    const localRecord = getLocalRecordLocation(book.key);
    const localPercentage = normalizePercentage(localRecord.percentage);
    const remoteRecord = await getBookProgress(config, book.md5);

    if (remoteRecord) {
      summary.matchedBooks++;
      if (remoteRecord.percentage > localPercentage + EPSILON) {
        persistKOReaderMetadata(book.key, localRecord, remoteRecord, true);
        summary.pulledBooks++;
      } else if (localPercentage > remoteRecord.percentage + EPSILON) {
        const uploadPayload = buildLocalUploadPayload(book, localRecord, deviceId);
        if (!uploadPayload) {
          summary.skippedBooks++;
          continue;
        }
        await updateBookProgress(config, uploadPayload);
        persistKOReaderMetadata(book.key, localRecord, uploadPayload, false);
        summary.pushedBooks++;
      } else {
        persistKOReaderMetadata(book.key, localRecord, remoteRecord, false);
      }
      continue;
    }

    const uploadPayload = buildLocalUploadPayload(book, localRecord, deviceId);
    if (!uploadPayload) {
      summary.skippedBooks++;
      continue;
    }
    await updateBookProgress(config, uploadPayload);
    persistKOReaderMetadata(book.key, localRecord, uploadPayload, false);
    summary.pushedBooks++;
  }

  return summary;
};
