import { useEffect, useState } from "react";
import { SettingSwitchProps } from "./interface";
import { Trans } from "react-i18next";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { readerSettingList } from "../../../constants/settingList";
import toast from "react-hot-toast";
import { isReadingRawPDF } from "../../../utils/common";
import BookUtil from "../../../utils/file/bookUtil";
import SwitchRow from "../switchRow";

const SettingSwitch = (props: SettingSwitchProps) => {
  const [state, setState] = useState<Record<string, any>>({
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
  });

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isSeperateStyle: ConfigService.getAllListConfig(
        "seperateStyleBooks"
      ).includes(props.currentBook?.key),
    }));
  }, [props.currentBook?.key]);

  const _handleChange = (stateName: string) => {
    const next = !state[stateName];
    setState((prev) => ({ ...prev, [stateName]: next }));
    ConfigService.setReaderConfig(stateName, next ? "yes" : "no");
    toast(props.t("Change successful"));
    setTimeout(async () => {
      await props.renderBookFunc();
    }, 500);
  };

  const handleChange = (stateName: string) => {
    const next = !state[stateName];
    setState((prev) => ({ ...prev, [stateName]: next }));
    ConfigService.setReaderConfig(stateName, next ? "yes" : "no");
    toast(props.t("Change successful"));
  };

  const isMoreGroup = !props.group || props.group === "more";

  return (
    <>
      {isMoreGroup && (
        <>
          <div style={{ margin: "20px", textAlign: "center" }}>
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
          <SwitchRow
            variant="panel"
            title={<Trans>Custom book style (CSS)</Trans>}
            isEnabled={state.isCustomBookCSS}
            onClick={() => {
              const next = !state.isCustomBookCSS;
              setState((prev) => ({ ...prev, isCustomBookCSS: next }));
              ConfigService.setReaderConfig(
                "isCustomBookCSS",
                next ? "yes" : "no"
              );
              if (!state.customBookCSS) {
                return;
              }
              toast(props.t("Change successful"));
              setTimeout(async () => {
                await props.renderBookFunc();
              }, 500);
            }}
          />
          {state.isCustomBookCSS && (
            <div style={{ margin: "10px 20px" }}>
              <textarea
                className="token-dialog-token-box"
                placeholder={
                  "/* " + props.t("Enter custom CSS here") + " */"
                }
                value={state.customBookCSS}
                onChange={(e) => {
                  const val = e.target.value;
                  setState((prev) => ({ ...prev, customBookCSS: val }));
                }}
                onBlur={() => {
                  ConfigService.setReaderConfig(
                    "customBookCSS",
                    state.customBookCSS
                  );
                  toast(props.t("Change successful"));
                  setTimeout(async () => {
                    await props.renderBookFunc();
                  }, 500);
                }}
              />
            </div>
          )}
          <SwitchRow
            variant="panel"
            title={<Trans>Enable seperate style for this book</Trans>}
            isEnabled={state.isSeperateStyle}
            onClick={async () => {
              const next = !state.isSeperateStyle;
              if (next) {
                ConfigService.setListConfig(
                  props.currentBook.key,
                  "seperateStyleBooks"
                );
                setState((prev) => ({ ...prev, isSeperateStyle: true }));
              } else {
                ConfigService.deleteListConfig(
                  props.currentBook.key,
                  "seperateStyleBooks"
                );
                setState((prev) => ({ ...prev, isSeperateStyle: false }));
              }
              toast(props.t("Change successful"));
              props.handleBackgroundColor(
                ConfigService.getReaderConfig("backgroundColor") || ""
              );
              props.renderBookFunc();
            }}
          />
        </>
      )}
      {readerSettingList
        .filter((item) => {
          if (props.group && item.group !== props.group) {
            return false;
          }
          if (isReadingRawPDF(props.currentBook)) {
            return item.isPDF;
          }
          return true;
        })
        .map((item) => (
          <SwitchRow
            key={item.title}
            variant="panel"
            title={<Trans>{item.title}</Trans>}
            isEnabled={state[item.propName]}
            onClick={async () => {
              const propName = item.propName;
              const renderProps: Partial<
                Record<string, (val: boolean) => void>
              > = {
                isHideFooter: props.handleHideFooter,
                isHideHeader: props.handleHideHeader,
                isHideBackground: props.handleHideBackground,
                isShowPageBorder: props.handleShowBorder,
              };

              if (propName === "isBionic") {
                if (
                  !state.isBionic &&
                  ConfigService.getAllListConfig(
                    "wordDefinitionBooks"
                  ).includes(props.currentBook.key)
                ) {
                  toast.error(
                    props.t(
                      "Word definitions and fast reading mode cannot be enabled at the same time"
                    )
                  );
                  return;
                }
                _handleChange(propName);
              } else if (propName === "isShowPageBorder") {
                props.handleShowBorder(!state.isShowPageBorder);
                handleChange("isShowPageBorder");
              } else if (propName === "isAllowScript") {
                handleChange(propName);
                setTimeout(() => {
                  BookUtil.reloadBooks(props.currentBook);
                }, 500);
              } else if (propName === "isRevertDirection") {
                const next = !state.isRevertDirection;
                setState((prev) => ({
                  ...prev,
                  isRevertDirection: next,
                }));
                ConfigService.setReaderConfig(
                  "revertDirection",
                  next ? "yes" : "no"
                );
                toast(props.t("Change successful"));
                setTimeout(async () => {
                  await props.renderBookFunc();
                }, 500);
              } else if (propName in renderProps) {
                renderProps[propName]!(!state[propName]);
                handleChange(propName);
              } else {
                _handleChange(propName);
              }
            }}
          />
        ))}
    </>
  );
};

export default SettingSwitch;
