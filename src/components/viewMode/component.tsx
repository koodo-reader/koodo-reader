import React from "react";
import "./viewMode.css";
import { ViewModeProps, ViewModeState } from "./interface";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { viewMode } from "../../constants/viewMode";

class ViewMode extends React.Component<ViewModeProps, ViewModeState> {
  constructor(props: ViewModeProps) {
    super(props);
    this.state = {};
  }
  handleChange = (mode: string) => {
    ConfigService.setReaderConfig("viewMode", mode);
    this.props.handleFetchList();
  };
  isElementInViewport = (element) => {
    const rect = element.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };
  render() {
    return (
      <div className="book-list-view">
        {viewMode.map((item) => (
          <div
            className="card-list-mode"
            onClick={() => {
              this.handleChange(item.mode);
            }}
            style={this.props.viewMode !== item.mode ? { opacity: 0.5 } : {}}
            key={item.mode}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t(item.name)}
            >
              <span className={`icon-${item.icon}`}></span>
            </span>
          </div>
        ))}
      </div>
    );
  }
}

export default ViewMode;
