import { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { SliderListProps } from "./interface";
import "./sliderList.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { useAppStore } from "../../../store/useAppStore";

const SliderList = (props: SliderListProps) => {
  const renderBookFunc = useAppStore((s) => s.renderBookFunc);
  const scale = useAppStore((s) => s.reader.scale);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const handleMargin = useAppStore((s) => s.handleMargin);
  const handleScale = useAppStore((s) => s.handleScale);
  const [state, setState] = useState<Record<string, any>>({
    isTyping: false,
    inputValue: "",
    isEntered: false,
    fontSize: ConfigService.getReaderConfig("fontSize") || "17",
    scale: ConfigService.getReaderConfig("scale") || "1",
    letterSpacing: ConfigService.getReaderConfig("letterSpacing") || "0",
    paraSpacing: ConfigService.getReaderConfig("paraSpacing") || "0",
    brightness: ConfigService.getReaderConfig("brightness") || "1",
    margin: ConfigService.getReaderConfig("margin") || "0",
    readingRulerLineHeight:
      ConfigService.getReaderConfig("readingRulerLineHeight") || "3",
    readingRulerBackgroundOpacity:
      ConfigService.getReaderConfig("readingRulerBackgroundOpacity") || "0.6",
    speedReadingSpeed:
      ConfigService.getReaderConfig("speedReadingSpeed") || "300",
    autoScrollRate: ConfigService.getReaderConfig("autoScrollRate") || "0.5",
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, scale: scale }));
  }, [scale]);

  const isPercentMode = () => props.item.mode === "scale";

  const getDisplayNumber = (value: string) => {
    if (!isPercentMode()) return value;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? value : String(Math.round(parsed * 100));
  };

  const getDisplayValue = (value: string) => {
    if (!isPercentMode()) return value;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? value : `${Math.round(parsed * 100)}%`;
  };

  const getClampedValue = (rawValue: string) => {
    const { minValue, maxValue } = props.item;
    const parsedValue = parseFloat(rawValue);
    const min = parseFloat(minValue);
    const max = parseFloat(maxValue);

    if (Number.isNaN(parsedValue)) {
      return state[props.item.mode];
    }

    return Math.min(Math.max(parsedValue, min), max).toString();
  };

  const applyValue = (mode: string, nextValue: string) => {
    setState((prev) => ({ ...prev, [mode]: nextValue }));
    ConfigService.setReaderConfig(mode, nextValue);

    if (mode === "scale") {
      handleScale(nextValue);
    }

    if (mode === "margin") {
      handleMargin(nextValue);
    }

    if (
      mode === "autoScrollRate" &&
      htmlBook &&
      ConfigService.getReaderConfig("isAutoReading") === "yes"
    ) {
      htmlBook.rendition.autoScroll?.(parseFloat(nextValue), "yes");
      htmlBook.rendition.autoScrollPDF?.("yes");
    }
  };

  const handleRest = async (_mode: string) => {
    renderBookFunc();
  };
  const onValueChange = (
    event: any,
    mode: string,
    fromPercent: boolean = false
  ) => {
    let rawValue = event.target.value;
    if (isPercentMode() && fromPercent) {
      const parsed = parseFloat(rawValue);
      if (!Number.isNaN(parsed)) {
        rawValue = (parsed / 100).toString();
      }
    }
    const nextValue = getClampedValue(rawValue);
    event.target.value = nextValue;
    setState((prev) => ({ ...prev, inputValue: nextValue }));
    applyValue(mode, nextValue);
  };
  const onValueInput = (event: any, mode: string) => {
    setState((prev) => ({ ...prev, [mode]: event.target.value }));
  };
  const updateValueByStep = (
    step: number,
    mode: string,
    direction: 1 | -1
  ) => {
    onValueChange(
      {
        target: {
          value: (parseFloat(state[mode]) + step * direction).toString(),
        },
      },
      mode
    );
  };
  const handleMinus = (step: number, mode: string) => {
    updateValueByStep(step, mode, -1);
  };
  const handleAdd = (step: number, mode: string) => {
    updateValueByStep(step, mode, 1);
  };

  return (
    <div className="font-size-setting">
      <div className="font-size-title">
        <span style={{ marginRight: "10px" }}>
          <Trans>{props.item.title}</Trans>
        </span>

        <input
          className="input-value"
          value={
            state.isTyping
              ? state.inputValue
              : getDisplayNumber(state[props.item.mode])
          }
          type="number"
          step={
            props.item.title === "Page width"
              ? "10"
              : props.item.title === "Brightness"
                ? "0.1"
                : "1"
          }
          onInput={(event: any) => {
            let fieldVal = event.target.value;
            setState((prev) => ({ ...prev, inputValue: fieldVal }));
          }}
          onChange={(event) => {
            let fieldVal = event.target.value;
            setState((prev) => ({ ...prev, inputValue: fieldVal }));
          }}
          onFocus={() => {
            setState((prev) => ({
              ...prev,
              isTyping: true,
              inputValue: getDisplayNumber(state[props.item.mode]),
            }));
          }}
          onBlur={(event) => {
            if (!state.isEntered) {
              let fieldVal = event.target.value;
              if (!fieldVal) return;
              onValueChange(event, props.item.mode, true);
              setState((prev) => ({ ...prev, isTyping: false }));
              handleRest(props.item.mode);
            } else {
              setState((prev) => ({ ...prev, isEntered: false }));
            }
          }}
          onKeyDown={(event: any) => {
            if (event.key === "Enter") {
              setState((prev) => ({ ...prev, isEntered: true }));
              let fieldVal = event.target.value;
              if (!fieldVal) return;
              onValueChange(event, props.item.mode, true);
              setState((prev) => ({ ...prev, isTyping: false }));
              handleRest(props.item.mode);
            }
          }}
        />
        <span style={{ marginLeft: "10px" }}>
          {getDisplayValue(state[props.item.mode])}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <span className="ultra-small-size">{props.item.minLabel}</span>
        <div className="font-size-selector">
          <input
            className="input-progress"
            value={state[props.item.mode]}
            type="range"
            max={props.item.maxValue}
            min={props.item.minValue}
            step={props.item.step}
            onInput={(event) => {
              onValueChange(event, props.item.mode);
            }}
            onChange={(event) => {
              onValueInput(event, props.item.mode);
            }}
            onMouseUp={() => {
              handleRest(props.item.mode);
            }}
            style={{
              position: "absolute",
              bottom: "11px",
              width: props.item.title === "Page width" ? "100%" : "200px",
            }}
          />
        </div>
        <span className="ultra-large-size" style={{ fontSize: "16px" }}>
          {props.item.maxLabel}
        </span>
      </div>
    </div>
  );
};

export default SliderList;
