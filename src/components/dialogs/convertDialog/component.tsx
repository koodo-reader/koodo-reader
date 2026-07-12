import React from "react";
import { Trans } from "react-i18next";
import { ConvertDialogProps, ConvertDialogState } from "./interface";
import { isElectron } from "react-device-detect";
import "./convertDialog.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import BookUtil from "../../../utils/file/bookUtil";
import {
  getOcrPaddleLangList,
  ocrEngineList,
  ocrTesseractLangList,
  paraSpacingList,
  titleSizeList,
} from "../../../constants/dropdownList";
import toast from "react-hot-toast";

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
  getLangList = (engine: string) => {
    let list: any[];
    if (engine === "tesseract") {
      list = ocrTesseractLangList;
    } else if (engine === "official-ai-ocr") {
      list = [
        {
          label: "General",
          value: "general",
          lang: "general",
        },
        {
          label: "Accurate",
          value: "accurate",
          lang: "accurate",
        },
      ];
    } else if (engine === "mineru-official-agent") {
      list = [
        {
          label: "General",
          value: "general",
          lang: "general",
        },
      ];
    } else if (engine === "system-ocr") {
      list = [
        {
          label: "Auto",
          value: "auto",
          lang: "auto",
        },
      ];
    } else {
      list = getOcrPaddleLangList();
    }
    return list;
  };
  renderSwitchOption = (optionList: any[]) => {
    return optionList.map((item) => {
      return (
        <div
          style={item.isElectron ? (isElectron ? {} : { display: "none" }) : {}}
          key={item.propName}
        >
          <div
            className="setting-dialog-new-title"
            key={item.title}
            style={{ marginLeft: 10, width: "calc(100% - 20px)" }}
          >
            <span style={{ width: "calc(100% - 50px)" }}>
              <Trans>{item.title}</Trans>
            </span>

            <span
              className="single-control-switch"
              onClick={() => {
                const newValue = !this.state[item.propName];
                this.setState({
                  [item.propName]: newValue,
                } as any);
                if (item.propName === "isConvertPDF") {
                  if (newValue) {
                    ConfigService.setListConfig(
                      this.props.currentBook.key,
                      "convertPDFBooks"
                    );
                  } else {
                    ConfigService.deleteListConfig(
                      this.props.currentBook.key,
                      "convertPDFBooks"
                    );
                  }
                } else {
                  ConfigService.setReaderConfig(
                    item.propName,
                    this.state[item.propName] ? "no" : "yes"
                  );
                }
                BookUtil.reloadBooks(this.props.currentBook);
              }}
              style={this.state[item.propName] ? {} : { opacity: 0.6 }}
            >
              <span
                className="single-control-button"
                style={
                  this.state[item.propName]
                    ? {
                        transform: "translateX(20px)",
                        transition: "transform 0.5s ease",
                      }
                    : {
                        transform: "translateX(0px)",
                        transition: "transform 0.5s ease",
                      }
                }
              ></span>
            </span>
          </div>
          <p className="setting-option-subtitle">
            <Trans>{item.desc}</Trans>
          </p>
        </div>
      );
    });
  };
  render() {
    return (
      <>
        <div
          className="sort-dialog-container"
          onMouseLeave={() => {
            this.props.handleConvertDialog(false);
          }}
          onMouseEnter={() => {
            this.props.handleConvertDialog(true);
          }}
          style={{
            left: "auto",
            top: "50px",
            width: "240px",
            right: this.props.isSettingLocked ? 325 : 20,
          }}
        >
          <ul className="sort-by-category">
            {this.renderSwitchOption([
              {
                isElectron: false,
                title: "Convert PDF to Text",
                desc: "",
                propName: "isConvertPDF",
              },
            ])}

            <div
              className="setting-dialog-new-title"
              style={{
                marginLeft: 10,
                width: "calc(100% - 20px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <Trans>OCR engine</Trans>

              <select
                name=""
                className="lang-setting-dropdown"
                value={
                  ConfigService.getReaderConfig(
                    this.props.currentBook.description.indexOf("scanned") > -1
                      ? "scannedOcrEngine"
                      : "textOcrEngine"
                  ) ||
                  (this.props.currentBook.description.indexOf("scanned") > -1
                    ? "paddle"
                    : "system-ocr")
                }
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
                    this.props.currentBook.description.indexOf("scanned") > -1
                      ? "scannedOcrEngine"
                      : "textOcrEngine",
                    event.target.value
                  );
                  if (event.target.value === "tesseract") {
                    ConfigService.setReaderConfig(
                      this.props.currentBook.description.indexOf("scanned") > -1
                        ? "scannedOcrLang"
                        : "textOcrLang",
                      ocrTesseractLangList.find(
                        (item) =>
                          item.lang === ConfigService.getReaderConfig("lang")
                      )?.value || "chi_sim"
                    );
                  } else {
                    ConfigService.setReaderConfig(
                      this.props.currentBook.description.indexOf("scanned") > -1
                        ? "scannedOcrLang"
                        : "textOcrLang",
                      ocrEngineList.find(
                        (item) => item.value === event.target.value
                      )?.lang || "general"
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
                {ocrEngineList
                  .filter((item) => {
                    if (!isElectron && item.value === "mineru-official-agent") {
                      return false;
                    }
                    if (!isElectron && item.value === "system-ocr") {
                      return false;
                    }
                    return true;
                  })
                  .map((item) => (
                    <option
                      value={item.value}
                      key={item.value}
                      className="lang-setting-option"
                    >
                      {this.props.t(item.label)}
                    </option>
                  ))}
              </select>
            </div>
            {this.props.currentBook.description.indexOf("scanned") === -1 &&
            ConfigService.getReaderConfig("textOcrEngine") === "system-ocr" ? (
              <>
                <div>
                  <div
                    className="setting-dialog-new-title"
                    style={{
                      marginLeft: 10,
                      width: "calc(100% - 20px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Trans>Paragraph spacing threshold</Trans>
                    <select
                      name=""
                      className="lang-setting-dropdown"
                      style={{ width: "70px" }}
                      value={
                        ConfigService.getReaderConfig("paraSpacingValue") ||
                        "1.5"
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
                    </select>
                  </div>
                  <p
                    className="setting-option-subtitle"
                    style={{ margin: 10, marginTop: 5 }}
                  >
                    <Trans>
                      When the spacing between two lines of text is n times of
                      regular spacing, they will be split into two paragraphs
                    </Trans>
                  </p>
                </div>
                <div>
                  <div
                    className="setting-dialog-new-title"
                    style={{
                      marginLeft: 10,
                      width: "calc(100% - 20px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Trans>Title size threshold</Trans>
                    <select
                      name=""
                      className="lang-setting-dropdown"
                      style={{ width: "70px" }}
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
                    </select>
                  </div>
                  <p
                    className="setting-option-subtitle"
                    style={{ margin: 10, marginTop: 5 }}
                  >
                    <Trans>
                      When a line of text is n times the size of regular text,
                      it will be treated as a title
                    </Trans>
                  </p>
                </div>
              </>
            ) : (
              <div
                className="setting-dialog-new-title"
                style={{
                  marginLeft: 10,
                  width: "calc(100% - 20px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Trans>
                  {ConfigService.getReaderConfig(
                    this.props.currentBook.description.indexOf("scanned") > -1
                      ? "scannedOcrEngine"
                      : "textOcrEngine"
                  ) === "official-ai-ocr"
                    ? "Set OCR mode"
                    : "Set OCR language"}
                </Trans>

                <select
                  name=""
                  className="lang-setting-dropdown"
                  style={{ width: "70px" }}
                  value={(() => {
                    const ocrLang = ConfigService.getReaderConfig(
                      this.props.currentBook.description.indexOf("scanned") > -1
                        ? "scannedOcrLang"
                        : "textOcrLang"
                    );
                    if (ocrLang) return ocrLang;
                    const engine = ConfigService.getReaderConfig(
                      this.props.currentBook.description.indexOf("scanned") > -1
                        ? "scannedOcrEngine"
                        : "textOcrEngine"
                    );
                    const currentLang = ConfigService.getReaderConfig("lang");

                    const match = this.getLangList(engine).find(
                      (o: any) => o.lang === currentLang
                    );
                    return match ? match.value : "";
                  })()}
                  onChange={(event) => {
                    ConfigService.setReaderConfig(
                      this.props.currentBook.description.indexOf("scanned") > -1
                        ? "scannedOcrLang"
                        : "textOcrLang",
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
                    { label: "Please select", value: "", lang: "" },
                    ...(this.getLangList(
                      ConfigService.getReaderConfig(
                        this.props.currentBook.description.indexOf("scanned") >
                          -1
                          ? "scannedOcrEngine"
                          : "textOcrEngine"
                      )
                    ) || []),
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
              </div>
            )}
          </ul>
        </div>
      </>
    );
  }
}

export default ConvertDialog;
