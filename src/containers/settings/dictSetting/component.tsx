import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import "./dictSetting.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import DictUtil, {
  CloudDictItem,
  DictMeta,
} from "../../../utils/file/dictUtil";
import { getFileNameWithoutExtension } from "../../../utils/common";
import { KookitConfig } from "../../../assets/lib/kookit-extra-browser.min";
import { useAppStore } from "../../../store/useAppStore";

export interface SettingInfoState {
  dicts: DictMeta[];
  isLoading: boolean;
  downloadingId: string;
  downloadProgress: number;
}

const DictSetting = () => {
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const handleFetchPlugins = useAppStore((s) => s.handleFetchPlugins);
  const { t } = useTranslation();
  const [dicts, setDicts] = useState<DictMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);

  const loadDicts = () => {
    const ids = DictUtil.getDictIds();
    const nextDicts: DictMeta[] = [];
    for (const id of ids) {
      const meta = DictUtil.getDictMeta(id);
      if (meta) nextDicts.push(meta);
    }
    setDicts(nextDicts);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDicts();
  }, []);

  const handleImportClick = async () => {
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
      setDicts((prev) => [...prev, newDict]);
      handleFetchPlugins();
      toast.success(t("Import successful"));
    } catch (err) {
      console.error(err);
      toast.error(t("Import failed"));
    }
  };

  const handleDelete = async (dict: DictMeta) => {
    try {
      await DictUtil.deleteDict(dict.id);
      DictUtil.deleteDictMeta(dict.id);
      DictUtil.removeDictId(dict.id);
      setDicts((prev) => prev.filter((d) => d.id !== dict.id));
      handleFetchPlugins();
      toast.success(t("Deletion successful"));
    } catch (err) {
      console.error(err);
      toast.error(t("Deletion failed"));
    }
  };

  const isCloudDictInstalled = (dictId: string) => {
    return DictUtil.getDictIds().includes(dictId);
  };

  const handleDownloadCloudDict = async (dict: CloudDictItem) => {
    if (isCloudDictInstalled(dict.id)) {
      toast.success(t("Dictionary already downloaded"));
      return;
    }
    if (downloadingId) return;

    setDownloadingId(dict.id); setDownloadProgress(0);
    try {
      const success = await DictUtil.downloadCloudDict(
        dict,
        isAuthed,
        (progress) => {
          setDownloadProgress(progress);
        }
      );
      if (success) {
        loadDicts();
        handleFetchPlugins();
        toast.success(t("Download successful"));
      } else {
        toast.error(t("Download failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Download failed"));
    } finally {
      setDownloadingId(""); setDownloadProgress(0);
    }
  };

  const renderCloudDictSection = () => {
    return (
      <div className="dict-cloud-section">
        <div className="dict-cloud-section-title">
          <Trans>Download open dictionaries</Trans>
        </div>
        <div className="dict-cloud-list">
          {KookitConfig.CloudDictList.map((dict) => {
            const installed = isCloudDictInstalled(dict.id);
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
                      onClick={() => handleDownloadCloudDict(dict)}
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
                  onClick={() => handleDelete(dict)}
                >
                  <Trans>Delete</Trans>
                </span>
              </div>
            ))
          )}
        </div>

        {renderCloudDictSection()}

        {/* Import button */}
        <div
          className="setting-dialog-new-plugin"
          onClick={handleImportClick}
        >
          <span style={{ fontWeight: "bold" }}>
            <Trans>Import dictionary</Trans>
            <span>{"(MDX)"}</span>
          </span>
        </div>
      </>
  );
};

export default DictSetting;
