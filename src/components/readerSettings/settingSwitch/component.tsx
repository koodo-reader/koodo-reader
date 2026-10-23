import React from "react";
import { SettingSwitchProps, SettingSwitchState } from "./interface";
import { Trans } from "react-i18next";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { readerSettingList } from "../../../constants/settingList";
import toast from "react-hot-toast";
import { isReadingRawPDF } from "../../../utils/common";
import BookUtil from "../../../utils/file/bookUtil";

class SettingSwitch extends React.Component<
  SettingSwitchProps,
  SettingSwitchState
> {
  constructor(props: SettingSwitchProps) {
    super(props);
    this.state = {
      isBold: ConfigService.getReaderConfig("isBold") === "yes",
      isIndent: ConfigService.getReaderConfig("isIndent") === "yes",
      isUnderline: ConfigService.getReaderConfig("isUnderline") === "yes",
      isShadow: ConfigService.getReaderConfig("isShadow") === "yes",
      isItalic: ConfigService.getReaderConfig("isItalic") === "yes",
      isInvert: ConfigService.getReaderConfig("isInvert") === "yes",
      isBionic: ConfigService.getReaderConfig("isBionic") === "yes",
      isHyphenation: ConfigService.getReaderConfig("isHyphenation") === "yes",
      isOrphanWidow: ConfigService.getReaderConfig("isOrphanWidow") === "yes",
      isKeepPDFBackground:
        ConfigService.getReaderConfig("isKeepPDFBackground") === "yes",
      isAllowScript: ConfigService.getReaderConfig("isAllowScript") === "yes",
      isShowTotalPage:
        ConfigService.getReaderConfig("isShowTotalPage") === "yes",
      isStartFromEven:
        ConfigService.getReaderConfig("isStartFromEven") === "yes",
      isRevertDirection:
        ConfigService.getReaderConfig("revertDirection") === "yes",
      isHideBackground:
        ConfigService.getReaderConfig("isHideBackground") === "yes",
      isHideFooter: ConfigService.getReaderConfig("isHideFooter") === "yes",
      isHideHeader: ConfigService.getReaderConfig("isHideHeader") === "yes",
      isShowPageBorder:
        ConfigService.getReaderConfig("isShowPageBorder") === "yes",
      isCustomBookCSS:
        ConfigService.getReaderConfig("isCustomBookCSS") === "yes",
      customBookCSS: ConfigService.getReaderConfig("customBookCSS") || "",
      isSeperateStyle: ConfigService.getAllListConfig(
        "seperateStyleBooks"
      ).includes(props.currentBook?.key),
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: SettingSwitchProps) {
    if (nextProps.currentBook?.key !== this.props.currentBook?.key) {
      this.setState({
        isSeperateStyle: ConfigService.getAllListConfig(
          "seperateStyleBooks"
        ).includes(nextProps.currentBook?.key),
      });
    }
  }

  _handleChange = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any, () => {
      ConfigService.setReaderConfig(
        stateName,
        this.state[stateName] ? "yes" : "no"
      );
      toast(this.props.t("Change successful"));
      setTimeout(async () => {
        await this.props.renderBookFunc();
      }, 500);
    });
  };

  handleChange = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );

    toast(this.props.t("Change successful"));
  };

  render() {
    return (
      <>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <span
            style={{
              textDecoration: "underline",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <Trans>
              {
                "Full text translation, word definitions, auto reading, paragraph mode, reading ruler and speed reading have been moved to the top right corner of the book page"
              }
            </Trans>
          </span>
        </div>
        <div className="single-control-switch-container" key="isCustomBookCSS">
          <span className="single-control-switch-title">
            <Trans>Custom book style (CSS)</Trans>
          </span>
          <span
            className="single-control-switch"
            onClick={() => {
              const next = !this.state.isCustomBookCSS;
              this.setState({ isCustomBookCSS: next }, () => {
                ConfigService.setReaderConfig(
                  "isCustomBookCSS",
                  next ? "yes" : "no"
                );
                if (!this.state.customBookCSS) {
                  return;
                }
                toast(this.props.t("Change successful"));
                setTimeout(async () => {
                  await this.props.renderBookFunc();
                }, 500);
              });
            }}
            style={this.state.isCustomBookCSS ? {} : { opacity: 0.6 }}
          >
            <span
              className="single-control-button"
              style={
                !this.state.isCustomBookCSS
                  ? {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                    }
                  : {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                    }
              }
            ></span>
          </span>
        </div>
        {this.state.isCustomBookCSS && (
          <div style={{ margin: "10px 20px" }}>
            <textarea
              className="token-dialog-token-box"
              placeholder={
                "/* " + this.props.t("Enter custom CSS here") + " */"
              }
              value={this.state.customBookCSS}
              onChange={(e) => {
                const val = e.target.value;
                this.setState({ customBookCSS: val });
              }}
              onBlur={() => {
                ConfigService.setReaderConfig(
                  "customBookCSS",
                  this.state.customBookCSS
                );
                toast(this.props.t("Change successful"));
                setTimeout(async () => {
                  await this.props.renderBookFunc();
                }, 500);
              }}
            />
          </div>
        )}
        <div className="single-control-switch-container" key="isSeperateStyle">
          <span className="single-control-switch-title">
            <Trans>Enable seperate style for this book</Trans>
          </span>
          <span
            className="single-control-switch"
            onClick={async () => {
              const next = !this.state.isSeperateStyle;
              if (next) {
                ConfigService.setListConfig(
                  this.props.currentBook.key,
                  "seperateStyleBooks"
                );
                this.setState({
                  isSeperateStyle: true,
                });
              } else {
                ConfigService.deleteListConfig(
                  this.props.currentBook.key,
                  "seperateStyleBooks"
                );
                this.setState({
                  isSeperateStyle: false,
                });
              }
              toast(this.props.t("Change successful"));
              this.props.handleBackgroundColor(
                ConfigService.getReaderConfig("backgroundColor") || ""
              );
              this.props.renderBookFunc();
            }}
            style={this.state.isSeperateStyle ? {} : { opacity: 0.6 }}
          >
            <span
              className="single-control-button"
              style={
                !this.state.isSeperateStyle
                  ? {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                    }
                  : {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                    }
              }
            ></span>
          </span>
        </div>
        {readerSettingList
          .filter((item) => {
            if (isReadingRawPDF(this.props.currentBook)) {
              return item.isPDF;
            }
            return true;
          })
          .map((item) => (
            <div className="single-control-switch-container" key={item.title}>
              <span className="single-control-switch-title">
                <Trans>{item.title}</Trans>
              </span>

              <span
                className="single-control-switch"
                onClick={async () => {
                  const propName = item.propName as keyof SettingSwitchState;
                  const renderProps: Partial<
                    Record<keyof SettingSwitchState, (val: boolean) => void>
                  > = {
                    isHideFooter: this.props.handleHideFooter,
                    isHideHeader: this.props.handleHideHeader,
                    isHideBackground: this.props.handleHideBackground,
                    isShowPageBorder: this.props.handleShowBorder,
                  };

                  if (propName === "isBionic") {
                    if (
                      !this.state.isBionic &&
                      ConfigService.getAllListConfig(
                        "wordDefinitionBooks"
                      ).includes(this.props.currentBook.key)
                    ) {
                      toast.error(
                        this.props.t(
                          "Word definitions and fast reading mode cannot be enabled at the same time"
                        )
                      );
                      return;
                    }
                    this._handleChange(propName);
                  } else if (propName === "isShowPageBorder") {
                    this.props.handleShowBorder(!this.state.isShowPageBorder);
                    this.handleChange("isShowPageBorder");
                  } else if (propName === "isAllowScript") {
                    this.handleChange(propName);
                    setTimeout(() => {
                      BookUtil.reloadBooks(this.props.currentBook);
                    }, 500);
                  } else if (propName === "isRevertDirection") {
                    const next = !this.state.isRevertDirection;
                    this.setState({ isRevertDirection: next });
                    ConfigService.setReaderConfig(
                      "revertDirection",
                      next ? "yes" : "no"
                    );
                    toast(this.props.t("Change successful"));
                    setTimeout(async () => {
                      await this.props.renderBookFunc();
                    }, 500);
                  } else if (propName in renderProps) {
                    renderProps[propName]!(!this.state[propName]);
                    this.handleChange(propName);
                  } else {
                    this._handleChange(propName);
                  }
                }}
                style={this.state[item.propName] ? {} : { opacity: 0.6 }}
              >
                <span
                  className="single-control-button"
                  style={
                    !this.state[item.propName]
                      ? {
                          transform: "translateX(0px)",
                          transition: "transform 0.5s ease",
                        }
                      : {
                          transform: "translateX(20px)",
                          transition: "transform 0.5s ease",
                        }
                  }
                ></span>
              </span>
            </div>
          ))}
      </>
    );
  }
}

export default SettingSwitch;
