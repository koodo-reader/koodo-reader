import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import _ from "underscore";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isPaginatedBook, scrollContents } from "../../utils/common";
import { useAppStore } from "../../store/useAppStore";
import "./readerBottomToolbar.css";

export interface ReaderBottomToolbarProps {
  isNearEdge: boolean;
  showQuickButtons: () => void;
  hideQuickButtons: () => void;
}

let lock = false;
const throttleTime = 200;

const ReaderBottomToolbar = (props: ReaderBottomToolbarProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const isNavLocked = useAppStore((s) => s.reader.isNavLocked);
  const isSettingLocked = useAppStore((s) => s.reader.isSettingLocked);
  const isDockedRight = useAppStore((s) => s.reader.isDockedRight);
  const percentage = useAppStore((s) => s.progressPanel.percentage);
  const handleFetchPercentage = useAppStore((s) => s.handleFetchPercentage);
  const handleCurrentChapter = useAppStore((s) => s.handleCurrentChapter);
  const { t } = useTranslation();
  const [state, setState] = useState<Record<string, any>>({
    currentPage: 0,
    totalPage: 0,
    targetChapterIndex: 0,
    targetPage: 0,
    currentPercentage: 0,
    isEntered: false,
  });

  const handleSaveLocation = () => {
    if (!htmlBook) return;
    const position = htmlBook.rendition.getPosition();
    ConfigService.setObjectConfig(currentBook.key, position, "recordLocation");
  };

  const handleLocation = () => {
    if (!htmlBook) return;
    const position = htmlBook.rendition.getPosition();
    ConfigService.setObjectConfig(currentBook.key, position, "recordLocation");
    handleCurrentChapter(position.chapterTitle);
    setTimeout(() => {
      scrollContents(position.chapterTitle, position.chapterHref);
    }, 1000);
  };

  const handleCurrentChapterIndex = (rendition: any) => {
    const position = rendition.getPosition();
    const href = position.chapterHref;
    if (!href) return;
    const chapterIndex = _.findIndex(htmlBook.flattenChapters, { href });
    setState((prev) => ({ ...prev, targetChapterIndex: chapterIndex + 1 }));
  };

  const handlePageNum = async (rendition: any) => {
    const pageInfo = await rendition.getProgress();
    if (!pageInfo) return;
    setState((prev) => ({
      ...prev,
      currentPage: pageInfo.currentPage,
      totalPage: pageInfo.totalPage,
    }));
  };

  useEffect(() => {
    if (!htmlBook) return;
    const rendition = htmlBook.rendition;
    (async () => {
      await handlePageNum(rendition);
    })();
    const onPageChanged = async () => {
      handleLocation();
      await handlePageNum(rendition);
      handleCurrentChapterIndex(rendition);
      handleFetchPercentage(currentBook);
    };
    const onRendered = async () => {
      await handlePageNum(rendition);
      handleCurrentChapterIndex(rendition);
    };
    rendition.on("page-changed", onPageChanged);
    rendition.on("rendered", onRendered);
    handleCurrentChapterIndex(rendition);
    const bookLocation: {
      text: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
    } = ConfigService.getObjectConfig(currentBook.key, "recordLocation", {});
    if (bookLocation.percentage) {
      const nextPercentage = (
        parseFloat(bookLocation.percentage) * 100
      ).toFixed(2);
      setState((prev) => ({
        ...prev,
        currentPercentage: parseFloat(nextPercentage),
      }));
    }
    return () => {
      rendition.off?.("page-changed", onPageChanged);
      rendition.off?.("rendered", onRendered);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlBook]);

  useEffect(() => {
    if (!htmlBook) return;
    const nextPercentage = (percentage * 100).toFixed(2);
    setState((prev) => ({
      ...prev,
      currentPercentage: parseFloat(nextPercentage),
    }));
  }, [percentage, htmlBook]);

  const onProgressChange = async (event: any) => {
    const value = event.target.value / 100;
    setState((prev) => ({ ...prev, currentPercentage: event.target.value }));
    await htmlBook.rendition.goToPercentage(value);
  };

  const handlePrevPage = async () => {
    if (lock) return;
    lock = true;
    if (
      ConfigService.getReaderConfig("revertDirection") === "yes" &&
      ConfigService.getReaderConfig("textOrientation") !== "vertical"
    ) {
      await htmlBook.rendition.next();
    } else {
      await htmlBook.rendition.prev();
    }
    handleSaveLocation();
    setTimeout(() => (lock = false), throttleTime);
  };

  const handleNextPage = async () => {
    if (lock) return;
    lock = true;
    if (
      ConfigService.getReaderConfig("revertDirection") === "yes" &&
      ConfigService.getReaderConfig("textOrientation") !== "vertical"
    ) {
      await htmlBook.rendition.prev();
    } else {
      await htmlBook.rendition.next();
    }
    handleSaveLocation();
    setTimeout(() => (lock = false), throttleTime);
  };

  const nextChapter = async () => {
    if (htmlBook.flattenChapters.length > 0) {
      await htmlBook.rendition.nextChapter();
    }
  };

  const prevChapter = async () => {
    if (htmlBook.flattenChapters.length > 0) {
      await htmlBook.rendition.prevChapter();
    }
  };

  const handleJumpChapter = async (event: any) => {
    const targetChapterIndex = parseInt(event.target.value.trim()) - 1;
    await htmlBook.rendition.goToChapterIndex(targetChapterIndex);
  };

  if (!htmlBook) return null;

  const readerMode = isPaginatedBook(currentBook)
    ? ConfigService.getReaderConfig("pdfReaderMode") || "scroll"
    : ConfigService.getReaderConfig("readerMode") || "double";

  return (
    <div
      className="reader-quick-buttons reader-bottom-toolbar"
      onMouseEnter={props.showQuickButtons}
      onMouseLeave={props.hideQuickButtons}
      style={{
        position: "absolute",
        bottom: 0,
        left: isNavLocked ? 315 : 15,
        right: isSettingLocked || isDockedRight ? 315 : 15,
        zIndex: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 8,
        opacity: props.isNearEdge ? 1 : 0,
        visibility: props.isNearEdge ? "visible" : "hidden",
        transition: "opacity 0.3s ease, visibility 0.3s ease",
        color: ConfigService.getReaderConfig("textColor") || "",
      }}
    >
      <div className="reader-bottom-toolbar-side reader-bottom-toolbar-side-left">
        <div
          className="previous-chapter"
          onClick={() => {
            handlePrevPage();
          }}
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="icon-dropdown previous-chapter-icon"></span>
        </div>
        <div
          className="previous-chapter previous-chapter-double"
          aria-label={t("Previous chapter")}
          data-tooltip-id="my-tooltip"
          data-tooltip-content={t("Previous chapter")}
          onClick={() => {
            prevChapter();
          }}
          style={{
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
          }}
        >
          <span className="icon-dropdown previous-chapter-icon"></span>
          <span className="icon-dropdown previous-chapter-icon"></span>
        </div>
      </div>
      <div className="reader-bottom-toolbar-left">
        <input
          className="input-progress"
          value={state.currentPercentage}
          type="range"
          max="100"
          min="0"
          step="1"
          onMouseUp={(event) => {
            onProgressChange(event);
          }}
          onTouchEnd={(event) => {
            onProgressChange(event);
          }}
          onChange={(event) => {
            setState((prev) => ({
              ...prev,
              currentPercentage: parseInt(event.target.value),
            }));
          }}
        />
      </div>
      <div className="reader-bottom-toolbar-right">
        <span className="reader-bottom-toolbar-info">
          <span>
            <Trans>Progress</Trans>: {state.currentPercentage}%
          </span>
          <span className="reader-bottom-toolbar-field">
            <Trans>Pages</Trans>
            <input
              type="text"
              name="jumpPage"
              id="jumpPage"
              value={
                state.targetPage
                  ? state.targetPage
                  : state.currentPage *
                    (readerMode === "double" && currentBook.format !== "PDF"
                      ? 2
                      : 1)
              }
              onFocus={() => {
                setState((prev) => ({ ...prev, targetPage: " " }));
              }}
              onChange={(event) => {
                const fieldVal = event.target.value;
                setState((prev) => ({ ...prev, targetPage: fieldVal }));
              }}
              onBlur={(event) => {
                if (event.target.value.trim()) {
                  htmlBook.rendition.goToPage(
                    parseInt(event.target.value.trim())
                  );
                } else {
                  setState((prev) => ({ ...prev, targetPage: "" }));
                }
              }}
            />
            <span>/ {state.totalPage}</span>
          </span>
          <span className="reader-bottom-toolbar-field">
            <Trans>Chapters</Trans>
            <input
              type="text"
              name="jumpChapter"
              id="jumpChapter"
              value={state.targetChapterIndex}
              onFocus={() => {
                setState((prev) => ({ ...prev, targetChapterIndex: " " }));
              }}
              onChange={(event) => {
                const fieldVal = event.target.value;
                setState((prev) => ({ ...prev, targetChapterIndex: fieldVal }));
              }}
              onBlur={(event) => {
                if (!state.isEntered) {
                  if (event.target.value.trim()) {
                    handleJumpChapter(event);
                    setState((prev) => ({ ...prev, targetChapterIndex: "" }));
                  } else {
                    setState((prev) => ({ ...prev, targetChapterIndex: "" }));
                  }
                } else {
                  setState((prev) => ({ ...prev, isEntered: false }));
                }
              }}
              onKeyDown={(event: any) => {
                if (event.key === "Enter") {
                  setState((prev) => ({ ...prev, isEntered: true }));
                  if (event.target.value.trim()) {
                    handleJumpChapter(event);
                    setState((prev) => ({ ...prev, targetChapterIndex: "" }));
                  } else {
                    setState((prev) => ({ ...prev, targetChapterIndex: "" }));
                  }
                }
              }}
            />
            <span>/ {htmlBook.flattenChapters.length}</span>
          </span>
        </span>
      </div>
      <div className="reader-bottom-toolbar-side reader-bottom-toolbar-side-right">
        <div
          className="next-chapter next-chapter-double"
          aria-label={t("Next chapter")}
          data-tooltip-id="my-tooltip"
          data-tooltip-content={t("Next chapter")}
          onClick={() => {
            nextChapter();
          }}
          style={{
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
          }}
        >
          <span className="icon-dropdown next-chapter-icon"></span>
          <span className="icon-dropdown next-chapter-icon"></span>
        </div>
        <div
          className="next-chapter"
          onClick={() => {
            handleNextPage();
          }}
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="icon-dropdown next-chapter-icon"></span>
        </div>
      </div>
    </div>
  );
};

export default ReaderBottomToolbar;
