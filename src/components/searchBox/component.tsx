import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import "./searchBox.css";
import { SearchBoxProps } from "./interface";
import {
  ConfigService,
  CollectionUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import ConfigUtil from "../../utils/file/configUtil";
import BookUtil from "../../utils/file/bookUtil";
import { useAppStore } from "../../store/useAppStore";

const collectionUtil = new CollectionUtil(ConfigService);

const SearchBox = (props: SearchBoxProps) => {
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const isNavLocked = useAppStore((s) => s.reader.isNavLocked);
  const isSearch = useAppStore((s) => s.manager.isSearch);
  const isReading = useAppStore((s) => s.book.isReading);
  const tabMode = useAppStore((s) => s.sidebar.mode);
  const handleSearchResults = useAppStore((s) => s.handleSearchResults);
  const handleSearch = useAppStore((s) => s.handleSearch);
  const { t } = useTranslation();
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (props.isNavSearch) {
      let searchBox: any = document.querySelector(".header-search-box");
      searchBox && searchBox.focus();
    }
  }, []);

  const handleGetSearchResults = async (keyword: string) => {
    let results =
      tabMode === "note"
        ? await ConfigUtil.searchNotesByKeyword(keyword, "", "note")
        : tabMode === "highlight"
          ? await ConfigUtil.searchNotesByKeyword(keyword, "", "highlight")
          : await BookUtil.searchBooksByKeyword(keyword);
    if (tabMode !== "note" && tabMode !== "highlight") {
      let lowerKeyword = keyword.toLowerCase();
      collectionUtil.getCollectionList().forEach((collection) => {
        if (collectionUtil.isCollectionDeleted(collection.key)) return;
        if (collection.name.toLowerCase().includes(lowerKeyword)) {
          results.push({ key: collection.key, name: collection.name });
        }
      });
    }
    let deletedBookKeys = ConfigService.getAllListConfig("deletedBooks");
    results = results.filter((result: any) => {
      return !deletedBookKeys.includes(
        result[
          tabMode === "note" || tabMode === "highlight"
            ? "bookKey"
            : "key"
        ]
      );
    });
    return results;
  };

  const search = async (q: string) => {
    props.handleNavSearchState?.("searching");
    let searchList = await htmlBook.rendition.doSearch(q);
    props.handleNavSearchState?.("pending");
    props.handleSearchList?.(
      searchList.map((item: any) => {
        const regex = new RegExp(
          q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi"
        );
        item.excerpt = item.excerpt.replace(
          regex,
          `<span class="content-search-text">$&</span>`
        );
        return item;
      })
    );
    props.handleNavSearchState?.("done");
  };

  const handleMouse = async () => {
    let value = searchBoxRef.current?.value || "";
    if (props.isNavSearch) {
      value && search(value);
    }
    setIsFocused(false);
    if (props.mode === "nav") {
      props.handleNavSearchState?.("searching");
    }
    let keyword = (
      document.querySelector(".header-search-box") as HTMLInputElement
    ).value.toLowerCase();
    let results = await handleGetSearchResults(keyword);
    if (results) {
      handleSearchResults(results);
      handleSearch(true);
      if (props.mode === "nav") {
        props.handleNavSearchState?.("done");
      }
    }
  };

  const handleKey = async (event: any) => {
    if (event.keyCode !== 13) {
      return;
    }
    let value = searchBoxRef.current?.value || "";
    if (props.isNavSearch || isReading) {
      value && search(value);
    }
    setIsFocused(false);
    if (event && event.keyCode === 13) {
      let keyword = event.target.value.toLowerCase();
      let results = await handleGetSearchResults(keyword);
      if (results) {
        handleSearchResults(results);
        handleSearch(true);
        if (props.mode === "nav") {
          props.handleNavSearchState?.("done");
        }
      }
    }
  };

  const handleCancel = () => {
    if (props.isNavSearch) {
      props.handleSearchList?.(null);
      props.handleNavSearchState?.("done");
    }
    handleSearch(false);
    (document.querySelector(".header-search-box") as HTMLInputElement).value =
      "";
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        ref={searchBoxRef}
        className="header-search-box"
        onKeyDown={(event) => {
          handleKey(event);
        }}
        onFocus={() => {
          setIsFocused(true);

          if (props.mode === "nav") {
            props.handleNavSearchState?.("focused");
          }
        }}
        placeholder={
          props.isNavSearch || props.mode === "nav"
            ? t("Search in the Book")
            : tabMode === "note"
              ? t("Search my notes")
              : tabMode === "highlight"
                ? t("Search my highlights")
                : t("Search my library")
        }
        style={
          props.mode === "nav"
            ? {
                width: props.width,
                height: props.height,
                paddingRight: "30px",
              }
            : {}
        }
        onCompositionStart={() => {
          if (props.mode === "nav") {
            props.handleNavSearchState?.("focused");
          }
          if (isNavLocked) {
            return;
          } else {
            ConfigService.setReaderConfig("isTempLocked", "yes");
            ConfigService.setReaderConfig("isNavLocked", "yes");
          }
        }}
        onCompositionEnd={() => {
          if (ConfigService.getReaderConfig("isTempLocked") === "yes") {
            ConfigService.setReaderConfig("isNavLocked", "");
            ConfigService.setReaderConfig("isTempLocked", "");
          }
        }}
      />
      {isSearch && !isFocused ? (
        <span
          className="header-search-text"
          onClick={() => {
            handleCancel();
          }}
          style={props.mode === "nav" ? { right: "-9px", top: "14px" } : {}}
        >
          <span className="icon-close theme-color-delete"></span>
        </span>
      ) : (
        <span
          className="header-search-text"
          onClick={() => {
            handleMouse();
          }}
        >
          <span
            className="icon-search header-search-icon"
            style={props.mode === "nav" ? { right: "5px" } : {}}
          ></span>
        </span>
      )}
    </div>
  );
};

export default SearchBox;
