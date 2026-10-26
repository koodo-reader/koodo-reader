import { useTranslation } from "react-i18next";
﻿import { useReducer, useState } from "react";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import { isElectron } from "react-device-detect";
import "./convertDialog.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import BookUtil from "../../../utils/file/bookUtil";
import {
  getOcrEngineList,
  ocrTesseractLangList,
  paraSpacingList,
  titleSizeList,
} from "../../../constants/dropdownList";
import toast from "react-hot-toast";
import {
  getDefaultOcrEngine,
  getOcrLangList,
} from "../../../utils/common";
import SwitchRow from "../../readerSettings/switchRow";

const ConvertDialog = () => {
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const currentBook = useAppStore((s) => s.book.currentBook);
  const plugins = useAppStore((s) => s.manager.plugins || []);
  const handleSetting = useAppStore((s) => s.handleSetting);
  const handleConvertDialog = useAppStore((s) => s.handleConvertDialog);
  const handleSettingMode = useAppStore((s) => s.handleSettingMode);
  const handlePluginSettingTab = useAppStore((s) => s.handlePluginSettingTab);
  const { t } = useTranslation();
  const [isConvertPDF, setIsConvertPDF] = useState(
    ConfigService.getAllListConfig("convertPDFBooks").includes(
      currentBook?.key
    )
  );
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const handleConvertToggle = () => {
    const next = !isConvertPDF;
    setIsConvertPDF(next);
    if (next) {
      ConfigService.setListConfig(currentBook.key, "convertPDFBooks");
    } else {
      ConfigService.deleteListConfig(
        currentBook.key,
        "convertPDFBooks"
      );
    }
    BookUtil.reloadBooks(currentBook);
  };

  const renderSelectRow = (
    title: string,
    select: React.ReactNode,
    subtitle?: string
  ) => {
    return (
      <div className="convert-dialog-section">
        <div className="setting-dialog-new-title scale-page-preset-row">
          <span className="convert-dialog-row-title">
            <Trans>{title}</Trans>
          </span>
          {select}
        </div>
        {subtitle && (
          <p className="setting-option-subtitle">
            <Trans>{subtitle}</Trans>
          </p>
        )}
      </div>
    );
  };

  const isScanned =
      currentBook.description.indexOf("scanned") > -1;
    const isDefaultOcrEngine =
      !isScanned &&
      (ConfigService.getReaderConfig("textOcrEngine") === "system-ocr" ||
        !ConfigService.getReaderConfig("textOcrEngine"));
    const ocrEngine = ConfigService.getReaderConfig(
      isScanned ? "scannedOcrEngine" : "textOcrEngine"
    );
    const engineList = getOcrEngineList(plugins);
    const filteredOcrEngineList = engineList.filter((item) => {
      if (!isElectron && isScanned) {
        return item.value !== "system-ocr";
      }
      return true;
    });
    const ocrLangList = getOcrLangList(
      getDefaultOcrEngine(currentBook)
    );

    return (
      <div
        className="sort-dialog-container scale-page-dialog-container convert-dialog-container"
        onMouseLeave={() => {
          handleConvertDialog(false);
        }}
        onMouseEnter={() => {
          handleConvertDialog(true);
        }}
        style={{
          top: "50px",
          width: "280px",
          overflowY: "auto",
          maxHeight: "calc(100vh - 80px)",
        }}
      >
        <ul className="sort-by-category">
          <SwitchRow
            title={<Trans>Convert PDF to Text</Trans>}
            isEnabled={isConvertPDF}
            onClick={handleConvertToggle}
          />

          {renderSelectRow(
            "OCR engine",
            <select
              className="lang-setting-dropdown"
              value={getDefaultOcrEngine(currentBook)}
              onChange={(event) => {
                if (event.target.value === "add-new") {
                  handleConvertDialog(false);
                  handlePluginSettingTab("ocr");
                  handleSetting(true);
                  handleSettingMode("plugins");
                  forceUpdate();
                  return;
                }
                if (
                  event.target.value === "official-ai-ocr" &&
                  !isAuthed
                ) {
                  toast(
                    t("Please upgrade to Pro to use this feature")
                  );
                  handleSetting(true);
                  handleSettingMode("account");
                  return;
                }
                ConfigService.setReaderConfig(
                  isScanned ? "scannedOcrEngine" : "textOcrEngine",
                  event.target.value
                );
                if (event.target.value === "tesseract") {
                  ConfigService.setReaderConfig(
                    isScanned ? "scannedOcrLang" : "textOcrLang",
                    ocrTesseractLangList.find(
                      (item) =>
                        item.lang === ConfigService.getReaderConfig("lang")
                    )?.value || "chi_sim"
                  );
                } else {
                  ConfigService.setReaderConfig(
                    isScanned ? "scannedOcrLang" : "textOcrLang",
                    filteredOcrEngineList
                      .find((item) => item.value === event.target.value)?.lang ||
                      ""
                  );
                }
                if (
                  ConfigService.getAllListConfig("convertPDFBooks").includes(
                    currentBook.key
                  )
                ) {
                  BookUtil.reloadBooks(currentBook);
                }
                forceUpdate();
              }}
            >
              {filteredOcrEngineList.map((item) => (
                <option
                  value={item.value}
                  key={item.value}
                  className="lang-setting-option"
                >
                  {t(item.label) + (item.isPro ? " (Pro)" : "")}
                </option>
              ))}
              <option
                value="add-new"
                key="add-new"
                className="lang-setting-option"
              >
                {t("Add new plugin")}
              </option>
            </select>
          )}

          {isDefaultOcrEngine ? (
            <>
              {renderSelectRow(
                "Paragraph spacing threshold",
                <select
                  className="lang-setting-dropdown"
                  value={
                    ConfigService.getReaderConfig("paraSpacingValue") || "1.5"
                  }
                  onChange={(event) => {
                    ConfigService.setReaderConfig(
                      "paraSpacingValue",
                      event.target.value
                    );
                    if (
                      ConfigService.getAllListConfig(
                        "convertPDFBooks"
                      ).includes(currentBook.key)
                    ) {
                      BookUtil.reloadBooks(currentBook);
                    }
                    forceUpdate();
                  }}
                >
                  {[
                    { label: "Please select", value: "" },
                    ...paraSpacingList,
                  ].map((item) => (
                    <option
                      value={item.value}
                      key={item.value}
                      className="lang-setting-option"
                    >
                      {t(item.label)}
                    </option>
                  ))}
                </select>,
                "When the spacing between two lines of text is n times of regular spacing, they will be split into two paragraphs"
              )}
              {renderSelectRow(
                "Title size threshold",
                <select
                  className="lang-setting-dropdown"
                  value={
                    ConfigService.getReaderConfig("titleSizeValue") || "1.2"
                  }
                  onChange={(event) => {
                    ConfigService.setReaderConfig(
                      "titleSizeValue",
                      event.target.value
                    );
                    if (
                      ConfigService.getAllListConfig(
                        "convertPDFBooks"
                      ).includes(currentBook.key)
                    ) {
                      BookUtil.reloadBooks(currentBook);
                    }
                    forceUpdate();
                  }}
                >
                  {[
                    { label: "Please select", value: "" },
                    ...titleSizeList,
                  ].map((item) => (
                    <option
                      value={item.value}
                      key={item.value}
                      className="lang-setting-option"
                    >
                      {t(item.label)}
                    </option>
                  ))}
                </select>,
                "When a line of text is n times the size of regular text, it will be treated as a title"
              )}
            </>
          ) : ocrLangList.length > 0 ? (
            renderSelectRow(
              ocrEngine === "official-ai-ocr"
                ? "Set OCR mode"
                : "Set OCR language",
              <select
                className="lang-setting-dropdown"
                value={(() => {
                  const ocrLang = ConfigService.getReaderConfig(
                    isScanned ? "scannedOcrLang" : "textOcrLang"
                  );
                  if (ocrLang) return ocrLang;
                  const currentLang = ConfigService.getReaderConfig("lang");
                  const match = getOcrLangList(ocrEngine).find(
                    (o: any) => o.lang === currentLang
                  );
                  return match ? match.value : "";
                })()}
                onChange={(event) => {
                  ConfigService.setReaderConfig(
                    isScanned ? "scannedOcrLang" : "textOcrLang",
                    event.target.value
                  );
                  if (
                    ConfigService.getAllListConfig("convertPDFBooks").includes(
                      currentBook.key
                    )
                  ) {
                    BookUtil.reloadBooks(currentBook);
                  }
                  forceUpdate();
                }}
              >
                {[
                  { label: "Please select", value: "", lang: "" },
                  ...ocrLangList,
                ].map((item) => (
                  <option
                    value={item.value}
                    key={item.value}
                    className="lang-setting-option"
                  >
                    {t(item.label)}
                  </option>
                ))}
              </select>
            )
          ) : null}
        </ul>
      </div>
  );
};

export default ConvertDialog;

