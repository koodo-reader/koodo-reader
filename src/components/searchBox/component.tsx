import React from "react";
import "./searchBox.css";
import OtherUtil from "../../utils/otherUtil";
import { Trans } from "react-i18next";
import { SearchBoxProps } from "./interface";
class SearchBox extends React.Component<SearchBoxProps> {
  handleMouse = () => {
    let results = OtherUtil.MouseSearch(this.props.books);
    this.props.handleSearchBooks(results);
    this.props.handleSearch(true);
  };
  handleKey = (event: any) => {
    let results = OtherUtil.KeySearch(event, this.props.books);
    if (results) {
      this.props.handleSearchBooks(results);
      this.props.handleSearch(true);
    }
  };

  handleCancel = () => {
    this.props.handleSearch(false);
    (document.querySelector(".header-search-box") as HTMLInputElement).value =
      "";
  };

  render() {
    return (
      <div className="header-search-container">
        <input
          type="text"
          className="header-search-box"
          onKeyDown={(event) => {
            this.handleKey(event);
          }}
          placeholder="Search My Library"
        />
        {this.props.isSearch ? (
          <span
            className="header-search-text"
            onClick={() => {
              this.handleCancel();
            }}
          >
            <Trans>Cancel</Trans>
          </span>
        ) : (
          <span
            className="icon-search header-search-icon"
            onClick={() => {
              this.handleMouse();
            }}
          ></span>
        )}
      </div>
    );
  }
}

export default SearchBox;
