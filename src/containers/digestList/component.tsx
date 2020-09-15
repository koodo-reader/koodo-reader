//我的书摘页面
import React from "react";
import "./digestList.css";
import { DigestListProps, DigestListStates } from "./interface";
import CardList from "../../components/cardList";
import NoteTag from "../../components/noteTag";
import NoteModel from "../../model/Note";

class DigestList extends React.Component<DigestListProps, DigestListStates> {
  constructor(props: DigestListProps) {
    super(props);
    this.state = {
      tag: [],
    };
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
    let temp = [];
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
      <div className="digest-list-container-parent">
        <div className="note-tags">
          <NoteTag {...{ handleTag: this.handleTag }} />
        </div>
        <CardList {...noteProps} />
      </div>
    );
  }
}

export default DigestList;
