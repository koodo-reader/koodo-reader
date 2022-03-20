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
      displayPercentage: this.props.percentage ? this.props.percentage : 0,
      currentChapter: this.props.currentChapter,
      currentChapterIndex: 0,
      currentPage: 0,
      totalPage: 0,
    };
  }

  componentWillReceiveProps(nextProps: ProgressPanelProps) {
    if (nextProps.currentChapter && nextProps.htmlBook) {
      let pageProgress = nextProps.htmlBook.rendition.getProgress();
      // console.log(pageProgress);
      this.setState({
        currentPage: pageProgress.currentPage,
        totalPage: pageProgress.totalPage,
        currentChapter: nextProps.currentChapter,
        currentChapterIndex:
          _.findIndex(nextProps.htmlBook.chapters, {
            label: nextProps.currentChapter,
          }) > -1
            ? _.findIndex(nextProps.htmlBook.chapters, {
                label: nextProps.currentChapter,
              })
            : 0,
        displayPercentage:
          _.findIndex(nextProps.htmlBook.chapters, {
            label: nextProps.currentChapter,
          }) / nextProps.htmlBook.chapters.length,
      });
    }
    if (nextProps.percentage) {
      this.setState({ displayPercentage: nextProps.percentage });
    }
  }

  onProgressChange = (event: any) => {
    const percentage = event.target.value / 100;
    if (this.props.htmlBook.chapters.length > 0) {
      this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.chapters[
          Math.floor(this.props.htmlBook.chapters.length * percentage)
        ].label
      );
    }
  };
  //使进度百分比随拖动实时变化
  onProgressInput = (event: any) => {
    this.setState({ displayPercentage: event.target.value / 100 });
  };
  nextChapter = () => {
    if (this.props.htmlBook.chapters.length > 0) {
      this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.chapters[
          _.findIndex(this.props.htmlBook.chapters, {
            label: this.props.currentChapter,
          }) <
          this.props.htmlBook.chapters.length - 1
            ? _.findIndex(this.props.htmlBook.chapters, {
                label: this.props.currentChapter,
              }) + 1
            : this.props.htmlBook.chapters.length - 1
        ].label
      );
    }
  };
  prevChapter = () => {
    if (this.props.htmlBook.chapters.length > 0) {
      this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.chapters[
          _.findIndex(this.props.htmlBook.chapters, {
            label: this.props.currentChapter,
          }) > 0
            ? _.findIndex(this.props.htmlBook.chapters, {
                label: this.props.currentChapter,
              }) - 1
            : 0
        ].label
      );
    }
  };
  handleJumpChapter = (event: any) => {
    if (this.props.htmlBook.chapters.length > 0) {
      this.props.htmlBook.rendition.goToChapter(
        this.props.htmlBook.chapters[event.target.value].label
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
              this.state.displayPercentage > 1
                ? 100
                : this.state.displayPercentage * 100
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
              StorageUtil.getReaderConfig("readerMode") !== "double"
                ? this.state.currentPage
                : this.state.currentPage * 2 - 1
            }
          />
          <span>
            /{" "}
            {StorageUtil.getReaderConfig("readerMode") !== "double"
              ? this.state.totalPage
              : this.state.totalPage * 2 - 2}
          </span>
          &nbsp;&nbsp;&nbsp;
          <Trans>Chapters</Trans>
          <input
            type="text"
            name="jumpChapter"
            id="jumpChapter"
            onBlur={(event) => {
              this.handleJumpChapter(event);
            }}
            defaultValue={this.state.currentChapterIndex}
          />
          <span>/ {this.props.htmlBook.chapters.length}</span>
        </p>
        <div>
          <input
            className="input-progress"
            defaultValue={Math.round(this.state.displayPercentage * 100)}
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
            onChange={(event) => {
              this.onProgressInput(event);
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
