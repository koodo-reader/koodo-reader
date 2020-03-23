import React, { Component } from "react";
import "./progressPanel.css";
import { connect } from "react-redux";
import RecordLocation from "../../utils/recordLocation";
import {
  // handleFetchPercentage,
  handleFetchLocations
} from "../../redux/progressPanel.redux";
// @connect(state => state.book)
// @connect(state => state.reader)
class ProgressPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayPercentage:
        this.props.percentage !== undefined ? this.props.percentage : 0
    };
  }
  //WARNING! To be deprecated in React v17. Use componentDidMount instead.
  UNSAFE_componentWillMount() {
    // this.setState({
    //   displayPercentage: this.props.percentage
    // });
    this.props.handleFetchLocations(this.props.currentEpub);
  }
  onProgressChange = event => {
    const percentage = event.target.value / 100;
    // console.log(this.state.locations, "agashaf");
    const location =
      percentage >= 0 ? this.props.locations.cfiFromPercentage(percentage) : 0;
    // let progress = this.state.locations.percentageFromCfi(location);
    // console.log(location, percentage, "fhasfhfdh");
    this.props.currentEpub.gotoCfi(location);
    // this.recordCfi();
  };
  //使进度百分比随拖动实时变化
  onProgressInput = event => {
    this.setState({ displayPercentage: event.target.value / 100 });
    console.log(this.state.displayPercentage, "kgdkdk");
  };
  previourChapter = () => {
    let currentSection = this.props.currentEpub.spinePos;
    this.props.currentEpub.displayChapter(currentSection - 1, false);
    let percentage =
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? 0
        : RecordLocation.getCfi(this.props.currentBook.key).percentage;
    console.log(percentage, "sfhfhg");
    // this.props.handleFetchPercentage(this.props.currentBook);
    this.setState({ displayPercentage: percentage });
  };
  nextChapter = () => {
    let currentSection = this.props.currentEpub.spinePos;
    this.props.currentEpub.displayChapter(currentSection + 1, false);
    let percentage =
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? 0
        : RecordLocation.getCfi(this.props.currentBook.key).percentage;
    console.log(percentage, "sfhfhg");
    // this.props.handleFetchPercentage(this.props.currentBook);
    this.setState({ displayPercentage: percentage });
  };

  render() {
    console.log(this.state.displayPercentage, "sfhfsah");
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
          onMouseUp={event => {
            this.onProgressChange(event);
          }}
          // onMouseDown={this.handleDrag()}
          onChange={event => {
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
const mapStateToProps = state => {
  return {
    // state: state,

    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    percentage: state.progressPanel.percentage,
    locations: state.progressPanel.locations,
    section: state.progressPanel.section
  };
};
const actionCreator = { handleFetchLocations };
ProgressPanel = connect(mapStateToProps, actionCreator)(ProgressPanel);
export default ProgressPanel;
