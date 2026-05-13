import React from "react";
import "./metadataDialog.css";
import { Trans } from "react-i18next";
import {
  MetadataDialogProps,
  MetadataDialogState,
  MetadataResult,
  AppleBookItem,
} from "./interface";

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
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://itunes.apple.com/search?term=${encoded}&media=ebook&entity=ebook&limit=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      const items: AppleBookItem[] = data.results || [];
      this.setState({ results: items, isLoading: false });
    } catch (e) {
      this.setState({
        isLoading: false,
        error: this.props.t("Failed to fetch metadata"),
      });
    }
  };

  handleSelect = (id: string) => {
    this.setState((prev) => ({
      selectedId: prev.selectedId === id ? null : id,
    }));
  };

  handleApply = () => {
    const { results, selectedId } = this.state;
    const item = results.find((r) => r.trackId + "" === selectedId);
    if (!item) return;
    const metadata: MetadataResult = {
      name: item.trackName || "",
      author: item.artistName || "",
      publisher: "",
      description: item.description || "",
      cover: item.artworkUrl100 || item.artworkUrl60 || "",
    };
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
          <Trans>Get Metadata</Trans>
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
              <Trans>No results</Trans>
            </div>
          )}
          {!isLoading &&
            results.map((item) => {
              const isSelected = selectedId === item.trackId + "";
              const thumb = item.artworkUrl100 || item.artworkUrl60 || "";
              return (
                <div
                  key={item.trackId}
                  className="metadata-book-item"
                  onClick={() => this.handleSelect(item.trackId + "")}
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
                      <div className="metadata-book-name">{item.trackName}</div>
                      <div className="metadata-book-author">
                        {item.artistName}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="metadata-book-detail">
                      {item.artistName && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>Publisher</Trans>:
                          </span>
                          <span className="metadata-book-detail-value">
                            {item.artistName}
                          </span>
                        </div>
                      )}
                      {item.description && (
                        <div className="metadata-book-detail-row">
                          <span className="metadata-book-detail-label">
                            <Trans>Description</Trans>:
                          </span>
                          <span className="metadata-book-detail-value">
                            {item.description}
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
