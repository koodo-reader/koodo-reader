//我的笔记页面
import React from "react";
import "./noteList.css";
import { NoteListProps, NoteListState } from "./interface";
import CardList from "../../components/cardList";

class NoteList extends React.Component<NoteListProps, NoteListState> {
  handleFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });
    return itemArr;
  };
  render() {
    const noteProps = {
      cards: this.props.isSearch
        ? this.handleFilter(
            this.props.notes.filter((item) => item.notes !== ""),
            this.props.searchResults
          )
        : this.props.notes.filter((item) => item.notes !== ""),
      mode: "note",
    };
    return (
      <div className="note-list-container-parent">
        <CardList {...noteProps} />
      </div>
    );
  }
}

export default NoteList;
