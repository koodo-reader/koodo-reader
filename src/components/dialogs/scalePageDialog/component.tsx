import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  pageWidthConfig,
  pageWidthPresetList,
} from "../../../constants/dropdownList";
import SliderList from "../../readerSettings/sliderList";
import SwitchRow from "../../readerSettings/switchRow";
import { isPaginatedBook } from "../../../utils/common";
import { useAppStore } from "../../../store/useAppStore";
import "./scalePageDialog.css";

const ScalePageDialog = () => {
  const scale = useAppStore((s) => s.reader.scale);
  const isFitPage = useAppStore((s) => s.reader.isFitPage);
  const readerMode = useAppStore((s) => s.reader.readerMode);
  const currentBook = useAppStore((s) => s.book.currentBook);
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const handleScale = useAppStore((s) => s.handleScale);
  const handleFitPage = useAppStore((s) => s.handleFitPage);
  const handleScalePageDialog = useAppStore((s) => s.handleScalePageDialog);
  const { t } = useTranslation();
  // 分页格式书籍在单页模式下缩放页面宽度可能不生效，提示用户切换滚动模式
  const showZoomHint = () => {
    if (
      currentBook?.format &&
      isPaginatedBook(currentBook) &&
      readerMode === "single"
    ) {
      toast(
        t(
          "If the page is not enlarged, please switch the reading mode to scroll mode and try again"
        )
      );
    }
  };
  const handlePresetChange = (scale: string) => {
    ConfigService.setReaderConfig("scale", scale);
    handleScale(scale);
    renderBookFunc();
    showZoomHint();
  };

  return (
    <div
      className="sort-dialog-container scale-page-dialog-container"
      onMouseLeave={() => {
        handleScalePageDialog(false);
      }}
      onMouseEnter={() => {
        handleScalePageDialog(true);
      }}
      style={{
        top: "50px",
        width: "280px",
      }}
    >
      <ul className="sort-by-category">
        <SliderList
          {...({ item: pageWidthConfig, onApply: showZoomHint } as any)}
        />

        <div className="setting-dialog-new-title scale-page-preset-row">
          <Trans>Preset width</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            value={
              pageWidthPresetList.some((opt) => opt.value === scale)
                ? scale
                : ""
            }
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              handlePresetChange(value);
            }}
          >
            <option value="" hidden></option>
            {pageWidthPresetList.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="lang-setting-option"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <SwitchRow
          title={<Trans>Fit to page</Trans>}
          isEnabled={isFitPage}
          onClick={() => {
            const next = !isFitPage;
            ConfigService.setReaderConfig("isFitPage", next ? "yes" : "no");
            handleFitPage(next);
            toast(t("Change successful"));
            if (next) {
              showZoomHint();
            }
            setTimeout(() => {
              renderBookFunc();
            }, 300);
          }}
        />
      </ul>
    </div>
  );
};

export default ScalePageDialog;
