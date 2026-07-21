export interface AnnotationDialogProps {
  isAnnotationOpen: boolean;
  isSettingLocked: boolean;
  handleAnnotationDialog: (isAnnotationOpen: boolean) => void;
  t: (title: string) => string;
  htmlBook: any;
}

export interface AnnotationDialogState {
  annotationStyle: string;
  annotationBrushColor: string;
  annotationBrushWidth: number;
  annotationHighlighterColor: string;
  annotationHighlighterWidth: number;
  annotationHighlighterOpacity: number;
  annotationShapeType: string;
  annotationShapeColor: string;
  annotationShapeWidth: number;
  annotationTextSize: number;
  annotationTextFont: string;
  annotationTextColor: string;
  fontOptions: { label: string; value: string }[];
}
