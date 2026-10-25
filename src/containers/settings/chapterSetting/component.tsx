import { useTranslation } from "react-i18next";
import { useState } from "react";
import "./chapterSetting.css";
import { SettingInfoProps, SettingInfoState, TxtParser } from "./interface";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";

const ChapterSetting = (props: SettingInfoProps) => {
  const { t } = useTranslation();
  const [state, setState] = useState<SettingInfoState>({
    parserList: ConfigService.getAllListConfig("txtParserList") || [],
    isAddNew: false,
    isEditing: false,
    editingLabel: "",
    formLabel: "",
    formRegex: "",
  });

  const mergeState = (patch: Partial<SettingInfoState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  const scrollInfoToTop = () => {
    const infoEl = document.querySelector(".setting-dialog-info");
    if (infoEl) infoEl.scrollTop = 0;
  };

  const fetchParserList = () => {
    mergeState({
      parserList: ConfigService.getAllListConfig("txtParserList") || [],
    });
  };

  const openAddForm = () => {
    mergeState({
      isAddNew: true,
      isEditing: false,
      editingLabel: "",
      formLabel: "",
      formRegex: "",
    });
    scrollInfoToTop();
  };

  const openEditForm = (parserLabel: string) => {
    const parserObj = ConfigService.getObjectConfig(
      parserLabel,
      "txtParsers",
      null
    ) as TxtParser | null;
    mergeState({
      isAddNew: false,
      isEditing: true,
      editingLabel: parserLabel,
      formLabel: parserObj?.label || parserLabel,
      formRegex: parserObj?.regex || "",
    });
    scrollInfoToTop();
  };

  const handleCancel = () => {
    mergeState({
      isAddNew: false,
      isEditing: false,
      editingLabel: "",
      formLabel: "",
      formRegex: "",
    });
  };

  const handleSave = () => {
    const { formLabel, formRegex, isEditing, editingLabel } = state;
    const label = formLabel.trim();
    const regex = formRegex.trim();

    if (!label) {
      toast.error(t("Please enter parser name"));
      return;
    }
    if (!regex) {
      toast.error(t("Please enter parser regex"));
      return;
    }

    // Check duplicate label
    if (!isEditing || label !== editingLabel) {
      const existingList =
        ConfigService.getAllListConfig("txtParserList") || [];
      if (existingList.includes(label)) {
        toast.error(t("Parser name already exists"));
        return;
      }
    }

    if (isEditing && editingLabel) {
      if (label !== editingLabel) {
        ConfigService.deleteListConfig(editingLabel, "txtParserList");
        ConfigService.deleteObjectConfig(editingLabel, "txtParsers");
      }
      ConfigService.setObjectConfig(
        label,
        { label, value: label, regex },
        "txtParsers"
      );
      if (label !== editingLabel) {
        ConfigService.setListConfig(label, "txtParserList");
      }
      toast.success(t("Modification successful"));
    } else {
      ConfigService.setObjectConfig(
        label,
        { label, value: label, regex },
        "txtParsers"
      );
      ConfigService.setListConfig(label, "txtParserList");
      toast.success(t("Addition successful"));
    }

    fetchParserList();
    handleCancel();
  };

  const handleDelete = (parserLabel: string) => {
    ConfigService.deleteListConfig(parserLabel, "txtParserList");
    ConfigService.deleteObjectConfig(parserLabel, "txtParsers");
    fetchParserList();
    toast.success(t("Deletion successful"));
  };

  const renderForm = () => {
    const { isEditing, formLabel, formRegex } = state;
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
            placeholder={t("Please enter parser name")}
            value={formLabel}
            onChange={(e) => mergeState({ formLabel: e.target.value })}
          />
        </div>

        <div className="ai-setting-form-row">
          <label className="ai-setting-label">
            <Trans>Parser regex</Trans>
          </label>
          <input
            type="text"
            className="token-dialog-username-box"
            placeholder={t(
              "Regex example: ^(Chapter|Part|Book|CHAPTER|PART|BOOK)\\b.*$"
            )}
            value={formRegex}
            onChange={(e) => mergeState({ formRegex: e.target.value })}
          />
        </div>

        <div className="token-dialog-button-container">
          <div className="voice-add-confirm" onClick={handleSave}>
            <Trans>{isEditing ? "Save" : "Add"}</Trans>
          </div>
          <div className="voice-add-button-container">
            <div className="voice-add-cancel" onClick={handleCancel}>
              <Trans>Cancel</Trans>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const { parserList, isAddNew, isEditing } = state;

  return (
    <>
      {(isAddNew || isEditing) && renderForm()}

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

      {KookitConfig.ContentRegxConfig.map((parser) => (
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
            style={{ marginLeft: "20px" }}
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
                onClick={() => openEditForm(parserLabel)}
              >
                <Trans>Edit</Trans>
              </span>
              <span
                className="change-location-button"
                onClick={() => handleDelete(parserLabel)}
              >
                <Trans>Delete</Trans>
              </span>
            </span>
          </div>
        );
      })}

      <div className="setting-dialog-new-plugin">
        <span style={{ fontWeight: "bold" }} onClick={openAddForm}>
          <Trans>Add TXT parser</Trans>
        </span>
      </div>
    </>
  );
};

export default ChapterSetting;
