export interface ColorProps {
  color: number;
  targetColor: number;
  isEdit: boolean;
  handleColor: (color: number) => void;
  handleDigest: () => void;
}
export interface ColorStates {
  isLine: boolean;
}
