import SparkMD5 from "spark-md5";
import {
  ConfigService,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import Book from "../../models/Book";
import DatabaseService from "../storage/databaseService";
import CryptoJS from "crypto-js";
import { isElectron } from "react-device-detect";
import BookUtil from "./bookUtil";

const KO_READER_DEVICE_NAME = "Koodo Reader";
const KO_READER_ACCEPT = "application/vnd.koreader.v1+json";

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
  timestamp?: number;
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
  xpath?: string;
  timestamp?: number;
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
  const config = ConfigService.getObjectConfig(
    "koReaderSyncConfig",
    "thirdpartyToken",
    {}
  );
  if (!config || typeof config !== "object") {
    return null;
  }
  const serverUrl = normalizeServerUrl(config.serverUrl || "");
  const username = (config.username || "").trim();
  const passwordHash = (config.passwordHash || "").trim();
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
    xpath: overrideLocalPercentage
      ? payload.progress
      : localRecord.xpath || payload.progress,
  };
  ConfigService.setObjectConfig(bookKey, nextRecord, "recordLocation");
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
  throw new KOReaderRequestError(message, response.status, body?.code, body);
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
    timestamp: response.timestamp || 0,
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
      timestamp: payload.timestamp || parseInt(Date.now() / 1000 + ""),
    }),
  });
};

const buildLocalUploadPayload = async (
  book: Book,
  localRecord: LocalRecordLocation,
  deviceId: string
): Promise<KOReaderProgressRecord | null> => {
  const percentage = normalizePercentage(localRecord.percentage);
  const cachedProgress = localRecord.xpath || "";
  const koreaderBook = ConfigService.getObjectConfig(
    book.key,
    "koreaderBooks",
    {}
  ) as any;
  if (!koreaderBook.document) {
    let partialMD5 = await getBookPartialMd5(book);
    if (!partialMD5) {
      return null;
    }
    koreaderBook.document = partialMD5;
    ConfigService.setObjectConfig(book.key, koreaderBook, "koreaderBooks");
  }
  if (!cachedProgress) {
    return null;
  }
  return {
    document: koreaderBook.document,
    percentage,
    progress: cachedProgress,
    device: KO_READER_DEVICE_NAME,
    device_id: deviceId,
    timestamp: localRecord.timestamp || parseInt(Date.now() / 1000 + ""),
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
  const books = ((await DatabaseService.getAllRecords("books")) ||
    []) as Book[];
  const summary: KOReaderSyncSummary = {
    checkedBooks: 0,
    matchedBooks: 0,
    pulledBooks: 0,
    pushedBooks: 0,
    skippedBooks: 0,
  };

  for (const book of books) {
    summary.checkedBooks++;
    const localRecord = getLocalRecordLocation(book.key);
    if (!localRecord || !localRecord.xpath) {
      summary.skippedBooks++;
      continue;
    }
    const koreaderBook = ConfigService.getObjectConfig(
      book.key,
      "koreaderBooks",
      {}
    ) as any;
    if (!koreaderBook.document) {
      let partialMD5 = await getBookPartialMd5(book);
      if (!partialMD5) {
        summary.skippedBooks++;
        continue;
      }
      koreaderBook.document = partialMD5;
      ConfigService.setObjectConfig(book.key, koreaderBook, "koreaderBooks");
    }
    let partialMD5 = koreaderBook.document;
    const remoteRecord = await getBookProgress(config, partialMD5);
    const remoteTimpstamp = remoteRecord?.timestamp || 0;
    const localTimestamp = localRecord.timestamp || 0;

    if (remoteRecord) {
      summary.matchedBooks++;
      if (remoteTimpstamp > localTimestamp) {
        persistKOReaderMetadata(book.key, localRecord, remoteRecord, true);
        summary.pulledBooks++;
      } else if (remoteTimpstamp < localTimestamp) {
        const uploadPayload = await buildLocalUploadPayload(
          book,
          localRecord,
          deviceId
        );
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

    const uploadPayload = await buildLocalUploadPayload(
      book,
      localRecord,
      deviceId
    );
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
export const getBookPartialMd5 = async (book: Book) => {
  if (isElectron) {
    const fs = window.require("fs");
    const crypto = window.require("crypto");
    function partialMD5(filepath) {
      if (!filepath) return;

      try {
        const fd = fs.openSync(filepath, "r");
        const step = 1024;
        const size = 1024;
        const hash = crypto.createHash("md5");
        const buffer = Buffer.alloc(size);

        for (let i = -1; i <= 10; i++) {
          const position = step << (2 * i);

          try {
            const bytesRead = fs.readSync(fd, buffer, 0, size, position);
            if (bytesRead > 0) {
              hash.update(buffer.slice(0, bytesRead));
            } else {
              break;
            }
          } catch (err) {
            break;
          }
        }

        fs.closeSync(fd);
        return hash.digest("hex");
      } catch (err) {
        return;
      }
    }
    let filePath = BookUtil.getBookPath(book);
    if (!filePath) {
      return null;
    }
    return partialMD5(filePath);
  } else {
    function partialMD5(arrayBuffer) {
      if (!arrayBuffer) return;

      const step = 1024;
      const size = 1024;
      const fileSize = arrayBuffer.byteLength;
      const hash = CryptoJS.algo.MD5.create();

      for (let i = -1; i <= 10; i++) {
        const position = step << (2 * i);

        if (position >= fileSize) {
          break;
        }

        const endPosition = Math.min(position + size, fileSize);
        const chunk = arrayBuffer.slice(position, endPosition);

        if (chunk.byteLength > 0) {
          // 将 ArrayBuffer 转换为 WordArray
          const wordArray = CryptoJS.lib.WordArray.create(
            new Uint8Array(chunk)
          );
          hash.update(wordArray);
        } else {
          break;
        }
      }

      return hash.finalize().toString();
    }
    let bookBuffer = await BookUtil.fetchBook(
      book.key,
      book.format.toLowerCase(),
      true,
      book.path
    );
    const md5 = partialMD5(bookBuffer);
    return md5;
  }
};
