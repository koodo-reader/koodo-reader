import React from "react";
import "./chapterSetting.css";
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
      formSubtitle: "",
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
      formSubtitle: "",
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
      formSubtitle: parserObj?.subtitle || "",
      formRegex: parserObj?.regex || "",
    });
  };

  handleCancel = () => {
    this.setState({
      isAddNew: false,
      isEditing: false,
      editingLabel: "",
      formLabel: "",
      formSubtitle: "",
      formRegex: "",
    });
  };

  handleSave = () => {
    const { formLabel, formRegex, formSubtitle, isEditing, editingLabel } =
      this.state;
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
        { label, value: label, subtitle: formSubtitle, regex },
        "txtParsers"
      );
      if (label !== editingLabel) {
        ConfigService.setListConfig(label, "txtParserList");
      }
      toast.success(this.props.t("Modification successful"));
    } else {
      ConfigService.setObjectConfig(
        label,
        { label, value: label, subtitle: formSubtitle, regex },
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

  render() {
    const {
      parserList,
      isAddNew,
      isEditing,
      formLabel,
      formSubtitle,
      formRegex,
    } = this.state;

    return (
      <div style={{ position: "relative" }}>
        {/* Form overlay */}
        {(isAddNew || isEditing) && (
          <div className="chapter-setting-form-overlay">
            <div className="chapter-setting-form-title">
              <Trans>{isEditing ? "Edit TXT parser" : "Add TXT parser"}</Trans>
            </div>

            <div className="chapter-setting-form-row">
              <label className="chapter-setting-label">
                <Trans>Parser name</Trans>
              </label>
              <input
                className="chapter-setting-input"
                value={formLabel}
                onChange={(e) => this.setState({ formLabel: e.target.value })}
                placeholder={this.props.t("Please enter parser name")}
              />
            </div>

            <div className="chapter-setting-form-row">
              <label className="chapter-setting-label">
                <Trans>Description</Trans>
              </label>
              <input
                className="chapter-setting-input"
                value={formSubtitle}
                onChange={(e) =>
                  this.setState({ formSubtitle: e.target.value })
                }
                placeholder={this.props.t("Optional description")}
              />
            </div>

            <div className="chapter-setting-form-row">
              <label className="chapter-setting-label">
                <Trans>Parser regex</Trans>
              </label>
              <textarea
                className="chapter-setting-input"
                rows={3}
                value={formRegex}
                onChange={(e) => this.setState({ formRegex: e.target.value })}
                placeholder={this.props.t(
                  "Regex example: ^(Chapter|Part|Book|CHAPTER|PART|BOOK)\\b.*$"
                )}
              />
            </div>

            <div className="chapter-setting-form-btns">
              <button
                className="chapter-setting-cancel-btn"
                onClick={this.handleCancel}
              >
                <Trans>Cancel</Trans>
              </button>
              <button
                className="chapter-setting-save-btn"
                onClick={this.handleSave}
              >
                <Trans>{isEditing ? "Save" : "Add"}</Trans>
              </button>
            </div>
          </div>
        )}

        {/* Default parsers */}
        <div className="chapter-setting-section-title">
          <Trans>Built-in parsers</Trans>
        </div>
        <div className="chapter-setting-list">
          {DEFAULT_PARSERS.map((parser) => (
            <div className="chapter-setting-item" key={parser.label}>
              <div className="chapter-setting-item-info">
                <div className="chapter-setting-item-label">
                  <Trans>{parser.label}</Trans>
                </div>
                {parser.subtitle && (
                  <div className="chapter-setting-item-subtitle">
                    <Trans>{parser.subtitle}</Trans>
                  </div>
                )}
                {parser.regex && (
                  <div className="chapter-setting-item-regex">
                    {parser.regex}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom parsers */}
        <div className="chapter-setting-section-title">
          <Trans>Custom parsers</Trans>
        </div>
        <div className="chapter-setting-list">
          {parserList.length === 0 && (
            <div style={{ fontSize: 13, opacity: 0.4, padding: "12px 0" }}>
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
              <div className="chapter-setting-item" key={parserLabel}>
                <div className="chapter-setting-item-info">
                  <div className="chapter-setting-item-label">
                    {parserLabel}
                  </div>
                  {parserObj?.subtitle && (
                    <div className="chapter-setting-item-subtitle">
                      {parserObj.subtitle}
                    </div>
                  )}
                  {parserObj?.regex && (
                    <div className="chapter-setting-item-regex">
                      {parserObj.regex}
                    </div>
                  )}
                </div>
                <div className="chapter-setting-item-actions">
                  <button
                    className="chapter-setting-action-btn"
                    onClick={() => this.openEditForm(parserLabel)}
                  >
                    <Trans>Edit</Trans>
                  </button>
                  <button
                    className="chapter-setting-action-btn"
                    onClick={() => this.handleDelete(parserLabel)}
                  >
                    <Trans>Delete</Trans>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add button */}
        <div className="chapter-setting-add-btn" onClick={this.openAddForm}>
          <span
            className="icon-plus"
            style={{ marginRight: 6, fontSize: 14 }}
          ></span>
          <Trans>Add TXT parser</Trans>
        </div>
      </div>
    );
  }
}

export default ChapterSetting;
