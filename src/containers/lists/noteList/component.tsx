import React from "react";
import "./noteList.css";
import { NoteListProps, NoteListState } from "./interface";
import CardList from "../cardList";
import NoteTag from "../../../components/noteTag";
import NoteModel from "../../../models/Note";
import Empty from "../../emptyPage";

class NoteList extends React.Component<NoteListProps, NoteListState> {
  constructor(props: NoteListProps) {
    super(props);
    this.state = {
      tag: [],
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchNotes();
  }
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
        ? this.handleFilter(
            this.props.notes.filter((item) => item.notes !== ""),
            this.props.searchResults
          )
        : this.state.tag.length > 0
        ? this.filterTag(this.props.notes.filter((item) => item.notes !== ""))
        : this.props.notes.filter((item) => item.notes !== ""),
      mode: "note",
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
        <div className="note-tags">
          <NoteTag {...{ handleTag: this.handleTag }} />
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
