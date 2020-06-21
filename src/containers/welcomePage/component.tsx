import React from "react";
import "./welcomePage.css";
import { welcomeMessage } from "../../utils/readerConfig";
import { Trans } from "react-i18next";
import { WelcomePageProps, WelcomePageState } from "./interface";
class WelcomePage extends React.Component<WelcomePageProps, WelcomePageState> {
  constructor(props: WelcomePageProps) {
    super(props);
    this.state = { currentIndex: 0, isOpenWelcome: false };
  }
  handleSkip = () => {
    this.handleCloseWelcome();
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
  handleCloseWelcome = () => {
    this.props.handleFirst("no");
    localStorage.setItem("isFirst", "no");
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
              <div>
                <Trans>{item.main}</Trans>
              </div>
            </div>
            <div className="welcome-message-sub">
              <Trans>{item.sub}</Trans>
            </div>
          </div>
        );
      });
    };
    return (
      <div className="welcome-page-container">
        <div className="welcome-title">
          <Trans>Hi! Stranger</Trans>
        </div>
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
          <div>
            <Trans>Skip</Trans>
          </div>
        </div>
      </div>
    );
  }
}

export default WelcomePage;
