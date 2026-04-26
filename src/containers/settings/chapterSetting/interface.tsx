import { RouteComponentProps } from "react-router-dom";

export interface TxtParser {
  label: string;
  value: string;
  subtitle: string;
  regex: string;
}

export interface SettingInfoProps extends RouteComponentProps<any> {
  t: (title: string) => string;
}

export interface SettingInfoState {
  parserList: string[];
  isAddNew: boolean;
  isEditing: boolean;
  editingLabel: string;
  formLabel: string;
  formSubtitle: string;
  formRegex: string;
}
