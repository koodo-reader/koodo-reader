import { useEffect, useState } from "react";
import "./updateInfo.css";
import { DetailDialogProps } from "./interface";
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

const DetailDialog = (props: DetailDialogProps) => {
  const [cover, setCover] = useState("");
  const [isCoverExist, setIsCoverExist] = useState(false);
  const [shelfLocation, setShelfLocation] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setCover(await CoverUtil.getCover(props.currentBook));
      setIsCoverExist(await CoverUtil.isCoverExist(props.currentBook));
      let shelfList = ConfigService.getAllMapConfig("shelfList");
      let nextShelfLocation: string[] = [];
      for (let shelf in shelfList) {
        if (shelfList[shelf].indexOf(props.currentBook.key) > -1) {
          nextShelfLocation.push(shelf);
        }
      }
      setShelfLocation(nextShelfLocation);
    })();
  }, []);

  const handleClose = () => {
    props.handleDetailDialog(false);
  };
  const handleShelfClick = (shelfTitle: string) => {
    props.handleDetailDialog(false);
    props.handleShelf(shelfTitle);
    props.handleMode("shelf");
    props.history.push("/manager/shelf");
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
  const fileSize = props.currentBook.size
    ? props.currentBook.size / 1024 / 1024 > 1
      ? parseFloat(props.currentBook.size / 1024 / 1024 + "").toFixed(2) + "Mb"
      : parseInt(props.currentBook.size / 1024 + "") + "Kb"
    : "0Kb";
  const infoFields: { label: string; value: string }[] = [
    {
      label: "Publisher",
      value: props.currentBook.publisher || "-",
    },
    {
      label: "Published date",
      value: formatDateToDay(props.currentBook.published) || "-",
    },
    {
      label: "Modified date",
      value: formatDateToDay(props.currentBook.modified) || "-",
    },
    {
      label: "Language",
      value: props.currentBook.language || "-",
    },
    {
      label: "Rights",
      value: props.currentBook.rights || "-",
    },
    { label: "File size", value: fileSize },
    {
      label: "Added on",
      value: formatTimestamp(parseInt(props.currentBook.key)),
    },
    {
      label: "Format",
      value: props.currentBook.format || "-",
    },
  ];
  const metadataFields: { label: string; value: string }[] = [
    { label: "Identifier", value: props.currentBook.identifier },
    { label: "Subject", value: props.currentBook.subject },
    { label: "ISBN", value: props.currentBook.isbn },
    { label: "Layout", value: props.currentBook.layout },
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
                    format: props.currentBook.format,
                    title: props.currentBook.name,
                    scale: 1.2,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <p className="detail-dialog-book-title">{props.currentBook.name}</p>
        <p className="detail-dialog-book-author">
          <Trans>{props.currentBook.author || "Unknown author"}</Trans>
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
            {props.currentBook.description ? (
              Parser(DOMPurify.sanitize(props.currentBook.description))
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
