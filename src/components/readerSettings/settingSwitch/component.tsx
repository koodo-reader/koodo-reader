import React from "react";
import { SettingSwitchProps, SettingSwitchState } from "./interface";
import { Trans } from "react-i18next";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { readerSettingList } from "../../../constants/settingList";
import toast from "react-hot-toast";
import { vexComfirmAsync } from "../../../utils/common";
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
      isSliding: ConfigService.getReaderConfig("isSliding") === "yes",
      isUnderline: ConfigService.getReaderConfig("isUnderline") === "yes",
      isShadow: ConfigService.getReaderConfig("isShadow") === "yes",
      isItalic: ConfigService.getReaderConfig("isItalic") === "yes",
      isInvert: ConfigService.getReaderConfig("isInvert") === "yes",
      isBionic: ConfigService.getReaderConfig("isBionic") === "yes",
      isHyphenation: ConfigService.getReaderConfig("isHyphenation") === "yes",
      isOrphanWidow: ConfigService.getReaderConfig("isOrphanWidow") === "yes",
      isAllowScript: ConfigService.getReaderConfig("isAllowScript") === "yes",
      isStartFromEven:
        ConfigService.getReaderConfig("isStartFromEven") === "yes",
      isHideBackground:
        ConfigService.getReaderConfig("isHideBackground") === "yes",
      isHideFooter: ConfigService.getReaderConfig("isHideFooter") === "yes",
      isHideHeader: ConfigService.getReaderConfig("isHideHeader") === "yes",
      isHideAIButton: ConfigService.getReaderConfig("isHideAIButton") === "yes",
      isHideScaleButton:
        ConfigService.getReaderConfig("isHideScaleButton") === "yes",
      isHidePDFConvertButton:
        ConfigService.getReaderConfig("isHidePDFConvertButton") === "yes",
      isHidePageButton:
        ConfigService.getReaderConfig("isHidePageButton") === "yes",
      isHideMenuButton:
        ConfigService.getReaderConfig("isHideMenuButton") === "yes",
      isHideAudiobookButton:
        ConfigService.getReaderConfig("isHideAudiobookButton") === "yes",
      isShowPageBorder:
        ConfigService.getReaderConfig("isShowPageBorder") === "yes",
      isCustomBookCSS:
        ConfigService.getReaderConfig("isCustomBookCSS") === "yes",
      customBookCSS: ConfigService.getReaderConfig("customBookCSS") || "",
    };
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
              The audiobook feature has been moved to the bottom right of the
              book page
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
                      marginTop: "3px",
                    }
                  : {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                      marginTop: "3px",
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
        {readerSettingList
          .filter((item) => {
            if (
              this.props.currentBook.format === "PDF" &&
              ConfigService.getReaderConfig("isConvertPDF") !== "yes"
            ) {
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
                    isHidePageButton: this.props.handleHidePageButton,
                    isHideAIButton: this.props.handleHideAIButton,
                    isHideScaleButton: this.props.handleHideScaleButton,
                    isHidePDFConvertButton:
                      this.props.handleHidePDFConvertButton,
                    isShowPageBorder: this.props.handleShowBorder,
                  };

                  if (propName === "isHideMenuButton") {
                    if (!this.state.isHideMenuButton) {
                      const result = await vexComfirmAsync(
                        "After hiding the menu button, you can move the mouse to the edge of the window to show it again."
                      );
                      if (result) {
                        this.props.handleHideMenuButton(true);
                        ConfigService.setReaderConfig(
                          "isHideMenuButton",
                          "yes"
                        );
                        toast(this.props.t("Change successful"));
                      }
                    } else {
                      this.props.handleHideMenuButton(false);
                      this.handleChange("isHideMenuButton");
                    }
                  } else if (propName === "isHideAudiobookButton") {
                    this.props.handleHideAudiobookButton(
                      !this.state.isHideAudiobookButton
                    );
                    this.handleChange("isHideAudiobookButton");
                  } else if (propName === "isShowPageBorder") {
                    this.props.handleShowBorder(!this.state.isShowPageBorder);
                    if (!this.state.isShowPageBorder) {
                      this.props.handleHideBackground(true);
                      this.handleChange("isHideBackground");
                    }

                    this.handleChange("isShowPageBorder");
                  } else if (propName === "isAllowScript") {
                    this.handleChange(propName);
                    setTimeout(() => {
                      BookUtil.reloadBooks(this.props.currentBook);
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
                          marginTop: "3px",
                        }
                      : {
                          transform: "translateX(20px)",
                          transition: "transform 0.5s ease",
                          marginTop: "3px",
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
