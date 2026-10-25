import { useState } from "react";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import "../../readerSettings/sliderList/sliderList.css";
import BookUtil from "../../../utils/file/bookUtil";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

const cropSliderConfigs = [
  {
    maxValue: 50,
    minValue: 0,
    mode: "top",
    minLabel: "0",
    maxLabel: "50",
    step: 1,
    title: "Crop top",
  },
  {
    maxValue: 50,
    minValue: 0,
    mode: "bottom",
    minLabel: "0",
    maxLabel: "50",
    step: 1,
    title: "Crop bottom",
  },
  {
    maxValue: 50,
    minValue: 0,
    mode: "left",
    minLabel: "0",
    maxLabel: "50",
    step: 1,
    title: "Crop left",
  },
  {
    maxValue: 50,
    minValue: 0,
    mode: "right",
    minLabel: "0",
    maxLabel: "50",
    step: 1,
    title: "Crop right",
  },
];

interface PdfCropSliderProps {
  item: (typeof cropSliderConfigs)[number];
  value: number;
  onValueChange: (mode: string, value: number) => void;
  onCommit: () => void;
}

const PdfCropSlider = (props: PdfCropSliderProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isEntered, setIsEntered] = useState(false);

  const getClampedValue = (rawValue: string) => {
    const { minValue, maxValue } = props.item;
    const parsedValue = parseFloat(rawValue);
    const min = minValue;
    const max = maxValue;

    if (Number.isNaN(parsedValue)) {
      return props.value.toString();
    }

    return Math.min(Math.max(parsedValue, min), max).toString();
  };

  const applyValue = (nextValue: string) => {
    props.onValueChange(props.item.mode, parseFloat(nextValue));
  };

  const onValueChange = (event: any) => {
    const nextValue = getClampedValue(event.target.value);
    event.target.value = nextValue;
    setInputValue(nextValue);
    applyValue(nextValue);
  };

  const onValueInput = (event: any) => {
    props.onValueChange(props.item.mode, parseFloat(event.target.value) || 0);
  };

  const displayValue = props.value.toString();
  return (
    <div className="font-size-setting">
      <div className="font-size-title">
        <span style={{ marginRight: "10px" }}>
          <Trans>{props.item.title}</Trans>
        </span>

        <input
          className="input-value"
          value={isTyping ? inputValue : displayValue}
          type="number"
          step="1"
          onInput={(event: any) => {
            setInputValue(event.target.value);
          }}
          onChange={(event) => {
            setInputValue(event.target.value);
          }}
          onFocus={() => {
            setIsTyping(true);
          }}
          onBlur={(event) => {
            if (!isEntered) {
              const fieldVal = event.target.value;
              if (!fieldVal) return;
              onValueChange(event);
              setIsTyping(false);
              props.onCommit();
            } else {
              setIsEntered(false);
            }
          }}
          onKeyDown={(event: any) => {
            if (event.key === "Enter") {
              setIsEntered(true);
              const fieldVal = event.target.value;
              if (!fieldVal) return;
              onValueChange(event);
              setIsTyping(false);
              props.onCommit();
            }
          }}
        />
        <span style={{ marginLeft: "10px" }}>{displayValue}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <span className="ultra-small-size">{props.item.minLabel}</span>
        <div className="font-size-selector">
          <input
            className="input-progress"
            value={displayValue}
            type="range"
            max={props.item.maxValue}
            min={props.item.minValue}
            step={props.item.step}
            onInput={(event) => {
              onValueChange(event);
            }}
            onChange={(event) => {
              onValueInput(event);
            }}
            onMouseUp={() => {
              props.onCommit();
            }}
            style={{ position: "absolute", bottom: "11px" }}
          />
        </div>
        <span className="ultra-large-size" style={{ fontSize: "16px" }}>
          {props.item.maxLabel}
        </span>
      </div>
    </div>
  );
};

const PdfCropDialog = () => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const handlePdfCropDialog = useAppStore((s) => s.handlePdfCropDialog);
  const [crop, setCrop] = useState<Record<string, number>>(() => {
    const initialCrop = ConfigService.getObjectConfig(
      currentBook?.key,
      "pdfCrop",
      null
    );
    return {
      top: Number(initialCrop?.top) || 0,
      bottom: Number(initialCrop?.bottom) || 0,
      left: Number(initialCrop?.left) || 0,
      right: Number(initialCrop?.right) || 0,
    };
  });

  const handleValueChange = (mode: string, value: number) => {
    setCrop((prev) => ({ ...prev, [mode]: value }));
  };

  const handleCommit = () => {
    const { top, bottom, left, right } = crop;
    const bookKey = currentBook.key;
    if (top === 0 && bottom === 0 && left === 0 && right === 0) {
      ConfigService.deleteObjectConfig(bookKey, "pdfCrop");
    } else {
      ConfigService.setObjectConfig(
        bookKey,
        { top, bottom, left, right },
        "pdfCrop"
      );
    }
    BookUtil.reloadBooks(currentBook);
  };

  return (
    <div
      className="sort-dialog-container pdf-crop-dialog-container"
      onMouseLeave={() => {
        handlePdfCropDialog(false);
      }}
      onMouseEnter={() => {
        handlePdfCropDialog(true);
      }}
      style={{
        top: "50px",
        width: "280px",
        paddingBottom: "20px",
      }}
    >
      <ul className="sort-by-category">
        <div
          className="setting-dialog-new-title"
          style={{
            marginLeft: 10,
            width: "calc(100% - 20px)",
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          <Trans>Crop PDF</Trans>
          <span>{" (%)"}</span>
        </div>
        {cropSliderConfigs.map((item) => (
          <PdfCropSlider
            key={item.mode}
            item={item}
            value={crop[item.mode]}
            onValueChange={handleValueChange}
            onCommit={handleCommit}
          />
        ))}
      </ul>
    </div>
  );
};

export default PdfCropDialog;
