import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./localFileDialog.css";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import LazyLottie from "../../lazyLottie";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  exportToLocalFile,
  LocalFileManager,
} from "../../../utils/file/localFile";

const LocalFileDialog = () => {
  const handleLocalFileDialog = useAppStore((s) => s.handleLocalFileDialog);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFinish, setIsFinish] = useState(false);
  const [status, setStatus] = useState<{
    hasAccess: boolean;
    needsReauthorization: boolean;
    directoryName?: string;
  }>({
    hasAccess: false,
    needsReauthorization: false,
    directoryName: "",
  });

  useEffect(() => {
    if (!isElectron) {
      LocalFileManager.getPermissionStatus().then((nextStatus) => {
        setStatus(nextStatus);
      });
    }
  }, []);

  const handleClose = () => {
    handleLocalFileDialog(false);
  };
  const showMessage = (message: string) => {
    toast(t(message));
  };
  const handleSelectFolder = async () => {
    if (!LocalFileManager.isSupported()) {
      showMessage("Your browser doesn't support local file access");
      return;
    }

    try {
      const directoryHandle = await LocalFileManager.requestDirectoryAccess();

      if (directoryHandle) {
        toast.loading(
          t("Granting access to local folder, please wait"),
          {
            id: "local-folder-access",
          }
        );
        let fileList = await LocalFileManager.listFiles("config");
        if (fileList.length > 0 && fileList.indexOf("books.db") > -1) {
        } else {
          await exportToLocalFile();
        }
        toast.dismiss("local-folder-access");
        setIsFinish(true);
        ConfigService.setItem("isUseLocal", "yes");
        showMessage("Local folder access granted successfully");
        handleFetchBooks();
        setTimeout(() => {
          navigate("/manager/home");
        }, 2000);
      } else {
        showMessage("Failed to get folder access permission");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error("Error selecting folder:" + errorMessage);
      console.error("Error selecting folder:", error);
      showMessage("Error occurred while selecting folder");
    }
  };

  return (
    <div
      className="backup-page-container"
      style={{ height: "300px", top: "calc(50% - 150px)" }}
    >
      <div className="add-dialog-title">
        <Trans>Never lose your data</Trans>
      </div>
      {!isFinish ? (
        <div className="backup-page-option" style={{ bottom: "0px", top: "0px" }}>
          <div className="backup-page-finish">
            <LazyLottie
              animation="safe"
              loop={false}
              style={{ height: 120, width: "100%" }}
            />
            <div className="backup-page-warning-text">
              {status.needsReauthorization ? (
                t("Need to reauthorize the access to directory") +
                " " +
                status.directoryName +
                ", " +
                t(
                  "Please click the allow on every visit button to avoid this popup once and for all"
                )
              ) : (
                <Trans>
                  Grant access to local folder to save your data and reduce the
                  risk of data loss
                </Trans>
              )}
            </div>
          </div>
          <div className="add-dialog-button-container">
            <div
              className="add-dialog-cancel"
              style={{ borderWidth: 0, marginRight: "20px" }}
              onClick={() => {
                ConfigService.setItem("isUseLocal", "no");
                handleClose();
              }}
            >
              <Trans>Continue to store in the browser</Trans>
            </div>
            {status.needsReauthorization ? (
              <div
                className="add-dialog-confirm"
                onClick={async () => {
                  await LocalFileManager.ensureDirectoryAccess();
                  setIsFinish(true);

                  handleFetchBooks();
                  setTimeout(() => {
                    navigate("/manager/home");
                  }, 2000);
                }}
              >
                <Trans>Authorize</Trans>
              </div>
            ) : (
              <div
                className="add-dialog-confirm"
                onClick={() => {
                  handleSelectFolder();
                }}
              >
                <Trans>Select folder</Trans>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="backup-page-finish-container">
          <div className="backup-page-finish">
            <LazyLottie
              animation="success"
              loop={false}
              style={{ height: 80, width: "100%" }}
            />
            <div className="backup-page-finish-text">
              <Trans>Setup successful</Trans>
            </div>
          </div>
        </div>
      )}
      <div
        className="backup-page-close-icon"
        onClick={() => {
          handleClose();
        }}
      >
        <span className="icon-close backup-close-icon"></span>
      </div>
    </div>
  );
};

export default LocalFileDialog;
