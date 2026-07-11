export interface AnnotationDialogProps {
  isAnnotationOpen: boolean;
  isSettingLocked: boolean;
  handleAnnotationDialog: (isAnnotationOpen: boolean) => void;
  t: (title: string) => string;
}

export interface AnnotationDialogState {
  brushColor: string;
  brushWidth: number;
}
