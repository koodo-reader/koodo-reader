
export interface TxtParser {
  label: string;
  value: string;
  subtitle: string;
  regex: string;
}

export interface SettingInfoProps {
}

export interface SettingInfoState {
  parserList: string[];
  isAddNew: boolean;
  isEditing: boolean;
  editingLabel: string;
  formLabel: string;
  formRegex: string;
}
