//底部阅读进度面板
import React from "react";
import "./progressPanel.css";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import { Trans } from "react-i18next";
import { ProgressPanelProps, ProgressPanelState } from "./interface";
import Lottie from "react-lottie";
import animationSiri from "../../../assets/lotties/siri.json";

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
      currentChapter: "",
      currentChapterIndex: 0,
      chapters: [],
    };
  }
  componentWillReceiveProps(nextProps: ProgressPanelProps) {
    if (nextProps.currentBook && nextProps.htmlBook) {
      setTimeout(() => {
        let scrollTop =
          RecordLocation.getCfi(nextProps.currentBook.key).scroll || 0;
        let length =
          RecordLocation.getCfi(nextProps.currentBook.key).length || 1;
        this.setState({
          displayPercentage: scrollTop / length,
        });
        let _chapters: { top: number; label: string }[] = [];
        let _index = 0;
        let iframe = document.getElementsByTagName("iframe")[0];
        if (!iframe) return;
        let doc = iframe.contentDocument;
        if (!doc) {
          return;
        }
        for (let chapter of nextProps.htmlBook.chapters) {
          let top = doc.getElementById(chapter.id)?.offsetTop;

          top && _chapters.push({ top, label: chapter.label });
          if (top && top < scrollTop) {
            _index++;
          } else {
            this.setState({
              currentChapter: chapter.label,
              currentChapterIndex: _index,
            });
          }
        }
        this.setState({ chapters: _chapters });
      }, 1000);
    }
  }

  onProgressChange = (event: any) => {
    const percentage = event.target.value / 100;
    let iFrame: any = document.getElementsByTagName("iframe")[0];
    let body = iFrame.contentWindow.document.body,
      html = iFrame.contentWindow.document.documentElement;
    let height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
    document
      .getElementsByClassName("ebook-viewer")[0]
      .scrollTo(0, height * percentage);
  };
  //使进度百分比随拖动实时变化
  onProgressInput = (event: any) => {
    this.setState({ displayPercentage: event.target.value / 100 });
  };
  previourChapter = () => {
    let scrollTop = RecordLocation.getCfi(this.props.currentBook.key).scroll;
    for (let i = 0; i < this.state.chapters.length; i++) {
      if (scrollTop < this.state.chapters[i].top) {
        document
          .getElementsByClassName("ebook-viewer")[0]
          .scrollTo(0, this.state.chapters[i - 1].top);
        break;
      }
    }
  };
  nextChapter = () => {
    let scrollTop = RecordLocation.getCfi(this.props.currentBook.key).scroll;
    for (let i = 0; i < this.state.chapters.length; i++) {
      if (scrollTop < this.state.chapters[i].top) {
        document
          .getElementsByClassName("ebook-viewer")[0]
          .scrollTo(0, this.state.chapters[i].top);
        break;
      }
    }
  };
  handleJumpChapter = (event: any) => {
    if (!event.target.value) return;
    if (event.target.value > this.state.chapters.length) {
      document
        .getElementsByClassName("ebook-viewer")[0]
        .scrollTo(0, this.state.chapters[this.state.chapters.length - 1].top);
    } else {
      document
        .getElementsByClassName("ebook-viewer")[0]
        .scrollTo(0, this.state.chapters[event.target.value - 1].top);
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
