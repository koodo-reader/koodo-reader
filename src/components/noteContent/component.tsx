import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { normalizeNoteType } from "../../models/Note";
import "./noteContent.css";

export interface NoteContentProps {
  content: string;
  type?: string | null;
  className?: string;
}

export const renderNoteHtml = (content: string, type?: string | null) => {
  const noteType = normalizeNoteType(type);
  if (!content || noteType === "text") return "";
  const html =
    noteType === "markdown" ? (marked.parse(content) as string) : content;
  return DOMPurify.sanitize(html, { FORBID_TAGS: ["style"] });
};

const NoteContent = (props: NoteContentProps) => {
  const noteType = normalizeNoteType(props.type);
  const html = useMemo(
    () => renderNoteHtml(props.content, noteType),
    [props.content, noteType]
  );
  const classes = `note-content${props.className ? ` ${props.className}` : ""}`;
  if (noteType === "text") {
    return <div className={classes}>{props.content}</div>;
  }
  return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default NoteContent;
