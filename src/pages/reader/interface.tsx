import BookModel from "../../models/Book";
import HtmlBookModel from "../../models/HtmlBook";
export interface ReaderProps {
  currentBook: BookModel;

  t: (title: string) => string;
  htmlBook: HtmlBookModel;
  isNavLocked: boolean;
  isSettingLocked: boolean;
  isDockedRight: boolean;
  isConvertOpen: boolean;
  isScaleOpen: boolean;
  isPdfCropOpen: boolean;
  isStudyLangOpen: boolean;
  isAssistReadOpen: boolean;
  isSpeechOpen: boolean;
  isAnnotationOpen: boolean;
  isOpenPopupOptionDialog: boolean;


  isSettingOpen: boolean;
  readerMode: string;




  handleReaderMode: (readerMode: string) => void;
  handleConvertDialog: (isConvertOpen: boolean) => void;
  handleScalePageDialog: (isScaleOpen: boolean) => void;
  handlePdfCropDialog: (isPdfCropOpen: boolean) => void;
  handleStudyLangDialog: (isStudyLangOpen: boolean) => void;
  handleAssistReadDialog: (isAssistReadOpen: boolean) => void;
  handleSpeechDialog: (isSpeechOpen: boolean) => void;
  handleAnnotationDialog: (isAnnotationOpen: boolean) => void;
  handleMenuMode: (menuMode: string) => void;
  handleOriginalText: (originalText: string) => void;
  handleFetchBooks: () => void;
  handleBackgroundColor: (backgroundColor: string) => void;
  handleOpenMenu: (isOpen: boolean) => void;

  handleFetchPercentage: (currentBook: BookModel) => void;
  handleReadingBook: (book: BookModel) => void;


  handleFetchAuthed: () => void;
  handleFetchUserInfo: () => Promise<any>;
}

export interface ReaderState {
  isOpenRightPanel: boolean;
  isOpenTopPanel: boolean;
  isOpenBottomPanel: boolean;
  isOpenLeftPanel: boolean;
  isTouch: boolean;
  isPreventTrigger: boolean;
  hoverPanel: string;
  isNearEdge: boolean;
  totalDuration: number;
  currentDuration: number;
}
