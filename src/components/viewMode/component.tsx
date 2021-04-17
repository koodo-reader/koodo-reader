//为空页面
import React from "react";
import "./viewMode.css";
import { ViewModeProps, ViewModeState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import { NamespacesConsumer } from "react-i18next";
import { Tooltip } from "react-tippy";
import { viewMode } from "../../constants/viewMode";

class ViewMode extends React.Component<ViewModeProps, ViewModeState> {
  constructor(props: ViewModeProps) {
    super(props);
    this.state = {};
  }
  handleChange = (mode: string) => {
    OtherUtil.setReaderConfig("viewMode", mode);
    this.props.handleFetchList();
  };
  render() {
    return (
      <NamespacesConsumer>
        {(t) => (
          <div className="book-list-view">
            {viewMode.map((item) => (
              <Tooltip title={t(item.name)} position="top" trigger="mouseenter">
                <div
                  className="card-list-mode"
                  onClick={() => {
                    this.handleChange(item.mode);
                  }}
                  style={
                    this.props.viewMode !== item.mode ? { opacity: 0.5 } : {}
                  }
                >
                  <span className={`icon-${item.icon}`}></span>
                </div>
              </Tooltip>
            ))}
          </div>
        )}
      </NamespacesConsumer>
    );
  }
}

export default ViewMode;
