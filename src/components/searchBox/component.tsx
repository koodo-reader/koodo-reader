//搜索框
import React from "react";
import "./searchBox.css";
import SearchUtil from "../../utils/serviceUtils/searchUtil";
import { SearchBoxProps } from "./interface";

class SearchBox extends React.Component<SearchBoxProps> {
  componentDidMount() {
    if (this.props.isNavSearch) {
      let searchBox: any = document.querySelector(".header-search-box");
      searchBox && searchBox.focus();
    }
  }
  handleMouse = () => {
    let value = (this.refs.searchBox as any).value;
    if (this.props.isNavSearch) {
      value && this.search(value);
    }
    if (this.props.mode === "nav") {
      this.props.handleSearchState(true);
    }
    let results =
      this.props.tabMode === "note"
        ? SearchUtil.MouseNoteSearch(
            this.props.notes.filter((item) => item.notes !== "")
          )
        : this.props.tabMode === "digest"
        ? SearchUtil.MouseNoteSearch(this.props.digests)
        : SearchUtil.MouseSearch(this.props.books);
    if (results) {
      this.props.handleSearchResults(results);
      this.props.handleSearch(true);
    }
  };
  handleKey = (event: any) => {
    if (event.keyCode !== 13) {
      return;
    }
    let value = (this.refs.searchBox as any).value.toLowerCase();
    if (this.props.isNavSearch || this.props.isReading) {
      value && this.search(value);
    }
    let results =
      this.props.tabMode === "note"
        ? SearchUtil.KeyNoteSearch(
            event,
            this.props.notes.filter((item) => item.notes !== "")
          )
        : this.props.tabMode === "digest"
        ? SearchUtil.KeyNoteSearch(event, this.props.digests)
        : SearchUtil.KeySearch(event, this.props.books);
    if (results) {
      this.props.handleSearchResults(results);
      this.props.handleSearch(true);
    }
  };
  search = async (q: string) => {
    let searchList = await this.props.htmlBook.rendition.doSearch(q);

    this.props.handleSearchList(
      searchList.map((item: any) => {
        item.excerpt = item.excerpt.replace(
          q,
          `<span class="content-search-text">${q}</span>`
        );
        return item;
      })
    );
  };

  handleCancel = () => {
    if (this.props.isNavSearch) {
      this.props.handleSearchList(null);
    }
    this.props.handleSearch(false);
    (document.querySelector(".header-search-box") as HTMLInputElement).value =
      "";
  };

  render() {
    return (
      <div style={{ position: "relative" }}>
        <input
          type="text"
          ref="searchBox"
          className="header-search-box"
          onKeyDown={(event) => {
            this.handleKey(event);
          }}
          onFocus={() => {
            this.props.mode === "nav" && this.props.handleSearchState(true);
          }}
          placeholder={
            this.props.isNavSearch || this.props.mode === "nav"
              ? this.props.t("Search in the book")
              : this.props.tabMode === "note"
              ? this.props.t("Search my notes")
              : this.props.tabMode === "digest"
              ? this.props.t("Search my highlights")
              : this.props.t("Search my library")
          }
          style={
            this.props.mode === "nav"
              ? { width: this.props.width, height: this.props.height }
              : { paddingRight: "50px" }
          }
        />
        {this.props.isSearch ? (
          <span
            className="header-search-text"
            onClick={() => {
              this.handleCancel();
            }}
            style={
              this.props.mode === "nav" ? { right: "-9px", top: "14px" } : {}
            }
          >
            <span className="icon-close"></span>
          </span>
        ) : (
          <span
            className="icon-search header-search-icon"
            onClick={() => {
              this.handleMouse();
            }}
            style={this.props.mode === "nav" ? { right: "5px" } : {}}
          ></span>
        )}
      </div>
    );
  }
}

export default SearchBox;
