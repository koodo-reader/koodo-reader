export interface AnnotationDialogProps {
  isAnnotationOpen: boolean;
  isSettingLocked: boolean;
  handleAnnotationDialog: (isAnnotationOpen: boolean) => void;
  t: (title: string) => string;
  htmlBook: any;
}

export interface AnnotationDialogState {
  brushColor: string;
  brushWidth: number;
}
