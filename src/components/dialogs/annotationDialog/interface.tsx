export interface AnnotationDialogProps {
  isAnnotationOpen: boolean;
  isSettingLocked: boolean;
  handleAnnotationDialog: (isAnnotationOpen: boolean) => void;
  t: (title: string) => string;
  htmlBook: any;
}

export interface AnnotationDialogState {
  annotationStyle: string;
  brushColor: string;
  brushWidth: number;
  highlighterColor: string;
  highlighterWidth: number;
  highlighterOpacity: number;
  shapeType: string;
  shapeColor: string;
  shapeWidth: number;
}
