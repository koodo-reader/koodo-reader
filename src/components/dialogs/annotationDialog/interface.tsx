

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
  annotationEraserWidth: number;
  annotationQuickErase: string;
  annotationTextSize: number;
  annotationTextFont: string;
  annotationTextColor: string;
  fontOptions: { label: string; value: string }[];
}
