import React from "react";
import { Trans } from "react-i18next";
import { ConvertDialogProps, ConvertDialogState } from "./interface";
import { isElectron } from "react-device-detect";
import { openExternalUrl, WEBSITE_URL } from "../../../utils/common";
import toast from "react-hot-toast";
import {
  exportBooks,
  exportDictionaryHistory,
  exportHighlights,
  exportNotes,
} from "../../../utils/file/export";
import "./convertDialog.css";
import DatabaseService from "../../../utils/storage/databaseService";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import ConfigUtil from "../../../utils/file/configUtil";
import BookUtil from "../../../utils/file/bookUtil";
import {
  ocrLangList,
  paraSpacingList,
  titleSizeList,
} from "../../../constants/dropdownList";

declare var window: any;
class ConvertDialog extends React.Component<
  ConvertDialogProps,
  ConvertDialogState
> {
  constructor(props: ConvertDialogProps) {
    super(props);
    this.state = {
      isShowExportAll: false,
      isConvertPDF: ConfigService.getReaderConfig("isConvertPDF") === "yes",
    };
  }
  handleJump = (url: string) => {
    openExternalUrl(url);
    this.props.handleConvertDialog(false);
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
                this.setState({
                  [item.propName]: !this.state[item.propName],
                } as any);
                ConfigService.setReaderConfig(
                  item.propName,
                  this.state[item.propName] ? "no" : "yes"
                );
                BookUtil.reloadBooks();
                // ConfigService.setReaderConfig(
                //   "isConvertPDF",
                //   ConfigService.getReaderConfig("isConvertPDF") === "yes"
                //     ? "no"
                //     : "yes"
                // );
                // toast.success(
                //   ConfigService.getReaderConfig("isConvertPDF") === "yes"
                //     ? this.props.t("PDF to Text is enabled")
                //     : this.props.t("PDF to Text is disabled")
                // );
                // BookUtil.reloadBooks();
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
          style={{ right: "20px", left: "auto", top: "50px", width: "240px" }}
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
            {this.props.currentBook.description.indexOf("scanned PDF") > -1 ? (
              <>
                {/* TODO support more engine */}
                {/* <div
                  className="setting-dialog-new-title"
                  style={{
                    marginLeft: 10,
                    width: "calc(100% - 20px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Trans>OCR engine</Trans>

                  <select
                    name=""
                    className="lang-setting-dropdown"
                    onChange={(event) => {
                      ConfigService.setReaderConfig(
                        "ocrEngine",
                        event.target.value
                      );
                      if (
                        ConfigService.getReaderConfig("isConvertPDF") === "yes"
                      ) {
                        BookUtil.reloadBooks();
                      }
                    }}
                  >
                    {[
                      { label: "Please select", value: "", lang: "" },
                      { label: "Tesseract", value: "tesseract", lang: "" },
                      { label: "System OCR", value: "system", lang: "" },
                    ]
                      .filter((item) => {
                        if (!isElectron) {
                          return item.value !== "system"; // Hide system OCR option in Electron
                        } else {
                          return true; // Show all options in web
                        }
                      })
                      .map((item) => (
                        <option
                          value={item.value}
                          key={item.value}
                          className="lang-setting-option"
                          selected={
                            ConfigService.getReaderConfig("ocrEngine")
                              ? item.value ===
                                ConfigService.getReaderConfig("ocrEngine")
                              : item.value === "tesseract"
                              ? true
                              : false
                          }
                        >
                          {this.props.t(item.label)}
                        </option>
                      ))}
                  </select>
                </div> */}
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
                  <Trans>Set OCR language</Trans>

                  <select
                    name=""
                    className="lang-setting-dropdown"
                    onChange={(event) => {
                      ConfigService.setReaderConfig(
                        "ocrLang",
                        event.target.value
                      );
                      if (
                        ConfigService.getReaderConfig("isConvertPDF") === "yes"
                      ) {
                        BookUtil.reloadBooks();
                      }
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
                        selected={
                          ConfigService.getReaderConfig("ocrLang")
                            ? item.value ===
                              ConfigService.getReaderConfig("ocrLang")
                            : item.lang ===
                              ConfigService.getReaderConfig("lang")
                            ? true
                            : false
                        }
                      >
                        {this.props.t(item.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
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
                      onChange={(event) => {
                        ConfigService.setReaderConfig(
                          "paraSpacingValue",
                          event.target.value
                        );
                        if (
                          ConfigService.getReaderConfig("isConvertPDF") ===
                          "yes"
                        ) {
                          BookUtil.reloadBooks();
                        }
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
                          selected={
                            ConfigService.getReaderConfig("paraSpacingValue")
                              ? item.value ===
                                ConfigService.getReaderConfig(
                                  "paraSpacingValue"
                                )
                              : item.value === "1.5"
                          }
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
                      onChange={(event) => {
                        ConfigService.setReaderConfig(
                          "titleSizeValue",
                          event.target.value
                        );
                        if (
                          ConfigService.getReaderConfig("isConvertPDF") ===
                          "yes"
                        ) {
                          BookUtil.reloadBooks();
                        }
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
                          selected={
                            ConfigService.getReaderConfig("titleSizeValue")
                              ? item.value ===
                                ConfigService.getReaderConfig("titleSizeValue")
                              : item.value === "1.2"
                          }
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
            )}
          </ul>
        </div>
      </>
    );
  }
}

export default ConvertDialog;
