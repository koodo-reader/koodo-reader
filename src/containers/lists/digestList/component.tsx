import React from "react";
import "./digestList.css";
import { DigestListProps, DigestListStates } from "./interface";
import CardList from "../cardList";
import NoteTag from "../../../components/noteTag";
import NoteModel from "../../../models/Note";
import Empty from "../../emptyPage";

class DigestList extends React.Component<DigestListProps, DigestListStates> {
  constructor(props: DigestListProps) {
    super(props);
    this.state = {
      tag: [],
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchNotes();
  }
  handleFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });
    return itemArr;
  };
  handleTag = (tag: string[]) => {
    this.setState({ tag });
  };
  filterTag = (digests: NoteModel[]) => {
    let temp: NoteModel[] = [];
    for (let i = 0; i < digests.length; i++) {
      let flag = false;
      for (let j = 0; j < this.state.tag.length; j++) {
        if (digests[i].tag && digests[i].tag.indexOf(this.state.tag[j]) > -1) {
          flag = true;
          break;
        }
      }
      if (flag) {
        temp.push(digests[i]);
      }
    }
    return temp;
  };
  render() {
    const noteProps = {
      cards: this.props.isSearch
        ? this.handleFilter(this.props.digests, this.props.searchResults)
        : this.state.tag.length > 0
        ? this.filterTag(this.props.digests)
        : this.props.digests,
      mode: "digest",
    };

    return (
      <div
        className="digest-list-container-parent"
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

export default DigestList;
