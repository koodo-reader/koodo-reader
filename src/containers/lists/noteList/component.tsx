import React from "react";
import "./noteList.css";
import { NoteListProps, NoteListState } from "./interface";
import CardList from "../cardList";
import NoteTag from "../../../components/noteTag";
import NoteModel from "../../../models/Note";
import Empty from "../../emptyPage";
import { Trans } from "react-i18next";
import DatabaseService from "../../../utils/storage/databaseService";
import ConfigUtil from "../../../utils/file/configUtil";

class NoteList extends React.Component<NoteListProps, NoteListState> {
  constructor(props: NoteListProps) {
    super(props);
    this.state = {
      tag: [],
      currentSelectedBook: "",
      bookNamesMap: {},
      cardList: [],
    };
  }
  async UNSAFE_componentWillMount() {
    this.props.handleFetchNotes();

    this.setState({
      cardList:
        this.props.tabMode === "note"
          ? this.props.notes
          : this.props.highlights,
    });
  }
  async componentDidMount() {
    this.handleNamesMap();
  }
  handleNamesMap = async () => {
    let map: any = {};
    let notes =
      this.props.tabMode === "note" ? this.props.notes : this.props.highlights;
    for (let i = 0; i < notes.length; i++) {
      let book = await DatabaseService.getRecord(notes[i].bookKey, "books");
      if (book) {
        map[notes[i].bookKey] = book.name;
      }
    }

    this.setState({ bookNamesMap: map });
  };
  handleTag = (tag: string[]) => {
    this.setState({ tag });
  };
  handleFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });
    return itemArr;
  };
  filterTag = (notes: NoteModel[]) => {
    let temp: NoteModel[] = [];
    for (let i = 0; i < notes.length; i++) {
      let flag = false;
      for (let j = 0; j < this.state.tag.length; j++) {
        if (notes[i].tag && notes[i].tag.indexOf(this.state.tag[j]) > -1) {
          flag = true;
          break;
        }
      }
      if (flag) {
        temp.push(notes[i]);
      }
    }
    return temp;
  };
  render() {
    const noteProps = {
      cards: this.props.isSearch
        ? this.props.searchResults
        : this.state.tag.length > 0
        ? this.filterTag(this.state.cardList)
        : this.state.cardList,
      mode: this.props.tabMode,
      bookNamesMap: this.state.bookNamesMap,
    };
    return (
      <div
        className="note-list-container-parent"
        style={
          this.props.isCollapsed
            ? { width: "calc(100vw - 70px)", left: "70px" }
            : {}
        }
      >
        <div className="note-list-header">
          <div className="note-tags" style={{ width: "calc(100% - 240px)" }}>
            <NoteTag {...{ handleTag: this.handleTag }} />
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
                  this.setState({
                    currentSelectedBook: event.target.value,
                    cardList: await ConfigUtil.getNotesByBookKeyAndType(
                      event.target.value,
                      this.props.tabMode
                    ),
                  });
                }}
              >
                {[
                  { value: "", label: this.props.t("Please select") },
                  ...(this.props.tabMode === "note"
                    ? this.props.notes
                    : this.props.highlights
                  )
                    .map((note) => {
                      return {
                        label:
                          this.state.bookNamesMap[note.bookKey] ||
                          "Unknown book",
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
            {this.state.tag.length === 0 && <Empty />}
          </div>
        ) : (
          <CardList {...noteProps} />
        )}
      </div>
    );
  }
}

export default NoteList;
