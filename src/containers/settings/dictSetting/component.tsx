import React from "react";
import "./dictSetting.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import DictUtil, { DictMeta } from "../../../utils/file/dictUtil";
import { getFileNameWithoutExtension } from "../../../utils/common";
import { CloudDictList, CloudDictItem } from "../../../constants/dictConfig";

class DictSetting extends React.Component<SettingInfoProps, SettingInfoState> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      dicts: [],
      isLoading: true,
      downloadingId: "",
      downloadProgress: 0,
    };
  }

  componentDidMount() {
    this.loadDicts();
  }

  loadDicts = () => {
    const ids = DictUtil.getDictIds();
    const dicts: DictMeta[] = [];
    for (const id of ids) {
      const meta = DictUtil.getDictMeta(id);
      if (meta) dicts.push(meta);
    }
    this.setState({ dicts, isLoading: false });
  };

  handleImportClick = async () => {
    const ipcRenderer = window.electronAPI;
    const path = window.electronAPI.path;

    const filePath: string | undefined = await ipcRenderer.invoke(
      "select-file",
      { filters: [{ name: "MDict", extensions: ["mdx"] }] }
    );
    if (!filePath) return;

    const ext = path.extname(filePath).replace(/^\./, "").toLowerCase();

    const id = Date.now().toString();
    const meta: Omit<DictMeta, "id"> = {
      name: getFileNameWithoutExtension(filePath),
      extension: ext,
    };

    try {
      DictUtil.saveDictFromPath(id, filePath);
      DictUtil.saveDictMeta(id, meta);
      DictUtil.addDictId(id);

      const newDict: DictMeta = { id, ...meta };
      this.setState((prev) => ({
        dicts: [...prev.dicts, newDict],
      }));
      this.props.handleFetchPlugins();
      toast.success(this.props.t("Import successful"));
    } catch (err) {
      console.error(err);
      toast.error(this.props.t("Import failed"));
    }
  };

  handleDelete = async (dict: DictMeta) => {
    try {
      await DictUtil.deleteDict(dict.id);
      DictUtil.deleteDictMeta(dict.id);
      DictUtil.removeDictId(dict.id);
      this.setState((prev) => ({
        dicts: prev.dicts.filter((d) => d.id !== dict.id),
      }));
      this.props.handleFetchPlugins();
      toast.success(this.props.t("Deletion successful"));
    } catch (err) {
      console.error(err);
      toast.error(this.props.t("Deletion failed"));
    }
  };

  isCloudDictInstalled = (dictId: string) => {
    return DictUtil.getDictIds().includes(dictId);
  };

  handleDownloadCloudDict = async (dict: CloudDictItem) => {
    if (this.isCloudDictInstalled(dict.id)) {
      toast.success(this.props.t("Dictionary already downloaded"));
      return;
    }
    if (this.state.downloadingId) return;

    this.setState({ downloadingId: dict.id, downloadProgress: 0 });
    try {
      const success = await DictUtil.downloadCloudDict(
        dict,
        this.props.isAuthed,
        (progress) => {
          this.setState({ downloadProgress: progress });
        }
      );
      if (success) {
        this.loadDicts();
        this.props.handleFetchPlugins();
        toast.success(this.props.t("Download successful"));
      } else {
        toast.error(this.props.t("Download failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error(this.props.t("Download failed"));
    } finally {
      this.setState({ downloadingId: "", downloadProgress: 0 });
    }
  };

  renderCloudDictSection = () => {
    const { downloadingId, downloadProgress } = this.state;

    return (
      <div className="dict-cloud-section">
        <div className="dict-cloud-section-title">
          <Trans>Download open dictionaries</Trans>
        </div>
        <div className="dict-cloud-list">
          {CloudDictList.map((dict) => {
            const installed = this.isCloudDictInstalled(dict.id);
            const isDownloading = downloadingId === dict.id;
            return (
              <div key={dict.id} className="dict-cloud-item">
                <div className="dict-cloud-item-row">
                  <div className="dict-cloud-item-info">
                    <span className="dict-cloud-item-name">
                      {DictUtil.getCloudDictDisplayName(dict)}
                    </span>
                    <span className="dict-cloud-item-source">
                      <Trans>Source</Trans>
                      {": "}
                      {dict.source}
                    </span>
                  </div>
                  {installed ? (
                    <span
                      style={{
                        opacity: 0.5,
                        fontSize: 13,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "transparent",
                      }}
                    >
                      <Trans>Installed</Trans>
                    </span>
                  ) : (
                    <button
                      className="dict-cloud-download-btn"
                      disabled={!!downloadingId && !isDownloading}
                      onClick={() => this.handleDownloadCloudDict(dict)}
                    >
                      {isDownloading ? (
                        <Trans>Downloading</Trans>
                      ) : (
                        <Trans>Download</Trans>
                      )}
                    </button>
                  )}
                </div>
                {isDownloading && (
                  <div className="dict-cloud-progress">
                    <div
                      className="dict-cloud-progress-bar"
                      style={{
                        width: `${Math.round(downloadProgress * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  render() {
    const { dicts, isLoading } = this.state;
    return (
      <>
        <div className="dict-setting-list">
          {isLoading ? (
            <div className="dict-setting-empty">
              <Trans>Loading</Trans>...
            </div>
          ) : dicts.length === 0 ? (
            <div className="background-setting-empty">
              <Trans>No local dictionaries imported yet</Trans>
            </div>
          ) : (
            dicts.map((dict) => (
              <div
                className="setting-dialog-new-title"
                key={dict.id}
                style={{
                  marginLeft: "0px",
                  marginRight: "0px",
                  width: "calc(100% - 20px)",
                }}
              >
                <span>
                  <span className="setting-dialog-new-title-name">
                    {dict.name}
                  </span>
                  <span
                    className="setting-dialog-new-title-tag"
                    style={{
                      marginLeft: "10px",
                      color: "#888",
                      fontSize: "12px",
                    }}
                  >
                    {dict.extension.toUpperCase()}
                  </span>
                </span>
                <span
                  className="change-location-button"
                  onClick={() => this.handleDelete(dict)}
                >
                  <Trans>Delete</Trans>
                </span>
              </div>
            ))
          )}
        </div>

        {this.renderCloudDictSection()}

        {/* Import button */}
        <div
          className="setting-dialog-new-plugin"
          onClick={this.handleImportClick}
        >
          <span style={{ fontWeight: "bold" }}>
            <Trans>Import dictionary</Trans>
            <span>{"(MDX)"}</span>
          </span>
        </div>
      </>
    );
  }
}

export default DictSetting;
