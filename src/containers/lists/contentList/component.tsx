import React from "react";
import "./contentList.css";
import { ContentListProps, ContentListState } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { scrollContents } from "../../../utils/common";
import { Trans } from "react-i18next";
import _ from "underscore";

class ContentList extends React.Component<ContentListProps, ContentListState> {
  constructor(props: ContentListProps) {
    super(props);
    this.state = {
      chapters: [],
      isCollapsed: true,
      currentIndex: -1,
      currentChapterIndex: 0,
      expandedItems: new Set<string>(), // 存储展开的项目路径
      isExpandContent:
        ConfigService.getReaderConfig("isExpandContent") === "yes",
    };
    this.handleJump = this.handleJump.bind(this);
  }

  // 查找包含当前章节的路径并自动展开
  findAndExpandCurrentChapter = (
    chapters: any[],
    bookLocation: any,
    parentPath: string = ""
  ): Set<string> => {
    const expandedPaths = new Set<string>();

    const findInChapters = (items: any[], currentParentPath: string) => {
      items.forEach((item, index) => {
        const currentPath = currentParentPath
          ? `${currentParentPath}-${index}`
          : `${index}`;

        // 检查当前项是否匹配当前章节
        const isCurrentChapter =
          item.href === bookLocation.chapterHref ||
          (bookLocation.chapterHref &&
            bookLocation.chapterHref.includes(item.href.split("#")[0]));

        if (isCurrentChapter) {
          // 如果找到当前章节，展开其所有父路径
          const pathParts = currentPath.split("-");
          for (let i = 0; i < pathParts.length - 1; i++) {
            const parentPath = pathParts.slice(0, i + 1).join("-");
            expandedPaths.add(parentPath);
          }
        }

        // 检查子项中是否包含当前章节
        if (item.subitems && item.subitems.length > 0) {
          const hasCurrentChapterInSubitems = item.subitems.some(
            (subitem: any) =>
              this.checkIfContainsCurrentChapter(subitem, bookLocation)
          );

          if (hasCurrentChapterInSubitems) {
            expandedPaths.add(currentPath);
          }

          findInChapters(item.subitems, currentPath);
        }
      });
    };

    findInChapters(chapters, parentPath);
    return expandedPaths;
  };

  // 递归检查是否包含当前章节
  checkIfContainsCurrentChapter = (item: any, bookLocation: any): boolean => {
    const isCurrentChapter =
      item.href === bookLocation.chapterHref ||
      (bookLocation.chapterHref &&
        bookLocation.chapterHref.includes(item.href.split("#")[0]));

    if (isCurrentChapter) return true;

    if (item.subitems && item.subitems.length > 0) {
      return item.subitems.some((subitem: any) =>
        this.checkIfContainsCurrentChapter(subitem, bookLocation)
      );
    }

    return false;
  };

  async handleScrollToChapter(htmlBook: any) {
    this.setState(
      {
        chapters: htmlBook.chapters,
      },
      () => {
        let bookLocation: {
          text: string;
          chapterTitle: string;
          chapterDocIndex: string;
          chapterHref: string;
        } = ConfigService.getObjectConfig(
          this.props.currentBook.key,
          "recordLocation",
          {}
        );

        // 自动展开包含当前章节的路径
        if (bookLocation.chapterHref) {
          const expandedPaths = this.findAndExpandCurrentChapter(
            htmlBook.chapters,
            bookLocation
          );
          this.setState({ expandedItems: expandedPaths }, () => {
            let chapter =
              bookLocation.chapterTitle ||
              (htmlBook && htmlBook.flattenChapters[0]
                ? ""
                : "Unknown chapter");
            scrollContents(chapter, bookLocation.chapterHref);
          });
          return;
        }
      }
    );
  }
  async handleJump(item: any) {
    await this.props.htmlBook.rendition.goToChapter(
      item.index,
      item.href,
      item.label
    );
    this.props.handleCurrentChapter(item.label);
    this.props.handleCurrentChapterIndex(item.index);
    scrollContents(item.label, item.href);
  }
  componentDidMount() {
    if (this.props.htmlBook) {
      this.handleScrollToChapter(this.props.htmlBook);
    }
  }
  UNSAFE_componentWillReceiveProps(nextProps: ContentListProps) {
    if (nextProps.htmlBook !== this.props.htmlBook && nextProps.htmlBook) {
      this.handleScrollToChapter(nextProps.htmlBook);
    }
    if (
      nextProps.currentChapterIndex !== this.props.currentChapterIndex &&
      this.props.htmlBook
    ) {
      let chapter = _.find(nextProps.htmlBook.flattenChapters, {
        label: nextProps.currentChapter,
        index: nextProps.currentChapterIndex,
      });
      if (!chapter || !chapter.href) {
        return;
      }
      // scrollContents(chapter.label, chapter.href);
      let bookLocation: {
        text: string;
        chapterTitle: string;
        chapterDocIndex: number;
        chapterHref: string;
      } = {
        text: "",
        chapterTitle: chapter.label,
        chapterDocIndex: chapter.index,
        chapterHref: chapter.href,
      };
      const expandedPaths = this.findAndExpandCurrentChapter(
        this.props.htmlBook.chapters,
        bookLocation
      );
      this.setState({ expandedItems: expandedPaths }, () => {
        scrollContents(chapter.label, bookLocation.chapterHref);
      });
    }
  }
  render() {
    const renderContentList = (
      items: any,
      level: number,
      parentPath: string = ""
    ) => {
      level++;
      return items.map((item: any, index: number) => {
        const currentPath = parentPath ? `${parentPath}-${index}` : `${index}`;
        const isExpanded = this.state.expandedItems.has(currentPath);

        return (
          <li key={index} className="book-content-list">
            {item.subitems &&
              item.subitems.length > 0 &&
              !this.state.isExpandContent && (
                <span
                  className="icon-dropdown content-dropdown"
                  onClick={() => {
                    const newExpandedItems = new Set(this.state.expandedItems);
                    if (isExpanded) {
                      newExpandedItems.delete(currentPath);
                    } else {
                      newExpandedItems.add(currentPath);
                    }
                    this.setState({
                      expandedItems: newExpandedItems,
                    });
                  }}
                  style={isExpanded ? {} : { transform: "rotate(-90deg)" }}
                ></span>
              )}

            <span
              onClick={() => {
                this.handleJump(item);
              }}
              className="book-content-name"
              data-href={item.href}
            >
              {item.label}
            </span>
            {item.subitems &&
            item.subitems.length > 0 &&
            (isExpanded || this.state.isExpandContent) ? (
              <ul>{renderContentList(item.subitems, level, currentPath)}</ul>
            ) : null}
          </li>
        );
      });
    };
    return (
      <div className="book-content-container">
        {this.props.htmlBook && (
          <div className="book-content-header">
            <div>
              <Trans>Total chapters</Trans>:
              {this.props.htmlBook.flattenChapters.length}
            </div>
            <div
              onClick={() => {
                ConfigService.setReaderConfig(
                  "isExpandContent",
                  this.state.isExpandContent ? "no" : "yes"
                );
                this.setState({
                  isExpandContent: !this.state.isExpandContent,
                });
              }}
              className="book-content-expand"
            >
              <span className="icon-collapse"></span>
              {this.state.isExpandContent ? (
                <Trans>Collapse chapters</Trans>
              ) : (
                <Trans>Expand chapters</Trans>
              )}
            </div>
          </div>
        )}
        <ul className="book-content">
          {this.state.chapters && renderContentList(this.state.chapters, 1, "")}
        </ul>
      </div>
    );
  }
}

export default ContentList;
