import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isPaginatedBook } from "../../../utils/common";
import SliderList from "../../readerSettings/sliderList";
import SwitchRow from "../../readerSettings/switchRow";
import { useAppStore } from "../../../store/useAppStore";

const readingRulerSliderConfigs = [
  {
    maxValue: 20,
    minValue: 0,
    mode: "readingRulerLineHeight",
    minLabel: "0",
    maxLabel: "20",
    step: 1,
    title: "Reading ruler height",
    isPDF: false,
    defaultValue: 3,
  },
  {
    maxValue: 1,
    minValue: 0,
    mode: "readingRulerBackgroundOpacity",
    minLabel: "0",
    maxLabel: "1",
    step: 0.05,
    title: "Background opacity",
    isPDF: false,
    defaultValue: 0.6,
  },
];

const speedReadingSliderConfigs = [
  {
    maxValue: 900,
    minValue: 100,
    mode: "speedReadingSpeed",
    minLabel: "100",
    maxLabel: "900",
    step: 50,
    title: "Reading speed (WPM)",
    isPDF: false,
    defaultValue: 300,
  },
];

const autoReadingSliderConfigs = [
  {
    maxValue: 1,
    minValue: 0,
    mode: "autoScrollRate",
    minLabel: "0",
    maxLabel: "1",
    step: 0.05,
    title: "Auto scrolling speed",
    isPDF: false,
    defaultValue: 0.5,
  },
];

const exclusiveModeNames = [
  "isParagraphMode",
  "isReadingRuler",
  "isSpeedReading",
  "isAutoReading",
] as const;

type ExclusiveModeName = (typeof exclusiveModeNames)[number];

