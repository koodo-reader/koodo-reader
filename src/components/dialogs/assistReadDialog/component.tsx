import React from "react";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isPaginatedBook } from "../../../utils/common";
import SliderList from "../../readerSettings/sliderList";
import SwitchRow from "../../readerSettings/switchRow";
import { AssistReadDialogProps, AssistReadDialogState } from "./interface";

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

class AssistReadDialog extends React.Component<
  AssistReadDialogProps,
  AssistReadDialogState
> {
  constructor(props: AssistReadDialogProps) {
    super(props);
    this.state = {
      isParagraphMode:
        ConfigService.getReaderConfig("isParagraphMode") === "yes",
      isReadingRuler: ConfigService.getReaderConfig("isReadingRuler") === "yes",
      isSpeedReading: ConfigService.getReaderConfig("isSpeedReading") === "yes",
      isAutoReading: ConfigService.getReaderConfig("isAutoReading") === "yes",
    };
  }

  exclusiveModeNames = [
    "isParagraphMode",
    "isReadingRuler",
    "isSpeedReading",
    "isAutoReading",
  ] as const;

  handleExclusiveOff = (
    enabledName: (typeof this.exclusiveModeNames)[number]
  ) => {
    const exclusiveHandlers: Record<
      (typeof this.exclusiveModeNames)[number],
      (value: boolean) => void
    > = {
      isParagraphMode: this.props.handleParagraphMode,
      isReadingRuler: this.props.handleReadingRuler,
      isSpeedReading: this.props.handleSpeedReading,
      isAutoReading: this.props.handleAutoReading,
    };
    const offNames = this.exclusiveModeNames.filter(
      (name) => name !== enabledName && this.state[name]
    );
    if (offNames.length === 0) return;
    offNames.forEach((name) => {
      ConfigService.setReaderConfig(name, "no");
      exclusiveHandlers[name](false);
    });
    if (offNames.includes("isAutoReading")) {
      this.stopAutoScroll();
    }
    this.setState((prevState) => {
      const nextState = { ...prevState };
      offNames.forEach((name) => {
        nextState[name] = false;
      });
      return nextState;
    });
  };

  stopAutoScroll = () => {
    if (!this.props.htmlBook) return;
    const rate = parseFloat(
      ConfigService.getReaderConfig("autoScrollRate") || "0.5"
    );
    this.props.htmlBook.rendition.autoScroll?.(rate, "no");
    this.props.htmlBook.rendition.autoScrollPDF?.("no");
  };

  handleParagraphModeToggle = () => {
    const next = !this.state.isParagraphMode;
    if (next) {
      this.handleExclusiveOff("isParagraphMode");
    }
    this.setState({ isParagraphMode: next });
    ConfigService.setReaderConfig("isParagraphMode", next ? "yes" : "no");
    this.props.handleParagraphMode(next);
    toast(this.props.t("Change successful"));
    setTimeout(() => {
      this.props.renderBookFunc();
    }, 500);
  };

  handleReadingRulerToggle = () => {
    const next = !this.state.isReadingRuler;
    if (next) {
      this.handleExclusiveOff("isReadingRuler");
      if (!ConfigService.getReaderConfig("readingRulerLineHeight")) {
        ConfigService.setReaderConfig("readingRulerLineHeight", "3");
      }
      if (!ConfigService.getReaderConfig("readingRulerBackgroundOpacity")) {
        ConfigService.setReaderConfig("readingRulerBackgroundOpacity", "0.6");
      }
    }
    this.setState({ isReadingRuler: next });
    ConfigService.setReaderConfig("isReadingRuler", next ? "yes" : "no");
    this.props.handleReadingRuler(next);
    toast(this.props.t("Change successful"));
    setTimeout(() => {
      this.props.renderBookFunc();
    }, 500);
  };

  handleSpeedReadingToggle = () => {
    const next = !this.state.isSpeedReading;
    if (next) {
      this.handleExclusiveOff("isSpeedReading");
      if (!ConfigService.getReaderConfig("speedReadingSpeed")) {
        ConfigService.setReaderConfig("speedReadingSpeed", "300");
      }
    }
    this.setState({ isSpeedReading: next });
    ConfigService.setReaderConfig("isSpeedReading", next ? "yes" : "no");
    this.props.handleSpeedReading(next);
    toast(this.props.t("Change successful"));
    setTimeout(() => {
      this.props.renderBookFunc();
    }, 500);
  };

  handleAutoReadingToggle = () => {
    const next = !this.state.isAutoReading;
    if (next) {
      this.handleExclusiveOff("isAutoReading");
    }
    this.setState({ isAutoReading: next });
    ConfigService.setReaderConfig("isAutoReading", next ? "yes" : "no");
    this.props.handleAutoReading(next);
    if (next) {
      if (!ConfigService.getReaderConfig("autoScrollRate")) {
        ConfigService.setReaderConfig("autoScrollRate", "0.5");
      }
      if (isPaginatedBook(this.props.currentBook)) {
        ConfigService.setReaderConfig("pdfReaderMode", "scroll");
      } else {
        ConfigService.setReaderConfig("readerMode", "scroll");
      }
      this.props.handleReaderMode("scroll");
    } else {
      this.stopAutoScroll();
    }
    toast(this.props.t("Change successful"));
    if (next) {
      setTimeout(() => {
        this.props.renderBookFunc();
      }, 500);
    }
  };

  render() {
    return (
      <div
        className="sort-dialog-container scale-page-dialog-container assist-read-dialog-container"
        onMouseLeave={() => {
          this.props.handleAssistReadDialog(false);
        }}
        onMouseEnter={() => {
          this.props.handleAssistReadDialog(true);
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
            title="Enable auto reading"
            isEnabled={this.state.isAutoReading}
            onClick={this.handleAutoReadingToggle}
          />
          {this.state.isAutoReading &&
            autoReadingSliderConfigs.map((item) => (
              <SliderList key={item.mode} {...{ item }} />
            ))}

          <SwitchRow
            title="Enable paragraph mode"
            isEnabled={this.state.isParagraphMode}
            onClick={this.handleParagraphModeToggle}
          />

          <SwitchRow
            title="Enable reading ruler"
            isEnabled={this.state.isReadingRuler}
            onClick={this.handleReadingRulerToggle}
          />
          {this.state.isReadingRuler &&
            readingRulerSliderConfigs.map((item) => (
              <SliderList key={item.mode} {...{ item }} />
            ))}

          <SwitchRow
            title="Enable speed reading"
            isEnabled={this.state.isSpeedReading}
            onClick={this.handleSpeedReadingToggle}
          />
          {this.state.isSpeedReading &&
            speedReadingSliderConfigs.map((item) => (
              <SliderList key={item.mode} {...{ item }} />
            ))}
        </ul>
      </div>
    );
  }
}

export default AssistReadDialog;
