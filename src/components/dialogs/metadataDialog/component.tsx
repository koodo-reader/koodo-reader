import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import "./metadataDialog.css";
import { Trans } from "react-i18next";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import {
  MetadataDialogProps,
  MetadataResult,
  BookResultItem,
} from "./types";
import { useAppStore } from "../../../store/useAppStore";
import toast from "react-hot-toast";
import copy from "copy-text-to-clipboard";
import { getBookMetadata } from "../../../utils/request/reader";
import { formatDateToDay } from "../../../utils/common";

const MetadataDialog = (
  props: Pick<
    MetadataDialogProps,
    | "currentBookName"
    | "currentBookAuthor"
    | "handleMetadataDialog"
    | "handleApplyMetadata"
  >
) => {
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const handleSetting = useAppStore((s) => s.handleSetting);
  const handleSettingMode = useAppStore((s) => s.handleSettingMode);
  const { t } = useTranslation();
  const [state, setState] = useState<Record<string, any>>({
    searchName: props.currentBookName || "",
    searchAuthor: props.currentBookAuthor || "",
    results: [],
    selectedId: null,
    isLoading: false,
    error: "",
  });
  const updateState = (patch: Record<string, any>) =>
    setState((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (state.searchName || state.searchAuthor) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    const { searchName, searchAuthor } = state;
    if (!searchName.trim()) {
      toast(t("Please enter book name"));
      return;
    }

    if (!isAuthed) {
      toast(t("Please upgrade to Pro to use this feature"));
      handleSetting(true);
      handleSettingMode("account");
      return;
    }

    updateState({
      isLoading: true,
      error: "",
      results: [],
      selectedId: null,
    });

    try {
      const res = await getBookMetadata(searchName, searchAuthor);
      if (res && res.code === 200 && res.data) {
        const data = res.data as BookResultItem[];

        updateState({ results: data, isLoading: false });
      } else if (res && res.code === 200 && !res.data) {
        updateState({
          isLoading: false,
          error: t("No metadata found"),
        });
      } else {
        updateState({
          isLoading: false,
          error: t("Failed to fetch metadata"),
        });
      }
    } catch {
      updateState({
        isLoading: false,
        error: t("Failed to fetch metadata"),
      });
    }
  };

  const handleSelect = (id: string) => {
    setState((prev) => ({
      selectedId: prev.selectedId === id ? null : id,
    }));
  };

  const getItemId = (item: BookResultItem): string => {
    return item.key;
  };

  const handleApply = () => {
    const { results, selectedId } = state;
    const item = results.find((r) => r.key === selectedId);
    if (!item) return;
    const metadata: MetadataResult = {
      name: item.name || "",
      author: item.author || "",
      publisher: item.publisher || "",
      description: item.description || "",
      cover: item.cover || "",
      ...(item.pub_date ? { published: item.pub_date } : {}),
      ...(item.language ? { language: item.language } : {}),
      ...(item.categories ? { subject: item.categories } : {}),
      ...(item.isbn ? { isbn: item.isbn } : {}),
    };
    props.handleApplyMetadata(metadata);
    props.handleMetadataDialog(false);
  };

  const handleCancel = () => {
    props.handleMetadataDialog(false);
  };

  const { searchName, searchAuthor, results, selectedId, isLoading, error } =
      state;
    return (
      <div className="metadata-dialog-container edit-dialog-container">
        <div className="metadata-dialog-title">
          <Trans>Get metadata</Trans>
          <span style={{ fontSize: "13px", color: "#f16464" }}> (Pro)</span>
        </div>

        {/* Search inputs */}
        <div className="metadata-dialog-search-bar">
          <div className="metadata-dialog-search-row">
            <input
              className="metadata-dialog-search-input"
              value={searchName}
              placeholder={t("Book name")}
              onChange={(e) => updateState({ searchName: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ width: "155px" }}
            />
          </div>
          <div className="metadata-dialog-search-row">
            <input
              className="metadata-dialog-search-input"
              value={searchAuthor}
              placeholder={t("Author")}
              onChange={(e) => updateState({ searchAuthor: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ width: "100px" }}
            />
          </div>
          <button
            className="metadata-dialog-search-btn add-dialog-confirm"
            onClick={handleSearch}
          >
            <Trans>Search</Trans>
          </button>
        </div>

        {/* Results */}
        <div className="metadata-dialog-body">
          {isLoading && (
            <div className="metadata-dialog-loading">
              <Trans>Loading</Trans>...
            </div>
          )}
          {!isLoading && error && (
            <div className="metadata-dialog-error">{error}</div>
          )}
          {!isLoading && !error && results.length === 0 && (
            <div className="metadata-dialog-empty">
              <Trans>Empty</Trans>
            </div>
          )}
          {!isLoading &&
            results.map((item) => {
              const id = getItemId(item);
              const isSelected = selectedId === id;
              const thumb = item.cover || "";
              const title = item.name;
              const author = item.author;
              const publisher = item.publisher || "";
              const description = item.description || "";
              const ratingSource = item.rating_source || "";
              const rating = item.rating || 0;
              const ratingCount = item.rating_count || 0;
              const maxRating = ratingSource === "Douban" ? 10 : 5;
              const filledStars = Math.max(
                0,
                Math.round((rating / maxRating) * 5)
              );
              const stars =
                "★".repeat(filledStars) + "☆".repeat(5 - filledStars);
              return (
                <div
                  key={id}
                  className="metadata-book-item"
                  onClick={() => handleSelect(id)}
                >
                  <div className="metadata-book-item-header">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt="cover"
                        className="metadata-book-cover"
                      />
                    ) : (
                      <div className="metadata-book-cover-placeholder">N/A</div>
                    )}
                    <div className="metadata-book-basic">
                      <div className="metadata-book-name">{title}</div>
                      <div className="metadata-book-author">{author}</div>
                      {publisher && (
                        <div className="metadata-book-publisher">
                          {publisher}
                        </div>
                      )}
                      {item.rating ? (
                        <div className="metadata-book-rating">
                          <span className="metadata-book-rating-stars">
                            {stars}
                          </span>
                          <span className="metadata-book-rating-value">
                            {rating.toFixed(1)} / {maxRating}
                          </span>
                          {ratingCount > 0 && (
                            <span className="metadata-book-rating-count">
                              ({ratingCount})
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="metadata-book-detail">
                      {item.isbn && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>ISBN</Trans>:
                          </span>
                          <span className="metadata-book-detail-value metadata-book-detail-isbn">
                            {item.isbn}
                          </span>
                          <button
                            className="metadata-book-copy-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              copy(item.isbn || "");
                              toast(t("Copying successful"));
                            }}
                          >
                            <span className="icon-copy"></span>
                          </button>
                        </div>
                      )}
                      {item.pub_date && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>Publish date</Trans>:
                          </span>
                          <span className="metadata-book-detail-value">
                            {formatDateToDay(item.pub_date)}
                          </span>
                        </div>
                      )}
                      {item.categories && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>Categories</Trans>:
                          </span>
                          <span className="metadata-book-detail-value">
                            {item.categories}
                          </span>
                        </div>
                      )}
                      {item.language && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>Language</Trans>:
                          </span>
                          <span className="metadata-book-detail-value">
                            {item.language}
                          </span>
                        </div>
                      )}
                      {item.pages && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>Pages</Trans>:
                          </span>
                          <span className="metadata-book-detail-value">
                            {item.pages}
                          </span>
                        </div>
                      )}
                      {description && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>Description</Trans>:
                          </span>
                          <span className="metadata-book-detail-value">
                            {Parser(DOMPurify.sanitize(description))}
                          </span>
                        </div>
                      )}
                      <div className="metadata-dialog-apply-row">
                        <button
                          className="metadata-dialog-apply-btn add-dialog-confirm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply();
                          }}
                        >
                          <Trans>Apply</Trans>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="metadata-dialog-footer">
          <div className="add-dialog-cancel" onClick={handleCancel}>
            <Trans>Cancel</Trans>
          </div>
        </div>
      </div>
  );
};

export default MetadataDialog;
