//底部阅读进度面板
import React from "react";
import "./progressPanel.css";
import RecordLocation from "../../utils/recordLocation";
import { Trans } from "react-i18next";
import { ProgressPanelProps, ProgressPanelState } from "./interface";

class ProgressPanel extends React.Component<
  ProgressPanelProps,
  ProgressPanelState
> {
  constructor(props: ProgressPanelProps) {
    super(props);
    this.state = {
      displayPercentage: this.props.percentage ? this.props.percentage : 0,
      currentChapter: "",
      currentPage: 0,
      totalPage: 0,
      currentChapterIndex: 0,
    };
  }

  componentWillReceiveProps(nextProps: ProgressPanelProps) {
    if (nextProps.currentEpub.rendition.location) {
      const currentLocation = this.props.currentEpub.rendition.currentLocation();
      if (!currentLocation.start) {
        return;
      }
      this.setState({
        currentPage: currentLocation.start.displayed.page,
        totalPage: currentLocation.start.displayed.total,
        currentChapterIndex: currentLocation.start.index,
      });
      let chapterHref = currentLocation.start.href;
      let chapter = "Unknown Chapter";
      let currentChapter = this.props.flattenChapters.filter(
        (item: any) => item.href.split("#")[0] === chapterHref
      )[0];
      if (currentChapter) {
        chapter = currentChapter.label.trim(" ");
      }
      this.setState({ currentChapter: chapter });
    }
  }
  //WARNING! To be deprecated in React v17. Use componentDidMount instead.
  onProgressChange = (event: any) => {
    const percentage = event.target.value / 100;
    const location = percentage
      ? this.props.locations.cfiFromPercentage(percentage)
      : 0;
    this.props.currentEpub.rendition.display(location);
  };
  //使进度百分比随拖动实时变化
  onProgressInput = (event: any) => {
    this.setState({ displayPercentage: event.target.value / 100 });
  };
  previourChapter = () => {
    const currentLocation = this.props.currentEpub.rendition.currentLocation();
    if (!currentLocation.start) return;
    let chapterIndex = currentLocation.start.index;
    this.setState({
      currentChapterIndex: chapterIndex,
    });
    const section = this.props.currentEpub.section(chapterIndex - 1);
    if (section && section.href) {
      this.props.currentEpub.rendition.display(section.href).then(() => {
        let percentage = RecordLocation.getCfi(this.props.currentBook.key)
          .percentage
          ? RecordLocation.getCfi(this.props.currentBook.key).percentage
          : 0;

        this.setState({ displayPercentage: percentage });
      });
    }
  };
  nextChapter = () => {
    const currentLocation = this.props.currentEpub.rendition.currentLocation();
    if (!currentLocation.start) return;
    let chapterIndex = currentLocation.start.index;
    this.setState({
      currentChapterIndex: chapterIndex,
    });
    const section = this.props.currentEpub.section(chapterIndex + 1);
    if (section && section.href) {
      this.props.currentEpub.rendition.display(section.href).then(() => {
        let percentage = RecordLocation.getCfi(this.props.currentBook.key)
          .percentage
          ? RecordLocation.getCfi(this.props.currentBook.key).percentage
          : 0;
        this.setState({ displayPercentage: percentage });
      });
    }
  };
  handleJumpChapter = (event: any) => {
    if (!event.target.value) return;
    const section = this.props.currentEpub.section(event.target.value);
    if (section && section.href) {
      this.props.currentEpub.rendition.display(section.href).then(() => {
        let percentage = RecordLocation.getCfi(this.props.currentBook.key)
          .percentage
          ? RecordLocation.getCfi(this.props.currentBook.key).percentage
          : 0;
        this.setState({ displayPercentage: percentage });
      });
    }
  };
  handleJumpPage = (event: any) => {};
  render() {
    if (!this.props.locations) {
      return (
        <div className="progress-panel">
          <p className="progress-text">
            <Trans>Loading</Trans>
          </p>
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
          {this.state.currentPage > 0 ? (
            <>
              <Trans>Current Chapter Pages</Trans>
              <input
                type="text"
                name="jumpPage"
                id="jumpPage"
                onBlur={(event) => {
                  this.handleJumpPage(event);
                }}
                value={this.state.currentPage}
              />
              <span>/ {this.state.totalPage}</span>&nbsp;&nbsp;&nbsp;
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
              <span>
                / {this.props.currentEpub.rendition.book.spine.length}
              </span>
            </>
          ) : null}
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
            // onMouseDown={this.handleDrag()}
            onChange={(event) => {
              this.onProgressInput(event);
            }}
            style={{ width: 300, left: 50, top: 73 }}
          />
        </div>

        <div
          className="previous-chapter"
          onClick={() => {
            this.previourChapter();
          }}
        >
          <span className="icon-dropdown previous-chapter-icon"> </span>
        </div>
        <div
          className="next-chapter"
          onClick={() => {
            this.nextChapter();
          }}
        >
          <span className="icon-dropdown next-chapter-icon"></span>
        </div>
      </div>
    );
  }
}

export default ProgressPanel;
