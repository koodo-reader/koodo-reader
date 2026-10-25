import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./updateInfo.css";
import { useAppStore } from "../../../store/useAppStore";
import { Trans } from "react-i18next";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import EmptyCover from "../../emptyCover";
import CoverUtil from "../../../utils/file/coverUtil";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { formatDateToDay, formatTimestamp } from "../../../utils/common";
import copy from "copy-text-to-clipboard";
import toast from "react-hot-toast";
import i18n from "../../../i18n";

const DetailDialog = () => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const handleDetailDialog = useAppStore((s) => s.handleDetailDialog);
  const handleShelf = useAppStore((s) => s.handleShelf);
  const handleMode = useAppStore((s) => s.handleMode);
  const navigate = useNavigate();
  const [cover, setCover] = useState("");
  const [isCoverExist, setIsCoverExist] = useState(false);
  const [shelfLocation, setShelfLocation] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setCover(await CoverUtil.getCover(currentBook));
      setIsCoverExist(await CoverUtil.isCoverExist(currentBook));
      let shelfList = ConfigService.getAllMapConfig("shelfList");
      let nextShelfLocation: string[] = [];
      for (let shelf in shelfList) {
        if (shelfList[shelf].indexOf(currentBook.key) > -1) {
          nextShelfLocation.push(shelf);
        }
      }
      setShelfLocation(nextShelfLocation);
    })();
  }, []);

  const handleClose = () => {
    handleDetailDialog(false);
  };
  const handleShelfClick = (shelfTitle: string) => {
    handleDetailDialog(false);
    handleShelf(shelfTitle);
    handleMode("shelf");
    navigate("/manager/shelf");
  };

  const renderShelfLocation = (shelfLocationList: string[]) => {
    return shelfLocationList.map((item: any) => {
      return (
        <li
          key={item}
          className={"tag-list-item"}
          style={{ borderWidth: 1.5 }}
          onClick={() => {
            handleShelfClick(item);
          }}
        >
          <div className="center">
            <Trans>{item}</Trans>
          </div>
        </li>
      );
    });
  };
  const fileSize = currentBook.size
    ? currentBook.size / 1024 / 1024 > 1
      ? parseFloat(currentBook.size / 1024 / 1024 + "").toFixed(2) + "Mb"
      : parseInt(currentBook.size / 1024 + "") + "Kb"
    : "0Kb";
  const infoFields: { label: string; value: string }[] = [
    {
      label: "Publisher",
      value: currentBook.publisher || "-",
    },
    {
      label: "Published date",
      value: formatDateToDay(currentBook.published) || "-",
    },
    {
      label: "Modified date",
      value: formatDateToDay(currentBook.modified) || "-",
    },
    {
      label: "Language",
      value: currentBook.language || "-",
    },
    {
      label: "Rights",
      value: currentBook.rights || "-",
    },
    { label: "File size", value: fileSize },
    {
      label: "Added on",
      value: formatTimestamp(parseInt(currentBook.key)),
    },
    {
      label: "Format",
      value: currentBook.format || "-",
    },
  ];
  const metadataFields: { label: string; value: string }[] = [
    { label: "Identifier", value: currentBook.identifier },
    { label: "Subject", value: currentBook.subject },
    { label: "ISBN", value: currentBook.isbn },
    { label: "Layout", value: currentBook.layout },
  ].filter((item) => item.value);

  return (
    <div className="download-desk-container">
      <div
        className="detail-dialog-book-info"
        style={{
          paddingTop: "20",
          paddingBottom: "20",
          height: "430px",
        }}
      >
        <div style={{ position: "relative" }}>
          <div className="detail-cover-container">
            {isCoverExist ? (
              <img src={cover} alt="" className="detail-cover" />
            ) : (
              <div
                className="detail-cover"
                style={{ width: "125px", height: "170px" }}
              >
                <EmptyCover
                  {...{
                    format: currentBook.format,
                    title: currentBook.name,
                    scale: 1.2,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <p className="detail-dialog-book-title">{currentBook.name}</p>
        <p className="detail-dialog-book-author">
          <Trans>{currentBook.author || "Unknown author"}</Trans>
        </p>

        <div className="detail-sub-info">
          {infoFields.map((item) => (
            <div className="detail-sub-info-item" key={item.label}>
              <p className="detail-sub-title">
                <Trans>{item.label}</Trans>
              </p>
              <p className="detail-sub-content-container">
                <p className="detail-sub-content">{item.value}</p>
              </p>
            </div>
          ))}
        </div>
        {metadataFields.length > 0 && (
          <div className="detail-metadata-section">
            <p className="detail-dialog-book-desc">
              <Trans>Metadata</Trans>:
            </p>
            <div className="detail-metadata-grid">
              {metadataFields.map((item) => (
                <div className="detail-metadata-item" key={item.label}>
                  <div className="detail-metadata-label">
                    <Trans>{item.label}</Trans>
                  </div>
                  <div className="detail-metadata-value-row">
                    <div className="detail-metadata-value" title={item.value}>
                      {item.value}
                    </div>
                    {(item.label === "Identifier" || item.label === "ISBN") && (
                      <button
                        className="detail-metadata-copy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          copy(item.value);
                          toast(i18n.t("Copying successful"));
                        }}
                      >
                        <span className="icon-copy"></span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {shelfLocation.length > 0 && (
          <div>
            <p className="detail-dialog-book-desc">
              <Trans>Shelf location</Trans>:
            </p>
            <div className="detail-dialog-shelf-location">
              {renderShelfLocation(shelfLocation)}
            </div>
          </div>
        )}
        <div>
          <p className="detail-dialog-book-desc">
            <Trans>Description</Trans>:
          </p>
          <div className="detail-dialog-book-detail">
            {currentBook.description ? (
              Parser(DOMPurify.sanitize(currentBook.description))
            ) : (
              <Trans>Empty</Trans>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          className="new-version-open"
          onClick={() => {
            handleClose();
          }}
          style={{ marginTop: "10px", position: "absolute", bottom: "10px" }}
        >
          <Trans>Close</Trans>
        </div>
      </div>
    </div>
  );
};

export default DetailDialog;
