import React from "react";
import "./noteList.css";
import { NoteListProps, NoteListState } from "./interface";
import CardList from "../cardList";
import NoteTag from "../../../components/noteTag";
import Empty from "../../emptyPage";
import { Trans } from "react-i18next";
import ConfigUtil from "../../../utils/file/configUtil";
import BookUtil from "../../../utils/file/bookUtil";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import Note from "../../../models/Note";

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
  getDisplayList = (notes: Note[], highlights: Note[], tabMode: string) => {
    const isMergeNotes =
      ConfigService.getReaderConfig("isMergeNotes") === "yes";
    if (tabMode === "note" && isMergeNotes) {
      let merged = [...notes, ...highlights];
      let noteSortCodeStr =
        ConfigService.getReaderConfig("noteSortCode") ||
        '{"sort":1,"order":2}';
      let noteSortCode = JSON.parse(noteSortCodeStr);
      let sortField = noteSortCode.sort === 1 ? "key" : "percentage";
      let sortOrder = noteSortCode.order === 1 ? "ASC" : "DESC";

      merged.sort((a: any, b: any) => {
        let valA = Number(a[sortField]);
        let valB = Number(b[sortField]);
        if (sortOrder === "ASC") {
          return valA - valB;
        } else {
          return valB - valA;
        }
      });
      return merged;
    }
    return tabMode === "note" ? notes : highlights;
  };
  async UNSAFE_componentWillMount() {
    this.props.handleFetchNotes();

    this.setState({
      cardList: this.getDisplayList(
        this.props.notes,
        this.props.highlights,
        this.props.tabMode
      ),
    });
  }
  async componentDidMount() {
    this.props.handleFetchNotes();
  }
  async UNSAFE_componentWillReceiveProps(
    nextProps: Readonly<NoteListProps>,
    nextContext: any
  ) {
    if (
      nextProps.notes !== this.props.notes ||
      nextProps.highlights !== this.props.highlights
    ) {
      this.handleNamesMap(
        this.getDisplayList(
          nextProps.notes,
          nextProps.highlights,
          nextProps.tabMode
        )
      );
      this.setState({
        cardList: this.getDisplayList(
          nextProps.notes,
          nextProps.highlights,
          nextProps.tabMode
        ),
      });
    }
  }
  handleNamesMap = async (notes: Note[]) => {
    let uniqueBookKeys = Array.from(new Set(notes.map((note) => note.bookKey)));
    let map = await BookUtil.getBookNamesMapByKeys(uniqueBookKeys);

    this.setState({ bookNamesMap: map });
  };
  handleTag = async (tag: string[]) => {
    if (tag.length === 0) {
      this.setState({
        tag: [],
        cardList: this.getDisplayList(
          this.props.notes,
          this.props.highlights,
          this.props.tabMode
        ),
      });
      return;
    }
    const isMergeNotes =
      ConfigService.getReaderConfig("isMergeNotes") === "yes";
    let cardList = await ConfigUtil.getNoteWithTags(tag);
    cardList = cardList.filter((note) =>
      isMergeNotes && this.props.tabMode === "note"
        ? true
        : this.props.tabMode === "note"
          ? note.notes !== ""
          : note.notes === ""
    );
    this.setState({ tag, cardList });
  };
  render() {
    const noteProps = {
      cards: this.props.isSearch
        ? this.props.searchResults
        : this.state.tag.length > 0
          ? this.state.cardList
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
            <NoteTag {...({ handleTag: this.handleTag } as any)} />
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
                  const isMergeNotes =
                    ConfigService.getReaderConfig("isMergeNotes") === "yes";
                  this.setState({
                    currentSelectedBook: event.target.value,
                    cardList: await ConfigUtil.getNotesByBookKeyAndTypeWithSort(
                      event.target.value,
                      isMergeNotes && this.props.tabMode === "note"
                        ? ""
                        : this.props.tabMode
                    ),
                  });
                }}
              >
                {[
                  { value: "", label: this.props.t("Please select") },
                  ...this.getDisplayList(
                    this.props.notes,
                    this.props.highlights,
                    this.props.tabMode
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
          <CardList {...(noteProps as any)} />
        )}
      </div>
    );
  }
}

export default NoteList;
