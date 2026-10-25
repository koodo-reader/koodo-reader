import { DictMeta } from "../../../utils/file/dictUtil";

export interface SettingInfoProps {
}

export interface SettingInfoState {
  dicts: DictMeta[];
  isLoading: boolean;
  downloadingId: string;
  downloadProgress: number;
}
