import React from "react";
import "./progressPanel.css";
import { Trans } from "react-i18next";
import { ProgressPanelProps, ProgressPanelState } from "./interface";
import Lottie from "react-lottie";
import animationSiri from "../../../assets/lotties/siri.json";
import { Tooltip } from "react-tippy";
import _ from "underscore";

const siriOptions = {
  loop: true,
  autoplay: true,
  animationData: animationSiri,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
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
    };
  }
  componentWillReceiveProps(nextProps: ProgressPanelProps) {
    if (nextProps.currentChapter && nextProps.htmlBook) {
      this.setState({
        currentChapter: nextProps.currentChapter,
        currentChapterIndex:
          _.findIndex(nextProps.htmlBook.chapters, {
            id: nextProps.currentChapter,
          }) > -1
            ? _.findIndex(nextProps.htmlBook.chapters, {
                id: nextProps.currentChapter,
              })
            : 0,
        displayPercentage:
          _.findIndex(nextProps.htmlBook.chapters, {
            id: nextProps.currentChapter,
          }) / nextProps.htmlBook.chapters.length,
      });
    }
  }

  onProgressChange = (event: any) => {
    const percentage = event.target.value / 100;
    if (this.props.htmlBook.chapters.length > 0) {
      this.props.renderFunc(
        this.props.htmlBook.chapters[
          Math.floor(this.props.htmlBook.chapters.length * percentage)
        ].id
      );
    }
  };
  //使进度百分比随拖动实时变化
  onProgressInput = (event: any) => {
    this.setState({ displayPercentage: event.target.value / 100 });
  };
  nextChapter = () => {
    if (this.props.htmlBook.chapters.length > 0) {
      this.props.renderFunc(
        this.props.htmlBook.chapters[
          _.findIndex(this.props.htmlBook.chapters, {
            id: this.props.currentChapter,
          }) <
          this.props.htmlBook.chapters.length - 1
            ? _.findIndex(this.props.htmlBook.chapters, {
                id: this.props.currentChapter,
              }) + 1
            : this.props.htmlBook.chapters.length - 1
        ].id
      );
    }
  };
  prevChapter = () => {
    if (this.props.htmlBook.chapters.length > 0) {
      this.props.renderFunc(
        this.props.htmlBook.chapters[
          _.findIndex(this.props.htmlBook.chapters, {
            id: this.props.currentChapter,
          }) > 0
            ? _.findIndex(this.props.htmlBook.chapters, {
                id: this.props.currentChapter,
              }) - 1
            : 0
        ].id
      );
    }
  };
  handleJumpChapter = (event: any) => {
    if (this.props.htmlBook.chapters.length > 0) {
      this.props.renderFunc(
        this.props.htmlBook.chapters[event.target.value].id
      );
    }
  };
  render() {
    if (!this.props.htmlBook) {
      return (
        <div className="progress-panel">
          <Lottie options={siriOptions} height={100} width={300} />
        </div>
      );
    }

    return (
      <div className="progress-panel">
        <p className="progress-text" style={{ marginTop: 10 }}>
          <span>
            <Trans>Current Progress</Trans>:{" "}
            {Math.round(
              this.state.displayPercentage > 1
                ? 100
                : this.state.displayPercentage * 100
            )}
            %&nbsp;&nbsp;&nbsp;
          </span>
        </p>

        <p className="progress-text" style={{ marginTop: 0 }}>
          <Trans>Chapter Redirect</Trans>
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
