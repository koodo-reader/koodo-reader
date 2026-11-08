import React, { useEffect, useState } from "react";
import "./collectionCover.css";
import DatabaseService from "../../utils/storage/databaseService";
import CoverUtil from "../../utils/file/coverUtil";
import EmptyCover from "../emptyCover";

export interface CollectionCoverProps {
  bookKeys: string[];
  refreshBookKey: string;
  width: number;
  height: number;
}

export interface CollectionCoverItem {
  cover: string;
  title: string;
  format: string;
}

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
            result[key] = { cover: "", title: "", format: "" };
            continue;
          }
          let title = book.name || "";
          let format = book.format || "";
          let isCoverExist = await CoverUtil.isCoverExist(book);
          if (!isCoverExist) {
            result[key] = { cover: "", title, format };
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
          result[key] = { cover: cover || "", title, format };
        } catch {
          result[key] = { cover: "", title: "", format: "" };
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
  const cellWidth = (width - 1) / 2;
  const cellHeight = (height - 1) / 2;
  const emptyCoverScale = Math.max(cellWidth / 105, cellHeight / 137);
  const renderCell = (key: string) => {
    const item = items[key];
    return (
      <div className="collection-cover-cell" key={key}>
        {item && item.cover ? (
          <img src={item.cover} alt="" draggable={false}></img>
        ) : (
          <div className="collection-cover-cell-empty">
            {item ? (
              <div
                className="collection-cover-cell-empty-inner"
                style={{
                  width: `${105 * emptyCoverScale}px`,
                  height: `${137 * emptyCoverScale}px`,
                }}
              >
                <EmptyCover
                  {...{
                    format: item.format,
                    title: item.title,
                    scale: emptyCoverScale,
                  }}
                />
              </div>
            ) : null}
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
