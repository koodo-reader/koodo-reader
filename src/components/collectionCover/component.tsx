import React, { useEffect, useState } from "react";
import "./collectionCover.css";
import { CollectionCoverProps } from "./interface";
import DatabaseService from "../../utils/storage/databaseService";
import CoverUtil from "../../utils/file/coverUtil";

const MAX_COVER_COUNT = 4;

const CollectionCover: React.FC<CollectionCoverProps> = (props) => {
  const { bookKeys, refreshBookKey, width, height } = props;
  const latestKeys = bookKeys.slice(-MAX_COVER_COUNT).reverse();
  const latestKeyStr = latestKeys.join(",");
  const [covers, setCovers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    let cancelled = false;
    async function loadCovers() {
      let result: { [key: string]: string } = {};
      for (let i = 0; i < latestKeys.length; i++) {
        let key = latestKeys[i];
        try {
          let book = await DatabaseService.getRecord(key, "books");
          if (!book) {
            result[key] = "";
            continue;
          }
          let isCoverExist = await CoverUtil.isCoverExist(book);
          if (!isCoverExist) {
            result[key] = "";
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
          result[key] = cover || "";
        } catch {
          result[key] = "";
        }
      }
      if (!cancelled) {
        setCovers(result);
      }
    }
    loadCovers();
    return () => {
      cancelled = true;
    };
  }, [latestKeyStr, refreshBookKey]);

  const count = latestKeys.length;
  const renderCell = (key: string) => (
    <div className="collection-cover-cell" key={key}>
      {covers[key] ? (
        <img src={covers[key]} alt="" draggable={false}></img>
      ) : (
        <div className="collection-cover-cell-empty">
          <span className="icon-folder"></span>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="collection-cover"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {count === 0 ? (
        <div className="collection-cover-placeholder">
          <span className="icon-folder collection-cover-placeholder-icon"></span>
        </div>
      ) : (
        latestKeys.map((key) => renderCell(key))
      )}
    </div>
  );
};

export default CollectionCover;
