import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/fileUtils/bookUtil";
import PopupMenu from "../../components/popups/popupMenu";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import RecordLocation from "../../utils/readUtils/recordLocation";
import Background from "../../components/background";
import toast from "react-hot-toast";
import StyleUtil from "../../utils/readUtils/styleUtil";
import "./index.css";
import { HtmlMouseEvent } from "../../utils/serviceUtils/mouseEvent";
import ImageViewer from "../../components/imageViewer";
import { getIframeDoc } from "../../utils/serviceUtils/docUtil";
import { tsTransform } from "../../utils/serviceUtils/langUtil";
import { binicReadingProcess } from "../../utils/serviceUtils/bionicUtil";
import PopupBox from "../../components/popups/popupBox";
import { renderHighlighters } from "../../utils/serviceUtils/noteUtil";
import Note from "../../models/Note";
import PageWidget from "../../containers/pageWidget";
import { scrollContents } from "../../utils/commonUtil";


declare var window: any;
let lock = false; //prevent from clicking too fasts

class Viewer extends React.Component<ViewerProps, ViewerState> {
  lock: boolean;
  observer: MutationObserver | null = null;
  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      cfiRange: null,
      contents: null,
      rect: null,
      key: "",
      isFirst: true,
      scale: StorageUtil.getReaderConfig("scale") || 1,
      chapterTitle:
        RecordLocation.getHtmlLocation(this.props.currentBook.key)
          .chapterTitle || "",
      readerMode: StorageUtil.getReaderConfig("readerMode") || "double",
      isDisablePopup: StorageUtil.getReaderConfig("isDisablePopup") === "yes",
      isTouch: StorageUtil.getReaderConfig("isTouch") === "yes",
      margin: parseInt(StorageUtil.getReaderConfig("margin")) || 0,
      chapterDocIndex: parseInt(
        RecordLocation.getHtmlLocation(this.props.currentBook.key)
          .chapterDocIndex || 0
      ),
      pageOffset: "",
      pageWidth: "",
      chapter: "",
      rendition: null,
      isColorChanged: StorageUtil.getReaderConfig("changeColorsTriggered") === "true"
    };
    this.lock = false;

  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBookmarks();
    this.props.handleFetchNotes();
    this.props.handleFetchBooks();
  }
  componentDidMount() {
    window.rangy.init();

    //make sure page width is always 12 times, section = Math.floor(element.clientWidth / 12), or text will be blocked
    this.handlePageWidth();
    window.addEventListener("resize", () => {

      BookUtil.reloadBooks();
    });

    window.addEventListener("localStorageChange", () => {

      this.handleLocalStorageChange();
    })

    window.addEventListener("removeStyles", () => {
      this.disableBackgroundColor();
    })
    const changeColorsTriggered = StorageUtil.getReaderConfig("changeColorsTriggered") === "true";

    this.handleChangeStyle(changeColorsTriggered);


  }

  componentWillUnmount() {
    //écouteur d’événement est nettoyé lorsque le composant se démonte
    window.removeEventListener("localStorageChange", this.handleLocalStorageChange);
    window.removeEventListener("removeStyles", this.disableBackgroundColor)
  }


  handleChangeStyle = async (changeColorsTriggered: boolean) => {
    if (changeColorsTriggered) {
      await this.handleRenderBookWithLinesColor();
      this.props.handleRenderBookWithLinesColoredFunc(this.handleRenderBookWithLinesColor);

    } else {
      await this.handleRenderBook();
      this.props.handleRenderBookFunc(this.handleRenderBook);
    }

  };

  handleLocalStorageChange = () => {
    const changeColorsTriggered = StorageUtil.getReaderConfig("changeColorsTriggered") === "true";
    this.setState({ isColorChanged: changeColorsTriggered }, () => {
      this.handleChangeStyle(this.state.isColorChanged);
    });
  };

  handlePageWidth = () => {
    const findValidMultiple = (limit: number) => {
      let multiple = limit - (limit % 12);

      while (multiple >= 0) {
        if (((multiple - multiple / 12) / 2) % 2 === 0) {
          return multiple;
        }
        multiple -= 12;
      }

      return limit;
    };

    if (document.body.clientWidth < 570) {
      let width = findValidMultiple(document.body.clientWidth - 72);

      this.setState({
        pageOffset: `calc(50vw - ${width / 2}px)`,
        pageWidth: `${width}px`,
      });
    } else if (this.state.readerMode === "scroll") {
      let width = findValidMultiple(276 * parseFloat(this.state.scale) * 2);
      this.setState({
        pageOffset: `calc(50vw - ${width / 2}px)`,
        pageWidth: `${width}px`,
      });
    } else if (this.state.readerMode === "single") {
      let width = findValidMultiple(
        276 * parseFloat(this.state.scale) * 2 - 36
      );
      this.setState({
        pageOffset: `calc(50vw - ${width / 2}px)`,
        pageWidth: `${width}px`,
      });

    } else if (this.state.readerMode === "double") {
      let width = findValidMultiple(
        document.body.clientWidth - 2 * this.state.margin - 80
      );
      this.setState({
        pageOffset: `calc(50vw - ${width / 2}px)`,
        pageWidth: `${width}px`,
      });

    }
  };
  handleHighlight = (rendition: any) => {
    let highlighters: any = this.props.notes;
    if (!highlighters) return;
    let highlightersByChapter = highlighters.filter((item: Note) => {
      return (
        (item.chapter ===
          rendition.getChapterDoc()[this.state.chapterDocIndex].label ||
          item.chapterIndex === this.state.chapterDocIndex) &&
        item.bookKey === this.props.currentBook.key
      );
    });

    renderHighlighters(
      highlightersByChapter,
      this.props.currentBook.format,
      this.handleNoteClick
    );
  };
  handleNoteClick = (event: Event) => {
    this.props.handleNoteKey((event.target as any).dataset.key);
    this.props.handleMenuMode("note");
    this.props.handleOpenMenu(true);
  };

  handleRenderBookWithLinesColor = async () => {
    if (lock) return;
    const { key, path, format, name } = this.props.currentBook;

    try {
      let isCacheExsit = await BookUtil.isBookExist("cache-" + key, path);
      BookUtil.fetchBook(isCacheExsit ? "cache-" + key : key, true, path).then(
        async (result: any) => {
          if (!result) {
            toast.error(this.props.t("Book not exsit"));
            return;
          }

          let rendition = BookUtil.getRendtion(
            result,
            isCacheExsit ? "CACHE" : format,
            this.state.readerMode,
            this.props.currentBook.charset,
            StorageUtil.getReaderConfig("isSliding") === "yes" ? "sliding" : ""
          );
          await rendition.renderTo(
            document.getElementsByClassName("html-viewer-page")[0]
          );

          rendition.on("rendered", () => {
            this.changeStyleLinesColors(rendition);

          })

          await this.handleRest(rendition);
          this.props.handleReadingState(true);

          RecentBooks.setRecent(this.props.currentBook.key);
          document.title = name + " - Koodo Reader";
        }
      );
    } catch (error) {
      console.error("Erreur lors du traitement du livre :", error);
    }
  };



  handleRenderBook = async () => {
    if (lock) return;
    let { key, path, format, name } = this.props.currentBook;
    this.props.handleHtmlBook(null);
    let doc = getIframeDoc();
    if (doc && this.state.rendition) {
      this.state.rendition.removeContent();
    }
    let isCacheExsit = await BookUtil.isBookExist("cache-" + key, path);
    BookUtil.fetchBook(isCacheExsit ? "cache-" + key : key, true, path).then(
      async (result: any) => {
        if (!result) {
          toast.error(this.props.t("Book not exsit"));
          return;
        }

        let rendition = BookUtil.getRendtion(
          result,
          isCacheExsit ? "CACHE" : format,
          this.state.readerMode,
          this.props.currentBook.charset,
          StorageUtil.getReaderConfig("isSliding") === "yes" ? "sliding" : ""
        );
        await rendition.renderTo(
          document.getElementsByClassName("html-viewer-page")[0]

        )

        await this.handleRest(rendition);

        this.props.handleReadingState(true);

        RecentBooks.setRecent(this.props.currentBook.key);
        document.title = name + " - Cartable Fantastique Reader";
      }
    );
  };




  /**
   * On sélectionne les lignes de l'élément p
   *
   * @param p : élément à traiter
   */
  selectLines(p) {
    const lines: string[] = [];
    let range = new Range();
    const textnodes = this.extractTextNode(p);
    range.setStart(textnodes[0], 0); // démarre au début de p
    do {
      range = this.nextLineRange(range, textnodes); // sélectionne une ligne après l'autre
      if (range.toString().length > 0) {
        lines.push(range.toString());
      }
    } while (range.toString().length > 0); // jusqu'à ce qu'il n'y ait plus rien
    return lines;
  }

  /**
   * On part de la sélection précédente pour sélectionner la prochaine ligne de texte
   * 
   * @param range : sélection précédente
   * @return nouvelle sélection ou null si on est arrivé en bout de paragraphe
   */
  nextLineRange(range, textnodes) {
    const newRange = document.createRange();
    //Le début de ce nouveau Range est défini à la fin du Range existant passé en paramètre
    newRange.setStart(range.endContainer, range.endOffset);

    while (!this.hasNewLine(newRange.getClientRects())) {
      //Si la fin du Range atteint la fin du contenu du nœud actuel 
      if (newRange.endOffset >= newRange.endContainer.textContent!.length) {
        // on passe a la noeud suivant 
        const index = textnodes.indexOf(newRange.endContainer);
        if (index + 1 < textnodes.length) {
          newRange.setEnd(textnodes[index + 1], 0); // next child node
        } else {
          //Si c’est le dernier nœud, on définit la fin du Range à la fin du contenu du nœud actuel et on retourne le Range
          newRange.setEnd(newRange.endContainer, newRange.endContainer.textContent!.length); // end of paragraph
          return newRange;
        }
      } else {
        newRange.setEnd(newRange.endContainer, newRange.endOffset + 1); // next character
      }
    }

    //reculant d’un caractère pour rester sur la même ligne.
    if (newRange.endOffset > 0) {
      newRange.setEnd(newRange.endContainer, newRange.endOffset - 1); // move back to the line
    }

    return newRange;
  }
  removeTagsFromParagraph(paragraph) {
    // Remplace le contenu HTML du paragraphe par son équivalent texte brut
    paragraph.innerHTML = paragraph.innerText || paragraph.textContent || "";
  }

  /**
   * On extrait les noeuds de type TEXT_NODE
   *
   * @param p : élément à partir duquel on souhaite extraire les noeuds
   */
  extractTextNode(p) {
    this.removeTagsFromParagraph(p)
    const nodes: Node[] = [];
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);

    let currentNode = walker.nextNode();
    while (currentNode) {
      nodes.push(currentNode); // Ajoute chaque nœud texte à la liste
      currentNode = walker.nextNode();
    }

    return nodes;
  }

  /**
   * On a plusieurs lignes lorsqu'on a un rectangle dont le y est différent des autres rectangles
   *
   * @param rects : les rectangles issues de la sélection (range)
   */
  hasNewLine(rects) {
    for (let i = 0; i < rects.length; i++) {
      if (rects[i].y !== rects[0].y) {
        return true;
      }
    }
    return false;
  }


  disableBackgroundColor() {

    let doc = getIframeDoc();
    if (!doc) {
      console.error("Impossible d'accéder au contenu de l'iframe");
      return;
    }
    //resetStyles
    const allHighilightLines = Array.from(doc.getElementsByClassName('highlightLine'))
    const highlightConfig = StorageUtil.getReaderConfig("highlightLines");
    let config = null;

    try {
      config = highlightConfig ? JSON.parse(highlightConfig) : null;
      console.log("config", config)
    } catch (error) {
      console.error("Erreur de parsing JSON:", error);
      return;
    }
    if (config && config === "resetStyles") {
      Object.keys(allHighilightLines).forEach((e) => allHighilightLines[e].style.backgroundColor = "");
      StorageUtil.setReaderConfig("highlightLines", "resetStyles");
    } else if (config && config === "resetColorLines") {
      Object.keys(allHighilightLines).forEach((e) => allHighilightLines[e].style.color = "");
      StorageUtil.setReaderConfig("highlightLines", "resetColorLines");
    }
  }

  changeHiglightLines = (paragraphs) => {
    try {
      const randomColors = StorageUtil.getReaderConfig("highlightColors") || "[]";
      const colors = JSON.parse(randomColors);
      let colorIndex = 0;
      this.removeTagsFromParagraph(paragraphs)
      paragraphs.forEach((p) => {

        let coloredHTML = "";


        // Trouver les lignes correspondant à ce paragraphe
        const lines = this.selectLines(p);
        lines.forEach((line) => {

          const color = colors[colorIndex % colors.length];
          colorIndex++;

          // Ajouter chaque ligne colorée
          coloredHTML += `<span class="highlightLine" style= "
          
            background-color: ${color}">${line}</span>`;
        });

        // Mettre à jour le contenu du paragraphe
        p.innerHTML = coloredHTML;
      });
    } catch (error) {
      console.error("Erreur lors de l'application des couleurs de surlignage : ", error);
    }
  };

  changeSentenceColors = (paragraphs) => {
    try {
      const randomColors = StorageUtil.getReaderConfig("baseColors") || "[]";
      const colors = JSON.parse(randomColors);
      let colorIndex = 0;
      this.removeTagsFromParagraph(paragraphs)

      paragraphs.forEach((p) => {
        let coloredHTML = "";

        // Trouver les lignes correspondant à ce paragraphe
        const lines = this.selectLines(p);
        lines.forEach((line) => {
          const color = colors[colorIndex % colors.length];
          colorIndex++;

          // Ajouter chaque ligne colorée
          coloredHTML += `<span 
          class="highlightLine"
          style="
          font-size: ${StorageUtil.getReaderConfig("fontSize") || "17px"};
          line-height: ${StorageUtil.getReaderConfig("lineHeight") || "1.25"};
          color: ${color};">${line}</span>`;
        });

        // Mettre à jour le contenu du paragraphe
        p.innerHTML = coloredHTML;
      });
    } catch (error) {
      console.error("Erreur lors de l'application des couleurs de base : ", error);
    }
  };

  changeStyleLinesColors = (rendition) => {
    if (!rendition) return;

    const iframe = rendition.element?.querySelector("iframe");
    if (!iframe) {
      console.error("Impossible de trouver l'iframe dans rendition.element");
      return;
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      console.error("Impossible d'accéder au contenu de l'iframe");
      return;
    }

    try {
      const highlightConfig = StorageUtil.getReaderConfig("highlightLines");
      const lineHighlight = highlightConfig ? JSON.parse(highlightConfig) : null;

      const paragraphs = doc.querySelectorAll("p.kookit-text");

      if (lineHighlight && lineHighlight === "highlightColor") {
        this.changeHiglightLines(paragraphs);
      } else {
        this.changeSentenceColors(paragraphs);
      }
    } catch (error) {
      console.error("Erreur lors de l'application des styles de ligne : ", error);
    }
  };


  handleRest = async (rendition: any) => {
    HtmlMouseEvent(
      rendition,
      this.props.currentBook.key,
      this.state.readerMode
    );
    let chapters = rendition.getChapter();
    let chapterDocs = rendition.getChapterDoc();
    let flattenChapters = rendition.flatChapter(chapters);

    this.props.handleHtmlBook({
      key: this.props.currentBook.key,
      chapters,
      flattenChapters,
      rendition: rendition,
    });

    this.setState({ rendition });
    StyleUtil.addDefaultCss();
    tsTransform();
    binicReadingProcess();
    // rendition.setStyle(StyleUtil.getCustomCss());
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
      page: string;
    } = RecordLocation.getHtmlLocation(this.props.currentBook.key);

    if (chapterDocs.length > 0) {
      await rendition.goToPosition(
        JSON.stringify({
          text: bookLocation.text || "",
          chapterTitle: bookLocation.chapterTitle || chapterDocs[0].label,
          page: bookLocation.page || "",
          chapterDocIndex: bookLocation.chapterDocIndex || 0,
          chapterHref: bookLocation.chapterHref || chapterDocs[0].href,
          count: bookLocation.hasOwnProperty("cfi")
            ? "ignore"
            : bookLocation.count || 0,
          percentage: bookLocation.percentage,
          cfi: bookLocation.cfi,
          isFirst: true,
        })
      );

    }


    rendition.on("rendered", () => {
      this.handleLocation();
      let bookLocation: {
        text: string;
        count: string;
        chapterTitle: string;
        chapterDocIndex: string;
        chapterHref: string;
      } = RecordLocation.getHtmlLocation(this.props.currentBook.key);

      let chapter =
        bookLocation.chapterTitle ||
        (this.props.htmlBook && this.props.htmlBook.flattenChapters[0]
          ? this.props.htmlBook.flattenChapters[0].label
          : "Unknown chapter");
      let chapterDocIndex = 0;
      if (bookLocation.chapterDocIndex) {
        chapterDocIndex = parseInt(bookLocation.chapterDocIndex);
      } else {
        chapterDocIndex =
          bookLocation.chapterTitle && this.props.htmlBook

            ? window._.findLastIndex(
              this.props.htmlBook.flattenChapters.map((item) => {
                item.label = item.label.trim();
                return item;
              }),
              {
                title: bookLocation.chapterTitle.trim(),
              }
            )
            : 0;
      }
      this.props.handleCurrentChapter(chapter);
      this.props.handleCurrentChapterIndex(chapterDocIndex);
      this.props.handleFetchPercentage(this.props.currentBook);
      this.setState({
        chapter,
        chapterDocIndex,
      });
      scrollContents(chapter, bookLocation.chapterHref);
      StyleUtil.addDefaultCss();
      tsTransform();
      binicReadingProcess();
      this.handleBindGesture();
      this.handleHighlight(rendition);
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 1000);
      return false;
    });
  };

  handleLocation = () => {
    if (!this.props.htmlBook) {
      return;
    }
    let position = this.props.htmlBook.rendition.getPosition();
    RecordLocation.recordHtmlLocation(
      this.props.currentBook.key,
      position.text,
      position.chapterTitle,
      position.chapterDocIndex,
      position.chapterHref,
      position.count,
      position.percentage,
      position.cfi,
      position.page
    );
  };
  handleBindGesture = () => {
    let doc = getIframeDoc();
    if (!doc) return;
    doc.addEventListener("click", (event) => {
      this.props.handleLeaveReader("left");
      this.props.handleLeaveReader("right");
      this.props.handleLeaveReader("top");
      this.props.handleLeaveReader("bottom");
    });
    doc.addEventListener("mouseup", () => {
      if (this.state.isDisablePopup) {
        if (doc!.getSelection()!.toString().trim().length === 0) {
          let rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
          this.setState({ rect });
        }
      }
      if (this.state.isDisablePopup) return;

      var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
      this.setState({ rect });
    });
    doc.addEventListener("contextmenu", (event) => {
      if (document.location.href.indexOf("localhost") === -1) {
        event.preventDefault();
      }

      if (!this.state.isDisablePopup && !this.state.isTouch) return;

      if (
        !doc!.getSelection() ||
        doc!.getSelection()!.toString().trim().length === 0
      )
        return;
      var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();

      this.setState({ rect });
    });
  };
  render() {
    return (
      <>
        {this.props.htmlBook ? (
          <PopupMenu
            {...{
              rendition: this.props.htmlBook.rendition,
              rect: this.state.rect,
              chapterDocIndex: this.state.chapterDocIndex,
              chapter: this.state.chapter,
            }}
          />
        ) : null}
        {this.props.isOpenMenu &&
          this.props.htmlBook &&
          (this.props.menuMode === "dict" ||
            this.props.menuMode === "trans" ||
            this.props.menuMode === "note") ? (
          <PopupBox
            {...{
              rendition: this.props.htmlBook.rendition,
              rect: this.state.rect,
              chapterDocIndex: this.state.chapterDocIndex,
              chapter: this.state.chapter,
            }}
          />
        ) : null}
        {this.props.htmlBook && (
          <ImageViewer
            {...{
              isShow: this.props.isShow,
              rendition: this.props.htmlBook.rendition,
              handleEnterReader: this.props.handleEnterReader,
              handleLeaveReader: this.props.handleLeaveReader,
            }}
          />
        )}
        <div
          className={
            this.state.readerMode === "scroll"
              ? "html-viewer-page scrolling-html-viewer-page"
              : "html-viewer-page"
          }
          id="page-area"
          style={
            this.state.readerMode === "scroll" &&
              document.body.clientWidth >= 570
              ? {
                marginLeft: this.state.pageOffset,
                marginRight: this.state.pageOffset,
                paddingLeft: "20px",
                paddingRight: "15px",
                left: 0,
                right: 0,

              }
              : {

                left: this.state.pageOffset,
                width: this.state.pageWidth,

              }
          }
        ></div>
        <PageWidget />
        {StorageUtil.getReaderConfig("isHideBackground") === "yes" ? null : this
          .props.currentBook.key ? (
          <Background />
        ) : null}
      </>
    );
  }
}
export default withRouter(Viewer as any);




