import React, { useEffect, useState } from "react";
import "./collectionCover.css";
import { CollectionCoverItem, CollectionCoverProps } from "./interface";
import DatabaseService from "../../utils/storage/databaseService";
import CoverUtil from "../../utils/file/coverUtil";

const MAX_COVER_COUNT = 4;

const CollectionCover: React.FC<CollectionCoverProps> = (props) => {
  const { bookKeys, refreshBookKey, width, height } = props;
  const latestKeys = bookKeys.slice(-MAX_COVER_COUNT).reverse();
  const latestKeyStr = latestKeys.join(",");
  const [items, setItems] = useState<{ [key: string]: CollectionCoverItem }>(
    {}
  );

  useEffect(() => {
    let cancelled = false;
    async function loadCovers() {
      let result: { [key: string]: CollectionCoverItem } = {};
      for (let i = 0; i < latestKeys.length; i++) {
        let key = latestKeys[i];
        try {
          let book = await DatabaseService.getRecord(key, "books");
          if (!book) {
            result[key] = { cover: "", title: "" };
            continue;
          }
          let title = book.name || "";
          let isCoverExist = await CoverUtil.isCoverExist(book);
          if (!isCoverExist) {
            result[key] = { cover: "", title };
            continue;
          }
          let cover = await CoverUtil.getCover(book);
          if (
            cover &&
            !cover.startsWith("data:") &&
            !cover.startsWith("blob:") &&
            !cover.startsWith("http")
          ) {
            cover = cover + "?t=" + Date.now();
          }
          result[key] = { cover: cover || "", title };
        } catch {
          result[key] = { cover: "", title: "" };
        }
      }
      if (!cancelled) {
        setItems(result);
      }
    }
    loadCovers();
    return () => {
      cancelled = true;
    };
  }, [latestKeyStr, refreshBookKey]);

  const count = latestKeys.length;
  const cellWidth = width / 2;
  const titleFontSize = Math.min(12, Math.max(7, Math.round(cellWidth / 5)));
  const renderCell = (key: string) => {
    const item = items[key];
    return (
      <div className="collection-cover-cell" key={key}>
        {item && item.cover ? (
          <img src={item.cover} alt="" draggable={false}></img>
        ) : (
          <div className="collection-cover-cell-empty">
            <p
              className="collection-cover-cell-title"
              style={{ fontSize: `${titleFontSize}px` }}
            >
              {item ? item.title : ""}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="collection-cover"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {count === 0 ? (
        <div className="collection-cover-placeholder"></div>
      ) : (
        latestKeys.map((key) => renderCell(key))
      )}
    </div>
  );
};

export default CollectionCover;
