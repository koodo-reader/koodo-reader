import Book from "../../models/Book";
import CryptoJS from "crypto-js";
import { getBookPartialMd5 } from "../common";

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
const isUserExistsError = (error: any) => {
  return (
    error instanceof KOReaderRequestError &&
    (error.code === 2002 ||
      (error.message || "").toLowerCase().includes("already exists"))
  );
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

export default class KOReaderUtil {
  ConfigService: any;
  TokenService: any;
  DatabaseService: any;
  constructor(ConfigService: any, TokenService: any, DatabaseService: any) {
    this.ConfigService = ConfigService;
    this.TokenService = TokenService;
    this.DatabaseService = DatabaseService;
  }

  getKOReaderSyncConfig = (): KOReaderSyncConfig | null => {
    const config = this.ConfigService.getObjectConfig(
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

  getLocalRecordLocation = (bookKey: string): LocalRecordLocation => {
    return (
      this.ConfigService.getObjectConfig(bookKey, "recordLocation", {}) || {}
    );
  };

  persistKOReaderMetadata = (
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
    this.ConfigService.setObjectConfig(bookKey, nextRecord, "recordLocation");
  };

  authUser = async (config: KOReaderSyncConfig) => {
    return await requestJSON<any>(`${config.serverUrl}/users/auth`, {
      method: "GET",
      headers: getAuthHeaders(config),
    });
  };

  createUser = async (config: KOReaderSyncConfig) => {
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

  getBookProgress = async (
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

  updateBookProgress = async (
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

  buildLocalUploadPayload = async (
    book: Book,
    localRecord: LocalRecordLocation,
    deviceId: string
  ): Promise<KOReaderProgressRecord | null> => {
    const percentage = normalizePercentage(localRecord.percentage);
    const cachedProgress = localRecord.xpath || "";
    const koreaderBook = this.ConfigService.getObjectConfig(
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
      this.ConfigService.setObjectConfig(
        book.key,
        koreaderBook,
        "koreaderBooks"
      );
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

  resolveDeviceId = async () => {
    try {
      return (await this.TokenService.getFingerprint()) || "koodo-reader";
    } catch (_error) {
      return "koodo-reader";
    }
  };

  verifyAndBuildKOReaderSyncConfig = async (params: {
    serverUrl: string;
    username: string;
    password?: string;
    passwordHash?: string;
  }) => {
    const config: KOReaderSyncConfig = {
      serverUrl: normalizeServerUrl(params.serverUrl),
      username: (params.username || "").trim(),
      passwordHash: (params.password || "").trim()
        ? CryptoJS.MD5((params.password || "").trim()).toString()
        : (params.passwordHash || "").trim(),
    };
    if (!config.serverUrl || !config.username || !config.passwordHash) {
      throw new Error("Please fill in all fields");
    }

    try {
      await this.authUser(config);
      return config;
    } catch (authError) {
      try {
        await this.createUser(config);
        await this.authUser(config);
        return config;
      } catch (createError) {
        if (isUserExistsError(createError)) {
          throw authError;
        }
        throw createError;
      }
    }
  };

  syncKOReaderProgress = async (): Promise<KOReaderSyncSummary> => {
    const config = this.getKOReaderSyncConfig();
    if (!config) {
      throw new Error("Please configure the KOReader sync server first");
    }

    await this.authUser(config);

    const deviceId = await this.resolveDeviceId();
    const books = ((await this.DatabaseService.getAllRecords("books")) ||
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
      const localRecord = this.getLocalRecordLocation(book.key);
      if (!localRecord || !localRecord.xpath) {
        summary.skippedBooks++;
        continue;
      }
      const koreaderBook = this.ConfigService.getObjectConfig(
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
        this.ConfigService.setObjectConfig(
          book.key,
          koreaderBook,
          "koreaderBooks"
        );
      }
      let partialMD5 = koreaderBook.document;
      const remoteRecord = await this.getBookProgress(config, partialMD5);
      const remoteTimpstamp = remoteRecord?.timestamp || 0;
      const localTimestamp = localRecord.timestamp || 0;

      if (remoteRecord) {
        summary.matchedBooks++;
        if (remoteTimpstamp > localTimestamp) {
          this.persistKOReaderMetadata(
            book.key,
            localRecord,
            remoteRecord,
            true
          );
          summary.pulledBooks++;
        } else if (remoteTimpstamp < localTimestamp) {
          const uploadPayload = await this.buildLocalUploadPayload(
            book,
            localRecord,
            deviceId
          );
          if (!uploadPayload) {
            summary.skippedBooks++;
            continue;
          }
          await this.updateBookProgress(config, uploadPayload);
          this.persistKOReaderMetadata(
            book.key,
            localRecord,
            uploadPayload,
            false
          );
          summary.pushedBooks++;
        } else {
          this.persistKOReaderMetadata(
            book.key,
            localRecord,
            remoteRecord,
            false
          );
        }
        continue;
      }

      const uploadPayload = await this.buildLocalUploadPayload(
        book,
        localRecord,
        deviceId
      );
      if (!uploadPayload) {
        summary.skippedBooks++;
        continue;
      }
      await this.updateBookProgress(config, uploadPayload);
      this.persistKOReaderMetadata(book.key, localRecord, uploadPayload, false);
      summary.pushedBooks++;
    }

    return summary;
  };
}
