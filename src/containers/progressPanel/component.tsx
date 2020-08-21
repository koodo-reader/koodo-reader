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
    };
  }
  //WARNING! To be deprecated in React v17. Use componentDidMount instead.
  onProgressChange = (event: any) => {
    const percentage = event.target.value / 100;
    const location = percentage
      ? this.props.locations.cfiFromPercentage(percentage)
      : 0;
    this.props.currentEpub.gotoCfi(location);
  };
  //使进度百分比随拖动实时变化
  onProgressInput = (event: any) => {
    this.setState({ displayPercentage: event.target.value / 100 });
  };
  previourChapter = () => {
    let currentSection = this.props.currentEpub.spinePos;
    this.props.currentEpub.displayChapter(currentSection - 1, false);
    let percentage =
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? 0
        : RecordLocation.getCfi(this.props.currentBook.key).percentage;
    this.setState({ displayPercentage: percentage });
  };
  nextChapter = () => {
    let currentSection = this.props.currentEpub.spinePos;
    this.props.currentEpub.displayChapter(currentSection + 1, false);
    let percentage =
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? 0
        : RecordLocation.getCfi(this.props.currentBook.key).percentage;
    this.setState({ displayPercentage: percentage });
  };

  render() {
    return (
      <div className="progress-panel">
        <p className="progress-text">
          <Trans>Current Progress</Trans>:{" "}
          {Math.round(
            this.state.displayPercentage > 1
              ? 100
              : this.state.displayPercentage * 100
          )}
          %
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
