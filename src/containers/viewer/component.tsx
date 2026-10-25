import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ViewerProps, ViewerState } from "./interface";
import BookUtil from "../../utils/file/bookUtil";
import PopupMenu from "../../components/popups/popupMenu";
import Background from "../../components/background";
import StyleUtil from "../../utils/reader/styleUtil";
import "./index.css";
import { htmlMouseEvent } from "../../utils/reader/mouseEvent";
import ImageViewer from "../../components/imageViewer";
import { getIframeDoc } from "../../utils/reader/docUtil";
import PopupBox from "../../components/popups/popupBox";
import Note from "../../models/Note";
import PageWidget from "../pageWidget";
import {
  BRUSH_COLORS,
  BRUSH_WIDTHS,
  ERASER_WIDTH_DEFAULT,
  HIGHLIGHTER_COLORS,
  HIGHLIGHTER_WIDTHS,
  SHAPE_TYPES,
  TEXT_COLORS,
  clearComicTemp,
  getDefaultOcrEngine,
  getDefaultOcrLang,
  getOcrCache,
  getPageWidth,
  getParserRegex,
  getPdfPassword,
  getServerRegion,
  getTarBuffer,
  getTarEntries,
  getTextRules,
  getZipBuffer,
  getZipEntries,
  isFixedLayoutComic,
  isPaginatedBook,
  isReadingAidMode,
  isReadingRawPDF,
  saveOcrCache,
  throttle,
} from "../../utils/common";
import _ from "underscore";
import {
  ConfigService,
  CollectionUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import * as Kookit from "../../assets/lib/kookit.min";
import PopupRefer from "../../components/popups/popupRefer";
import DatabaseService from "../../utils/storage/databaseService";
import { getOcrResult, getOcrResultV2 } from "../../utils/request/reader";
import { BookHelper } from "../../assets/lib/kookit.min";
import { parseWithSystemOCR } from "../../utils/request/common";
import { isElectron } from "react-device-detect";
import axios from "axios";
import { getBuiltinOcr } from "../../utils/plugins/rendererRegistry";
import { resolveStoredPlugin } from "../../utils/plugins/records";
import type { PluginConfig } from "../../utils/plugins/types";
import { useAppStore } from "../../store/useAppStore";

const collectionUtil = new CollectionUtil(ConfigService);
declare var window: any;
let lock = false; //prevent from clicking too fasts

const Viewer = (props: ViewerProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const isNavLocked = useAppStore((s) => s.reader.isNavLocked);
  const isSettingLocked = useAppStore((s) => s.reader.isSettingLocked);
  const isDockedRight = useAppStore((s) => s.reader.isDockedRight);
  const isOpenMenu = useAppStore((s) => s.viewArea.isOpenMenu);
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const readerMode = useAppStore((s) => s.reader.readerMode);
  const menuMode = useAppStore((s) => s.viewArea.menuMode);
  const scale = useAppStore((s) => s.reader.scale);
  const isFitPage = useAppStore((s) => s.reader.isFitPage);
  const margin = useAppStore((s) => s.reader.margin);
  const isHideBackground = useAppStore((s) => s.reader.isHideBackground);
  const isParagraphMode = useAppStore((s) => s.reader.isParagraphMode);
  const isReadingRuler = useAppStore((s) => s.reader.isReadingRuler);
  const isSpeedReading = useAppStore((s) => s.reader.isSpeedReading);
  const isMergeWord = useAppStore((s) => s.reader.isMergeWord);
  const isShowPageBorder = useAppStore((s) => s.reader.isShowPageBorder);
  const textOrientation = useAppStore((s) => s.reader.textOrientation);
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const handleReadingState = useAppStore((s) => s.handleReadingState);
  const handleHtmlBook = useAppStore((s) => s.handleHtmlBook);
  const handleRenderBookFunc = useAppStore((s) => s.handleRenderBookFunc);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const handleOpenMenu = useAppStore((s) => s.handleOpenMenu);
  const handleCurrentChapter = useAppStore((s) => s.handleCurrentChapter);
  const handleNoteKey = useAppStore((s) => s.handleNoteKey);
  const handleCurrentChapterIndex = useAppStore(
    (s) => s.handleCurrentChapterIndex
  );
  const handleFetchNotes = useAppStore((s) => s.handleFetchNotes);
  const handleFetchBookmarks = useAppStore((s) => s.handleFetchBookmarks);
  const handleMenuMode = useAppStore((s) => s.handleMenuMode);
  const handleFetchPlugins = useAppStore((s) => s.handleFetchPlugins);
  const handleScale = useAppStore((s) => s.handleScale);
  const handleBackgroundColor = useAppStore((s) => s.handleBackgroundColor);

  const connected = {
    currentBook,
    htmlBook,
    isNavLocked,
    isSettingLocked,
    isDockedRight,
    isOpenMenu,
    isAuthed,
    readerMode,
    menuMode,
    scale,
    isFitPage,
    margin,
    isHideBackground,
    isParagraphMode,
    isReadingRuler,
    isSpeedReading,
    isMergeWord,
    isShowPageBorder,
    textOrientation,
    renderBookFunc,
    handleReadingState,
    handleHtmlBook,
    handleRenderBookFunc,
    handleFetchBooks,
    handleOpenMenu,
    handleCurrentChapter,
    handleNoteKey,
    handleCurrentChapterIndex,
    handleFetchNotes,
    handleFetchBookmarks,
    handleMenuMode,
    handleFetchPlugins,
    handleScale,
    handleBackgroundColor,
    handleLeaveReader: props.handleLeaveReader,
  };
  const propsRef = useRef(connected);
  propsRef.current = connected;
  const [state, setState] = useState<ViewerState>({
    rect: null,
    isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
    isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
    chapterDocIndex: parseInt(
      ConfigService.getObjectConfig(currentBook.key, "recordLocation", {})
        .chapterDocIndex || 0
    ),
    pageOffset: "",
    pageWidth: "",
    chapter: "",
    rendition: null,
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const updateState = (patch: Partial<ViewerState>) =>
    setState((prev) => ({ ...prev, ...patch }));
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const pendingRerenderRef = useRef(false);
  const prevWidthPropsRef = useRef({
    margin,
    scale,
    readerMode,
    isNavLocked,
    isSettingLocked,
    isFitPage,
    isDockedRight,
  });

  const handleHighlight = async (rendition: any) => {
    if (!rendition) return;
    let highlighters: any = await DatabaseService.getRecordsByBookKey(
      propsRef.current.currentBook.key,
      "notes"
    );
    if (!highlighters) return;
    let highlightersByChapter = highlighters.filter((item: Note) => {
      let cfi = JSON.parse(item.cfi);
      if (cfi.cfi) {
        // epub from 1.5.2 or older
        return (
          item.chapter ===
          rendition.getChapterDoc()[stateRef.current.chapterDocIndex].label
        );
      } else if (cfi.fingerprint) {
        // pdf from 1.7.4 or older
        return cfi.page - 1 === stateRef.current.chapterDocIndex;
      } else {
        return item.chapterIndex === stateRef.current.chapterDocIndex;
      }
    });
    if (propsRef.current.currentBook.format === "PDF") {
      highlightersByChapter = highlightersByChapter.map((item: Note) => {
        let cfi = JSON.parse(item.cfi);
        if (cfi.fingerprint) {
          item.chapterIndex = cfi.page - 1;
          cfi.chapterDocIndex = cfi.page - 1 + "";
          cfi.chapterHref = "title" + (cfi.page - 1);
          item.cfi = JSON.stringify(cfi);
        }

        return item;
      });
    }
    await rendition.renderHighlighters(highlightersByChapter, handleNoteClick);
    if (
      isReadingRawPDF(propsRef.current.currentBook) &&
      (propsRef.current.readerMode === "double" ||
        propsRef.current.readerMode === "scroll")
    ) {
      let highlightersByChapter = highlighters.filter((item: Note) => {
        let cfi = JSON.parse(item.cfi);
        if (cfi.fingerprint) {
          // pdf from 1.7.4 or older
          return cfi.page === stateRef.current.chapterDocIndex;
        } else {
          return item.chapterIndex === stateRef.current.chapterDocIndex + 1;
        }
      });
      if (propsRef.current.currentBook.format === "PDF") {
        highlightersByChapter = highlightersByChapter.map((item: Note) => {
          let cfi = JSON.parse(item.cfi);
          if (cfi.fingerprint) {
            item.chapterIndex = cfi.page - 1;
            cfi.chapterDocIndex = cfi.page - 1 + "";
            cfi.chapterHref = "title" + (cfi.page - 1);
            item.cfi = JSON.stringify(cfi);
          }

          return item;
        });
      }
      await rendition.renderHighlighters(
        highlightersByChapter,
        handleNoteClick
      );
    }
  };
  const handleNoteClick = (event: Event) => {
    propsRef.current.handleNoteKey((event.target as any).dataset.key);
    propsRef.current.handleMenuMode("note");
    propsRef.current.handleOpenMenu(true);
  };
  const handleRenderBook = async () => {
    if (lock) return;
    let { key, path, format, name } = propsRef.current.currentBook;
    if (ConfigService.getAllListConfig("seperateStyleBooks").includes(key)) {
      window.currentBookKey = key;
      propsRef.current.handleBackgroundColor(
        ConfigService.getReaderConfig("backgroundColor") || ""
      );
    } else {
      window.currentBookKey = "";
    }
    propsRef.current.handleHtmlBook(null);
    if (stateRef.current.rendition) {
      // 停止旧渲染实例的自动滚动定时器，避免重渲染后旧循环继续占用滚动容器
      stateRef.current.rendition.autoScroll?.(0, "no");
      stateRef.current.rendition.autoScrollPDF?.("no");
      stateRef.current.rendition.removeContent();
    }
    let result;
    let isCacheExsit = await BookUtil.isBookExist("cache-" + key, "zip", path);
    if (isFixedLayoutComic(propsRef.current.currentBook)) {
      isCacheExsit = false;
    }
    if (
      isElectron &&
      (propsRef.current.currentBook.format === "CBZ" ||
        propsRef.current.currentBook.format === "CBT")
    ) {
      result = new ArrayBuffer(0);
      clearComicTemp();
    } else {
      result = await BookUtil.fetchBook(
        isCacheExsit ? "cache-" + key : key,
        isCacheExsit ? "zip" : format.toLowerCase(),
        true,
        path
      );
    }

    const crop = ConfigService.getObjectConfig(
      propsRef.current.currentBook.key,
      "pdfCrop",
      null
    );
    let pdfCrop;
    if (crop) {
      const top = Number(crop.top) || 0;
      const bottom = Number(crop.bottom) || 0;
      const left = Number(crop.left) || 0;
      const right = Number(crop.right) || 0;
      if (top !== 0 || bottom !== 0 || left !== 0 || right !== 0) {
        pdfCrop = { top, bottom, left, right };
      }
    }
    const ocrLangKey =
      propsRef.current.currentBook.description.indexOf("scanned") > -1
        ? "scannedOcrLang"
        : "textOcrLang";
    const isScannedBook =
      propsRef.current.currentBook.description.indexOf("scanned") > -1;
    const rawOcrEngine = getDefaultOcrEngine(propsRef.current.currentBook);
    let ocrEngine = rawOcrEngine;
    let ocrLang = getDefaultOcrLang(rawOcrEngine, propsRef.current.currentBook);
    let externalWorker: {
      recognize: (input: string) => Promise<unknown>;
    } = {
      recognize:
        rawOcrEngine === "system-ocr"
          ? parseWithSystemOCR
          : ConfigService.getReaderConfig(ocrLangKey) === "accurate"
            ? getOcrResultV2
            : getOcrResult,
    };

    const builtinOcr = getBuiltinOcr(rawOcrEngine);
    if (builtinOcr) {
      const record = await DatabaseService.getRecord(rawOcrEngine, "plugins");
      const plugin = record ? await resolveStoredPlugin(record) : undefined;
      if (plugin) {
        const pluginConfig = {
          ...(plugin.config as PluginConfig),
        } as PluginConfig;
        if (ocrLang) {
          pluginConfig.language = ocrLang;
        }
        let ocrQueue: Promise<unknown> = Promise.resolve();
        externalWorker = {
          recognize: (imageBase64: string) => {
            const task = ocrQueue.then(() =>
              builtinOcr(imageBase64, axios, pluginConfig)
            );
            ocrQueue = task.catch(() => undefined);
            return task;
          },
        };
        ocrEngine = "plugin-ocr";
      } else {
        ocrEngine = isScannedBook ? "paddle" : "system-ocr";
        ocrLang = ocrEngine === "paddle" ? "standard_v5_mobile" : "auto";
        externalWorker = {
          recognize:
            ocrEngine === "system-ocr"
              ? parseWithSystemOCR
              : ConfigService.getReaderConfig(ocrLangKey) === "accurate"
                ? getOcrResultV2
                : getOcrResult,
        };
      }
    }
    let rendition = BookHelper.getRendition(
      result,
      {
        format: isCacheExsit ? "CACHE" : format,
        isFixedLayout: isFixedLayoutComic(propsRef.current.currentBook)
          ? "yes"
          : "no",
        readerMode: propsRef.current.readerMode,
        charset: propsRef.current.currentBook.charset,
        animation: ConfigService.getReaderConfig("animation") || "none",
        convertChinese: ConfigService.getReaderConfig("convertChinese"),
        bookLayout: ConfigService.getReaderConfig("bookLayout") || "",
        textRules: getTextRules(propsRef.current.currentBook.key),
        codeHighlight: ConfigService.getReaderConfig("codeHighlight") || "",
        revertDirection:
          ConfigService.getReaderConfig("revertDirection") || "no",
        parserRegex: getParserRegex(
          propsRef.current.currentBook.format,
          propsRef.current.currentBook.key
        ),
        fullTranslationMode:
          ConfigService.getAllListConfig("fullTranslationBooks").includes(
            propsRef.current.currentBook.key
          ) && propsRef.current.isAuthed
            ? ConfigService.getReaderConfig("fullTranslationMode")
            : "no",
        textOrientation: ConfigService.getReaderConfig("textOrientation"),
        isDarkMode:
          ConfigService.getReaderConfig("backgroundColor") ===
          "rgba(44,47,49,1)"
            ? "yes"
            : "no",
        backgroundColor: ConfigService.getReaderConfig("backgroundColor"),
        isMobile: "no",
        isIndent: ConfigService.getReaderConfig("isIndent"),
        isHyphenation: ConfigService.getReaderConfig("isHyphenation"),
        isStartFromEven: ConfigService.getReaderConfig("isStartFromEven"),
        isShowTotalPage: ConfigService.getReaderConfig("isShowTotalPage"),
        isAllowScript: ConfigService.getReaderConfig("isAllowScript"),
        isBionic: ConfigService.getReaderConfig("isBionic"),
        isParagraphMode: ConfigService.getReaderConfig("isParagraphMode"),
        isReadingRuler: ConfigService.getReaderConfig("isReadingRuler"),
        isSpeedReading: ConfigService.getReaderConfig("isSpeedReading"),
        speedReadingSpeed: parseFloat(
          ConfigService.getReaderConfig("speedReadingSpeed") || "300"
        ),
        readingRulerLineHeight: parseFloat(
          ConfigService.getReaderConfig("readingRulerLineHeight") || "3"
        ),
        readingRulerBackgroundOpacity: parseFloat(
          ConfigService.getReaderConfig("readingRulerBackgroundOpacity") ||
            "0.6"
        ),
        isEnableKoReaderSync:
          ConfigService.getReaderConfig("isEnableKoReaderSync") === "yes",
        password: getPdfPassword(propsRef.current.currentBook),
        pdfCrop,
        scale: parseFloat(propsRef.current.scale),
        isConvertPDF: ConfigService.getAllListConfig(
          "convertPDFBooks"
        ).includes(propsRef.current.currentBook.key)
          ? "yes"
          : "no",
        ocrLang,
        externalWorker,
        ocrEngine,
        serverRegion:
          getServerRegion() === "china" && propsRef.current.isAuthed
            ? "china"
            : "global",
        paraSpacingValue:
          ConfigService.getReaderConfig("paraSpacingValue") || "1.5",
        titleSizeValue:
          ConfigService.getReaderConfig("titleSizeValue") || "1.2",
        isScannedPDF:
          propsRef.current.currentBook.description.indexOf("scanned") > -1
            ? "yes"
            : "no",
        brushColor:
          ConfigService.getReaderConfig("annotationBrushColor") ||
          BRUSH_COLORS[0],
        brushWidth: parseFloat(
          ConfigService.getReaderConfig("annotationBrushWidth") ||
            BRUSH_WIDTHS[1] + ""
        ),
        annotationStyle:
          ConfigService.getReaderConfig("annotationStyle") || "brush",
        highlighterColor:
          ConfigService.getReaderConfig("annotationHighlighterColor") ||
          HIGHLIGHTER_COLORS[0],
        highlighterWidth: parseFloat(
          ConfigService.getReaderConfig("annotationHighlighterWidth") ||
            HIGHLIGHTER_WIDTHS[1] + ""
        ),
        highlighterOpacity: parseFloat(
          ConfigService.getReaderConfig("annotationHighlighterOpacity") || "0.4"
        ),
        shapeType:
          ConfigService.getReaderConfig("annotationShapeType") ||
          SHAPE_TYPES[0],
        shapeColor:
          ConfigService.getReaderConfig("annotationShapeColor") ||
          BRUSH_COLORS[0],
        shapeWidth: parseFloat(
          ConfigService.getReaderConfig("annotationShapeWidth") ||
            BRUSH_WIDTHS[1] + ""
        ),
        eraserWidth: parseFloat(
          ConfigService.getReaderConfig("annotationEraserWidth") ||
            ERASER_WIDTH_DEFAULT + ""
        ),
        quickErase:
          ConfigService.getReaderConfig("annotationQuickErase") || "no",
        textSize: parseFloat(
          ConfigService.getReaderConfig("annotationTextSize") || "24"
        ),
        textFont:
          ConfigService.getReaderConfig("annotationTextFont") || "sans-serif",
        textColor:
          ConfigService.getReaderConfig("annotationTextColor") ||
          TEXT_COLORS[0],
        isKeepPDFBackground: ConfigService.getReaderConfig(
          "isKeepPDFBackground"
        ),
        getTarBuffer: getTarBuffer,
        getZipBuffer: getZipBuffer,
        getTarEntries: getTarEntries,
        getZipEntries: getZipEntries,
        filePath: BookUtil.getBookPath(propsRef.current.currentBook),
        bookKey: propsRef.current.currentBook.key,
        getOcrCache: getOcrCache,
        saveOcrCache: saveOcrCache,
      },
      Kookit
    );
    if (propsRef.current.currentBook.format === "TXT") {
      let bookLocation = ConfigService.getObjectConfig(
        propsRef.current.currentBook.key,
        "recordLocation",
        {}
      );
      await rendition.renderTo(
        document.getElementById("page-area"),
        bookLocation
      );
    } else {
      await rendition.renderTo(document.getElementById("page-area"));
    }

    await handleRest(rendition);
    if (
      ConfigService.getReaderConfig("isAutoReading") === "yes" &&
      propsRef.current.readerMode === "scroll"
    ) {
      // 自动阅读开启：每次重渲染后以保存的速率重新启动自动滚动
      const rate = parseFloat(
        ConfigService.getReaderConfig("autoScrollRate") || "0.5"
      );
      rendition.autoScroll?.(rate, "yes");
      rendition.autoScrollPDF?.("yes");
    }
    propsRef.current.handleReadingState(true);

    ConfigService.setListConfig(
      collectionUtil.getRecentBookKey(propsRef.current.currentBook.key),
      "recentBooks"
    );
    document.title = name + " - Koodo Reader";
  };

  const handleRest = async (rendition: any) => {
    htmlMouseEvent(
      rendition,
      propsRef.current.currentBook,
      propsRef.current.readerMode,
      (scale: string) => {
        flushSync(() => {
          propsRef.current.handleScale(scale);
        });
      },
      propsRef.current.renderBookFunc
    );
    let chapters = rendition.getChapter();
    let chapterDocs = rendition.getChapterDoc();
    let flattenChapters = rendition.flatChapter(chapters);
    propsRef.current.handleHtmlBook({
      key: propsRef.current.currentBook.key,
      chapters,
      flattenChapters,
      rendition: rendition,
    });
    updateState({ rendition });
    if (isReadingRawPDF(propsRef.current.currentBook)) {
      //ignore
    } else {
      StyleUtil.addDefaultCss(propsRef.current.currentBook.key);
      await StyleUtil.applyReaderFonts(rendition);
    }

    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
      page: string;
      xpath: string;
    } = ConfigService.getObjectConfig(
      propsRef.current.currentBook.key,
      "recordLocation",
      {}
    );
    if (chapterDocs.length > 0) {
      if (
        ConfigService.getReaderConfig("isEnableKoReaderSync") === "yes" &&
        bookLocation.xpath
      ) {
        await rendition.goToXpath(bookLocation.xpath);
      } else {
        await rendition.goToPosition(
          JSON.stringify({
            text: bookLocation.text || "",
            chapterTitle: bookLocation.chapterTitle || "",
            page: bookLocation.page || "",
            chapterDocIndex: bookLocation.chapterDocIndex || 0,
            chapterHref: bookLocation.chapterHref || "",
            count: bookLocation.hasOwnProperty("cfi")
              ? "ignore"
              : bookLocation.count || 0,
            percentage: bookLocation.percentage,
            cfi: bookLocation.cfi,
            isFirst: true,
          })
        );
      }
    }
    rendition.on("rendered", async () => {
      handleLocation();
      let bookLocation: {
        text: string;
        count: string;
        chapterTitle: string;
        chapterDocIndex: string;
        chapterHref: string;
      } = ConfigService.getObjectConfig(
        propsRef.current.currentBook.key,
        "recordLocation",
        {}
      );

      let chapter =
        bookLocation.chapterTitle ||
        (propsRef.current.htmlBook &&
        propsRef.current.htmlBook.flattenChapters[0]
          ? ""
          : "Unknown chapter");
      let chapterDocIndex = 0;
      if (bookLocation.chapterDocIndex) {
        chapterDocIndex = parseInt(bookLocation.chapterDocIndex);
      } else {
        chapterDocIndex =
          bookLocation.chapterTitle && propsRef.current.htmlBook
            ? _.findLastIndex(
                propsRef.current.htmlBook.flattenChapters.map((item) => {
                  item.label = item.label.trim();
                  return item;
                }),
                {
                  label: bookLocation.chapterTitle.trim(),
                }
              )
            : 0;
      }
      propsRef.current.handleCurrentChapter(chapter);
      propsRef.current.handleCurrentChapterIndex(chapterDocIndex);

      updateState({
        chapter,
        chapterDocIndex,
      });
      if (isReadingRawPDF(propsRef.current.currentBook)) {
        //ignore
      } else {
        StyleUtil.addDefaultCss(propsRef.current.currentBook.key);
        await StyleUtil.applyReaderFonts(rendition);
      }
      // rendition.tranformText();
      handleBindGesture();
      await handleHighlight(rendition);
      lock = true;
      setTimeout(() => {
        lock = false;
        if (pendingRerenderRef.current) {
          pendingRerenderRef.current = false;
          handleRenderBook();
        }
      }, 1000);
      return false;
    });
    if (
      propsRef.current.currentBook.format === "TXT" &&
      rendition.format !== "CACHE"
    ) {
      if (
        flattenChapters.length > 0 &&
        flattenChapters[0].label === "Chapter 0"
      ) {
        return;
      }
      setTimeout(async () => {
        await rendition.refreshContent();
        let chapters = rendition.getChapter();
        let flattenChapters = rendition.flatChapter(chapters);
        propsRef.current.handleHtmlBook({
          key: propsRef.current.currentBook.key,
          chapters,
          flattenChapters,
          rendition: rendition,
        });
      }, 1000);
    }
  };

  const handleLocation = () => {
    if (!propsRef.current.htmlBook) {
      return;
    }
    let position = propsRef.current.htmlBook.rendition.getPosition();
    ConfigService.setObjectConfig(
      propsRef.current.currentBook.key,
      position,
      "recordLocation"
    );
  };
  const handleBindGesture = () => {
    let docs = getIframeDoc(propsRef.current.currentBook);
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      if (!doc) continue;
      doc.addEventListener("click", () => {
        propsRef.current.handleLeaveReader("left");
        propsRef.current.handleLeaveReader("right");
        propsRef.current.handleLeaveReader("top");
        propsRef.current.handleLeaveReader("bottom");
      });
      doc.addEventListener("pointerup", (event) => {
        if (isPaginatedBook(propsRef.current.currentBook)) {
          let ownerDoc = (event.target as HTMLElement).ownerDocument;
          let targetIframe = ownerDoc?.defaultView?.frameElement;
          let id = targetIframe?.getAttribute("id") || "";
          let chapterDocIndex = id ? parseInt(id.split("-").reverse()[0]) : 0;
          updateState({ chapterDocIndex });
        }

        if (stateRef.current.isDisablePopup) {
          if (doc!.getSelection()!.toString().trim().length === 0) {
            let rect = doc!
              .getSelection()!
              .getRangeAt(0)
              .getBoundingClientRect();
            updateState({ rect });
          }
        }
        if (stateRef.current.isDisablePopup) return;
        let selection = doc!.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        var rect = selection.getRangeAt(0).getBoundingClientRect();
        updateState({ rect });
      });
      doc.addEventListener("contextmenu", (event) => {
        if (isPaginatedBook(propsRef.current.currentBook)) {
          let ownerDoc = (event.target as HTMLElement).ownerDocument;
          let targetIframe = ownerDoc?.defaultView?.frameElement;
          let id = targetIframe?.getAttribute("id") || "";
          let chapterDocIndex = id ? parseInt(id.split("-").reverse()[0]) : 0;
          updateState({ chapterDocIndex });
        }
        if (document.location.href.indexOf("localhost") === -1) {
          event.preventDefault();
        }

        if (!stateRef.current.isDisablePopup && !stateRef.current.isTouch)
          return;

        if (
          !doc!.getSelection() ||
          doc!.getSelection()!.toString().trim().length === 0
        ) {
          return;
        }
        let selection = doc!.getSelection();

        if (!selection || selection.rangeCount === 0) return;
        var rect = selection.getRangeAt(0).getBoundingClientRect();
        updateState({ rect });
      });
    }
  };

  useEffect(() => {
    propsRef.current.handleFetchBookmarks();
    propsRef.current.handleFetchNotes();
    propsRef.current.handleFetchBooks();
    propsRef.current.handleFetchPlugins();

    handleRenderBook();
    //make sure page width is always 12 times, section = Math.floor(element.clientWidth / 12), or text will be blocked
    updateState(
      getPageWidth(
        propsRef.current.readerMode,
        propsRef.current.scale,
        parseInt(propsRef.current.margin),
        propsRef.current.isNavLocked,
        propsRef.current.isSettingLocked || propsRef.current.isDockedRight,
        propsRef.current.isFitPage
      )
    );
    // 刷新页面后，若 popupBox 处于固定右侧状态，自动恢复显示 popupAssist
    if (propsRef.current.isDockedRight) {
      propsRef.current.handleMenuMode("assistant");
      propsRef.current.handleOpenMenu(true);
    }
    propsRef.current.handleRenderBookFunc(handleRenderBook);
    const resizeHandler = throttle(() => {
      flushSync(() => {
        updateState(
          getPageWidth(
            propsRef.current.readerMode,
            propsRef.current.scale,
            parseInt(propsRef.current.margin),
            propsRef.current.isNavLocked,
            propsRef.current.isSettingLocked || propsRef.current.isDockedRight,
            propsRef.current.isFitPage
          )
        );
      });
      if (lock) {
        pendingRerenderRef.current = true;
      } else {
        handleRenderBook();
      }
    });
    resizeHandlerRef.current = resizeHandler;
    window.addEventListener("resize", resizeHandler);
    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const nextProps = {
      margin,
      scale,
      readerMode,
      isNavLocked,
      isSettingLocked,
      isFitPage,
      isDockedRight,
    };
    const prevProps = prevWidthPropsRef.current;
    prevWidthPropsRef.current = nextProps;
    if (
      nextProps.margin !== prevProps.margin ||
      nextProps.scale !== prevProps.scale ||
      nextProps.readerMode !== prevProps.readerMode ||
      nextProps.isNavLocked !== prevProps.isNavLocked ||
      nextProps.isSettingLocked !== prevProps.isSettingLocked ||
      nextProps.isFitPage !== prevProps.isFitPage ||
      nextProps.isDockedRight !== prevProps.isDockedRight
    ) {
      updateState(
        getPageWidth(
          nextProps.readerMode,
          nextProps.scale,
          parseInt(nextProps.margin),
          nextProps.isNavLocked,
          nextProps.isSettingLocked || nextProps.isDockedRight,
          nextProps.isFitPage
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  let isReadingAid =
    !isReadingRawPDF(currentBook) &&
    (isParagraphMode || isSpeedReading);
  return (
    <>
      {htmlBook && !isReadingAid ? (
        <PopupMenu
          {...({
            rendition: htmlBook.rendition,
            rect: state.rect,
            chapterDocIndex: state.chapterDocIndex,
            chapter: state.chapter,
          } as any)}
        />
      ) : null}
      {htmlBook ? (
        <PopupRefer
          {...({
            rendition: htmlBook.rendition,
            chapterDocIndex: state.chapterDocIndex,
          } as any)}
        />
      ) : null}
      {htmlBook &&
      (isDockedRight ||
        (isOpenMenu &&
          (menuMode === "dict" ||
            menuMode === "trans" ||
            menuMode === "assistant" ||
            menuMode === "note"))) ? (
        <PopupBox
          {...({
            rendition: htmlBook.rendition,
            rect: state.rect,
            chapterDocIndex: state.chapterDocIndex,
            chapter: state.chapter,
          } as any)}
        />
      ) : null}
      {htmlBook && currentBook.format !== "PDF" && (
        <ImageViewer
          {...({
            isShow: props.isShow,
            rendition: htmlBook.rendition,
            handleEnterReader: props.handleEnterReader,
            handleLeaveReader: props.handleLeaveReader,
          } as any)}
        />
      )}
      <div
        className={
          readerMode === "scroll" &&
          !isReadingAidMode(currentBook.format, currentBook.key)
            ? "html-viewer-page scrolling-html-viewer-page"
            : "html-viewer-page"
        }
        id="page-area"
        style={
          readerMode === "scroll" && document.body.clientWidth >= 570
            ? {
                // marginLeft: this.state.pageOffset,
                // marginRight: this.state.pageOffset,
                paddingLeft: "0px",
                paddingRight: "0px",
                left: state.pageOffset,
                width: state.pageWidth,
              }
            : {
                left: state.pageOffset,
                width: state.pageWidth,
              }
        }
      ></div>
      <PageWidget />
      {isHideBackground ||
      textOrientation === "vertical" ||
      isShowPageBorder ||
      ((isParagraphMode ||
        isReadingRuler ||
        isSpeedReading) &&
        !isReadingRawPDF(currentBook)) ||
      isMergeWord ? null : currentBook.key ? (
        <Background />
      ) : null}
    </>
  );
};
export default Viewer;
