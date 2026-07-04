import { RouteComponentProps } from "react-router-dom";
import BookModel from "../../../models/Book";

export type TextRuleType = "replace" | "delete";
export type TextRuleScope = "all" | "book";
export type TextRuleMatchType = "regex" | "plain";

export interface TextRule {
  id: string;
  type: TextRuleType;
  pattern: string;
  replacement?: string;
  matchType: TextRuleMatchType;
  scope: TextRuleScope;
  bookKey?: string;
  bookName?: string;
}

export interface TextSettingProps extends RouteComponentProps<any> {
  t: (title: string) => string;
  books: BookModel[];
}

export interface TextSettingState {
  ruleList: string[];
  bookNamesMap: { [key: string]: string };
  isFormOpen: boolean;
  isEditing: boolean;
  editingId: string;
  formType: TextRuleType;
  formPattern: string;
  formReplacement: string;
  formMatchType: TextRuleMatchType;
  formScope: TextRuleScope;
  formBookKey: string;
}