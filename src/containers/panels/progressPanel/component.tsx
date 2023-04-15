import React from "react";
import "./progressPanel.css";
import { Trans } from "react-i18next";
import { ProgressPanelProps, ProgressPanelState } from "./interface";

import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { getTooltip } from "../../../utils/commonUtil";

class ProgressPanel extends React.Component<
  ProgressPanelProps,
  ProgressPanelState
> {
  constructor(props: ProgressPanelProps) {
    super(props);
    this.state = {
      currentPage: 0,
      totalPage: 0,
      targetChapterIndex: 0,
      targetPage: 0,
      isSingle:
        StorageUtil.getReaderConfig("readerMode") &&
        StorageUtil.getReaderConfig("readerMode") !== "double",
    };
  }
  async UNSAFE_componentWillReceiveProps(nextProps: ProgressPanelProps) {
    if (nextProps.htmlBook !== this.props.htmlBook && nextProps.htmlBook) {
      await this.handlePageNum(nextProps.htmlBook.rendition);
      nextProps.htmlBook.rendition.on("page-changed", async () => {
        await this.handlePageNum(nextProps.htmlBook.rendition);
        this.handleCurrentChapterIndex(nextProps.htmlBook.rendition);
      });
      nextProps.htmlBook.rendition.on("rendered", async () => {
        await this.handlePageNum(nextProps.htmlBook.rendition);
        this.handleCurrentChapterIndex(nextProps.htmlBook.rendition);
      });
      this.handleCurrentChapterIndex(nextProps.htmlBook.rendition);
    }
  }
  handleCurrentChapterIndex = (rendition) => {
    let position = rendition.getPosition();
    let href = position.chapterHref;
    let chapterIndex = window._.findIndex(this.props.htmlBook.flattenChapters, {
      href,
    });
    this.setState({ targetChapterIndex: chapterIndex + 1 });
  };
  async handlePageNum(rendition) {
    let pageInfo = await rendition.getProgress();
    this.setState({
      currentPage: this.state.isSingle
        ? pageInfo.currentPage
        : pageInfo.currentPage * 2 - 1,
      totalPage: this.state.isSingle
        ? pageInfo.totalPage
        : (pageInfo.totalPage - 1) * 2,
    });
  }
  onProgressChange = async (event: any) => {
    const percentage = event.target.value / 100;
    if (this.props.htmlBook.flattenChapters.length > 0) {
      let chapterIndex =
        percentage === 1
          ? this.props.htmlBook.flattenChapters.length - 1
          : Math.floor(this.props.htmlBook.flattenChapters.length * percentage);
      await this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.flattenChapters[chapterIndex].index.toString(),
        this.props.htmlBook.flattenChapters[chapterIndex].href,
        ""
      );
    }
  };
  nextChapter = async () => {
    if (this.props.htmlBook.flattenChapters.length > 0) {
      await this.props.htmlBook.rendition.nextChapter();
    }
  };
  prevChapter = async () => {
    if (this.props.htmlBook.flattenChapters.length > 0) {
      await this.props.htmlBook.rendition.prevChapter();
    }
  };
  handleJumpChapter = async (event: any) => {
    let targetChapterIndex = parseInt(event.target.value.trim()) - 1;
    if (this.props.htmlBook.flattenChapters.length > 0) {
      await this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.flattenChapters[targetChapterIndex].index,
        this.props.htmlBook.flattenChapters[targetChapterIndex].href,
        ""
      );
    }
  };
  render() {
    if (!this.props.htmlBook) {
      return <div className="progress-panel">Loading</div>;
    }
    return (
      <div className="progress-panel">
        <p className="progress-text" style={{ marginTop: 10 }}>
          <span>
            <Trans>Progress</Trans>:{" "}
            {Math.round(
              this.props.percentage > 1 ? 100 : this.props.percentage * 100
            )}
            %&nbsp;&nbsp;&nbsp;
          </span>
        </p>

        <p className="progress-text" style={{ marginTop: 0 }}>
          <Trans>Pages</Trans>
          <input
            type="text"
            name="jumpPage"
            id="jumpPage"
            value={
              this.state.targetPage
                ? this.state.targetPage
                : this.state.currentPage
            }
            onFocus={() => {
              this.setState({ targetPage: " " });
            }}
            onChange={(event) => {
              let fieldVal = event.target.value;
              this.setState({ targetPage: fieldVal });
            }}
            onBlur={(event) => {
              if (event.target.value.trim()) {
                // this.handleJumpChapter(event);
                this.setState({ targetPage: "" });
              } else {
                this.setState({ targetPage: "" });
              }
            }}
          />
          <span>/ {this.state.totalPage}</span>
          &nbsp;&nbsp;&nbsp;
          <Trans>Chapters</Trans>
          <input
            type="text"
            name="jumpChapter"
            id="jumpChapter"
            value={this.state.targetChapterIndex}
            onFocus={() => {
              this.setState({ targetChapterIndex: " " });
            }}
            onChange={(event) => {
              let fieldVal = event.target.value;
              this.setState({ targetChapterIndex: fieldVal });
            }}
            onBlur={(event) => {
              if (event.target.value.trim()) {
                this.handleJumpChapter(event);
                this.setState({ targetChapterIndex: "" });
              } else {
                this.setState({ targetChapterIndex: "" });
              }
            }}
          />
          <span>/ {this.props.htmlBook.flattenChapters.length}</span>
        </p>
        <div>
          <input
            className="input-progress"
            defaultValue={Math.round(this.props.percentage * 100)}
            type="range"
            max="100"
            min="0"
            step="1"
            onMouseUp={(event) => {
              this.onProgressChange(event);
            }}
            onTouchEnd={(event) => {
              this.onProgressChange(event);
            }}
            style={{ width: 300, left: 50, top: 73 }}
          />
        </div>

        <div
          className="previous-chapter"
          onClick={() => {
            this.prevChapter();
          }}
        >
          {getTooltip(
            (
              <span className="icon-dropdown previous-chapter-icon"> </span>
            ) as any,
            {
              title: this.props.t("Prev Chapter"),
              position: "top",
              trigger: "mouseenter",
            }
          )}
        </div>

        <div
          className="next-chapter"
          onClick={() => {
            this.nextChapter();
          }}
        >
          {getTooltip(
            (<span className="icon-dropdown next-chapter-icon"></span>) as any,
            {
              title: this.props.t("Next Chapter"),
              position: "top",
              trigger: "mouseenter",
            }
          )}
        </div>
      </div>
    );
  }
}

export default ProgressPanel;
