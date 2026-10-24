import { useEffect, useState } from "react";
import "./noteList.css";
import { NoteListProps } from "./interface";
import CardList from "../cardList";
import NoteTag from "../../../components/noteTag";
import Empty from "../../emptyPage";
import { Trans } from "react-i18next";
import ConfigUtil from "../../../utils/file/configUtil";
import BookUtil from "../../../utils/file/bookUtil";
import Note from "../../../models/Note";

const NoteList = (props: NoteListProps) => {
  const [tag, setTag] = useState<string[]>([]);
  const [bookNamesMap, setBookNamesMap] = useState<Record<string, string>>({});
  const [cardList, setCardList] = useState<Note[]>([]);

  const handleNamesMap = async (notes: Note[]) => {
    let uniqueBookKeys = Array.from(new Set(notes.map((note) => note.bookKey)));
    let map = await BookUtil.getBookNamesMapByKeys(uniqueBookKeys);

    setBookNamesMap(map);
  };

  useEffect(() => {
    props.handleFetchNotes();
  }, []);

  useEffect(() => {
    const notes = props.tabMode === "note" ? props.notes : props.highlights;
    setCardList(notes);
    handleNamesMap(notes);
  }, [props.notes, props.highlights, props.tabMode]);

  const handleTag = async (newTag: string[]) => {
    if (newTag.length === 0) {
      setTag([]);
      setCardList(
        props.tabMode === "note" ? props.notes : props.highlights
      );
      return;
    }
    let nextCardList = await ConfigUtil.getNoteWithTags(newTag);
    nextCardList = nextCardList.filter((note) =>
      props.tabMode === "note"
        ? note.notes !== "" && note.notes !== "annotation"
        : note.notes === ""
    );
    setTag(newTag);
    setCardList(nextCardList);
  };

  const noteProps = {
    cards: props.isSearch ? props.searchResults : cardList,
    mode: props.tabMode,
    bookNamesMap: bookNamesMap,
  };
  return (
    <div
      className="note-list-container-parent"
      style={
        props.isCollapsed
          ? { width: "calc(100vw - 70px)", left: "70px" }
          : {}
      }
    >
      <div className="note-list-header">
        <div className="note-tags" style={{ width: "calc(100% - 240px)" }}>
          <NoteTag {...({ handleTag: handleTag } as any)} />
        </div>
        {noteProps.cards.length > 0 && (
          <div style={{ marginRight: "10px", marginTop: "3px" }}>
            <span className="note-list-filter-label">
              <Trans>Filter by book</Trans>
            </span>

            <select
              name=""
              className="lang-setting-dropdown"
              onChange={async (event) => {
                setCardList(
                  await ConfigUtil.getNotesByBookKeyAndTypeWithSort(
                    event.target.value,
                    props.tabMode
                  )
                );
              }}
            >
              {[
                { value: "", label: props.t("Please select") },
                ...(props.tabMode === "note" ? props.notes : props.highlights)
                  .map((note) => {
                    return {
                      label: bookNamesMap[note.bookKey] || "Unknown book",
                      value: note.bookKey,
                    };
                  })
                  .filter(
                    (item, index, self) =>
                      self.findIndex((t) => t.label === item.label) === index
                  ),
              ].map((item) => (
                <option
                  value={item.value}
                  key={item.value}
                  className="lang-setting-option"
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {noteProps.cards.length === 0 ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
          }}
        >
          {tag.length === 0 && <Empty />}
        </div>
      ) : (
        <CardList {...(noteProps as any)} />
      )}
    </div>
  );
};

export default NoteList;
