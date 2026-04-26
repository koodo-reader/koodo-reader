import React from "react";
import { SettingInfoProps, SettingInfoState, TxtParser } from "./interface";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

const DEFAULT_PARSERS: TxtParser[] = [
  {
    label: "Default parser",
    value: "Default parser",
    subtitle: "Suitable for most txt files",
    regex: "",
  },
  {
    label: "Chinese novel parser",
    value: "Chinese novel parser",
    subtitle: "Suitable for most Chinese novels, eg. 第一章，第2回",
    regex: String.raw`^\s*(第[0-9一二三四五六七八九十百千万零]+[章回])\s*(.*?)$`,
  },
  {
    label: "English novel parser",
    value: "English novel parser",
    subtitle: "Suitable for most English novels, eg. Chapter 1, Part II",
    regex: String.raw`^(Chapter|Part|Book|CHAPTER|PART|BOOK)\b.*$`,
  },
];

class ChapterSetting extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      parserList: ConfigService.getAllListConfig("txtParserList") || [],
      isAddNew: false,
      isEditing: false,
      editingLabel: "",
      formLabel: "",
      formRegex: "",
    };
  }

  fetchParserList = () => {
    this.setState({
      parserList: ConfigService.getAllListConfig("txtParserList") || [],
    });
  };

  openAddForm = () => {
    this.setState({
      isAddNew: true,
      isEditing: false,
      editingLabel: "",
      formLabel: "",
      formRegex: "",
    });
  };

  openEditForm = (parserLabel: string) => {
    const parserObj = ConfigService.getObjectConfig(
      parserLabel,
      "txtParsers",
      null
    ) as TxtParser | null;
    this.setState({
      isAddNew: false,
      isEditing: true,
      editingLabel: parserLabel,
      formLabel: parserObj?.label || parserLabel,
      formRegex: parserObj?.regex || "",
    });
    const infoEl = document.querySelector(".setting-dialog-info");
    if (infoEl) infoEl.scrollTop = 0;
  };

  handleCancel = () => {
    this.setState({
      isAddNew: false,
      isEditing: false,
      editingLabel: "",
      formLabel: "",
      formRegex: "",
    });
  };

  handleSave = () => {
    const { formLabel, formRegex, isEditing, editingLabel } = this.state;
    const label = formLabel.trim();
    const regex = formRegex.trim();

    if (!label) {
      toast.error(this.props.t("Please enter parser name"));
      return;
    }
    if (!regex) {
      toast.error(this.props.t("Please enter parser regex"));
      return;
    }

    // Check duplicate label
    if (!isEditing || label !== editingLabel) {
      const existingList =
        ConfigService.getAllListConfig("txtParserList") || [];
      if (existingList.includes(label)) {
        toast.error(this.props.t("Parser name already exists"));
        return;
      }
    }

    if (isEditing && editingLabel) {
      if (label !== editingLabel) {
        ConfigService.deleteListConfig(editingLabel, "txtParserList");
        ConfigService.setObjectConfig(editingLabel, null, "txtParsers");
      }
      ConfigService.setObjectConfig(
        label,
        { label, value: label, regex },
        "txtParsers"
      );
      if (label !== editingLabel) {
        ConfigService.setListConfig(label, "txtParserList");
      }
      toast.success(this.props.t("Modification successful"));
    } else {
      ConfigService.setObjectConfig(
        label,
        { label, value: label, regex },
        "txtParsers"
      );
      ConfigService.setListConfig(label, "txtParserList");
      toast.success(this.props.t("Addition successful"));
    }

    this.fetchParserList();
    this.handleCancel();
  };

  handleDelete = (parserLabel: string) => {
    ConfigService.deleteListConfig(parserLabel, "txtParserList");
    ConfigService.setObjectConfig(parserLabel, null, "txtParsers");
    this.fetchParserList();
    toast.success(this.props.t("Deletion successful"));
  };

  renderForm = () => {
    const { isEditing, formLabel, formRegex } = this.state;
    return (
      <div
        className="voice-add-new-container"
        style={{
          marginLeft: "25px",
          width: "calc(100% - 50px)",
          fontWeight: 500,
        }}
      >
        <div className="ai-setting-form-row">
          <label className="ai-setting-label">
            <Trans>Parser name</Trans>
          </label>
          <input
            type="text"
            className="token-dialog-username-box"
            placeholder={this.props.t("Please enter parser name")}
            value={formLabel}
            onChange={(e) => this.setState({ formLabel: e.target.value })}
          />
        </div>

        <div className="ai-setting-form-row">
          <label className="ai-setting-label">
            <Trans>Parser regex</Trans>
          </label>
          <input
            type="text"
            className="token-dialog-username-box"
            placeholder={this.props.t(
              "Regex example: ^(Chapter|Part|Book|CHAPTER|PART|BOOK)\\b.*$"
            )}
            value={formRegex}
            onChange={(e) => this.setState({ formRegex: e.target.value })}
          />
        </div>

        <div className="token-dialog-button-container">
          <div className="voice-add-confirm" onClick={this.handleSave}>
            <Trans>{isEditing ? "Save" : "Add"}</Trans>
          </div>
          <div className="voice-add-button-container">
            <div className="voice-add-cancel" onClick={this.handleCancel}>
              <Trans>Cancel</Trans>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { parserList, isAddNew, isEditing } = this.state;

    return (
      <>
        {(isAddNew || isEditing) && this.renderForm()}

        <div
          style={{
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "20px",
            marginLeft: "20px",
            marginTop: "20px",
          }}
        >
          <Trans>Built-in parsers</Trans>
        </div>

        {DEFAULT_PARSERS.map((parser) => (
          <div
            className="setting-dialog-new-title"
            key={parser.label}
            style={{
              marginLeft: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <p>
              <span className="setting-plugin-name">
                <Trans>{parser.label}</Trans>
              </span>
              {parser.subtitle && (
                <span
                  style={{
                    opacity: 0.6,
                    marginLeft: "8px",
                    fontSize: "12px",
                  }}
                >
                  (<Trans>{parser.subtitle}</Trans>)
                </span>
              )}
            </p>
            {parser.regex && (
              <p
                style={{
                  fontSize: "11px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: "-10px",
                  opacity: 0.7,
                }}
              >
                {parser.regex}
              </p>
            )}
          </div>
        ))}

        <div
          style={{
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "20px",
            marginLeft: "20px",
            marginTop: "20px",
          }}
        >
          <Trans>Custom parsers</Trans>
        </div>

        {parserList.length === 0 && (
          <div
            style={{
              textAlign: "center",
              opacity: 0.5,
              padding: "20px 0",
              fontSize: "14px",
            }}
          >
            <Trans>No custom parsers added</Trans>
          </div>
        )}

        {parserList.map((parserLabel) => {
          const parserObj = ConfigService.getObjectConfig(
            parserLabel,
            "txtParsers",
            null
          ) as TxtParser | null;
          return (
            <div
              className="setting-dialog-new-title"
              key={parserLabel}
              style={{ marginLeft: "15px" }}
            >
              <span>
                <span className="setting-plugin-name">{parserLabel}</span>
                {parserObj?.subtitle && (
                  <span
                    style={{
                      opacity: 0.6,
                      marginLeft: "8px",
                      fontSize: "12px",
                    }}
                  >
                    ({parserObj.subtitle})
                  </span>
                )}
              </span>
              <span
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <span
                  className="change-location-button"
                  onClick={() => this.openEditForm(parserLabel)}
                >
                  <Trans>Edit</Trans>
                </span>
                <span
                  className="change-location-button"
                  onClick={() => this.handleDelete(parserLabel)}
                >
                  <Trans>Delete</Trans>
                </span>
              </span>
            </div>
          );
        })}

        <div className="setting-dialog-new-plugin">
          <span
            style={{ fontWeight: "bold" }}
            onClick={() => {
              const infoEl = document.querySelector(".setting-dialog-info");
              this.setState(
                {
                  isAddNew: true,
                  isEditing: false,
                  editingLabel: "",
                  formLabel: "",
                  formRegex: "",
                },
                () => {
                  if (infoEl) infoEl.scrollTop = 0;
                }
              );
            }}
          >
            <Trans>Add TXT parser</Trans>
          </span>
        </div>
      </>
    );
  }
}

export default ChapterSetting;
