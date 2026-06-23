import React from "react";
import { Trans } from "react-i18next";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
import { shortcutList } from "../../../constants/shortcutList";
import {
  ShortcutAction,
  ShortcutConfig,
  findShortcutConflict,
  formatShortcut,
  getShortcutConfig,
  parseKeyEvent,
  resetShortcutConfig,
  saveShortcutConfig,
} from "../../../utils/reader/shortcutUtil";
import { ShortcutSettingProps, ShortcutSettingState } from "./interface";
import "./shortcutSetting.css";

class ShortcutSetting extends React.Component<
  ShortcutSettingProps,
  ShortcutSettingState
> {
  config: ShortcutConfig;

  constructor(props: ShortcutSettingProps) {
    super(props);
    this.config = getShortcutConfig();
    this.state = {
      recording: null,
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleRecordKeyDown, true);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleRecordKeyDown, true);
  }

  persistConfig = () => {
    saveShortcutConfig(this.config);
    this.forceUpdate();
  };

  handleRecordKeyDown = (event: KeyboardEvent) => {
    const { recording } = this.state;
    if (!recording) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.keyCode === 27) {
      const action = recording.action as ShortcutAction;
      if (this.config[action][recording.index]?.keyCode === 0) {
        this.config[action] = this.config[action].filter(
          (_, i) => i !== recording.index
        );
        this.persistConfig();
      }
      this.setState({ recording: null });
      return;
    }

    const binding = parseKeyEvent(event);
    if (!binding) return;

    const action = recording.action as ShortcutAction;
    const conflict = findShortcutConflict(
      this.config,
      action,
      binding,
      recording.index
    );
    if (conflict) {
      toast.error(this.props.t("Shortcut conflict"));
      return;
    }

    this.config[action][recording.index] = binding;
    this.persistConfig();
    this.setState({ recording: null });
    toast.success(this.props.t("Change successful"));
  };

  startRecording = (action: ShortcutAction, index: number) => {
    this.setState({ recording: { action, index } });
  };

  addBinding = (action: ShortcutAction) => {
    const bindings = this.config[action];
    this.config[action] = [...bindings, { keyCode: 0 }];
    this.startRecording(action, bindings.length);
  };

  removeBinding = (action: ShortcutAction, index: number) => {
    if (this.config[action].length <= 1) {
      toast.error(this.props.t("At least one shortcut required"));
      return;
    }
    this.config[action] = this.config[action].filter((_, i) => i !== index);
    if (
      this.state.recording?.action === action &&
      this.state.recording.index === index
    ) {
      this.setState({ recording: null });
    }
    this.persistConfig();
    toast.success(this.props.t("Change successful"));
  };

  handleReset = () => {
    this.config = resetShortcutConfig();
    this.setState({ recording: null });
    toast.success(this.props.t("Reset successful"));
  };

  renderChips = (action: ShortcutAction) => {
    const { recording } = this.state;
    return this.config[action].map((binding, index) => {
      const isRecording =
        recording?.action === action && recording.index === index;
      return (
        <span
          key={`${action}-${index}`}
          className={"shortcut-chip" + (isRecording ? " recording" : "")}
          onClick={() => this.startRecording(action, index)}
        >
          {isRecording ? (
            <Trans>Press shortcut keys...</Trans>
          ) : binding.keyCode === 0 ? (
            "..."
          ) : (
            formatShortcut(binding)
          )}
          <span
            className="shortcut-chip-remove icon-close"
            onClick={(e) => {
              e.stopPropagation();
              this.removeBinding(action, index);
            }}
          ></span>
        </span>
      );
    });
  };

  render() {
    return (
      <>
        {shortcutList.map((item) => {
          if (item.isElectron && !isElectron) {
            return null;
          }
          return (
            <div className="shortcut-setting-row" key={item.action}>
              <div className="shortcut-setting-header setting-dialog-new-title">
                <span style={{ width: "calc(100% - 80px)" }}>
                  <Trans>{item.title}</Trans>
                  <span
                    style={{
                      fontSize: "12px",
                      opacity: "0.75",
                      margin: "4px 0",
                      marginLeft: "10px",
                    }}
                  >
                    <Trans>{item.desc}</Trans>
                  </span>
                </span>
                <span
                  className="shortcut-add-button change-location-button"
                  onClick={() => this.addBinding(item.action)}
                >
                  <Trans>Add</Trans>
                </span>
              </div>
              <div className="shortcut-chip-list">
                {this.renderChips(item.action)}
              </div>
            </div>
          );
        })}
        <div className="setting-dialog-new-title">
          <Trans>Reset shortcuts to default</Trans>
          <span className="change-location-button" onClick={this.handleReset}>
            <Trans>Reset</Trans>
          </span>
        </div>
      </>
    );
  }
}

export default ShortcutSetting;
