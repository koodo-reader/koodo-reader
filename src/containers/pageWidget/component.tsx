import React from "react";
import "./pageWidget.css";
import { PageWidgetProps, PageWidgetState } from "./interface";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { Trans } from "react-i18next";
import { getBatchTrans, getWordDefinitions } from "../../utils/request/reader";
import {
  detectLocalLanguage,
  getFullTranslationTarget,
} from "../../utils/common";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import DatabaseService from "../../utils/storage/databaseService";
import Note from "../../models/Note";
import ConfigUtil from "../../utils/file/configUtil";
declare var window: any;

type TransCache = Record<string, Record<string, string>>;

class PageWidget extends React.Component<PageWidgetProps, PageWidgetState> {
  isFirst: Boolean;
  timeInterval: any;
  lastBatchTranslationTriggerAt: number;
  batchTranslationLock: Promise<any>;
  transCache: TransCache | null;
  transCachePath: string;
  constructor(props: any) {
    super(props);
    this.state = {
      isSingle: this.props.readerMode !== "double",
      prevPage: 0,
      nextPage: 0,
      currentTime: this.getFormattedTime(),
      percentage: "",
      ignoreNextPageChange: false,
    };
    this.isFirst = true;
    this.lastBatchTranslationTriggerAt = 0;
    this.batchTranslationLock = Promise.resolve();
    this.transCache = null;
    this.transCachePath = "";
  }

  getFormattedTime() {
    const now = new Date();
    return (
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0")
    );
  }

  async componentDidMount() {
    this.timeInterval = setInterval(() => {
      this.setState({ currentTime: this.getFormattedTime() });
    }, 60000);
  }

  componentWillUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  async UNSAFE_componentWillReceiveProps(nextProps: PageWidgetProps) {
    if (
      nextProps.htmlBook !== this.props.htmlBook &&
      nextProps.htmlBook &&
      !this.props.htmlBook
    ) {
      await this.handlePageNum(nextProps.htmlBook.rendition);
      nextProps.htmlBook.rendition.on("page-changed", async () => {
        await this.handlePageNum(nextProps.htmlBook.rendition);
        await this.handleBatchTranslation(nextProps.htmlBook.rendition);
        if (this.state.ignoreNextPageChange) {
          this.setState({ ignoreNextPageChange: false });
        } else {
          this.props.handleJumpPosition(null);
        }
      });
      nextProps.htmlBook.rendition.on(
        "annotation-changed",
        async (chapterDocIndex: number) => {
          let annotationData =
            nextProps.htmlBook.rendition.getAnnotationData(chapterDocIndex);
          let notes = await ConfigUtil.getNotesByBookKeyAndTypeWithSort(
            this.props.currentBook.key,
            "annotation"
          );
          let note = notes.find(
            (note: Note) => note.chapterIndex === chapterDocIndex
          );
          if (note) {
            note = await DatabaseService.getRecord(note.key, "notes");
            let newNote = {
              ...note,
              range: JSON.stringify(annotationData),
            };
            await DatabaseService.updateRecord(newNote, "notes");
          } else {
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
              this.props.currentBook.key,
              "recordLocation",
              {}
            );
            let newNote = new Note(
              this.props.currentBook.key,
              bookLocation.chapterTitle,
              chapterDocIndex,
              "",
              JSON.stringify(bookLocation),
              JSON.stringify(annotationData),
              "annotation",
              bookLocation.percentage,
              "annotation",
              []
            );
            await DatabaseService.saveRecord(newNote, "notes");
          }
          this.props.handleFetchNotes();
        }
      );
      nextProps.htmlBook.rendition.on("rendered", async () => {
        await this.handlePageNum(nextProps.htmlBook.rendition);
        await this.handleBatchTranslation(nextProps.htmlBook.rendition);
        await this.handleWordDefinition(nextProps.htmlBook.rendition);
      });
    }
    if (nextProps.readerMode !== this.props.readerMode) {
      this.setState({ isSingle: nextProps.readerMode !== "double" });
    }
    if (
      nextProps.jumpPosition !== this.props.jumpPosition &&
      nextProps.jumpPosition !== null
    ) {
      this.setState({ ignoreNextPageChange: true });
    }
  }
  getTransCachePath(): string {
    if (this.transCachePath) {
      return this.transCachePath;
    }
    const electron = window.electronAPI;
    const dirPath = electron.sendSync("user-data", "ping");
    const transDir = electron.path.join(dirPath, "trans");
    if (!electron.fs.existsSync(transDir)) {
      electron.fs.mkdirSync(transDir, { recursive: true });
    }
    this.transCachePath = electron.path.join(
      transDir,
      this.props.currentBook.key + ".json"
    );
    return this.transCachePath;
  }

  getTransCache(): TransCache {
    if (this.transCache) {
      return this.transCache;
    }
    let cache: TransCache = {};
    if (isElectron && window.electronAPI && window.electronAPI.fs) {
      try {
        const cachePath = this.getTransCachePath();
        const fs = window.electronAPI.fs;
        if (fs.existsSync(cachePath)) {
          cache = JSON.parse(fs.readFileSync(cachePath, "utf-8")) || {};
        }
      } catch (error) {
        console.error("Failed to load translation cache:", error);
        cache = {};
      }
    }
    this.transCache = cache;
    return cache;
  }

  saveTransCache(cache: TransCache) {
    if (!isElectron || !window.electronAPI || !window.electronAPI.fs) {
      return;
    }
    try {
      const cachePath = this.getTransCachePath();
      window.electronAPI.fs.writeFileSync(
        cachePath,
        JSON.stringify(cache),
        "utf-8"
      );
    } catch (error) {
      console.error("Failed to save translation cache:", error);
    }
  }

  async handleBatchTranslation(rendition) {
    const prev = this.batchTranslationLock;
    const next = prev.then(async () => {
      if (
        !ConfigService.getAllListConfig("fullTranslationBooks").includes(
          this.props.currentBook.key
        ) ||
        ConfigService.getReaderConfig("fullTranslationMode") === "no" ||
        !this.props.isAuthed
      ) {
        return;
      }

      let batchTransTexts: string[] = await rendition.getBatchTransTexts();
      if (batchTransTexts && batchTransTexts.length > 0) {
        let targetLang = getFullTranslationTarget();
        let cache = this.getTransCache();
        let translatedTexts: string[] = new Array(batchTransTexts.length);
        let pendingIndexes: number[] = [];
        let pendingTexts: string[] = [];
        batchTransTexts.forEach((text, index) => {
          let cachedText = cache[targetLang] && cache[targetLang][text];
          if (cachedText !== undefined) {
            translatedTexts[index] = cachedText;
          } else {
            pendingIndexes.push(index);
            pendingTexts.push(text);
          }
        });
        if (pendingTexts.length > 0) {
          let res = await getBatchTrans(pendingTexts, "Automatic", targetLang);
          if (res && res.data && res.data.texts) {
            pendingIndexes.forEach((index, i) => {
              translatedTexts[index] = res.data.texts[i];
              if (!cache[targetLang]) {
                cache[targetLang] = {};
              }
              cache[targetLang][batchTransTexts[index]] = res.data.texts[i];
            });
            this.saveTransCache(cache);
          }
        }
        if (translatedTexts.every((text) => text !== undefined)) {
          rendition.handleBatchTransResult(batchTransTexts, translatedTexts);
        }
      }
    });
    this.batchTranslationLock = next.catch(() => {});
    return next;
  }
  async handleWordDefinition(rendition) {
    const prev = this.batchTranslationLock;
    const next = prev.then(async () => {
      if (
        !ConfigService.getAllListConfig("wordDefinitionBooks").includes(
          this.props.currentBook.key
        ) ||
        !this.props.isAuthed
      ) {
        return;
      }

      let wordTexts = await rendition.audioText();
      if (wordTexts && wordTexts.length > 0) {
        let lang = detectLocalLanguage(wordTexts.slice(0, 500).join(" "));
        if (lang === "ko") {
          toast.error(
            this.props.t(
              "Unsupported language for word definition, currently only Chinese, Japanese and English are supported"
            )
          );
          return;
        }
        let currentLevel =
          lang === "zh"
            ? ConfigService.getReaderConfig("currentChineseLevel") || "HSK3"
            : lang === "ja"
              ? ConfigService.getReaderConfig("currentJapaneseLevel") || "N3"
              : ConfigService.getReaderConfig("currentEnglishLevel") || "四级";
        let res = await getWordDefinitions(wordTexts, currentLevel, lang);

        if (res && res.data && res.data.results) {
          rendition.handleWordDefinitionResult(
            res.data.results,
            lang,
            ConfigService.getReaderConfig("lang")
          );
        }
      }
    });
    this.batchTranslationLock = next.catch(() => {});
    return next;
  }
  async handlePageNum(rendition) {
    let pageInfo = await rendition.getProgress();
    if (!pageInfo) {
      return;
    }
    if (
      this.props.currentBook.format === "PDF" &&
      !ConfigService.getAllListConfig("convertPDFBooks").includes(
        this.props.currentBook.key
      )
    ) {
      this.setState({
        prevPage: pageInfo.currentPage,
        nextPage: pageInfo.currentPage + 1,
        percentage: pageInfo.percentage,
      });
      return;
    }
    this.setState({
      prevPage: this.state.isSingle
        ? pageInfo.currentPage
        : pageInfo.currentPage * 2 - 1,
      nextPage: this.state.isSingle
        ? pageInfo.currentPage
        : pageInfo.currentPage * 2,
      percentage: pageInfo.percentage,
    });
  }

  render() {
    return (
      <>
        <div
          className="background"
          style={{
            color: ConfigService.getReaderConfig("textColor")
              ? ConfigService.getReaderConfig("textColor")
              : "",
            width:
              !this.props.isNavLocked &&
              !this.props.isSettingLocked &&
              !this.props.isDockedRight
                ? "100%"
                : this.props.isNavLocked &&
                    (this.props.isSettingLocked || this.props.isDockedRight)
                  ? "calc(100% - 600px)"
                  : "calc(100% - 300px)",
            left: !this.props.isNavLocked ? "0" : "300px",
            right:
              !this.props.isSettingLocked && !this.props.isDockedRight
                ? "0"
                : "300px",
            backgroundColor: this.props.backgroundColor,
            filter: `brightness(${
              ConfigService.getReaderConfig("brightness") || 1
            }) invert(${
              ConfigService.getReaderConfig("isInvert") === "yes" ? 1 : 0
            })`,
          }}
        >
          <div className="header-container">
            {!this.props.isHideHeader && this.props.currentChapter + "" && (
              <p
                className="header-chapter-name"
                style={
                  this.state.isSingle
                    ? {
                        left: `calc(50vw - 
                      270px)`,
                      }
                    : {}
                }
              >
                {this.props.currentChapter}
              </p>
            )}
            {!this.props.isHideHeader &&
              this.props.currentChapter + "" &&
              !this.state.isSingle && (
                <p
                  className="header-book-name"
                  style={
                    this.state.isSingle
                      ? {
                          right: `calc(50vw - 
                      270px)`,
                        }
                      : {}
                  }
                >
                  {this.props.currentBook.name}
                </p>
              )}
            {!this.props.isHideHeader && (
              <>
                <span className="footer-time">
                  {this.state.currentTime}
                  {this.state.percentage
                    ? "  " +
                      (parseFloat(this.state.percentage) * 100).toFixed(2) +
                      "%"
                    : ""}
                </span>
              </>
            )}
          </div>
          <div className="footer-container">
            {!this.props.isHideFooter && this.state.prevPage > 0 && (
              <p
                className="background-page-left"
                style={
                  this.state.isSingle
                    ? {
                        left: `calc(50vw - 
                      270px)`,
                      }
                    : {}
                }
              >
                <Trans i18nKey="Book page" count={this.state.prevPage}>
                  Page
                  {{
                    count: this.state.prevPage,
                  }}
                </Trans>
              </p>
            )}
            {!this.props.isHideFooter &&
              this.state.nextPage > 0 &&
              !this.state.isSingle && (
                <p className="background-page-right">
                  <Trans i18nKey="Book page" count={this.state.nextPage}>
                    Page
                    {{
                      count: this.state.nextPage,
                    }}
                  </Trans>
                </p>
              )}
          </div>
          <>
            {this.props.isShowBookmark ? (
              <div className="bookmark"></div>
            ) : null}
          </>
          {this.props.isShowPageBorder && (
            <>
              <div className="page-border"></div>
              <div className="inner-page-border"></div>
              <div className="page-border-header-line"></div>
              <div className="page-border-footer-line"></div>
              {!this.state.isSingle && (
                <div
                  className="page-border-center-line"
                  style={
                    this.props.textOrientation === "vertical"
                      ? {
                          top: "50%",
                          height: "1px",
                          width: "calc(100% - 30px)",
                          left: "15px",
                          right: "15px",
                        }
                      : {}
                  }
                ></div>
              )}
            </>
          )}
        </div>
        {this.props.jumpPosition && (
          <div className="jump-return-button-container">
            <button
              className="jump-return-button"
              onClick={async () => {
                if (this.props.jumpPosition && this.props.htmlBook) {
                  this.setState({ ignoreNextPageChange: true });
                  await this.props.htmlBook.rendition.goToPosition(
                    JSON.stringify(this.props.jumpPosition)
                  );
                  this.props.handleJumpPosition(null);
                }
              }}
            >
              {this.props.t("Return")}
            </button>
          </div>
        )}
      </>
    );
  }
}

export default PageWidget;
