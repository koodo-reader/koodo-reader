import React from "react";
import { Trans } from "react-i18next";
import { ConvertDialogProps, ConvertDialogState } from "./interface";
import { isElectron } from "react-device-detect";
import "./convertDialog.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import BookUtil from "../../../utils/file/bookUtil";
import {
  ocrEngineList,
  ocrTesseractLangList,
  paraSpacingList,
  titleSizeList,
} from "../../../constants/dropdownList";
import toast from "react-hot-toast";
import { getDefaultOcrEngine, getOcrLangList } from "../../../utils/common";
import SwitchRow from "../../readerSettings/switchRow";

class ConvertDialog extends React.Component<
  ConvertDialogProps,
  ConvertDialogState
> {
  constructor(props: ConvertDialogProps) {
    super(props);
    this.state = {
      isShowExportAll: false,
      isConvertPDF: ConfigService.getAllListConfig("convertPDFBooks").includes(
        props.currentBook?.key
      ),
    };
  }

  handleConvertToggle = () => {
    const next = !this.state.isConvertPDF;
    this.setState({ isConvertPDF: next });
    if (next) {
      ConfigService.setListConfig(this.props.currentBook.key, "convertPDFBooks");
    } else {
      ConfigService.deleteListConfig(
        this.props.currentBook.key,
        "convertPDFBooks"
      );
    }
    BookUtil.reloadBooks(this.props.currentBook);
  };

  renderSelectRow = (
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

  render() {
    const isScanned =
      this.props.currentBook.description.indexOf("scanned") > -1;
    const isDefaultOcrEngine =
      !isScanned &&
      (ConfigService.getReaderConfig("textOcrEngine") === "system-ocr" ||
        !ConfigService.getReaderConfig("textOcrEngine"));
    const ocrEngine = ConfigService.getReaderConfig(
      isScanned ? "scannedOcrEngine" : "textOcrEngine"
    );
    const filteredOcrEngineList = ocrEngineList.filter((item) => {
      if (!isElectron && isScanned) {
        return item.value !== "system-ocr";
      }
      return true;
    });

    return (
      <div
        className="sort-dialog-container scale-page-dialog-container convert-dialog-container"
        onMouseLeave={() => {
          this.props.handleConvertDialog(false);
        }}
        onMouseEnter={() => {
          this.props.handleConvertDialog(true);
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
            isEnabled={this.state.isConvertPDF}
            onClick={this.handleConvertToggle}
          />

          {this.renderSelectRow(
            "OCR engine",
            <select
              className="lang-setting-dropdown"
              value={getDefaultOcrEngine(this.props.currentBook)}
              onChange={(event) => {
                if (
                  event.target.value === "official-ai-ocr" &&
                  !this.props.isAuthed
                ) {
                  toast(
                    this.props.t("Please upgrade to Pro to use this feature")
                  );
                  this.props.handleSetting(true);
                  this.props.handleSettingMode("account");
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
                      "general"
                  );
                }
                if (
                  ConfigService.getAllListConfig("convertPDFBooks").includes(
                    this.props.currentBook.key
                  )
                ) {
                  BookUtil.reloadBooks(this.props.currentBook);
                }
                this.forceUpdate();
              }}
            >
              {filteredOcrEngineList.map((item) => (
                <option
                  value={item.value}
                  key={item.value}
                  className="lang-setting-option"
                >
                  {this.props.t(item.label) + (item.isPro ? " (Pro)" : "")}
                </option>
              ))}
            </select>
          )}

          {isDefaultOcrEngine ? (
            <>
              {this.renderSelectRow(
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
                      ).includes(this.props.currentBook.key)
                    ) {
                      BookUtil.reloadBooks(this.props.currentBook);
                    }
                    this.forceUpdate();
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
                      {this.props.t(item.label)}
                    </option>
                  ))}
                </select>,
                "When the spacing between two lines of text is n times of regular spacing, they will be split into two paragraphs"
              )}
              {this.renderSelectRow(
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
                      ).includes(this.props.currentBook.key)
                    ) {
                      BookUtil.reloadBooks(this.props.currentBook);
                    }
                    this.forceUpdate();
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
                      {this.props.t(item.label)}
                    </option>
                  ))}
                </select>,
                "When a line of text is n times the size of regular text, it will be treated as a title"
              )}
            </>
          ) : (
            this.renderSelectRow(
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
                      this.props.currentBook.key
                    )
                  ) {
                    BookUtil.reloadBooks(this.props.currentBook);
                  }
                  this.forceUpdate();
                }}
              >
                {[
                  { label: "Please select", value: "", lang: "" },
                  ...(getOcrLangList(getDefaultOcrEngine(this.props.currentBook)) ||
                    []),
                ].map((item) => (
                  <option
                    value={item.value}
                    key={item.value}
                    className="lang-setting-option"
                  >
                    {this.props.t(item.label)}
                  </option>
                ))}
              </select>
            )
          )}
        </ul>
      </div>
    );
  }
}

export default ConvertDialog;
