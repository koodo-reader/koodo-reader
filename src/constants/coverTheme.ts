// Cover palettes shared by the empty cover placeholder, mirroring the mobile app.
export const coverColors = {
  yellow: {
    backgroundColor: "#FAF3D8",
    color: "#473E43",
  },
  green: {
    backgroundColor: "#DFECDD",
    color: "#33326C",
  },
  orange: {
    backgroundColor: "#F3EADD",
    color: "#193F5B",
  },
  pink: {
    backgroundColor: "#ECDCD7",
    color: "#8E5240",
  },
  blue: {
    backgroundColor: "#E2EEF5",
    color: "#16294A",
  },
  purple: {
    backgroundColor: "#E9E1F3",
    color: "#4E3B73",
  },
  red: {
    backgroundColor: "#F6E2DA",
    color: "#8F2F17",
  },
  navy: {
    backgroundColor: "#E1E9F1",
    color: "#0B2C52",
  },
  magenta: {
    backgroundColor: "#F7E0E8",
    color: "#A3164D",
  },
} as const;

export type CoverThemeKey = keyof typeof coverColors;

export const getCoverTheme = (format?: string): CoverThemeKey => {
  switch (format) {
    case "PDF":
      return "blue";
    case "TXT":
    case "AZW3":
    case "AZW":
      return "orange";
    case "EPUB":
      return "green";
    case "MOBI":
      return "yellow";
    case "MD":
    case "FB2":
    case "DOCX":
    case "DOC":
    case "RTF":
    case "CBT":
    case "CBZ":
    case "CB7":
    case "CBR":
      return "pink";
    case "CHM":
    case "XPS":
    case "OXPS":
      return "purple";
    case "PPTX":
    case "PPT":
      return "red";
    case "DJVU":
    case "DJV":
      return "navy";
    case "OFD":
      return "magenta";
    default:
      return "orange";
  }
};
