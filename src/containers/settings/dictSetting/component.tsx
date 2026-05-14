import React from "react";
import "./dictSetting.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import DictUtil, { DictMeta } from "../../../utils/file/dictUtil";

class DictSetting extends React.Component<SettingInfoProps, SettingInfoState> {
  fileInputRef = React.createRef<HTMLInputElement>();

  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      dicts: [],
      isLoading: true,
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

  handleImportClick = () => {
    this.fileInputRef.current?.click();
  };

  handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = "";

    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const arrayBuffer = ev.target?.result as ArrayBuffer;
      if (!arrayBuffer) return;

      const id = Date.now().toString();
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const meta: Omit<DictMeta, "id"> = {
        name: fileNameWithoutExt,
        extension: ext,
      };

      try {
        await DictUtil.saveDict(id, file.name, arrayBuffer);
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
    reader.readAsArrayBuffer(file);
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

        {/* Hidden file input */}
        <input
          ref={this.fileInputRef}
          type="file"
          accept=".mdx"
          style={{ display: "none" }}
          onChange={this.handleFileChange}
        />

        {/* Import button */}
        <div
          className="setting-dialog-new-plugin"
          onClick={this.handleImportClick}
        >
          <span style={{ fontWeight: "bold" }}>
            <Trans>Import dictionary</Trans>
          </span>
        </div>
      </>
    );
  }
}

export default DictSetting;
