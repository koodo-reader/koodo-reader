import { useEffect, useState } from "react";
import "./windowControls.css";

export interface WindowControlsProps {
  t: (key: string) => string;
}

export interface ReaderWindowState {
  isMaximized: boolean;
  isFullScreen: boolean;
}

declare var window: any;

const WindowControls = (props: WindowControlsProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    api
      .invoke("reader-window-get-state", "ping")
      .then((state: ReaderWindowState | null) => {
        if (!state) return;
        setIsMaximized(!!state.isMaximized);
        setIsFullScreen(!!state.isFullScreen);
      })
      .catch(() => undefined);
    const unsubscribe = api.on(
      "reader-window-state",
      (state: ReaderWindowState) => {
        setIsMaximized(!!state.isMaximized);
        setIsFullScreen(!!state.isFullScreen);
      }
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleMinimize = () => {
    window.electronAPI.invoke("reader-window-minimize", "ping");
  };

  const handleToggleMaximize = () => {
    window.electronAPI
      .invoke("reader-window-toggle-maximize", "ping")
      .then((nextIsMaximized: boolean | null) => {
        if (typeof nextIsMaximized === "boolean") {
          setIsMaximized(nextIsMaximized);
        }
      })
      .catch(() => undefined);
  };

  const handleClose = () => {
    window.electronAPI.invoke("reader-window-close", "ping");
  };

  if (isFullScreen) return null;
  const { t } = props;
  return (
    <div className="reader-window-controls">
      <button
        type="button"
        className="reader-window-control"
        aria-label={t("Minimize")}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={t("Minimize")}
        onClick={handleMinimize}
      >
        <span className="reader-window-control-icon reader-window-control-minimize" />
      </button>
      <button
        type="button"
        className="reader-window-control"
        aria-label={t(isMaximized ? "Restore" : "Maximize")}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={t(isMaximized ? "Restore" : "Maximize")}
        onClick={handleToggleMaximize}
      >
        <span
          className={`reader-window-control-icon ${
            isMaximized
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
        onClick={handleClose}
      >
        <span className="reader-window-control-icon reader-window-control-close-icon" />
      </button>
    </div>
  );
};

export default WindowControls;
