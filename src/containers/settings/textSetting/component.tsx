import React from "react";
import { TextRule, TextSettingProps, TextSettingState } from "./interface";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import {
  ConfigService,
  KookitConfig,
  HighlightUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import BookUtil from "../../../utils/file/bookUtil";

const HIGHLIGHT_STYLE_TYPES = KookitConfig.HighlightStyleTypes;
const HIGHLIGHT_PRESET_COLORS = KookitConfig.HighlightPresetColors;

class TextSetting extends React.Component<TextSettingProps, TextSettingState> {
  highlightUtil: any;
  constructor(props: TextSettingProps) {
    super(props);
    this.highlightUtil = new HighlightUtil(ConfigService);
    this.state = {
      ruleList: ConfigService.getAllListConfig("textRuleList") || [],
      bookNamesMap: {},
      isFormOpen: false,
      isEditing: false,
      editingId: "",
      formType: "replace",
      formPattern: "",
      formReplacement: "",
      formMatchType: "plain",
      formScope: "all",
      formBookKey: "",
      formHighlightStyle: "background",
      formHighlightColor: "#F3C9C9",
    };
  }

  componentDidMount(): void {
    this.loadBookNamesMap();
  }

  componentDidUpdate(prevProps: TextSettingProps): void {
    if (prevProps.books !== this.props.books) {
      this.loadBookNamesMap();
    }
  }

  getBookKeys = () => {
    const bookKeys = (this.props.books || []).map((book) => book.key);
    const ruleBookKeys = (ConfigService.getAllListConfig("textRuleList") || [])
      .map((id) => this.getRule(id))
      .filter(
        (rule): rule is TextRule =>
          !!rule && rule.scope === "book" && !!rule.bookKey
      )
      .map((rule) => rule.bookKey as string);
    return Array.from(new Set([...bookKeys, ...ruleBookKeys]));
  };

  loadBookNamesMap = async () => {
    const bookKeys = this.getBookKeys();
    if (bookKeys.length === 0) {
      this.setState({ bookNamesMap: {} });
      return;
    }
    const bookNamesMap = await BookUtil.getBookNamesMapByKeys(bookKeys);
    this.setState({ bookNamesMap });
  };

  fetchRuleList = () => {
    this.setState({
      ruleList: ConfigService.getAllListConfig("textRuleList") || [],
    });
    this.loadBookNamesMap();
  };

  getRule = (ruleId: string): TextRule | null => {
    return ConfigService.getObjectConfig(
      ruleId,
      "textRules",
      null
    ) as TextRule | null;
  };

  scrollFormToTop = () => {
    const infoEl = document.querySelector(".setting-dialog-info");
    if (infoEl) infoEl.scrollTop = 0;
  };

  resetForm = () => {
    this.setState({
      isFormOpen: false,
      isEditing: false,
      editingId: "",
      formType: "replace",
      formPattern: "",
      formReplacement: "",
      formMatchType: "plain",
      formScope: "all",
      formBookKey: "",
      formHighlightStyle: "background",
      formHighlightColor: "#F3C9C9",
    });
  };

  openAddForm = (type: "replace" | "delete" | "highlight") => {
    this.setState(
      {
        isFormOpen: true,
        isEditing: false,
        editingId: "",
        formType: type,
        formPattern: "",
        formReplacement: "",
        formMatchType: "plain",
        formScope: "all",
        formBookKey: "",
        formHighlightStyle: "background",
        formHighlightColor: "#F3C9C9",
      },
      () => this.scrollFormToTop()
    );
  };

  openEditForm = (ruleId: string) => {
    const rule = this.getRule(ruleId);
    if (!rule) return;
    this.setState(
      {
        isFormOpen: true,
        isEditing: true,
        editingId: ruleId,
        formType: rule.type,
        formPattern: rule.pattern,
        formReplacement: rule.replacement || "",
        formMatchType: rule.matchType,
        formScope: rule.scope,
        formBookKey: rule.bookKey || "",
        formHighlightStyle: rule.highlightStyle || "background",
        formHighlightColor: rule.highlightColor || "#F3C9C9",
      },
      () => this.scrollFormToTop()
    );
  };

  handleCancel = () => {
    this.resetForm();
  };

  validateRegex = (pattern: string): boolean => {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  };

  handleSave = () => {
    const {
      formType,
      formPattern,
      formReplacement,
      formMatchType,
      formScope,
      formBookKey,
      isEditing,
      editingId,
      bookNamesMap,
      formHighlightStyle,
      formHighlightColor,
    } = this.state;

    const pattern = formPattern.trim();
    const replacement = formReplacement.trim();

    if (!pattern) {
      toast.error(this.props.t("Please enter match pattern"));
      return;
    }
    if (formType === "replace" && !replacement) {
      toast.error(this.props.t("Please enter replacement"));
      return;
    }
    if (formScope === "book" && !formBookKey) {
      toast.error(this.props.t("Please select a book"));
      return;
    }
    if (formMatchType === "regex" && !this.validateRegex(pattern)) {
      toast.error(this.props.t("Invalid regex pattern"));
      return;
    }

    const selectedBookName = bookNamesMap[formBookKey];
    const rule: TextRule = {
      id: isEditing && editingId ? editingId : `${Date.now()}`,
      type: formType,
      pattern,
      matchType: formMatchType,
      scope: formScope,
    };

    if (formType === "replace") {
      rule.replacement = replacement;
    }
    if (formType === "highlight") {
      rule.highlightStyle = formHighlightStyle;
      rule.highlightColor = formHighlightColor;
    }
    if (formScope === "book") {
      rule.bookKey = formBookKey;
      rule.bookName = selectedBookName || "";
    }

    if (isEditing && editingId) {
      ConfigService.setObjectConfig(editingId, rule, "textRules");
      toast.success(this.props.t("Modification successful"));
    } else {
      ConfigService.setObjectConfig(rule.id, rule, "textRules");
      ConfigService.setListConfig(rule.id, "textRuleList");
      toast.success(this.props.t("Addition successful"));
    }

    this.fetchRuleList();
    this.resetForm();
  };

  handleDelete = (ruleId: string) => {
    ConfigService.deleteListConfig(ruleId, "textRuleList");
    ConfigService.setObjectConfig(ruleId, null, "textRules");
    this.fetchRuleList();
    toast.success(this.props.t("Deletion successful"));
  };

  renderScopeLabel = (rule: TextRule) => {
    if (rule.scope === "book" && rule.bookName) {
      return rule.bookName;
    }
    return this.props.t("All books");
  };

  renderMatchTypeLabel = (matchType: string) => {
    return matchType === "regex"
      ? this.props.t("Regular expression")
      : this.props.t("Plain text");
  };

  renderForm = () => {
    const {
      isEditing,
      formType,
      formPattern,
      formReplacement,
      formMatchType,
      formScope,
      formBookKey,
      bookNamesMap,
      formHighlightStyle,
      formHighlightColor,
    } = this.state;

    const scopeValue = formScope === "all" ? "all" : formBookKey;
    const bookKeys = (this.props.books || []).map((book) => book.key);
    const presetColors =
      HIGHLIGHT_PRESET_COLORS[formHighlightStyle] ||
      HIGHLIGHT_PRESET_COLORS["background"];

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
            <Trans>Match type</Trans>
          </label>
          <select
            className="lang-setting-dropdown"
            value={formMatchType}
            onChange={(e) =>
              this.setState({
                formMatchType: e.target.value as "regex" | "plain",
              })
            }
          >
            <option value="plain" className="lang-setting-option">
              {this.props.t("Plain text")}
            </option>
            <option value="regex" className="lang-setting-option">
              {this.props.t("Regular expression")}
            </option>
          </select>
        </div>

        <div className="ai-setting-form-row">
          <label className="ai-setting-label">
            <Trans>Match pattern</Trans>
          </label>
          <input
            type="text"
            className="token-dialog-username-box"
            placeholder={this.props.t("Please enter match pattern")}
            value={formPattern}
            onChange={(e) => this.setState({ formPattern: e.target.value })}
          />
        </div>

        {formType === "replace" && (
          <div className="ai-setting-form-row">
            <label className="ai-setting-label">
              <Trans>Replacement</Trans>
            </label>
            <input
              type="text"
              className="token-dialog-username-box"
              placeholder={this.props.t("Please enter replacement")}
              value={formReplacement}
              onChange={(e) =>
                this.setState({ formReplacement: e.target.value })
              }
            />
          </div>
        )}

        {formType === "highlight" && (
          <>
            <div className="ai-setting-form-row">
              <label className="ai-setting-label">
                <Trans>Highlight style</Trans>
              </label>
            </div>
            <ul
              className="tts-highlight-style-tabs"
              style={{ marginLeft: "-10px", marginTop: "8px" }}
            >
              {HIGHLIGHT_STYLE_TYPES.map(
                (item: { value: string; label: string }) => {
                  const previewColor =
                    item.value === formHighlightStyle
                      ? formHighlightColor
                      : HIGHLIGHT_PRESET_COLORS[item.value][0];
                  return (
                    <li
                      key={item.value}
                      className={
                        formHighlightStyle === item.value
                          ? "tts-highlight-style-tab active-tts-highlight-tab"
                          : "tts-highlight-style-tab"
                      }
                      onClick={() => {
                        const color = HIGHLIGHT_PRESET_COLORS[item.value][0];
                        this.setState({
                          formHighlightStyle: item.value,
                          formHighlightColor: color,
                        });
                      }}
                    >
                      <span
                        className="tts-highlight-style-preview"
                        style={this.highlightUtil.buildHighlightPreviewStyle(
                          item.value,
                          previewColor
                        )}
                      >
                        Aa
                      </span>
                      <span className="tts-highlight-style-label">
                        <Trans>{item.label}</Trans>
                      </span>
                    </li>
                  );
                }
              )}
            </ul>
            <ul
              className="tts-highlight-color-container"
              style={{ marginLeft: "10px" }}
            >
              {presetColors.map((color: string, index: number) => (
                <li
                  key={color}
                  className={
                    presetColors.indexOf(formHighlightColor) === index
                      ? "tts-highlight-color-item active-tts-highlight-color"
                      : "tts-highlight-color-item"
                  }
                  style={{ backgroundColor: color }}
                  onClick={() => this.setState({ formHighlightColor: color })}
                />
              ))}
            </ul>
          </>
        )}

        <div className="ai-setting-form-row">
          <label className="ai-setting-label">
            <Trans>Scope</Trans>
          </label>
          <select
            className="lang-setting-dropdown"
            value={scopeValue}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "all") {
                this.setState({ formScope: "all", formBookKey: "" });
              } else {
                this.setState({ formScope: "book", formBookKey: value });
              }
            }}
          >
            <option value="all" className="lang-setting-option">
              {this.props.t("All books")}
            </option>
            {bookKeys.map((bookKey) => (
              <option
                key={bookKey}
                value={bookKey}
                className="lang-setting-option"
              >
                {bookNamesMap[bookKey] || bookKey}
              </option>
            ))}
          </select>
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

  renderRuleList = (
    type: "replace" | "delete" | "highlight",
    emptyMessage: string
  ) => {
    const { ruleList } = this.state;
    const rules = ruleList
      .map((id) => this.getRule(id))
      .filter((rule): rule is TextRule => !!rule && rule.type === type);

    return (
      <>
        {rules.length === 0 && (
          <div
            style={{
              textAlign: "center",
              opacity: 0.5,
              padding: "20px 0",
              fontSize: "14px",
            }}
          >
            <Trans>{emptyMessage}</Trans>
          </div>
        )}

        {rules.map((rule) => (
          <div
            className="setting-dialog-new-title"
            key={rule.id}
            style={{
              marginLeft: "20px",
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.25,
              marginTop: "10px",
            }}
          >
            <p
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p>
                <span className="setting-plugin-name">{rule.pattern}</span>
                <span
                  style={{
                    opacity: 0.6,
                    marginLeft: "8px",
                    fontSize: "12px",
                  }}
                >
                  ({this.renderMatchTypeLabel(rule.matchType)})
                </span>
              </p>
              <p
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <span
                  className="change-location-button"
                  onClick={() => this.openEditForm(rule.id)}
                >
                  <Trans>Edit</Trans>
                </span>
                <span
                  className="change-location-button"
                  onClick={() => this.handleDelete(rule.id)}
                >
                  <Trans>Delete</Trans>
                </span>
              </p>
            </p>
            <p
              style={{
                fontSize: "11px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: "5px",
                opacity: 0.7,
                zIndex: -1,
              }}
            >
              {type === "replace" && rule.replacement !== undefined && (
                <span>
                  {this.props.t("Replacement")}: {rule.replacement} ·{" "}
                </span>
              )}
              {type === "highlight" &&
                rule.highlightStyle &&
                rule.highlightColor && (
                  <span>
                    <span
                      style={{
                        ...this.highlightUtil.buildHighlightPreviewStyle(
                          rule.highlightStyle,
                          rule.highlightColor
                        ),
                        padding: "0 4px",
                        marginRight: "4px",
                      }}
                    >
                      Aa
                    </span>
                    {this.props.t("Highlight style")}: {rule.highlightStyle}{" "}
                    ·{" "}
                  </span>
                )}
            </p>
            <p
              style={{
                fontSize: "11px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: "5px",
                opacity: 0.7,
                zIndex: -1,
              }}
            >
              {this.props.t("Scope")}: {this.renderScopeLabel(rule)}
            </p>
          </div>
        ))}
      </>
    );
  };

  render() {
    const { isFormOpen } = this.state;

    return (
      <>
        {isFormOpen && this.renderForm()}

        <div
          style={{
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "20px",
            marginLeft: "20px",
            marginTop: "20px",
          }}
        >
          <Trans>Replace rules</Trans>
        </div>
        {this.renderRuleList("replace", "No replace rules added")}

        <div
          style={{
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "20px",
            marginLeft: "20px",
            marginTop: "20px",
          }}
        >
          <Trans>Delete rules</Trans>
        </div>
        {this.renderRuleList("delete", "No delete rules added")}

        <div
          style={{
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "20px",
            marginLeft: "20px",
            marginTop: "20px",
          }}
        >
          <Trans>Highlight rules</Trans>
        </div>
        {this.renderRuleList("highlight", "No highlight rules added")}

        <div
          className="setting-dialog-new-plugin"
          style={{ display: "flex", gap: "16px" }}
        >
          <span
            style={{ fontWeight: "bold" }}
            onClick={() => this.openAddForm("replace")}
          >
            <Trans>Add replace rule</Trans>
          </span>
          <span
            style={{ fontWeight: "bold" }}
            onClick={() => this.openAddForm("delete")}
          >
            <Trans>Add delete rule</Trans>
          </span>
          <span
            style={{ fontWeight: "bold" }}
            onClick={() => this.openAddForm("highlight")}
          >
            <Trans>Add highlight rule</Trans>
          </span>
        </div>
      </>
    );
  }
}

export default TextSetting;
