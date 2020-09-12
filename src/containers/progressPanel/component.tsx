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
    };
  }

  componentWillReceiveProps(nextProps: ProgressPanelProps) {
    if (nextProps.currentEpub.rendition.location) {
      const currentLocation = this.props.currentEpub.rendition.currentLocation();
      if (!currentLocation.start) {
        return;
      }
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
    let chapterIndex = currentLocation.start.index;
    const section = this.props.currentEpub.section(chapterIndex - 1);
    if (section && section.href) {
      this.props.currentEpub.rendition.display(section.href).then(() => {
        let percentage =
          RecordLocation.getCfi(this.props.currentBook.key) === null
            ? 0
            : RecordLocation.getCfi(this.props.currentBook.key).percentage;
        this.setState({ displayPercentage: percentage });
      });
    }
  };
  nextChapter = () => {
    const currentLocation = this.props.currentEpub.rendition.currentLocation();
    let chapterIndex = currentLocation.start.index;
    const section = this.props.currentEpub.section(chapterIndex + 1);
    if (section && section.href) {
      this.props.currentEpub.rendition.display(section.href).then(() => {
        let percentage =
          RecordLocation.getCfi(this.props.currentBook.key) === null
            ? 0
            : RecordLocation.getCfi(this.props.currentBook.key).percentage;
        this.setState({ displayPercentage: percentage });
      });
    }
  };

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
        <p className="progress-text">
          <span>
            <Trans>Current Progress</Trans>:{" "}
            {Math.round(
              this.state.displayPercentage > 1
                ? 100
                : this.state.displayPercentage * 100
            )}
            {"%  "}
          </span>
          {this.state.currentChapter && (
            <span className="progress-chapter-name">
              {this.state.currentChapter}
            </span>
          )}
        </p>

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
        />

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
