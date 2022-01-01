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
