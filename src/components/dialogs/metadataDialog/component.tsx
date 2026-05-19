import React from "react";
import "./metadataDialog.css";
import { Trans } from "react-i18next";
import {
  MetadataDialogProps,
  MetadataDialogState,
  MetadataResult,
  AppleBookItem,
  OpenLibraryBookItem,
  BookResultItem,
} from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { getBookMetadata } from "../../../utils/request/reader";

class MetadataDialog extends React.Component<
  MetadataDialogProps,
  MetadataDialogState
> {
  constructor(props: MetadataDialogProps) {
    super(props);
    this.state = {
      searchName: props.currentBookName || "",
      searchAuthor: props.currentBookAuthor || "",
      results: [],
      selectedId: null,
      isLoading: false,
      isCloudSearch: false,
      error: "",
    };
  }

  componentDidMount() {
    if (this.state.searchName || this.state.searchAuthor) {
      this.handleSearch();
    }
  }

  handleSearch = async () => {
    const { searchName, searchAuthor } = this.state;
    const query = [searchName, searchAuthor].filter(Boolean).join(" ");
    if (!query.trim()) return;

    this.setState({
      isLoading: true,
      error: "",
      results: [],
      selectedId: null,
    });

    const fetchItunes = async (): Promise<BookResultItem[]> => {
      const encoded = encodeURIComponent(query);
      const url = `https://itunes.apple.com/search?term=${encoded}&media=ebook&entity=ebook&limit=3`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("iTunes network error");
      const data = await res.json();
      return ((data.results || []) as AppleBookItem[]).map((item) => ({
        ...item,
        source: "itunes" as const,
      }));
    };

    const fetchOpenLibrary = async (): Promise<BookResultItem[]> => {
      const parts: string[] = [];
      if (searchName) parts.push(`title=${encodeURIComponent(searchName)}`);
      if (searchAuthor)
        parts.push(`author=${encodeURIComponent(searchAuthor)}`);
      if (!parts.length) parts.push(`q=${encodeURIComponent(query)}`);
      const url = `https://openlibrary.org/search.json?${parts.join("&")}&fields=key,title,author_name,publisher,first_publish_year,cover_i&limit=3`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Open Library network error");
      const data = await res.json();
      return ((data.docs || []) as Omit<OpenLibraryBookItem, "source">[]).map(
        (item) => ({ ...item, source: "openlibrary" as const })
      );
    };

    const results = await Promise.allSettled([
      fetchItunes(),
      fetchOpenLibrary(),
    ]);
    const merged: BookResultItem[] = [];
    let hasError = false;
    for (const r of results) {
      if (r.status === "fulfilled") {
        merged.push(...r.value);
      } else {
        hasError = true;
      }
    }

    if (merged.length === 0 && hasError) {
      this.setState({
        isLoading: false,
        error: this.props.t("Failed to fetch metadata"),
      });
    } else {
      this.setState({ results: merged, isLoading: false });
    }
  };

  handleSelect = (id: string) => {
    this.setState((prev) => ({
      selectedId: prev.selectedId === id ? null : id,
    }));
  };

  getItemId = (item: BookResultItem): string => {
    if (item.source === "itunes") return item.trackId + "";
    return item.key;
  };

  handleApply = () => {
    const { results, selectedId } = this.state;
    const item = results.find((r) => {
      if (r.source === "itunes") return r.trackId + "" === selectedId;
      return r.key === selectedId;
    });
    if (!item) return;
    let metadata: MetadataResult;
    if (item.source === "itunes") {
      metadata = {
        name: item.trackName || "",
        author: item.artistName || "",
        publisher: "",
        description: item.description || "",
        cover: item.artworkUrl100
          ? item.artworkUrl100.replace("100x100", "600x600")
          : "",
      };
    } else if (item.source === "cloud") {
      metadata = {
        name: item.name || "",
        author: item.author || "",
        publisher: item.publisher || "",
        description: item.description || "",
        cover: item.cover || "",
      };
    } else {
      const coverUrl = item.cover_i
        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
        : "";
      metadata = {
        name: item.title || "",
        author: (item.author_name || []).join(", "),
        publisher: (item.publisher || [])[0] || "",
        description: item.description || "",
        cover: coverUrl,
      };
    }
    this.props.handleApplyMetadata(metadata);
    this.props.handleMetadataDialog(false);
  };

  handleCancel = () => {
    this.props.handleMetadataDialog(false);
  };

  render() {
    const { searchName, searchAuthor, results, selectedId, isLoading, error } =
      this.state;
    return (
      <div className="metadata-dialog-container edit-dialog-container">
        <div className="metadata-dialog-title">
          <Trans>Get metadata</Trans>
        </div>

        {/* Search inputs */}
        <div className="metadata-dialog-search-bar">
          <div className="metadata-dialog-search-row">
            <input
              className="metadata-dialog-search-input"
              value={searchName}
              placeholder={this.props.t("Book name")}
              onChange={(e) => this.setState({ searchName: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && this.handleSearch()}
              style={{ width: "155px" }}
            />
          </div>
          <div className="metadata-dialog-search-row">
            <input
              className="metadata-dialog-search-input"
              value={searchAuthor}
              placeholder={this.props.t("Author")}
              onChange={(e) => this.setState({ searchAuthor: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && this.handleSearch()}
              style={{ width: "100px" }}
            />
          </div>
          <button
            className="metadata-dialog-search-btn add-dialog-confirm"
            onClick={this.handleSearch}
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
              const id = this.getItemId(item);
              const isSelected = selectedId === id;
              let thumb = "";
              let title = "";
              let author = "";
              let publisher = "";
              let description = "";
              let source = "";
              if (item.source === "itunes") {
                thumb = item.artworkUrl100 || item.artworkUrl60 || "";
                title = item.trackName;
                author = item.artistName;
                description = item.description || "";
                source = "iTunes";
              } else if (item.source === "cloud") {
                thumb = item.cover || "";
                title = item.name;
                author = item.author;
                publisher = item.publisher || "";
                description = item.description || "";
                source = "Cloud";
              } else {
                thumb = item.cover_i
                  ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
                  : "";
                title = item.title;
                author = (item.author_name || []).join(", ");
                publisher = (item.publisher || [])[0] || "";
                description = item.description || "";
                source = "Open Library";
              }
              return (
                <div
                  key={id}
                  className="metadata-book-item"
                  onClick={() => this.handleSelect(id)}
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
                      <div className="metadata-book-source">
                        {this.props.t("Data source") +
                          ": " +
                          this.props.t(source)}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="metadata-book-detail">
                      {publisher && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>Publisher</Trans>:
                          </span>
                          <span className="metadata-book-detail-value">
                            {publisher}
                          </span>
                        </div>
                      )}
                      {description && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>Description</Trans>:
                          </span>
                          <span className="metadata-book-detail-value">
                            {description}
                          </span>
                        </div>
                      )}
                      <div className="metadata-dialog-apply-row">
                        <button
                          className="metadata-dialog-apply-btn add-dialog-confirm"
                          onClick={(e) => {
                            e.stopPropagation();
                            this.handleApply();
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
          {!this.state.isCloudSearch && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 10,
              }}
            >
              <div
                onClick={async () => {
                  if (!this.props.isAuthed) {
                    toast(
                      this.props.t("Please upgrade to Pro to use this feature")
                    );
                    this.props.handleSetting(true);
                    this.props.handleSettingMode("account");
                    ConfigService.setReaderConfig("fullTranslationMode", "no");
                    return;
                  }
                  toast.loading(this.props.t("Fetching metadata from cloud"));
                  let res = await getBookMetadata(
                    this.props.currentBookName,
                    this.props.currentBookAuthor
                  );
                  toast.dismiss();
                  if (res && res.data) {
                    const data = res.data as BookResultItem[];
                    if (data.length === 0) {
                      toast(this.props.t("No metadata found"));
                    } else {
                      this.setState({
                        results: [...this.state.results, ...data],
                        selectedId: null,
                        isCloudSearch: true,
                      });
                    }
                  } else {
                    toast(this.props.t("Failed to fetch metadata from cloud"));
                  }
                }}
                style={{
                  marginTop: "10px",
                  cursor: "pointer",
                  textAlign: "center",
                  height: "40px",
                  borderRadius: "20px",
                  lineHeight: "40px",
                  width: "140px",
                }}
                className="token-dialog-token-text"
              >
                <Trans>Get more results</Trans>
              </div>
            </div>
          )}
        </div>

        <div className="metadata-dialog-footer">
          <div className="add-dialog-cancel" onClick={this.handleCancel}>
            <Trans>Cancel</Trans>
          </div>
        </div>
      </div>
    );
  }
}

export default MetadataDialog;
