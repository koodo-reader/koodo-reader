export const sleep = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};
export const removeExtraQuestionMark = (html: any) => {
  return html
    .replaceAll("–?", "–")
    .replaceAll("“?", "“")
    .replaceAll("”?", "”")
    .replaceAll("©?", "©")
    .replaceAll("’?", "’")
    .replaceAll("“?", "“")
    .replaceAll("…?", "…")
    .replaceAll("—?", "—")
    .replaceAll("‘?", "‘")
    .replaceAll("“?", "“");
};
