//我的书摘页面
import React from "react";
import "./digestList.css";
import { DigestListProps, DigestListStates } from "./interface";
import CardList from "../../components/cardList";

class DigestList extends React.Component<DigestListProps, DigestListStates> {
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
        ? this.handleFilter(this.props.digests, this.props.searchResults)
        : this.props.digests,
      mode: "digest",
    };
    return (
      <div className="digest-list-container-parent">
        <CardList {...noteProps} />
      </div>
    );
  }
}

export default DigestList;
