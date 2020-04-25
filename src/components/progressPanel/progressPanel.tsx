import React from "react";
import "./progressPanel.css";
import { connect } from "react-redux";
import RecordLocation from "../../utils/recordLocation";
import { handleFetchLocations } from "../../redux/progressPanel.redux";
import BookModel from "../../model/Book";
export interface ProgressPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  percentage: number;
  locations: any;
  section: string;
  handleFetchLocations: (currentEpub: any) => void;
}

export interface ProgressPanelState {
  displayPercentage: number;
}

class ProgressPanel extends React.Component<
  ProgressPanelProps,
  ProgressPanelState
> {
  constructor(props) {
    super(props);
    this.state = {
      displayPercentage:
        this.props.percentage !== undefined ? this.props.percentage : 0,
    };
  }
  //WARNING! To be deprecated in React v17. Use componentDidMount instead.
  UNSAFE_componentWillMount() {
    this.props.handleFetchLocations(this.props.currentEpub);
  }
  onProgressChange = (event) => {
    const percentage = event.target.value / 100;
    const location =
      percentage >= 0 ? this.props.locations.cfiFromPercentage(percentage) : 0;
    this.props.currentEpub.gotoCfi(location);
  };
  //使进度百分比随拖动实时变化
  onProgressInput = (event) => {
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
          当前进度:
          {Math.round(this.state.displayPercentage * 100)}%
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
const mapStateToProps = (state) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    percentage: state.progressPanel.percentage,
    locations: state.progressPanel.locations,
    section: state.progressPanel.section,
  };
};
const actionCreator = { handleFetchLocations };
export default connect(mapStateToProps, actionCreator)(ProgressPanel);
