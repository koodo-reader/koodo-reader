import React from "react";
import "./opdsDialog.css";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import SparkMD5 from "spark-md5";
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

function encodeBasicAuth(username: string, password: string): string {
  return btoa(unescape(encodeURIComponent(`${username}:${password}`)));
}

function getBaseRequestHeaders(
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  return {
    Accept: "application/atom+xml, application/xml, text/html, text/xml, */*",
    ...extraHeaders,
  };
}

function getBasicAuthHeader(
  catalog?: Pick<OPDSCatalog, "username" | "password"> | null
): string {
  if (!catalog?.username && !catalog?.password) return "";
  return `Basic ${encodeBasicAuth(catalog?.username || "", catalog?.password || "")}`;
}

function randomString(): string {
  return Math.random().toString(36).slice(2, 12);
}

function parseDigestChallenge(header: string): Record<string, string> {
  const digestPart = header.replace(/^Digest\s+/i, "");
  const result: Record<string, string> = {};
  const pattern = /([a-z0-9_-]+)=("([^"]*)"|([^,\s]+))/gi;
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(digestPart))) {
    result[match[1]] = match[3] || match[4] || "";
  }
  return result;
}

function buildDigestAuthHeader(
  url: string,
  method: string,
  catalog: Pick<OPDSCatalog, "username" | "password">,
  challengeHeader: string
): string {
  const challenge = parseDigestChallenge(challengeHeader);
  const username = catalog.username || "";
  const password = catalog.password || "";
  const parsedUrl = new URL(url);
  const uri = `${parsedUrl.pathname}${parsedUrl.search}`;
  const realm = challenge.realm || "";
  const nonce = challenge.nonce || "";
  const algorithm = (challenge.algorithm || "MD5").toUpperCase();
  const qopList = (challenge.qop || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const qop = qopList.includes("auth") ? "auth" : qopList[0] || "";
  const nc = "00000001";
  const cnonce = randomString();
  const hash = (value: string) => SparkMD5.hash(value);

  let ha1 = hash(`${username}:${realm}:${password}`);
  if (algorithm === "MD5-SESS") {
    ha1 = hash(`${ha1}:${nonce}:${cnonce}`);
  }
  const ha2 = hash(`${method.toUpperCase()}:${uri}`);
  const response = qop
    ? hash(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
    : hash(`${ha1}:${nonce}:${ha2}`);

  const parts = [
    `Digest username="${username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${uri}"`,
    `response="${response}"`,
  ];
  if (challenge.opaque) {
    parts.push(`opaque="${challenge.opaque}"`);
  }
  if (algorithm) {
    parts.push(`algorithm="${challenge.algorithm || "MD5"}"`);
  }
  if (qop) {
    parts.push(`qop="${qop}"`);
    parts.push(`nc=${nc}`);
    parts.push(`cnonce="${cnonce}"`);
  }
  return parts.join(", ");
}

async function fetchWithCatalogAuth(
  url: string,
  init: RequestInit = {},
  catalog?: Pick<OPDSCatalog, "username" | "password"> | null
): Promise<Response> {
  const method = init.method || "GET";
  const baseHeaders = {
    ...getBaseRequestHeaders(init.headers as Record<string, string>),
  };
  const firstResponse = await fetch(url, {
    ...init,
    method,
    headers: baseHeaders,
  });
  if (
    firstResponse.status !== 401 ||
    !catalog ||
    (!catalog.username && !catalog.password)
  ) {
    return firstResponse;
  }

  const challengeHeader = firstResponse.headers.get("www-authenticate") || "";
  let authorization = "";
  if (/^Digest\s+/i.test(challengeHeader)) {
    authorization = buildDigestAuthHeader(
      url,
      method,
      catalog,
      challengeHeader
    );
  } else if (/^Basic\s+/i.test(challengeHeader)) {
    authorization = getBasicAuthHeader(catalog);
  } else if (challengeHeader.toLowerCase().includes("digest")) {
    authorization = buildDigestAuthHeader(
      url,
      method,
      catalog,
      challengeHeader
    );
  } else {
    authorization = getBasicAuthHeader(catalog);
  }

  return fetch(url, {
    ...init,
    method,
    headers: {
      ...baseHeaders,
      Authorization: authorization,
    },
  });
}

function resolveUrl(href: string, baseUrl: string): string {
  if (!href) return "";
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

// Query Dublin Core elements across dc: and dcterms: namespaces
function getDC(entry: Element, localName: string): string {
  return (
    entry.getElementsByTagNameNS(
      "http://purl.org/dc/elements/1.1/",
      localName
    )[0]?.textContent ||
    entry.getElementsByTagNameNS("http://purl.org/dc/terms/", localName)[0]
      ?.textContent ||
    ""
  );
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
          l.type?.includes("text/html") ||
          l.rel === "subsection" ||
          l.rel === "related"
      );
      const isNavigation =
        hasNavigationLink && !hasAcquisitionLink && !hasSupportedDownload;

      const coverLink = entryLinks.find(
        (l) =>
          l.rel === "http://opds-spec.org/image" ||
          l.rel === "http://opds-spec.org/cover"
      );
      const thumbnailLink =
        entryLinks.find(
          (l) =>
            l.rel === "http://opds-spec.org/image/thumbnail" ||
            l.rel === "http://opds-spec.org/thumbnail"
        ) || coverLink;

      const authors = Array.from(entry.querySelectorAll("author"))
        .map((a) => a.querySelector("name")?.textContent || "")
        .filter(Boolean);

      const categories = Array.from(entry.querySelectorAll("category"))
        .map((c) => c.getAttribute("label") || c.getAttribute("term") || "")
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
        publisher: getDC(entry, "publisher"),
        language: getDC(entry, "language"),
        pubDate: getDC(entry, "date") || getDC(entry, "issued"),
        rights: getDC(entry, "rights"),
        categories,
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

async function fetchOPDSFeed(
  url: string,
  catalog?: Pick<OPDSCatalog, "username" | "password"> | null
): Promise<OPDSFeed> {
  const response = await fetchWithCatalogAuth(url, {}, catalog);
  if (!response.ok)
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const text = await response.text();
  return parseOPDSFeed(text, url);
}

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className: string;
  catalogAuth?: Pick<OPDSCatalog, "username" | "password"> | null;
  onError?: () => void;
}

interface AuthenticatedImageState {
  blobUrl: string;
  isFailed: boolean;
}

class AuthenticatedImage extends React.PureComponent<
  AuthenticatedImageProps,
  AuthenticatedImageState
> {
  private currentBlobUrl = "";

  constructor(props: AuthenticatedImageProps) {
    super(props);
    this.state = {
      blobUrl: "",
      isFailed: false,
    };
  }

  componentDidMount() {
    this.loadImage();
  }

  componentDidUpdate(prevProps: AuthenticatedImageProps) {
    if (
      prevProps.src !== this.props.src ||
      prevProps.catalogAuth?.username !== this.props.catalogAuth?.username ||
      prevProps.catalogAuth?.password !== this.props.catalogAuth?.password
    ) {
      this.loadImage();
    }
  }

  componentWillUnmount() {
    this.revokeBlobUrl();
  }

  revokeBlobUrl() {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = "";
    }
  }

  async loadImage() {
    const { src, catalogAuth, onError } = this.props;
    if (!src) {
      this.revokeBlobUrl();
      this.setState({ blobUrl: "", isFailed: true });
      return;
    }

    try {
      const response = await fetchWithCatalogAuth(src, {}, catalogAuth);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      this.revokeBlobUrl();
      const blobUrl = URL.createObjectURL(blob);
      this.currentBlobUrl = blobUrl;
      this.setState({ blobUrl, isFailed: false });
    } catch {
      this.revokeBlobUrl();
      this.setState({ blobUrl: "", isFailed: true });
      onError?.();
    }
  }

  render() {
    const { alt, className } = this.props;
    const { blobUrl, isFailed } = this.state;
    if (!blobUrl || isFailed) return null;
    return <img src={blobUrl} alt={alt} className={className} />;
  }
}

class OPDSDialog extends React.Component<OPDSDialogProps, OPDSDialogState> {
  constructor(props: OPDSDialogProps) {
    super(props);
    this.state = {
      view: "catalog",
      userCatalogs: this.loadUserCatalogs(),
      currentFeed: null,
      feedStack: [],
      currentCatalogAuth: null,
      selectedBook: null,
      isLoading: false,
      error: "",
      searchQuery: "",
      isAddingCatalog: false,
      newCatalogUrl: "",
      newCatalogTitle: "",
      newCatalogUsername: "",
      newCatalogPassword: "",
    };
  }

  loadUserCatalogs(): OPDSCatalog[] {
    try {
      const catalogMap = ConfigService.getAllObjectConfig("opdsCatalogs") || {};
      const catalogList =
        ConfigService.getAllListConfig("opdsCatalogList") || [];
      return catalogList
        .map((id: string) => catalogMap[id])
        .filter(Boolean) as OPDSCatalog[];
    } catch {
      return [];
    }
  }

  handleClose = () => this.props.handleOPDSDialog(false);

  openCatalog = async (catalog: OPDSCatalog) => {
    this.setState({
      view: "feed",
      isLoading: true,
      error: "",
      feedStack: [{ url: catalog.url, title: catalog.title }],
      currentCatalogAuth: {
        username: catalog.username || "",
        password: catalog.password || "",
      },
      currentFeed: null,
      searchQuery: "",
    });
    try {
      const feed = await fetchOPDSFeed(catalog.url, catalog);
      this.setState({ currentFeed: feed, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState({ isLoading: false, error: msg });
      toast.error(this.props.t("Failed to load catalog") + ": " + msg);
    }
  };

  navigateToEntry = async (entry: OPDSEntry) => {
    const { currentCatalogAuth } = this.state;
    const navLink = entry.links.find(
      (l) =>
        l.type?.includes("application/atom+xml") ||
        l.type?.includes("text/html") ||
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
      const feed = await fetchOPDSFeed(navLink.href, currentCatalogAuth);
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
    const { view, feedStack, currentCatalogAuth } = this.state;
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
      fetchOPDSFeed(parentUrl, currentCatalogAuth)
        .then((feed) => this.setState({ currentFeed: feed, isLoading: false }))
        .catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.setState({ isLoading: false, error: msg });
        });
    }
  };

  handleSearch = async () => {
    const { currentFeed, searchQuery, currentCatalogAuth } = this.state;
    if (!currentFeed?.searchTemplate || !searchQuery.trim()) return;
    let searchUrl = currentFeed.searchTemplate;
    if (!searchUrl.includes("searchTerms")) {
      try {
        const resp = await fetchWithCatalogAuth(
          searchUrl,
          {},
          currentCatalogAuth
        );
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
    let finalUrl = searchUrl
      .replace("{searchTerms}", encodeURIComponent(searchQuery.trim()))
      .replace("%7BsearchTerms%7D", encodeURIComponent(searchQuery.trim()));
    this.setState({ isLoading: true, error: "" });
    try {
      const feed = await fetchOPDSFeed(finalUrl, currentCatalogAuth);
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
    const { currentCatalogAuth } = this.state;
    const ext = DOWNLOAD_TYPES[link.type] || link.href.split(".").pop() || "";
    if (!supportedFormats.includes("." + ext)) {
      toast.error(this.props.t("Unsupported file format") + ": " + link.type);
      return;
    }
    toast.loading(this.props.t("Downloading") + ": " + entry.title, {
      id: "opds-download",
    });
    try {
      const response = await fetchWithCatalogAuth(
        link.href,
        {},
        currentCatalogAuth
      );
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
    const {
      newCatalogUrl,
      newCatalogTitle,
      newCatalogUsername,
      newCatalogPassword,
    } = this.state;
    if (!newCatalogUrl.trim()) {
      toast.error(this.props.t("Please enter a valid URL"));
      return;
    }
    const id = Date.now() + "";
    const newCatalog: OPDSCatalog = {
      id,
      title: newCatalogTitle.trim() || newCatalogUrl.trim(),
      url: newCatalogUrl.trim(),
      username: newCatalogUsername.trim(),
      password: newCatalogPassword,
    };
    ConfigService.setObjectConfig(id, newCatalog, "opdsCatalogs");
    ConfigService.setListConfig(id, "opdsCatalogList");
    this.setState({
      userCatalogs: this.loadUserCatalogs(),
      isAddingCatalog: false,
      newCatalogUrl: "",
      newCatalogTitle: "",
      newCatalogUsername: "",
      newCatalogPassword: "",
    });
    toast.success(this.props.t("Added successfully"));
  };

  handleRemoveCatalog = (id: string) => {
    ConfigService.deleteObjectConfig(id, "opdsCatalogs");
    ConfigService.deleteListConfig(id, "opdsCatalogList");
    this.setState({ userCatalogs: this.loadUserCatalogs() });
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
    const {
      userCatalogs,
      isAddingCatalog,
      newCatalogUrl,
      newCatalogTitle,
      newCatalogUsername,
      newCatalogPassword,
    } = this.state;

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
              placeholder={
                this.props.t("Catalog Name") +
                " (" +
                this.props.t("Optional") +
                ")"
              }
              value={newCatalogTitle}
              onChange={(e) =>
                this.setState({ newCatalogTitle: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && this.handleAddCatalog()}
            />
            <input
              className="token-dialog-username-box"
              type="text"
              placeholder={
                this.props.t("Username") + " (" + this.props.t("Optional") + ")"
              }
              value={newCatalogUsername}
              onChange={(e) =>
                this.setState({ newCatalogUsername: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && this.handleAddCatalog()}
            />
            <input
              className="token-dialog-username-box"
              type="password"
              placeholder={
                this.props.t("Password") + " (" + this.props.t("Optional") + ")"
              }
              value={newCatalogPassword}
              onChange={(e) =>
                this.setState({ newCatalogPassword: e.target.value })
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
                    newCatalogUsername: "",
                    newCatalogPassword: "",
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

        {/* User catalogs */}
        {userCatalogs.length > 0 ? (
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
                  className="icon-trash import-dialog-folder-button"
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
        ) : (
          <div
            style={{
              textAlign: "center",
              opacity: 0.5,
              padding: "30px 0",
              fontSize: "14px",
            }}
          >
            <Trans>No OPDS added yet</Trans>
          </div>
        )}
      </>
    );
  }

  renderFeedView() {
    const { currentFeed, isLoading, error, searchQuery, currentCatalogAuth } =
      this.state;

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
              style={{ marginRight: "15px", height: "40px", marginTop: "5px" }}
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
                    <AuthenticatedImage
                      src={entry.thumbnailUrl}
                      alt=""
                      className="opds-thumb-img"
                      catalogAuth={currentCatalogAuth}
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
    const { selectedBook, currentCatalogAuth } = this.state;
    if (!selectedBook) return null;
    const formatUpdated = (iso: string) => {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleDateString();
      } catch {
        return iso;
      }
    };

    // Metadata cells: [label, value] — only show non-empty ones
    const metaCells: [string, string][] = [
      ["Publisher", selectedBook.publisher],
      ["Language", selectedBook.language],
      [
        "Published",
        selectedBook.pubDate ? formatUpdated(selectedBook.pubDate) : "",
      ],
      [
        "Updated",
        selectedBook.updated ? formatUpdated(selectedBook.updated) : "",
      ],
    ].filter(([, v]) => v) as [string, string][];

    return (
      <div className="detail-dialog-book-info" style={{ height: "100%" }}>
        {/* Cover */}
        <div
          className="detail-cover-container"
          style={{
            width: "100%",
            height: "auto",
            margin: 0,
            padding: "16px 0 8px",
          }}
        >
          {selectedBook.coverUrl ? (
            <AuthenticatedImage
              src={selectedBook.coverUrl}
              alt={selectedBook.title}
              className="detail-cover"
              catalogAuth={currentCatalogAuth}
            />
          ) : (
            <span
              className="icon-book"
              style={{ fontSize: "60px", opacity: 0.15 }}
            ></span>
          )}
        </div>

        {/* Title */}
        <p className="detail-dialog-book-title">{selectedBook.title}</p>

        {/* Author */}
        {selectedBook.authors.length > 0 && (
          <p className="detail-dialog-book-author">
            {selectedBook.authors.join(", ")}
          </p>
        )}

        {/* Categories */}
        {selectedBook.categories.length > 0 && (
          <p
            className="detail-dialog-book-author"
            style={{ opacity: 0.5, fontSize: "12px" }}
          >
            {selectedBook.categories.join(" · ")}
          </p>
        )}

        {/* Metadata row */}
        {metaCells.length > 0 && (
          <div className="detail-sub-info">
            {metaCells.map(([label, value], i) => (
              <React.Fragment key={label}>
                {i > 0 && <p className="detail-dialog-book-divider"></p>}
                <p className="detail-dialog-book-publisher">
                  <p className="detail-sub-title">
                    <Trans>{label}</Trans>
                  </p>
                  <p className="detail-sub-content-container">
                    <p className="detail-sub-content">{value}</p>
                  </p>
                </p>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Rights */}
        {selectedBook.rights && (
          <p className="detail-dialog-book-desc" style={{ fontSize: "11px" }}>
            {selectedBook.rights}
          </p>
        )}

        {/* Description */}
        {selectedBook.summary && (
          <>
            <p className="detail-dialog-book-desc">
              <Trans>Description</Trans>:
            </p>
            <div className="detail-dialog-book-detail">
              {selectedBook.summary}
            </div>
          </>
        )}
      </div>
    );
  }

  renderTitle() {
    const { view, feedStack } = this.state;
    if (view === "catalog") return <Trans>From OPDS</Trans>;
    if (view === "detail") return <Trans>Book Detail</Trans>;
    if (feedStack.length > 0) return feedStack[feedStack.length - 1].title;
    return <Trans>From OPDS</Trans>;
  }

  render() {
    const { view, selectedBook } = this.state;
    const downloadLinks =
      view === "detail" && selectedBook
        ? this.getDownloadLinks(selectedBook)
        : [];

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

        {/* Bottom bar */}
        {view === "detail" && downloadLinks.length > 0 && (
          <div
            className="opds-bottom-bar"
            style={{
              padding: "2px",
            }}
          >
            {downloadLinks.map((link, i) => (
              <div
                key={i}
                className="new-version-open"
                onClick={() => this.handleDownloadBook(selectedBook!, link)}
                style={{
                  padding: "0px 0px",
                  fontSize: "12px",
                  height: "30px",
                  lineHeight: "30px",
                }}
              >
                <span>
                  <Trans>Download</Trans>
                </span>{" "}
                {(
                  DOWNLOAD_TYPES[link.type] ||
                  link.href.split(".").pop() ||
                  "file"
                ).toUpperCase()}
              </div>
            ))}
          </div>
        )}

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
