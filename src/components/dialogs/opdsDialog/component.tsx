import React from "react";
import "./opdsDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  OPDSCatalog,
  OPDSEntry,
  OPDSFeed,
  OPDSLink,
  OPDSDialogProps,
  OPDSDialogState,
} from "./interface";
import { supportedFormats } from "../../../utils/common";
import { isElectron } from "react-device-detect";

const BUILT_IN_CATALOGS: OPDSCatalog[] = [
  {
    id: "project-gutenberg",
    title: "Project Gutenberg",
    url: "https://www.gutenberg.org/ebooks.opds/",
    isBuiltIn: true,
    isElectronicOnly: false,
  },
  {
    id: "manybooks",
    title: "ManyBooks",
    url: "https://manybooks.net/opds/index.php",
    isBuiltIn: true,
    isElectronicOnly: true,
  },
];

const OPDS_CATALOGS_KEY = "opdsCatalogs";

const DOWNLOAD_TYPES: Record<string, string> = {
  "application/epub+zip": "epub",
  "application/pdf": "pdf",
  "application/x-mobipocket-ebook": "mobi",
  "application/x-cbz": "cbz",
  "application/x-cbr": "cbr",
  "text/html": "html",
  "application/fb2+zip": "fb2",
  "application/fb2": "fb2",
};

const ACQUISITION_RELS = [
  "http://opds-spec.org/acquisition",
  "http://opds-spec.org/acquisition/open-access",
  "http://opds-spec.org/acquisition/buy",
  "http://opds-spec.org/acquisition/borrow",
  "http://opds-spec.org/acquisition/sample",
];

function resolveUrl(href: string, baseUrl: string): string {
  if (!href) return "";
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function parseOPDSFeed(xmlText: string, feedUrl: string): OPDSFeed {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Invalid XML response");
  }

  const feedTitle =
    doc.querySelector("feed > title")?.textContent ||
    doc.querySelector("title")?.textContent ||
    "";

  const feedLinks: OPDSLink[] = Array.from(
    doc.querySelectorAll("feed > link")
  ).map((link) => ({
    href: resolveUrl(link.getAttribute("href") || "", feedUrl),
    type: link.getAttribute("type") || "",
    rel: link.getAttribute("rel") || "",
    title: link.getAttribute("title") || undefined,
  }));

  let searchTemplate = "";
  const searchLink = feedLinks.find(
    (l) =>
      l.rel === "search" ||
      l.type?.includes("opensearch") ||
      l.type?.includes("application/opensearchdescription")
  );
  if (searchLink) searchTemplate = searchLink.href;

  const entries: OPDSEntry[] = Array.from(doc.querySelectorAll("entry")).map(
    (entry) => {
      const entryLinks: OPDSLink[] = Array.from(
        entry.querySelectorAll("link")
      ).map((link) => ({
        href: resolveUrl(link.getAttribute("href") || "", feedUrl),
        type: link.getAttribute("type") || "",
        rel: link.getAttribute("rel") || "",
        title: link.getAttribute("title") || undefined,
      }));

      const hasAcquisitionLink = entryLinks.some((l) =>
        ACQUISITION_RELS.some((rel) => l.rel === rel)
      );
      const hasSupportedDownload = entryLinks.some(
        (l) =>
          ACQUISITION_RELS.some((rel) => l.rel === rel) &&
          supportedFormats.includes("." + (DOWNLOAD_TYPES[l.type] || ""))
      );
      const hasNavigationLink = entryLinks.some(
        (l) =>
          l.type?.includes("application/atom+xml") ||
          l.rel === "subsection" ||
          l.rel === "related"
      );
      const isNavigation =
        hasNavigationLink && !hasAcquisitionLink && !hasSupportedDownload;

      const coverLink = entryLinks.find(
        (l) => l.rel === "http://opds-spec.org/image"
      );
      const thumbnailLink =
        entryLinks.find(
          (l) => l.rel === "http://opds-spec.org/image/thumbnail"
        ) || coverLink;

      const authors = Array.from(entry.querySelectorAll("author"))
        .map((a) => a.querySelector("name")?.textContent || "")
        .filter(Boolean);

      return {
        id: entry.querySelector("id")?.textContent || "",
        title: entry.querySelector("title")?.textContent || "",
        authors,
        summary:
          entry.querySelector("summary")?.textContent ||
          entry.querySelector("content")?.textContent ||
          "",
        coverUrl: coverLink?.href || "",
        thumbnailUrl: thumbnailLink?.href || "",
        links: entryLinks,
        updated: entry.querySelector("updated")?.textContent || "",
        isNavigation,
      };
    }
  );

  return {
    title: feedTitle,
    url: feedUrl,
    entries,
    links: feedLinks,
    searchTemplate,
  };
}

