import { RouteComponentProps } from "react-router-dom";

export interface OPDSCatalog {
  id: string;
  title: string;
  url: string;
  isBuiltIn?: boolean;
  isElectronicOnly?: boolean;
}

export interface OPDSLink {
  href: string;
  type: string;
  rel: string;
  title?: string;
}

export interface OPDSEntry {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  coverUrl: string;
  thumbnailUrl: string;
  links: OPDSLink[];
  updated: string;
  isNavigation: boolean;
}

export interface OPDSFeed {
  title: string;
  url: string;
  entries: OPDSEntry[];
  links: OPDSLink[];
  searchTemplate: string;
}

export interface OPDSDialogProps extends RouteComponentProps<any> {
  handleOPDSDialog: (isOpen: boolean) => void;
  importBookFunc: (file: any) => Promise<void>;
  t: (title: string) => string;
}

export interface OPDSDialogState {
  view: "catalog" | "feed" | "detail";
  userCatalogs: OPDSCatalog[];
  currentFeed: OPDSFeed | null;
  feedStack: { url: string; title: string }[];
  selectedBook: OPDSEntry | null;
  isLoading: boolean;
  error: string;
  searchQuery: string;
  isAddingCatalog: boolean;
  newCatalogUrl: string;
  newCatalogTitle: string;
}
