import React from "react";
import {
  ReaderWindowState,
  WindowControlsProps,
  WindowControlsState,
} from "./interface";
import "./windowControls.css";
declare var window: any;

class WindowControls extends React.Component<
  WindowControlsProps,
  WindowControlsState
> {
  private unsubscribe?: () => void;

  constructor(props: WindowControlsProps) {
    super(props);
    this.state = {
      isMaximized: false,
      isFullScreen: false,
    };
  }

  componentDidMount() {
    const api = window.electronAPI;
    if (!api) return;
    api
      .invoke("reader-window-get-state", "ping")
      .then((state: ReaderWindowState | null) => {
        if (!state) return;
        this.setState({
          isMaximized: !!state.isMaximized,
          isFullScreen: !!state.isFullScreen,
        });
      })
      .catch(() => undefined);
    this.unsubscribe = api.on(
      "reader-window-state",
      (state: ReaderWindowState) => {
        this.setState({
          isMaximized: !!state.isMaximized,
          isFullScreen: !!state.isFullScreen,
        });
      }
    );
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  handleMinimize = () => {
    window.electronAPI.invoke("reader-window-minimize", "ping");
  };

  handleToggleMaximize = () => {
    window.electronAPI
      .invoke("reader-window-toggle-maximize", "ping")
      .then((isMaximized: boolean | null) => {
        if (typeof isMaximized === "boolean") {
          this.setState({ isMaximized });
        }
      })
      .catch(() => undefined);
  };

  handleClose = () => {
    window.electronAPI.invoke("reader-window-close", "ping");
  };

  render() {
    if (this.state.isFullScreen) return null;
    const { t } = this.props;
    return (
      <div className="reader-window-controls">
        <button
          type="button"
          className="reader-window-control"
          aria-label={t("Minimize")}
          data-tooltip-id="my-tooltip"
          data-tooltip-content={t("Minimize")}
          onClick={this.handleMinimize}
        >
          <span className="reader-window-control-icon reader-window-control-minimize" />
        </button>
        <button
          type="button"
          className="reader-window-control"
          aria-label={t(this.state.isMaximized ? "Restore" : "Maximize")}
          data-tooltip-id="my-tooltip"
          data-tooltip-content={t(this.state.isMaximized ? "Restore" : "Maximize")}
          onClick={this.handleToggleMaximize}
        >
          <span
            className={`reader-window-control-icon ${
              this.state.isMaximized
                ? "reader-window-control-restore"
                : "reader-window-control-maximize"
            }`}
          />
        </button>
        <button
          type="button"
          className="reader-window-control reader-window-control-close"
          aria-label={t("Close")}
          data-tooltip-id="my-tooltip"
          data-tooltip-content={t("Close")}
          onClick={this.handleClose}
        >
          <span className="reader-window-control-icon reader-window-control-close-icon" />
        </button>
      </div>
    );
  }
}

export default WindowControls;