const AssistReadDialog = () => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const handleAssistReadDialog = useAppStore((s) => s.handleAssistReadDialog);
  const handleParagraphMode = useAppStore((s) => s.handleParagraphMode);
  const handleReadingRuler = useAppStore((s) => s.handleReadingRuler);
  const handleSpeedReading = useAppStore((s) => s.handleSpeedReading);
  const handleAutoReading = useAppStore((s) => s.handleAutoReading);
  const handleReaderMode = useAppStore((s) => s.handleReaderMode);
  const { t } = useTranslation();
  const [state, setState] = useState<Record<ExclusiveModeName, boolean>>({
    isParagraphMode: ConfigService.getReaderConfig("isParagraphMode") === "yes",
    isReadingRuler: ConfigService.getReaderConfig("isReadingRuler") === "yes",
    isSpeedReading: ConfigService.getReaderConfig("isSpeedReading") === "yes",
    isAutoReading: ConfigService.getReaderConfig("isAutoReading") === "yes",
  });

  const stopAutoScroll = () => {
    if (!htmlBook) return;
    const rate = parseFloat(
      ConfigService.getReaderConfig("autoScrollRate") || "0.5"
    );
    htmlBook.rendition.autoScroll?.(rate, "no");
    htmlBook.rendition.autoScrollPDF?.("no");
  };

  const handleExclusiveOff = (enabledName: ExclusiveModeName) => {
    const exclusiveHandlers: Record<
      ExclusiveModeName,
      (value: boolean) => void
    > = {
      isParagraphMode: handleParagraphMode,
      isReadingRuler: handleReadingRuler,
      isSpeedReading: handleSpeedReading,
      isAutoReading: handleAutoReading,
    };
    const offNames = exclusiveModeNames.filter(
      (name) => name !== enabledName && state[name]
    );
    if (offNames.length === 0) return;
    offNames.forEach((name) => {
      ConfigService.setReaderConfig(name, "no");
      exclusiveHandlers[name](false);
    });
    if (offNames.includes("isAutoReading")) {
      stopAutoScroll();
    }
    setState((prevState) => {
      const nextState = { ...prevState };
      offNames.forEach((name) => {
        nextState[name] = false;
      });
      return nextState;
    });
  };

  const handleParagraphModeToggle = () => {
    const next = !state.isParagraphMode;
    if (next) {
      handleExclusiveOff("isParagraphMode");
    }
    setState((prev) => ({ ...prev, isParagraphMode: next }));
    ConfigService.setReaderConfig("isParagraphMode", next ? "yes" : "no");
    handleParagraphMode(next);
    toast(t("Change successful"));
    setTimeout(() => {
      renderBookFunc();
    }, 500);
  };

  const handleReadingRulerToggle = () => {
    const next = !state.isReadingRuler;
    if (next) {
      handleExclusiveOff("isReadingRuler");
      if (!ConfigService.getReaderConfig("readingRulerLineHeight")) {
        ConfigService.setReaderConfig("readingRulerLineHeight", "3");
      }
      if (!ConfigService.getReaderConfig("readingRulerBackgroundOpacity")) {
        ConfigService.setReaderConfig("readingRulerBackgroundOpacity", "0.6");
      }
    }
    setState((prev) => ({ ...prev, isReadingRuler: next }));
    ConfigService.setReaderConfig("isReadingRuler", next ? "yes" : "no");
    handleReadingRuler(next);
    toast(t("Change successful"));
    setTimeout(() => {
      renderBookFunc();
    }, 500);
  };

  const handleSpeedReadingToggle = () => {
    const next = !state.isSpeedReading;
    if (next) {
      handleExclusiveOff("isSpeedReading");
      if (!ConfigService.getReaderConfig("speedReadingSpeed")) {
        ConfigService.setReaderConfig("speedReadingSpeed", "300");
      }
    }
    setState((prev) => ({ ...prev, isSpeedReading: next }));
    ConfigService.setReaderConfig("isSpeedReading", next ? "yes" : "no");
    handleSpeedReading(next);
    toast(t("Change successful"));
    setTimeout(() => {
      renderBookFunc();
    }, 500);
  };

  const handleAutoReadingToggle = () => {
    const next = !state.isAutoReading;
    if (next) {
      handleExclusiveOff("isAutoReading");
    }
    setState((prev) => ({ ...prev, isAutoReading: next }));
    ConfigService.setReaderConfig("isAutoReading", next ? "yes" : "no");
    handleAutoReading(next);
    if (next) {
      if (!ConfigService.getReaderConfig("autoScrollRate")) {
        ConfigService.setReaderConfig("autoScrollRate", "0.5");
      }
      if (isPaginatedBook(currentBook)) {
        ConfigService.setReaderConfig("pdfReaderMode", "scroll");
      } else {
        ConfigService.setReaderConfig("readerMode", "scroll");
      }
      handleReaderMode("scroll");
    } else {
      stopAutoScroll();
    }
    toast(t("Change successful"));
    if (next) {
      setTimeout(() => {
        renderBookFunc();
      }, 500);
    }
  };

  return (
    <div
      className="sort-dialog-container scale-page-dialog-container assist-read-dialog-container"
      onMouseLeave={() => {
        handleAssistReadDialog(false);
      }}
      onMouseEnter={() => {
        handleAssistReadDialog(true);
      }}
      style={{
        top: "50px",
        width: "280px",
        overflowY: "auto",
        maxHeight: "calc(100vh - 80px)",
        paddingTop: "0px",
      }}
    >
      <ul className="sort-by-category">
        <SwitchRow
          title={<Trans>Enable auto reading</Trans>}
          isEnabled={state.isAutoReading}
          onClick={handleAutoReadingToggle}
        />
        {state.isAutoReading &&
          autoReadingSliderConfigs.map((item) => (
            <SliderList key={item.mode} {...{ item }} />
          ))}

        <SwitchRow
          title={<Trans>Enable paragraph mode</Trans>}
          isEnabled={state.isParagraphMode}
          onClick={handleParagraphModeToggle}
        />

        <SwitchRow
          title={<Trans>Enable reading ruler</Trans>}
          isEnabled={state.isReadingRuler}
          onClick={handleReadingRulerToggle}
        />
        {state.isReadingRuler &&
          readingRulerSliderConfigs.map((item) => (
            <SliderList key={item.mode} {...{ item }} />
          ))}

        <SwitchRow
          title={<Trans>Enable speed reading</Trans>}
          isEnabled={state.isSpeedReading}
          onClick={handleSpeedReadingToggle}
        />
        {state.isSpeedReading &&
          speedReadingSliderConfigs.map((item) => (
            <SliderList key={item.mode} {...{ item }} />
          ))}
      </ul>
    </div>
  );
};

export default AssistReadDialog;
