import { useEffect, useState } from "react";
import "./progressPanel.css";
import { Trans } from "react-i18next";
import { ProgressPanelProps } from "./interface";
import _ from "underscore";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isPaginatedBook, scrollContents } from "../../../utils/common";

const ProgressPanel = (props: ProgressPanelProps) => {
  const [state, setState] = useState<Record<string, any>>({
    currentPage: 0,
    totalPage: 0,
    targetChapterIndex: 0,
    targetPage: 0,
    currentPercentage: 0,
    isEntered: false,
  });

  const handleLocation = () => {
    let position = props.htmlBook.rendition.getPosition();
    ConfigService.setObjectConfig(
      props.currentBook.key,
      position,
      "recordLocation"
    );
    props.handleCurrentChapter(position.chapterTitle);
    setTimeout(() => {
      scrollContents(position.chapterTitle, position.chapterHref);
    }, 1000);
  };

  const handleCurrentChapterIndex = (rendition: any) => {
    let position = rendition.getPosition();

    let href = position.chapterHref;
    if (!href) {
      return;
    }
    let chapterIndex = _.findIndex(props.htmlBook.flattenChapters, {
      href,
    });
    setState((prev) => ({ ...prev, targetChapterIndex: chapterIndex + 1 }));
  };

  const handlePageNum = async (rendition: any) => {
    let pageInfo = await rendition.getProgress();
    if (!pageInfo) {
      return;
    }
    setState((prev) => ({
      ...prev,
      currentPage: pageInfo.currentPage,
      totalPage: pageInfo.totalPage,
    }));
  };

  useEffect(() => {
    if (!props.htmlBook) return;
    const rendition = props.htmlBook.rendition;
    (async () => {
      await handlePageNum(rendition);
    })();
    const onPageChanged = async () => {
      handleLocation();
      await handlePageNum(rendition);
      handleCurrentChapterIndex(rendition);
      props.handleFetchPercentage(props.currentBook);
    };
    const onRendered = async () => {
      await handlePageNum(rendition);
      handleCurrentChapterIndex(rendition);
    };
    rendition.on("page-changed", onPageChanged);
    rendition.on("rendered", onRendered);
    handleCurrentChapterIndex(rendition);
    let bookLocation: {
      text: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
    } = ConfigService.getObjectConfig(
      props.currentBook.key,
      "recordLocation",
      {}
    );
    if (bookLocation.percentage) {
      let percentage = (parseFloat(bookLocation.percentage) * 100).toFixed(2);
      setState((prev) => ({
        ...prev,
        currentPercentage: parseFloat(percentage),
      }));
    }
    return () => {
      rendition.off?.("page-changed", onPageChanged);
      rendition.off?.("rendered", onRendered);
    };
  }, [props.htmlBook]);

  useEffect(() => {
    if (props.htmlBook) {
      let percentage = (props.percentage * 100).toFixed(2);
      setState((prev) => ({
        ...prev,
        currentPercentage: parseFloat(percentage),
      }));
    }
  }, [props.percentage]);

  const onProgressChange = async (event: any) => {
    const percentage = event.target.value / 100;
    setState((prev) => ({ ...prev, currentPercentage: event.target.value }));
    await props.htmlBook.rendition.goToPercentage(percentage);
  };
  const nextChapter = async () => {
    if (props.htmlBook.flattenChapters.length > 0) {
      await props.htmlBook.rendition.nextChapter();
    }
  };
  const prevChapter = async () => {
    if (props.htmlBook.flattenChapters.length > 0) {
      await props.htmlBook.rendition.prevChapter();
    }
  };
  const handleJumpChapter = async (event: any) => {
    let targetChapterIndex = parseInt(event.target.value.trim()) - 1;
    await props.htmlBook.rendition.goToChapterIndex(targetChapterIndex);
  };

  if (!props.htmlBook) {
    return <div className="progress-panel">Loading</div>;
  }
  let readerMode = isPaginatedBook(props.currentBook)
    ? ConfigService.getReaderConfig("pdfReaderMode") || "scroll"
    : ConfigService.getReaderConfig("readerMode") || "double";
  return (
    <div className="progress-panel">
      <p className="progress-text" style={{ marginTop: 10 }}>
        <span>
          <Trans>Progress</Trans>: {state.currentPercentage}
          %&nbsp;&nbsp;&nbsp;
        </span>
      </p>

      <p className="progress-text" style={{ marginTop: 0 }}>
        <Trans>Pages</Trans>
        <input
          type="text"
          name="jumpPage"
          id="jumpPage"
          value={
            state.targetPage
              ? state.targetPage
              : state.currentPage *
                (readerMode === "double" &&
                props.currentBook.format !== "PDF"
                  ? 2
                  : 1)
          }
          onFocus={() => {
            setState((prev) => ({ ...prev, targetPage: " " }));
          }}
          onChange={(event) => {
            let fieldVal = event.target.value;
            setState((prev) => ({ ...prev, targetPage: fieldVal }));
          }}
          onBlur={(event) => {
            if (event.target.value.trim()) {
              props.htmlBook.rendition.goToPage(
                parseInt(event.target.value.trim())
              );
            } else {
              setState((prev) => ({ ...prev, targetPage: "" }));
            }
          }}
        />
        <span>/ {state.totalPage}</span>
        &nbsp;&nbsp;&nbsp;
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
            let fieldVal = event.target.value;
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
        <span>/ {props.htmlBook.flattenChapters.length}</span>
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "90%",
          marginLeft: "5%",
        }}
      >
        <div
          className="previous-chapter"
          onClick={() => {
            prevChapter();
          }}
        >
          <span className="icon-dropdown previous-chapter-icon"> </span>
        </div>
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
          style={{ width: "80%" }}
        />
        <div
          className="next-chapter"
          onClick={() => {
            nextChapter();
          }}
        >
          <span className="icon-dropdown next-chapter-icon"></span>
        </div>
      </div>
    </div>
  );
};

export default ProgressPanel;
