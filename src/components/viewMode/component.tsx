import React from "react";
import "./viewMode.css";
import { ViewModeProps, ViewModeState } from "./interface";
import StorageUtil from "../../utils/serviceUtils/storageUtil";

import { viewMode } from "../../constants/viewMode";

class ViewMode extends React.Component<ViewModeProps, ViewModeState> {
  constructor(props: ViewModeProps) {
    super(props);
    this.state = {};
  }
  handleChange = (mode: string) => {
    StorageUtil.setReaderConfig("viewMode", mode);
    this.props.handleFetchList();
  };
  render() {
    return (
      <div className="book-list-view">
        {viewMode.map((item) => (
          <>
            <div
              className="card-list-mode"
              onClick={() => {
                this.handleChange(item.mode);
              }}
              style={this.props.viewMode !== item.mode ? { opacity: 0.5 } : {}}
            >
              <span className={`icon-${item.icon}`}></span>
            </div>
          </>
        ))}
      </div>
    );
  }
}

export default ViewMode;
