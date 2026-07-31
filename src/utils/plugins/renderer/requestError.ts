export const getPluginRequestError = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as { response?: { data?: unknown; status?: number } }
    ).response;
    const data = response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const details = data as Record<string, unknown>;
      const message =
        details.message ||
        details.Message ||
        details.errorMsg ||
        (details.error && typeof details.error === "object"
          ? (details.error as Record<string, unknown>).message
          : details.error);
      const code =
        details.code || details.Code || details.errorCode || response?.status;
      if (message) return code ? `${code}: ${String(message)}` : String(message);
    }
  }
  return error instanceof Error ? error.message : "Error happened";
};
