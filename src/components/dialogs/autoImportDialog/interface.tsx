import { RouteComponentProps } from "react-router-dom";

export interface AutoImportDialogProps extends RouteComponentProps<any> {
  books: any[];
  handleAutoImportDialog: (isOpen: boolean) => void;
  handleFetchBooks: () => void;
  importBookFunc: (file: any) => Promise<void>;
  t: (title: string) => string;
}

export interface AutoImportDialogState {
  folders: string[];
  isLoading: boolean;
}
