import SparkMD5 from "spark-md5";
import {
  ConfigService,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import Book from "../../models/Book";
import DatabaseService from "../storage/databaseService";

const KO_READER_DEVICE_NAME = "Koodo Reader";
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

const persistKOReaderMetadata = (
  bookKey: string,
  payload: KOReaderProgressRecord,
  overrideLocalPercentage: boolean
) => {
  if (overrideLocalPercentage) {
    ConfigService.setObjectConfig(bookKey, payload, "koreaderLocation");
  } else {
    ConfigService.deleteObjectConfig(bookKey, "koreaderLocation");
  }

  ConfigService.setListConfig(bookKey, "koReaderBooks");
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
    if (!book.md5) {
      summary.skippedBooks++;
      continue;
    }

    summary.checkedBooks++;
    const localRecord = ConfigService.getObjectConfig(
      book.key,
      "koreaderLocation",
      {}
    );
    const localPercentage = normalizePercentage(localRecord.percentage);
    const remoteRecord = await getBookProgress(config, book.md5);
    console.log(remoteRecord, localPercentage, "remoteRecord");

    if (remoteRecord) {
      summary.matchedBooks++;
      if (remoteRecord.percentage > localPercentage + EPSILON) {
        persistKOReaderMetadata(book.key, remoteRecord, true);
        summary.pulledBooks++;
      } else if (localPercentage > remoteRecord.percentage + EPSILON) {
        const uploadPayload = ConfigService.getObjectConfig(
          book.key,
          "koreaderLocation",
          {}
        ) as KOReaderProgressRecord;
        if (!uploadPayload) {
          summary.skippedBooks++;
          continue;
        }
        await updateBookProgress(config, uploadPayload);
        persistKOReaderMetadata(book.key, uploadPayload, false);
        summary.pushedBooks++;
      } else {
        persistKOReaderMetadata(book.key, remoteRecord, false);
      }
      continue;
    }

    const uploadPayload = ConfigService.getObjectConfig(
      book.key,
      "koreaderLocation",
      {}
    ) as KOReaderProgressRecord;
    if (!uploadPayload) {
      summary.skippedBooks++;
      continue;
    }
    await updateBookProgress(config, uploadPayload);
    persistKOReaderMetadata(book.key, uploadPayload, false);
    summary.pushedBooks++;
  }
  console.log(summary, "summary");

  return summary;
};
