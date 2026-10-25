import { useTranslation } from "react-i18next";
import { useEffect, useReducer, useRef, useState } from "react";
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
import { ShortcutSettingProps } from "./interface";
import "./shortcutSetting.css";

const ShortcutSetting = () => {
  const { t } = useTranslation();
  const configRef = useRef<ShortcutConfig>(getShortcutConfig());
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [recording, setRecording] = useState<{
    action: ShortcutAction;
    index: number;
  } | null>(null);

  const persistConfig = () => {
    saveShortcutConfig(configRef.current);
    forceUpdate();
  };

  const handleRecordKeyDown = (event: KeyboardEvent) => {
    if (!recording) return;

    event.preventDefault();
    event.stopPropagation();

    const config = configRef.current;
    if (event.keyCode === 27) {
      const action = recording.action as ShortcutAction;
      if (config[action][recording.index]?.keyCode === 0) {
        config[action] = config[action].filter(
          (_, i) => i !== recording.index
        );
        persistConfig();
      }
      setRecording(null);
      return;
    }

    const binding = parseKeyEvent(event);
    if (!binding) return;

    const action = recording.action as ShortcutAction;
    const conflict = findShortcutConflict(
      config,
      action,
      binding,
      recording.index
    );
    if (conflict) {
      toast.error(t("Shortcut conflict"));
      return;
    }

    config[action][recording.index] = binding;
    persistConfig();
    setRecording(null);
    toast.success(t("Change successful"));
  };

  useEffect(() => {
    window.addEventListener("keydown", handleRecordKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleRecordKeyDown, true);
    };
  }, [recording]);

  const startRecording = (action: ShortcutAction, index: number) => {
    setRecording({ action, index });
  };

  const addBinding = (action: ShortcutAction) => {
    const bindings = configRef.current[action];
    configRef.current[action] = [...bindings, { keyCode: 0 }];
    startRecording(action, bindings.length);
  };

  const removeBinding = (action: ShortcutAction, index: number) => {
    configRef.current[action] = configRef.current[action].filter(
      (_, i) => i !== index
    );
    if (recording?.action === action && recording.index === index) {
      setRecording(null);
    }
    persistConfig();
    toast.success(t("Change successful"));
  };

  const handleReset = () => {
    configRef.current = resetShortcutConfig();
    setRecording(null);
    forceUpdate();
    toast.success(t("Reset successful"));
  };

  const renderChips = (action: ShortcutAction) => {
    return configRef.current[action].map((binding, index) => {
      const isRecording =
        recording?.action === action && recording.index === index;
      return (
        <span
          key={`${action}-${index}`}
          className={"shortcut-chip" + (isRecording ? " recording" : "")}
          onClick={() => startRecording(action, index)}
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
              removeBinding(action, index);
            }}
          ></span>
        </span>
      );
    });
  };

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
                onClick={() => addBinding(item.action)}
              >
                <Trans>Customize</Trans>
              </span>
            </div>
            <div className="shortcut-chip-list">
              {renderChips(item.action)}
            </div>
          </div>
        );
      })}
      <div className="setting-dialog-new-title">
        <Trans>Reset shortcuts to default</Trans>
        <span className="change-location-button" onClick={handleReset}>
          <Trans>Reset</Trans>
        </span>
      </div>
    </>
  );
};

export default ShortcutSetting;
