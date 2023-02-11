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
export const copyArrayBuffer = (src) => {
  var dst = new ArrayBuffer(src.byteLength);
  new Uint8Array(dst).set(new Uint8Array(src));
  return dst;
};
