import React from "react";
import "./welcomePage.css";
import { welcomeMessage } from "../../utils/readerConfig";

export interface WelcomePageProps {
  handleCloseWelcome: () => void;
}

export interface WelcomePageState {
  currentIndex: number;
  isOpenWelcome: boolean;
}

class WelcomePage extends React.Component<WelcomePageProps, WelcomePageState> {
  constructor(props) {
    super(props);
    this.state = { currentIndex: 0, isOpenWelcome: false };
  }
  handleSkip = () => {
    this.props.handleCloseWelcome();
  };
  handlePrevious = () => {
    if (this.state.currentIndex > 0)
      this.setState({ currentIndex: this.state.currentIndex - 1 });
  };
  handleNext = () => {
    // console.log("next");
    if (this.state.currentIndex < 3)
      this.setState({ currentIndex: this.state.currentIndex + 1 });
  };
  render() {
    const renderWelcome = () => {
      return welcomeMessage.map((item, index) => {
        return (
          <div
            className={
              this.state.currentIndex === index
                ? "welcome-message-page welcome-page-animation"
                : "welcome-message-page"
            }
            key={item.sub}
          >
            <div className="welcome-message-main">
              <div>{item.main}</div>
            </div>
            <div className="welcome-message-sub">{item.sub}</div>
          </div>
        );
      });
    };
    return (
      <div className="welcome-page-container">
        <div className="welcome-title">朋友，别来无恙啊！</div>
        <div
          className="welcome-previout-page"
          onClick={() => {
            this.handlePrevious();
          }}
        >
          <span className="icon-dropdown welcome-page-icon"></span>
        </div>
        <div
          className="welcome-next-page"
          onClick={() => {
            this.handleNext();
          }}
        >
          <span className="icon-dropdown welcome-page-icon"></span>
        </div>
        <div
          className="welcome-message-page-container"
          style={{ left: `${86 - this.state.currentIndex * 506}px` }}
        >
          {renderWelcome()}
        </div>

        <ul className="welcome-dots-page">
          <li
            className="welcome-dots"
            style={
              this.state.currentIndex === 0
                ? { backgroundColor: "rgba(112, 112, 112, 1)" }
                : {}
            }
          ></li>
          <li
            className="welcome-dots"
            style={
              this.state.currentIndex === 1
                ? { backgroundColor: "rgba(112, 112, 112, 1)" }
                : {}
            }
          ></li>
          <li
            className="welcome-dots"
            style={
              this.state.currentIndex === 2
                ? { backgroundColor: "rgba(112, 112, 112, 1)" }
                : {}
            }
          ></li>
          <li
            className="welcome-dots"
            style={
              this.state.currentIndex === 3
                ? { backgroundColor: "rgba(112, 112, 112, 1)" }
                : {}
            }
          ></li>
        </ul>
        <div
          className="welcome-button-page"
          onClick={() => {
            this.handleSkip();
          }}
        >
          <div>不再提示</div>
        </div>
      </div>
    );
  }
}

export default WelcomePage;
