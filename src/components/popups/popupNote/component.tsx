import { useEffect, useState } from "react";
import "./popupNote.css";
import { isReadingRawPDF } from "../../../utils/common";
import Note from "../../../models/Note";
import { PopupNoteProps } from "./interface";
import NoteTag from "../../noteTag";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import {
  ConfigService,
  HighlightUtil,
  NoteSyncManager,
} from "../../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../../utils/storage/databaseService";
import ColorOption from "../../colorOption";
import copy from "copy-text-to-clipboard";

const highlightUtil: any = new HighlightUtil(ConfigService);

const PopupNote = (props: PopupNoteProps) => {
  const [tag, setTag] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    let textArea: any = document.querySelector(".editor-box");
    textArea && textArea.focus();
    (async () => {
      if (props.noteKey) {
        let loadedNote: Note = await DatabaseService.getRecord(
          props.noteKey,
          "notes"
        );
        setText(loadedNote.text);
        setTag(loadedNote.tag);
        setNote(loadedNote);
        if (textArea) {
          textArea.value = loadedNote.notes;
        }
        let { styleType, color } = highlightUtil.getHighlightValue(
          loadedNote.color || "background-#FEF3CD"
        );
        props.handleHighlight({
          styleType,
          color,
        });
      } else {
        let docs = getIframeDoc(props.currentBook);
        let selectedText = "";
        for (let i = 0; i < docs.length; i++) {
          let doc = docs[i];
          if (!doc) continue;
          selectedText = doc.getSelection()?.toString() || "";
          if (selectedText) {
            break;
          }
        }
        if (!selectedText) return;

        selectedText = selectedText.replace(/\s\s/g, "");
        selectedText = selectedText.replace(/\r/g, "");
        selectedText = selectedText.replace(/\n/g, "");
        selectedText = selectedText.replace(/\t/g, "");
        selectedText = selectedText.replace(/\f/g, "");
        setText(selectedText);
      }
    })();
  }, []);

  const handleTag = (nextTag: string[]) => {
    setTag(nextTag);
  };

  const handleNoteClick = (event: Event) => {
    props.handleNoteKey((event.target as any).dataset.key);
    props.handleMenuMode("note");
    props.handleOpenMenu(true);
  };

  const createNote = async () => {
    let notes = (document.querySelector(".editor-box") as HTMLInputElement)
      .value;

    if (props.noteKey) {
      let newNote = await DatabaseService.getRecord(props.noteKey, "notes");
      newNote.notes = notes;
      newNote.tag = tag;
      newNote.color =
        highlightUtil.formatHighlightValue(props.highlight) || newNote.color;
      DatabaseService.updateRecord(newNote, "notes").then(() => {
        props.handleOpenMenu(false);
        props.handleFetchNotes();
        props.handleMenuMode("");
        props.handleNoteKey("");
        props.handleShowPopupNote(false);
        if (props.htmlBook && props.htmlBook.rendition) {
          props.htmlBook.rendition.removeOneNote(
            props.noteKey,
            props.chapterDocIndex
          );
          props.htmlBook.rendition.createOneNote(newNote, handleNoteClick);
        }
      });
    } else {
      let cfi = JSON.stringify(
        ConfigService.getObjectConfig(
          props.currentBook.key,
          "recordLocation",
          {}
        )
      );
      if (isReadingRawPDF(props.currentBook)) {
        let bookLocation = props.htmlBook.rendition.getPositionByChapter(
          props.chapterDocIndex
        );
        cfi = JSON.stringify(bookLocation);
      }
      let bookKey = props.currentBook.key;
      let range = JSON.stringify(
        await props.htmlBook.rendition.getHighlightCoords(
          props.chapterDocIndex
        )
      );

      let percentage = ConfigService.getObjectConfig(
        props.currentBook.key,
        "recordLocation",
        {}
      ).percentage
        ? ConfigService.getObjectConfig(
            props.currentBook.key,
            "recordLocation",
            {}
          ).percentage
        : "0";

      let color =
        highlightUtil.formatHighlightValue(props.highlight) ||
        "background-#FEF3CD";

      let newNote = new Note(
        bookKey,
        props.chapter,
        props.chapterDocIndex,
        text,
        cfi,
        range,
        notes,
        percentage,
        color,
        tag
      );
      DatabaseService.saveRecord(newNote, "notes").then(async () => {
        props.handleOpenMenu(false);
        props.handleFetchNotes();
        props.handleMenuMode("");
        await props.htmlBook.rendition.createOneNote(
          newNote,
          handleNoteClick
        );
        let noteSyncManager = new NoteSyncManager(
          DatabaseService,
          ConfigService,
          window.electronAPI?.fs,
          window.electronAPI?.path
        );
        noteSyncManager.syncNote(newNote, bookKey);
      });
    }
  };

  const handleUpdateHighlight = () => {};

  const handleClose = () => {
    if (props.noteKey) {
      DatabaseService.deleteRecord(props.noteKey, "notes").then(() => {
        toast.success(props.t("Deletion successful"));
        props.handleMenuMode("");
        props.handleFetchNotes();
        props.handleNoteKey("");
        if (props.htmlBook && props.htmlBook.rendition) {
          props.htmlBook.rendition.removeOneNote(
            props.noteKey,
            props.chapterDocIndex
          );
        }

        props.handleOpenMenu(false);
        props.handleShowPopupNote(false);
      });
    } else {
      props.handleOpenMenu(false);
      props.handleMenuMode("");
      props.handleNoteKey("");
    }
  };

  const colorOptionProps = {
    handleDigest: handleUpdateHighlight,
    isEdit: true,
    noteItem: note,
  };

  return (
    <div className="note-editor">
      <div className="note-original-text">{text}</div>
      <div className="editor-box-parent">
        <textarea
          className="editor-box"
          style={{ height: "calc(100% - 90px)" }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.ctrlKey || event.metaKey) &&
              !(event.nativeEvent as any).isComposing
            ) {
              event.preventDefault();
              createNote();
            }
          }}
        />
      </div>
      <ColorOption {...(colorOptionProps as any)} />
      <div
        className="note-tags"
        style={{
          position: "absolute",
          bottom: "35px",
          height: "40px",
          width: "calc(100% - 40px)",
        }}
      >
        <NoteTag
          {...({
            handleTag: handleTag,
            tag: props.noteKey && note ? note.tag : [],
          } as any)}
        />
      </div>

      <div className="note-button-container">
        <span
          className="book-manage-title"
          onClick={() => {
            copy(text);
            toast.success(props.t("Copying successful"));
          }}
        >
          <Trans>Copy quotes</Trans>
        </span>
        <span
          className="book-manage-title"
          onClick={() => {
            handleClose();
          }}
        >
          {props.noteKey ? <Trans>Delete</Trans> : <Trans>Cancel</Trans>}
        </span>
        <span
          className="book-manage-title"
          onClick={() => {
            createNote();
          }}
        >
          <Trans>Confirm</Trans>
          <span> (CTRL + ↵)</span>
        </span>
      </div>
    </div>
  );
};

export default PopupNote;
