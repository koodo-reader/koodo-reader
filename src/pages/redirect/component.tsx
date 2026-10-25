import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./manager.css";
import { Trans } from "react-i18next";
import { getParamsFromUrl } from "../../utils/file/common";
import copy from "copy-text-to-clipboard";
import Lottie from "lottie-react";
import emptyDark from "../../assets/images/empty-dark.svg";
import emptyLight from "../../assets/images/empty-light.svg";
import animationSuccess from "../../assets/lotties/success.json";
import toast, { Toaster } from "react-hot-toast";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import * as Kookit from "../../assets/lib/kookit.min";
import { removeSearchParams } from "../../utils/common";
import { BookHelper } from "../../assets/lib/kookit.min";
import { useAppStore } from "../../store/useAppStore";

declare var window: any;

const Redirect = () => {
  const handleLoadingDialog = useAppStore((s) => s.handleLoadingDialog);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isError, setIsError] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    let url = document.location.href;
    const hash = document.location.hash;
    if ((!hash || hash === "#" || hash === "#/") && url.indexOf("code") === -1) {
      navigate("/manager/home");
    }
    if (url.indexOf("error") > -1) {
      setIsError(true);
    }
    if (url.indexOf("import") > -1) {
      window.Kookit = Kookit;
      window.BookHelper = BookHelper;
    }
    if (url.indexOf("code") > -1) {
      let params: any = getParamsFromUrl();
      removeSearchParams();
      if (params.locationid) {
        params.code = params.code + "$" + params.locationid;
      }
      setToken(params.code);
      setIsAuthed(true);
      let state = params.state;
      // boxnet doesn't allow | in state
      if (state) {
        if (state.indexOf("boxnet") > -1 || state.indexOf("adrive") > -1) {
          const encodedState = state.split("$")[1];
          const customParams = JSON.parse(decodeURIComponent(encodedState));
          if (customParams && customParams.deeplink) {
            window.location.replace(
              customParams.deeplink +
                "?code=" +
                params.code +
                "&state=" +
                state.replace("$", "|")
            );
          }
        } else {
          const encodedState = state.split("|")[1];
          const customParams = JSON.parse(decodeURIComponent(encodedState));
          if (customParams && customParams.deeplink) {
            window.location.replace(
              customParams.deeplink + "?code=" + params.code + "&state=" + state
            );
          }
        }
      }
    }
    if (url.indexOf("access_token") > -1) {
      let params: any = getParamsFromUrl();
      setToken(params.access_token);
      setIsAuthed(true);
    }
  }, []);

  const handleFinish = () => {
    handleLoadingDialog(false);
  };
  const showMessage = (message: string) => {
    toast(t(message));
  };

  if (isError || isAuthed) {
    return (
      <div className="backup-page-finish-container">
        <Toaster
          toastOptions={{
            style: {
              padding: "8px 10px",
              wordWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "normal",
              overflowWrap: "break-word",
            },
          }}
        />
        <div className="backup-page-finish" style={{ maxWidth: "70%" }}>
          {isAuthed ? (
            <Lottie
              animationData={animationSuccess}
              loop={false}
              style={{ height: 80, width: "100%" }}
            />
          ) : (
            <span className="icon-close auth-page-close-icon theme-color-delete"></span>
          )}

          <div className="backup-page-finish-text">
            <Trans>
              {isAuthed ? "Authorisation successful" : "Authorisation failed"}
            </Trans>
          </div>
          {isAuthed ? (
            <div
              className="token-dialog-token-text"
              onClick={() => {
                copy(token);
                toast.success(t("Copied"));
              }}
            >
              <Trans>Copy token</Trans>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="manager">
      <div className="empty-page-info-container" style={{ margin: 100 }}>
        <div className="empty-page-info-main">
          <Trans>It seems like you're lost</Trans>
        </div>
        <div
          className="empty-page-info-sub"
          onClick={() => {
            navigate("/manager/home");
          }}
          style={{ marginTop: 10, cursor: "pointer" }}
        >
          <Trans>Return to home</Trans>
        </div>
      </div>
      <img
        src={
          ConfigService.getReaderConfig("appSkin") === "night" ||
          (ConfigService.getReaderConfig("appSkin") === "system" &&
            ConfigService.getReaderConfig("isOSNight") === "yes")
            ? emptyDark
            : emptyLight
        }
        alt=""
        className="empty-page-illustration"
      />
      <Toaster
        position="top-right"
        containerStyle={{
          maxWidth: "500px",
        }}
        toastOptions={{
          style: {
            wordWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "normal",
            overflowWrap: "break-word",
          },
        }}
      />
    </div>
  );
};

export default Redirect;