async function fetchOPDSFeed(url: string): Promise<OPDSFeed> {
  const response = await fetch(url, {
    headers: { Accept: "application/atom+xml, application/xml, text/xml, */*" },
  });
  if (!response.ok)
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const text = await response.text();
  console.log(text);
  return parseOPDSFeed(text, url);
}

class OPDSDialog extends React.Component<OPDSDialogProps, OPDSDialogState> {
  constructor(props: OPDSDialogProps) {
    super(props);
    this.state = {
      view: "catalog",
      userCatalogs: this.loadUserCatalogs(),
      currentFeed: null,
      feedStack: [],
      selectedBook: null,
      isLoading: false,
      error: "",
      searchQuery: "",
      isAddingCatalog: false,
      newCatalogUrl: "",
      newCatalogTitle: "",
    };
  }

  loadUserCatalogs(): OPDSCatalog[] {
    try {
      return JSON.parse(ConfigService.getItem(OPDS_CATALOGS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  saveUserCatalogs(catalogs: OPDSCatalog[]) {
    ConfigService.setItem(OPDS_CATALOGS_KEY, JSON.stringify(catalogs));
  }

  handleClose = () => this.props.handleOPDSDialog(false);

  openCatalog = async (catalog: OPDSCatalog) => {
    this.setState({
      view: "feed",
      isLoading: true,
      error: "",
      feedStack: [{ url: catalog.url, title: catalog.title }],
      currentFeed: null,
      searchQuery: "",
    });
    try {
      const feed = await fetchOPDSFeed(catalog.url);
      this.setState({ currentFeed: feed, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState({ isLoading: false, error: msg });
      toast.error(this.props.t("Failed to load catalog") + ": " + msg);
    }
  };

  navigateToEntry = async (entry: OPDSEntry) => {
    const navLink = entry.links.find(
      (l) =>
        l.type?.includes("application/atom+xml") ||
        l.rel === "subsection" ||
        l.rel === "related"
    );
    if (!navLink) return;
    this.setState((prev) => ({
      isLoading: true,
      error: "",
      feedStack: [...prev.feedStack, { url: navLink.href, title: entry.title }],
      searchQuery: "",
    }));
    try {
      const feed = await fetchOPDSFeed(navLink.href);
      this.setState({ currentFeed: feed, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState((prev) => ({
        isLoading: false,
        error: msg,
        feedStack: prev.feedStack.slice(0, -1),
      }));
      toast.error(this.props.t("Failed to load catalog") + ": " + msg);
    }
  };

  handleBack = () => {
    const { view, feedStack } = this.state;
    if (view === "detail") {
      this.setState({ view: "feed", selectedBook: null });
      return;
    }
    if (view === "feed") {
      if (feedStack.length <= 1) {
        this.setState({ view: "catalog", currentFeed: null, feedStack: [] });
        return;
      }
      const newStack = feedStack.slice(0, -1);
      const parentUrl = newStack[newStack.length - 1].url;
      this.setState({
        isLoading: true,
        error: "",
        feedStack: newStack,
        searchQuery: "",
      });
      fetchOPDSFeed(parentUrl)
        .then((feed) => this.setState({ currentFeed: feed, isLoading: false }))
        .catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.setState({ isLoading: false, error: msg });
        });
    }
  };

  handleSearch = async () => {
    const { currentFeed, searchQuery } = this.state;
    if (!currentFeed?.searchTemplate || !searchQuery.trim()) return;

    let searchUrl = currentFeed.searchTemplate;
    if (!searchUrl.includes("{searchTerms}")) {
      try {
        const resp = await fetch(searchUrl);
        const text = await resp.text();
        const parser = new DOMParser();
        const osDoc = parser.parseFromString(text, "application/xml");
        const urlEl = osDoc.querySelector(
          "Url[type*='atom'], Url[type*='opds']"
        );
        if (urlEl) searchUrl = urlEl.getAttribute("template") || searchUrl;
      } catch {
        // fallback to original
      }
    }

    const finalUrl = searchUrl.replace(
      "{searchTerms}",
      encodeURIComponent(searchQuery.trim())
    );
    this.setState({ isLoading: true, error: "" });
    try {
      const feed = await fetchOPDSFeed(finalUrl);
      this.setState((prev) => ({
        currentFeed: {
          ...feed,
          searchTemplate: prev.currentFeed?.searchTemplate || "",
        },
        feedStack: [
          ...prev.feedStack,
          { url: finalUrl, title: this.props.t("Search") + ": " + searchQuery },
        ],
        isLoading: false,
        searchQuery: "",
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState({ isLoading: false, error: msg });
      toast.error(this.props.t("Search failed") + ": " + msg);
    }
  };

  handleDownloadBook = async (entry: OPDSEntry, link: OPDSLink) => {
    const ext = DOWNLOAD_TYPES[link.type] || link.href.split(".").pop() || "";
    if (!supportedFormats.includes("." + ext)) {
      toast.error(this.props.t("Unsupported file format") + ": " + link.type);
      return;
    }
    toast.loading(this.props.t("Downloading") + ": " + entry.title, {
      id: "opds-download",
    });
    try {
      const response = await fetch(link.href);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const fileName = entry.title.replace(/[/\\?%*:|"<>]/g, "-") + "." + ext;
      const file = new File([arrayBuffer], fileName);
      toast.dismiss("opds-download");
      await this.props.importBookFunc(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(this.props.t("Import failed") + ": " + msg, {
        id: "opds-download",
      });
    }
  };

  handleAddCatalog = () => {
    const { newCatalogUrl, newCatalogTitle, userCatalogs } = this.state;
    if (!newCatalogUrl.trim()) {
      toast.error(this.props.t("Please enter a valid URL"));
      return;
    }
    const newCatalog: OPDSCatalog = {
      id: "user-" + Date.now(),
      title: newCatalogTitle.trim() || newCatalogUrl.trim(),
      url: newCatalogUrl.trim(),
    };
    const updated = [...userCatalogs, newCatalog];
    this.saveUserCatalogs(updated);
    this.setState({
      userCatalogs: updated,
      isAddingCatalog: false,
      newCatalogUrl: "",
      newCatalogTitle: "",
    });
    toast.success(this.props.t("Added successfully"));
  };

  handleRemoveCatalog = (id: string) => {
    const updated = this.state.userCatalogs.filter((c) => c.id !== id);
    this.saveUserCatalogs(updated);
    this.setState({ userCatalogs: updated });
  };

  getDownloadLinks(entry: OPDSEntry): OPDSLink[] {
    return entry.links.filter(
      (l) =>
        ACQUISITION_RELS.some((rel) => l.rel === rel) &&
        (DOWNLOAD_TYPES[l.type] ||
          supportedFormats.includes(
            "." + l.href.split(".").pop()?.toLowerCase()
          ))
    );
  }

  renderCatalogView() {
    const { userCatalogs, isAddingCatalog, newCatalogUrl, newCatalogTitle } =
      this.state;

    return (
      <>
        {/* Add catalog */}
        {isAddingCatalog ? (
          <div className="opds-add-form">
            <input
              className="token-dialog-username-box"
              type="url"
              placeholder={this.props.t("OPDS Catalog URL")}
              value={newCatalogUrl}
              onChange={(e) => this.setState({ newCatalogUrl: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && this.handleAddCatalog()}
              autoFocus
            />
            <input
              className="token-dialog-username-box"
              type="text"
              placeholder={this.props.t("Catalog Name (optional)")}
              value={newCatalogTitle}
              onChange={(e) =>
                this.setState({ newCatalogTitle: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && this.handleAddCatalog()}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                padding: "0 25px",
                justifyContent: "flex-end",
                marginTop: "10px",
                paddingRight: "0px",
              }}
            >
              <span
                className="voice-add-cancel"
                onClick={() =>
                  this.setState({
                    isAddingCatalog: false,
                    newCatalogUrl: "",
                    newCatalogTitle: "",
                  })
                }
              >
                <Trans>Cancel</Trans>
              </span>
              <span
                className="voice-add-confirm"
                style={{ position: "static", fontSize: "14px" }}
                onClick={this.handleAddCatalog}
              >
                <Trans>Add</Trans>
              </span>
            </div>
          </div>
        ) : null}
        {/* Popular catalogs */}
        <div className="opds-section-label">
          <Trans>Popular OPDS Catalogs</Trans>
        </div>
        {BUILT_IN_CATALOGS.filter((item) => {
          if (item.isElectronicOnly) {
            return isElectron;
          }
          return true;
        }).map((catalog) => (
          <div
            key={catalog.id}
            className="cloud-drive-item"
            onClick={() => this.openCatalog(catalog)}
          >
            <span className="cloud-drive-label">{catalog.title}</span>
            <span className="icon-dropdown import-dialog-more-file"></span>
          </div>
        ))}

        {/* User catalogs */}
        {userCatalogs.length > 0 && (
          <>
            <div className="opds-section-label">
              <Trans>My OPDS Catalogs</Trans>
            </div>
            {userCatalogs.map((catalog) => (
              <div key={catalog.id} className="cloud-drive-item">
                <span
                  className="cloud-drive-label"
                  onClick={() => this.openCatalog(catalog)}
                >
                  {catalog.title}
                </span>
                <span
                  className="icon-close import-dialog-folder-button"
                  style={{ fontSize: "13px", marginRight: "8px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handleRemoveCatalog(catalog.id);
                  }}
                ></span>
                <span
                  className="icon-dropdown import-dialog-more-file"
                  onClick={() => this.openCatalog(catalog)}
                ></span>
              </div>
            ))}
          </>
        )}
      </>
    );
  }

  renderFeedView() {
    const { currentFeed, isLoading, error, searchQuery } = this.state;

    return (
      <>
        {/* Search bar */}
        {currentFeed?.searchTemplate && (
          <div className="opds-search-bar">
            <input
              className="header-search-box"
              type="text"
              placeholder={this.props.t("Search in catalog...")}
              value={searchQuery}
              onChange={(e) => this.setState({ searchQuery: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && this.handleSearch()}
            />
            <span
              className="header-search-text"
              style={{ marginRight: "15px", height: "50px" }}
            >
              <span
                className="icon-search header-search-icon"
                onClick={this.handleSearch}
              ></span>
            </span>
          </div>
        )}

        {isLoading && (
          <div
            className="loading-animation"
            style={{ height: "calc(100% - 50px)" }}
          >
            <div className="loader"></div>
          </div>
        )}

        {error && !isLoading && (
          <div
            className="loading-animation"
            style={{
              height: "calc(100% - 50px)",
              fontSize: "13px",
              padding: "0 20px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {!isLoading &&
          !error &&
          currentFeed &&
          currentFeed.entries.length === 0 && (
            <div
              className="loading-animation"
              style={{ height: "calc(100% - 50px)" }}
            >
              <Trans>Empty</Trans>
            </div>
          )}

        {!isLoading &&
          !error &&
          currentFeed &&
          currentFeed.entries.map((entry, index) => (
            <div
              key={entry.id || index}
              className="cloud-drive-item opds-entry-row"
              onClick={() => {
                if (entry.isNavigation) {
                  this.navigateToEntry(entry);
                } else {
                  this.setState({ view: "detail", selectedBook: entry });
                }
              }}
            >
              {/* Cover thumbnail */}
              {!entry.isNavigation && (
                <div className="opds-thumb">
                  {entry.thumbnailUrl ? (
                    <img
                      src={entry.thumbnailUrl}
                      alt=""
                      className="opds-thumb-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span
                      className="icon-book"
                      style={{ fontSize: "20px", opacity: 0.3 }}
                    ></span>
                  )}
                </div>
              )}
              {entry.isNavigation && (
                <span
                  className="icon-folder"
                  style={{ fontSize: "15px", margin: "5px" }}
                ></span>
              )}

              {/* Text content */}
              <div className="opds-entry-info">
                <span
                  className="cloud-drive-label"
                  style={{ width: "auto", marginRight: 0 }}
                >
                  {entry.title}
                </span>
                {!entry.isNavigation && entry.authors.length > 0 && (
                  <span className="opds-entry-author">
                    {entry.authors.join(", ")}
                  </span>
                )}
              </div>

              <span className="icon-dropdown import-dialog-more-file"></span>
            </div>
          ))}
      </>
    );
  }

  renderDetailView() {
    const { selectedBook } = this.state;
    if (!selectedBook) return null;
    const downloadLinks = this.getDownloadLinks(selectedBook);

    return (
      <div className="opds-detail">
        <div className="opds-detail-header">
          {selectedBook.coverUrl && (
            <img
              className="opds-detail-cover"
              src={selectedBook.coverUrl}
              alt={selectedBook.title}
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
          )}
          <div className="opds-detail-meta">
            <div className="opds-detail-title">{selectedBook.title}</div>
            {selectedBook.authors.length > 0 && (
              <div className="opds-entry-author">
                {selectedBook.authors.join(", ")}
              </div>
            )}
            <div
              className="opds-detail-download-label"
              style={{ marginTop: "15px" }}
            >
              <Trans>Download as</Trans>:
            </div>
            {downloadLinks.length === 0 && (
              <div style={{ opacity: 0.5, fontSize: "13px", padding: "8px 0" }}>
                <Trans>No supported formats available</Trans>
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {downloadLinks.map((link, i) => (
                <span
                  key={i}
                  className="import-dialog-back-button"
                  style={{
                    position: "static",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                  onClick={() => this.handleDownloadBook(selectedBook, link)}
                >
                  {(
                    DOWNLOAD_TYPES[link.type] ||
                    link.href.split(".").pop() ||
                    "file"
                  ).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {selectedBook.summary && (
          <div className="opds-detail-summary">{selectedBook.summary}</div>
        )}
      </div>
    );
  }

  renderTitle() {
    const { view, feedStack, selectedBook } = this.state;
    if (view === "catalog") return <Trans>From OPDS</Trans>;
    if (view === "detail")
      return selectedBook?.title || <Trans>Book Detail</Trans>;
    if (feedStack.length > 0) return feedStack[feedStack.length - 1].title;
    return <Trans>From OPDS</Trans>;
  }

  render() {
    const { view } = this.state;

    return (
      <div
        className="backup-page-container"
        style={{
          height: "450px",
          top: "calc(50% - 225px)",
          width: "500px",
          left: "calc(50% - 250px)",
        }}
      >
        <div className="backup-dialog-title">{this.renderTitle()}</div>

        <div className="import-dialog-option">
          {view === "catalog" && this.renderCatalogView()}
          {view === "feed" && this.renderFeedView()}
          {view === "detail" && this.renderDetailView()}
        </div>

        {view !== "catalog" && (
          <div className="import-dialog-back-button" onClick={this.handleBack}>
            <Trans>Back to parent</Trans>
          </div>
        )}

        <div className="backup-page-close-icon" onClick={this.handleClose}>
          <span className="icon-close backup-close-icon"></span>
        </div>

        {view === "catalog" && (
          <div
            className="cloud-drive-item"
            onClick={() => this.setState({ isAddingCatalog: true })}
            style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              paddingRight: "10px",
              width: "100%",
              height: "40px",
            }}
          >
            <span
              className="cloud-drive-label"
              style={{ width: "auto", fontSize: "16px" }}
            >
              <Trans>Add OPDS Catalog</Trans>
            </span>
          </div>
        )}
      </div>
    );
  }
}

export default OPDSDialog;
