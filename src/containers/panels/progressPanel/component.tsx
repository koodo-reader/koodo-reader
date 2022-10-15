import React from "react";
import "./progressPanel.css";
import { Trans } from "react-i18next";
import { ProgressPanelProps, ProgressPanelState } from "./interface";
import { Tooltip } from "react-tippy";
import _ from "underscore";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";

class ProgressPanel extends React.Component<
  ProgressPanelProps,
  ProgressPanelState
> {
  constructor(props: ProgressPanelProps) {
    super(props);
    this.state = {
      currentPage: 0,
      totalPage: 0,
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
      });
    }
  }
  async handlePageNum(rendition) {
    let pageInfo = await rendition.getProgress();
    this.setState({
      currentPage: this.state.isSingle
        ? pageInfo.currentPage
        : pageInfo.currentPage * 2 - 1,
      totalPage: pageInfo.totalPage,
    });
  }
  onProgressChange = (event: any) => {
    const percentage = event.target.value / 100;
    if (this.props.htmlBook.flattenChapters.length > 0) {
      this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.flattenChapters[
          percentage === 1
            ? this.props.htmlBook.flattenChapters.length - 1
            : Math.floor(
                this.props.htmlBook.flattenChapters.length * percentage
              )
        ].label
      );
    }
  };
  nextChapter = () => {
    if (this.props.htmlBook.flattenChapters.length > 0) {
      this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.flattenChapters[
          _.findIndex(
            this.props.htmlBook.flattenChapters.map((item) => {
              item.label = item.label.trim();
              return item;
            }),
            {
              label: this.props.currentChapter.trim(),
            }
          ) <
          this.props.htmlBook.flattenChapters.length - 1
            ? _.findIndex(
                this.props.htmlBook.flattenChapters.map((item) => {
                  item.label = item.label.trim();
                  return item;
                }),
                {
                  label: this.props.currentChapter.trim(),
                }
              ) + 1
            : this.props.htmlBook.flattenChapters.length - 1
        ].label
      );
    }
  };
  prevChapter = () => {
    if (this.props.htmlBook.flattenChapters.length > 0) {
      this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.flattenChapters[
          _.findIndex(
            this.props.htmlBook.flattenChapters.map((item) => {
              item.label = item.label.trim();
              return item;
            }),
            {
              label: this.props.currentChapter.trim(),
            }
          ) > 0
            ? _.findIndex(
                this.props.htmlBook.flattenChapters.map((item) => {
                  item.label = item.label.trim();
                  return item;
                }),
                {
                  label: this.props.currentChapter.trim(),
                }
              ) - 1
            : 0
        ].label
      );
    }
  };
  handleJumpChapter = (event: any) => {
    if (this.props.htmlBook.flattenChapters.length > 0) {
      this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.flattenChapters[event.target.value].label
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
            defaultValue={this.state.currentPage}
          />
          <span>/ {this.state.totalPage}</span>
          &nbsp;&nbsp;&nbsp;
          <Trans>Chapters</Trans>
          <input
            type="text"
            name="jumpChapter"
            id="jumpChapter"
            onBlur={(event) => {
              this.handleJumpChapter(event);
            }}
            defaultValue={
              this.props.currentChapterIndex === -1
                ? this.props.htmlBook.flattenChapters.length
                : this.props.currentChapterIndex + 1
            }
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
          <Tooltip
            title={this.props.t("Prev Chapter")}
            position="top"
            trigger="mouseenter"
          >
            <span className="icon-dropdown previous-chapter-icon"> </span>
          </Tooltip>
        </div>

        <div
          className="next-chapter"
          onClick={() => {
            this.nextChapter();
          }}
        >
          <Tooltip
            title={this.props.t("Next Chapter")}
            position="top"
            trigger="mouseenter"
          >
            <span className="icon-dropdown next-chapter-icon"></span>
          </Tooltip>
        </div>
      </div>
    );
  }
}

export default ProgressPanel;
