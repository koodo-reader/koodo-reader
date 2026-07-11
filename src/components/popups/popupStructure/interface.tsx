import Book from "../../../models/Book";
import Plugin from "../../../models/Plugin";
import { WordStructureResult } from "../../../utils/reader/wordStructure/nestPack";

export interface PopupStructureProps {
  originalText: string;
  currentBook: Book;
  plugins: Plugin[];
  t: (title: string) => string;
  handleMenuMode: (menuMode: string) => void;
  handleOriginalText: (originalText: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
}

export interface PopupStructureState {
  status: "loading" | "ready" | "empty" | "error" | "no-plugin";
  loadPhase: string;
  result: WordStructureResult | null;
  glossLang: string;
  aiGlosses: Record<string, string | null>;
  aiRoot: string | null;
  aiPending: boolean;
}
