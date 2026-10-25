import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./imageViewer.css";
import { ImageViewerProps, ImageViewerStates } from "./interface";
import { saveAs } from "file-saver";
import { getIframeDoc } from "../../utils/reader/docUtil";
import {
  getShortcutConfig,
  isNextPageKey,
  isPrevPageKey,
  matchShortcut,
} from "../../utils/reader/shortcutUtil";
import toast from "react-hot-toast";
import { useAppStore } from "../../store/useAppStore";
declare var window: any;
declare var ClipboardItem: any;

const NAV_LOCK_MS = 100;

const findImageIndex = (href: string, list: string[]) => {
  if (!href || !list.length) return 0;
  const name = href.split("/").pop() || href;
  const index = list.findIndex(
    (url) => url === href || url.split("/").pop() === name
  );
  return index >= 0 ? index : 0;
};

const ImageViewer = (props: ImageViewerProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const readerMode = useAppStore((s) => s.reader.readerMode);
  const { t } = useTranslation();
  const [state, setState] = useState<ImageViewerStates>({
    isShowImage: false,
    imageRatio: "horizontal",
    imageName: "",
    zoomIndex: 0,
    rotateIndex: 0,
    imageList: [],
    currentIndex: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const propsRef = useRef(props);
  propsRef.current = props;
  const lockRef = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const showAt = useCallback((index: number, list?: string[]) => {
    const targetList = list ?? stateRef.current.imageList;
    if (index < 0 || index >= targetList.length) return;
    const image = imageRef.current;
    if (!image) return;

    // 先恢复默认宽度约束，避免换图时 img 以原始尺寸闪现
    image.style.width = "60vw";
    image.style.removeProperty("margin-top");
    image.style.removeProperty("transform");
    image.style.removeProperty("height");

    if (previewRef.current) {
      previewRef.current.scrollTop = 0;
      previewRef.current.scrollLeft = 0;
    }

    const url = targetList[index];
    const loader = new Image();
    loader.onload = () => {
      const horizontal = loader.naturalWidth / loader.naturalHeight > 1;
      setState((prev) => ({
        ...prev,
        imageList: targetList,
        currentIndex: index,
        imageRatio: horizontal ? "horizontal" : "vertical",
        zoomIndex: 0,
        rotateIndex: 0,
      }));
      image.style.width = "60vw";
    };
    loader.src = url;
    image.src = url;
  }, []);

  const loadChapterImages = useCallback(async (direction: "next" | "prev") => {
    const { rendition } = propsRef.current;
    while (true) {
      const prevChapterDocIndex =
        rendition.getPosition()?.chapterDocIndex || "";
      await rendition[direction === "next" ? "nextChapter" : "prevChapter"]();
      if (
        (rendition.getPosition()?.chapterDocIndex || "") === prevChapterDocIndex
      ) {
        return null;
      }
      const list = (await rendition.getImageList?.()) || [];
      if (list.length) return list;
    }
  }, []);

  const shiftImage = useCallback(
    async (step: number) => {
      if (lockRef.current || !stateRef.current.isShowImage) return;
      lockRef.current = true;
      try {
        const { imageList, currentIndex } = stateRef.current;
        const next = currentIndex + step;
        if (next >= 0 && next < imageList.length) {
          showAt(next);
          return;
        }
        const list = await loadChapterImages(step > 0 ? "next" : "prev");
        if (!list) {
          toast(t("No more images"));
          return;
        }
        showAt(step > 0 ? 0 : list.length - 1, list);
      } finally {
        setTimeout(() => (lockRef.current = false), NAV_LOCK_MS);
      }
    },
    [loadChapterImages, showAt]
  );

  const hideImage = useCallback((event?: any) => {
    event?.preventDefault?.();
    const image = imageRef.current;
    if (image) {
      image.src = "";
      image.style.removeProperty("margin-top");
      image.style.removeProperty("transform");
      image.style.removeProperty("width");
      image.style.removeProperty("height");
    }
    setState((prev) => ({
      ...prev,
      isShowImage: false,
      imageList: [],
      currentIndex: 0,
      zoomIndex: 0,
      rotateIndex: 0,
    }));
  }, []);

  const handleKeyDown = useCallback(
    async (event: Event) => {
      if (!stateRef.current.isShowImage) return;
      const keyEvent = event as KeyboardEvent;
      const tag = (keyEvent.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "textarea" || tag === "input") return;

      const shortcuts = getShortcutConfig();

      if (matchShortcut(keyEvent, shortcuts.exitReader)) {
        keyEvent.preventDefault();
        keyEvent.stopPropagation();
        hideImage(keyEvent);
        return;
      }

      if (
        !isPrevPageKey(keyEvent, readerMode) &&
        !isNextPageKey(keyEvent, readerMode)
      ) {
        return;
      }

      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      keyEvent.stopImmediatePropagation();
      await shiftImage(isPrevPageKey(keyEvent, readerMode) ? -1 : 1);
    },
    [hideImage, shiftImage, readerMode]
  );

  const showImage = useCallback(
    async (event: any) => {
      event.preventDefault();
      const currentProps = propsRef.current;
      if (currentProps.isShow) {
        ["left", "right", "top", "bottom"].forEach((pos) =>
          currentProps.handleLeaveReader(pos)
        );
      }

      const { rendition } = currentProps;
      let href = rendition.getTargetHref(event);
      if (
        href &&
        (rendition.resolveChapter(href) ||
          href.indexOf("#") > -1 ||
          href.indexOf("../") === 0 ||
          href.indexOf("http") === 0 ||
          href.indexOf("mailto") === 0 ||
          href.indexOf("OEBPF") > -1 ||
          href.indexOf("kindle:") > -1 ||
          href.indexOf("footnote") > -1)
      ) {
        return;
      }
      if (
        event.target.tagName === "IMG" &&
        event.target.getAttribute("alt") &&
        ((event.target.getAttribute("class") || "").includes("footnote") ||
          (event.target.getAttribute("id") || "").includes("footnote"))
      ) {
        window.vex.dialog.alert(event.target.getAttribute("alt"));
        return;
      }
      if (event.target.tagName === "IMG" && event.target.src) {
        href = event.target.src;
      }
      if (
        event.target.tagName === "image" &&
        event.target.getAttribute("xlink:href")
      ) {
        href = event.target.getAttribute("xlink:href");
      }
      if (event.target.tagName === "IMG" && event.target.getAttribute("alt")) {
        setState((prev) => ({
          ...prev,
          imageName: event.target.getAttribute("alt"),
        }));
      }
      if (!href) return;

      const list = (await currentProps.rendition.getImageList?.()) || [];
      const images = list.length ? list : [href];
      setState((prev) => ({ ...prev, isShowImage: true }));
      showAt(findImageIndex(href, images), images);
      requestAnimationFrame(() => {
        previewRef.current?.focus({ preventScroll: true });
        window.focus();
      });
    },
    [showAt]
  );

  const bindDocEvents = useCallback(
    (bind: boolean) => {
      const method = bind ? "addEventListener" : "removeEventListener";
      getIframeDoc(currentBook).forEach((doc) => {
        if (!doc) return;
        doc[method]("click", showImage);
        doc[method]("keydown", handleKeyDown, true);
        doc.defaultView?.[method]("keydown", handleKeyDown, true);
      });
    },
    [handleKeyDown, showImage]
  );

  const onRendered = useCallback(() => bindDocEvents(true), [bindDocEvents]);

  useEffect(() => {
    bindDocEvents(true);
    props.rendition.on("rendered", onRendered);
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      propsRef.current.rendition.off?.("rendered", onRendered);
      bindDocEvents(false);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [bindDocEvents, handleKeyDown, onRendered]);

  const handleZoomIn = () => {
    const image: any = imageRef.current;
    if (!image) return;
    if (image.style.width === "200vw") return;
    const nextZoomIndex = stateRef.current.zoomIndex + 1;
    setState((prev) => ({ ...prev, zoomIndex: nextZoomIndex }));
    image.style.width = `${60 + nextZoomIndex * 10}vw`;
  };

  const handleZoomOut = () => {
    const image: any = imageRef.current;
    if (!image) return;
    if (image.style.width === "10vw") return;
    const nextZoomIndex = stateRef.current.zoomIndex - 1;
    setState((prev) => ({ ...prev, zoomIndex: nextZoomIndex }));
    image.style.width = `${60 + nextZoomIndex * 10}vw`;
  };

  const handleSave = async () => {
    const image: any = imageRef.current;
    if (!image?.src) return;
    const blob = await fetch(image.src).then((r) => r.blob());
    saveAs(
      blob,
      state.imageName ? state.imageName : `${new Date().toLocaleDateString()}`
    );
  };

  const handleCopy = async () => {
    const image: any = imageRef.current;
    if (!image?.src) return;
    const blob = await fetch(image.src).then((r) => r.blob());

    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0);

    canvas.toBlob(async (pngBlob) => {
      if (pngBlob) {
        const data = [new ClipboardItem({ "image/png": pngBlob })];
        await (navigator.clipboard as any).write(data);
      }
    }, "image/png");

    URL.revokeObjectURL(img.src);
    toast.success(t("Image copied to clipboard"));
  };

  const handleClock = () => {
    const image: any = imageRef.current;
    if (!image) return;
    const nextRotateIndex = stateRef.current.rotateIndex + 1;
    setState((prev) => ({ ...prev, rotateIndex: nextRotateIndex }));
    image.style.transform = `rotate(${nextRotateIndex * 90}deg)`;
  };

  const handleCounterClock = () => {
    const image: any = imageRef.current;
    if (!image) return;
    const nextRotateIndex = stateRef.current.rotateIndex - 1;
    setState((prev) => ({ ...prev, rotateIndex: nextRotateIndex }));
    image.style.transform = `rotate(${nextRotateIndex * 90}deg)`;
  };

  const { isShowImage, imageName } = state;
  return (
    <div
      className="image-preview"
      ref={previewRef}
      tabIndex={-1}
      style={isShowImage ? {} : { display: "none" }}
    >
      <div
        className="image-background"
        style={isShowImage ? { backgroundColor: "rgba(0,0,0,0.8)" } : {}}
        onClick={hideImage}
      />
      {isShowImage && (
        <>
          <div
            className="image-nav image-nav-prev"
            onClick={(e) => {
              e.stopPropagation();
              shiftImage(-1);
            }}
          >
            <span className="icon-dropdown image-nav-prev-icon" />
          </div>
          <div
            className="image-nav image-nav-next"
            onClick={(e) => {
              e.stopPropagation();
              shiftImage(1);
            }}
          >
            <span className="icon-dropdown image-nav-next-icon" />
          </div>
        </>
      )}
      <div className="image-content">
        <img
          ref={imageRef}
          src=""
          alt={imageName}
          className="image"
          style={{ width: "60vw" }}
        />
      </div>
      <div className="image-operation">
        <span
          className="icon-zoom-in zoom-in-icon"
          onClick={() => {
            handleZoomIn();
          }}
        ></span>
        <span
          className="icon-zoom-out zoom-out-icon"
          onClick={() => {
            handleZoomOut();
          }}
        ></span>
        <span
          className="icon-save save-icon"
          onClick={() => {
            handleSave();
          }}
        ></span>
        <span
          className="icon-copy-line save-icon"
          onClick={() => {
            handleCopy();
          }}
        ></span>
        <span
          className="icon-clockwise clockwise-icon"
          onClick={() => {
            handleClock();
          }}
        ></span>
        <span
          className="icon-counterclockwise counterclockwise-icon"
          onClick={() => {
            handleCounterClock();
          }}
        ></span>
      </div>
    </div>
  );
};

export default ImageViewer;
