export interface ColorProps {
  color: number;
  isEdit: boolean;
  handleColor: (color: number) => void;
  handleDigest: () => void;
}
export interface ColorStates {
  isLine: boolean;
}
