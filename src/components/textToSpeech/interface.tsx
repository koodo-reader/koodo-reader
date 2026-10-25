import BookModel from "../../models/Book";
import PluginModel from "../../models/Plugin";
import HtmlBook from "../../models/HtmlBook";

export interface TextToSpeechProps {

}
export interface TextToSpeechState {
  isAudioOn: boolean;
  isPaused: boolean;
  currentIndex: number;
  voiceLocale: string;
  languageList: string[];
  voiceList: any;
  multiRoleEnabled: boolean;
  multiRoleVoiceType: string;
  multiRoleNarratorVoice: string;
  multiRoleMaleVoice: string;
  multiRoleFemaleVoice: string;
  multiRoleNarratorEngine: string;
  multiRoleMaleEngine: string;
  multiRoleFemaleEngine: string;
  multiRoleChildVoice: string;
  multiRoleChildEngine: string;
}
