import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import "./popupRefer.css";
import { PopupReferProps } from "./interface";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import {
  isReadingRawPDF,
  openExternalUrl,
  vexComfirmAsync,
} from "../../../utils/common";
import Parser from "html-react-parser";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { useAppStore } from "../../../store/useAppStore";

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const PopupRefer = (props: PopupReferProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const readerMode = useAppStore((s) => s.reader.readerMode);
  const handleJumpPosition = useAppStore((s) => s.handleJumpPosition);
  const { t } = useTranslation();
  const [rect, setRect] = useState<any>({});
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [footnote, setFootnote] = useState("");
  const [href, setHref] = useState("");
  const [isJump, setIsJump] = useState(false);
  const [returnPosition, setReturnPosition] = useState<any>(null);
  const propsRef = useLatest(props);
  const isOpenMenuRef = useLatest(isOpenMenu);

  const getHtmlPosition = (menuRect: any) => {
    let pageSize = props.rendition.getPageSize();
    let posY = menuRect.bottom - pageSize.scrollTop;
    let posX = menuRect.left + menuRect.width / 2;
    if (menuRect.width > pageSize.sectionWidth) {
      posX = menuRect.left + menuRect.width - pageSize.sectionWidth / 2;
    }
    if (pageSize.height - menuRect.height < 188) {
      posY = menuRect.top + 16 + pageSize.top;
    } else if (posY < pageSize.height - 188 + pageSize.top) {
      posY = posY + 16 + pageSize.top;
    } else {
      posY = posY - menuRect.height - 188 + pageSize.top;
    }
    posX = posX - 135 + pageSize.left;
    if (
      isReadingRawPDF(currentBook) &&
      readerMode === "double" &&
      props.chapterDocIndex % 2 === 1
    ) {
      posX = posX + pageSize.sectionWidth + pageSize.gap;
    }
    if (
      isReadingRawPDF(currentBook) &&
      readerMode === "scroll"
    ) {
      posY = posY + props.chapterDocIndex * pageSize.sectionHeight;
    }
    if (posX < 0) {
      posX = 20;
    }
    if (posY < 0) {
      posY = 20;
    }
    if (posX > document.body.clientWidth - 290 - 20) {
      posX = document.body.clientWidth - 290 - 20;
    }
    if (posY > document.body.clientHeight - 250 - 20) {
      posY = document.body.clientHeight - 250 - 20;
    }
    if (
      readerMode === "scroll" &&
      currentBook.format === "PDF"
    ) {
      posX = posX - pageSize.scrollLeft;
    }
    return { posX, posY } as any;
  };

  const showMenu = (menuRect: any) => {
    if (!menuRect) return;
    let { posX, posY } = getHtmlPosition(menuRect);
    let popupMenu = document.querySelector(".popup-ref-container");
    popupMenu?.setAttribute("style", `left:${posX}px;top:${posY}px`);
  };

  const handleShowMenu = async (node: any, menuRect: any) => {
    let result = await props.rendition.getFootnoteContent(node);
    if (!result.handled) return;
    setRect(menuRect);
    setFootnote(result.content);
    setIsOpenMenu(true);
    setTimeout(() => showMenu(menuRect), 0);
  };

  const handleLinkJump = async (event: any): Promise<boolean> => {
    let targetHref = props.rendition.getTargetHref(event);
    let result = await props.rendition.handleLinkJump(targetHref, event);
    if (!result.handled) {
      return false;
    }
    if (result.external) {
      const confirm = await vexComfirmAsync(
        t("Do you want to open this link in browser") +
          "<br><span style='word-break:break-all'>" +
          escapeHtml(targetHref) +
          "</span>"
      );
      if (confirm) {
        openExternalUrl(targetHref);
      }
      return true;
    }
    if (result.redirectChapter) {
      let prevPosition = ConfigService.getObjectConfig(
        currentBook.key,
        "recordLocation",
        {}
      );
      handleJumpPosition(prevPosition);
    }
    if (result.isJump) {
      setIsJump(true);
      setReturnPosition(
        ConfigService.getObjectConfig(
          currentBook.key,
          "recordLocation",
          {}
        )
      );
    }
    if (result.href) {
      setHref(result.href);
    }
    if (result.isShowMenu) {
      let targetElement = event.target;
      let targetRect = targetElement.getBoundingClientRect();
      await handleShowMenu(result.node, targetRect);
      return true;
    }
    return true;
  };

  const handleLink = async (event: any) => {
    if (isOpenMenuRef.current) {
      setIsOpenMenu(false);
      return;
    }
    handleLinkJump(event);
  };
  const handleLinkRef = useLatest(handleLink);

  useEffect(() => {
    const onRendered = () => {
      let docs = getIframeDoc(currentBook);
      for (let i = 0; i < docs.length; i++) {
        let doc = docs[i];
        if (!doc) continue;
        doc.addEventListener("click", (event: any) =>
          handleLinkRef.current(event)
        );
      }
    };
    props.rendition.on("rendered", onRendered);
    return () => {
      props.rendition.off?.("rendered", onRendered);
    };
  }, []);

  return (
    <div>
      <div
        className="popup-menu-container popup-ref-container"
        style={isOpenMenu ? {} : { display: "none" }}
      >
        <div
          className="popup-menu-box popup-ref-box"
          onClick={(event) => {
            handleLinkJump(event);
            event.stopPropagation();
            event.preventDefault();
          }}
        >
          {Parser(footnote)}
          <div className="popup-ref-button">
            <span
              style={{ marginRight: 10 }}
              onClick={() => {
                navigator.clipboard.writeText(
                  footnote.replace(/<[^>]+>/g, "").trim()
                );
                toast.success(t("Copying successful"));
              }}
            >
              {t("Copy")}
            </span>
            {href && (
              <span
                onClick={async () => {
                  if (isJump && returnPosition) {
                    await props.rendition.goToPosition(
                      JSON.stringify(returnPosition)
                    );
                    setIsJump(false);
                    setReturnPosition(null);
                    setIsOpenMenu(false);
                    return;
                  }
                  let pageArea = document.getElementById("page-area");
                  if (!pageArea) return false;
                  let iframe = pageArea.getElementsByTagName("iframe")[0];
                  if (!iframe) return false;
                  let doc: any = iframe.contentDocument;
                  if (!doc) {
                    return false;
                  }
                  if (!href) {
                    return false;
                  }
                  let id = href.split("#").reverse()[0];
                  setIsJump(true);
                  setReturnPosition(
                    ConfigService.getObjectConfig(
                      currentBook.key,
                      "recordLocation",
                      {}
                    )
                  );
                  if (id) {
                    await props.rendition.goToNode(
                      doc.body.querySelector("#" + CSS.escape(id)) || doc.body
                    );
                  }
                }}
                style={{
                  color: isJump ? "rgba(231, 69, 69, 0.8)" : "",
                }}
              >
                {t(isJump ? "Return" : "Go to")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupRefer;
