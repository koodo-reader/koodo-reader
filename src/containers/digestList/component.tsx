//我的书摘页面
import React from "react";
import "./digestList.css";
import { DigestListProps, DigestListStates } from "./interface";
import CardList from "../../components/cardList";

class DigestList extends React.Component<DigestListProps, DigestListStates> {
  render() {
    const noteProps = {
      cards: this.props.digests,
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
