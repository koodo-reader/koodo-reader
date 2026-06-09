import React from "react";
import "./metadataDialog.css";
import { Trans } from "react-i18next";
import {
  MetadataDialogProps,
  MetadataDialogState,
  MetadataResult,
  BookResultItem,
} from "./interface";
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
    if (!searchName.trim() && !searchAuthor.trim()) return;

    if (!this.props.isAuthed) {
      toast(this.props.t("Please upgrade to Pro to use this feature"));
      this.props.handleSetting(true);
      this.props.handleSettingMode("account");
      return;
    }

    this.setState({
      isLoading: true,
      error: "",
      results: [],
      selectedId: null,
    });

    try {
      const res = await getBookMetadata(searchName, searchAuthor);
      if (res && res.code === 200 && res.data) {
        const data = res.data as BookResultItem[];

        this.setState({ results: data, isLoading: false });
      } else if (res && res.code === 200 && !res.data) {
        this.setState({
          isLoading: false,
          error: this.props.t("No metadata found"),
        });
      } else {
        this.setState({
          isLoading: false,
          error: this.props.t("Failed to fetch metadata"),
        });
      }
    } catch {
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

  getItemId = (item: BookResultItem): string => {
    return item.key;
  };

  handleApply = () => {
    const { results, selectedId } = this.state;
    const item = results.find((r) => r.key === selectedId);
    if (!item) return;
    const metadata: MetadataResult = {
      name: item.name || "",
      author: item.author || "",
      publisher: item.publisher || "",
      description: item.description || "",
      cover: item.cover || "",
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
              const thumb = item.cover || "";
              const title = item.name;
              const author = item.author;
              const publisher = item.publisher || "";
              const description = item.description || "";
              const source = "Cloud";
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
