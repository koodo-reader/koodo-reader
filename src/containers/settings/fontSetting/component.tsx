import React from "react";
import "./fontSetting.css";
import {
  SettingInfoProps,
  SettingInfoState,
  InstalledFont,
} from "./interface";
import { Trans } from "react-i18next";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import FontUtil from "../../../utils/file/fontUtil";
import { ChineseFonts, NonChineseFonts } from "../../../constants/fontConfig";

class FontSetting extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  fileInputRef = React.createRef<HTMLInputElement>();
  abortController: AbortController | null = null;

  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      fonts: [],
      loadedUrls: {},
      isLoading: true,
      showFeatured: false,
      expandedFamily: "",
      downloadingId: "",
      downloadProgress: 0,
    };
  }

  componentDidMount() {
    this.loadAllFonts();
    window.addEventListener("font-list-changed", this.loadAllFonts);
  }

  componentWillUnmount() {
    window.removeEventListener("font-list-changed", this.loadAllFonts);
    Object.values(this.state.loadedUrls).forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
  }

  loadAllFonts = async () => {
    this.setState({ isLoading: true });
    const ids = FontUtil.getFontIds();
    const fonts: InstalledFont[] = [];
    const loadedUrls: Record<string, string> = { ...this.state.loadedUrls };

    for (const id of ids) {
      const meta = FontUtil.getFontMeta(id);
      if (!meta) continue;
      fonts.push({ key: id, ...meta });
      if (!loadedUrls[id]) {
        const url = await FontUtil.getFontUrl(id);
        if (url) loadedUrls[id] = url;
      }
    }

    this.setState({ fonts, loadedUrls, isLoading: false });
  };

  handleImportClick = () => {
    this.fileInputRef.current?.click();
  };

  handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = "";

    const ext = FontUtil.getFontExtension(file.name);
    if (!FontUtil.isValidFontExtension(ext)) {
      toast.error(this.props.t("Only ttf, otf, woff files are supported"));
      return;
    }

    const fontKey = FontUtil.normalizeFontName(file.name);
    if (FontUtil.getFontMeta(fontKey)) {
      toast.error(this.props.t("Font already exists"));
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      await FontUtil.saveFont(fontKey, arrayBuffer, ext);
      const label = file.name.replace(/\.[^.]+$/, "");
      FontUtil.saveFontMeta(fontKey, { label, value: fontKey, type: ext });
      FontUtil.addFontId(fontKey);
      const url = await FontUtil.getFontUrl(fontKey);
      const newFont: InstalledFont = {
        key: fontKey,
        label,
        value: fontKey,
        type: ext,
      };
      this.setState((prev) => ({
        fonts: [...prev.fonts, newFont],
        loadedUrls: url ? { ...prev.loadedUrls, [fontKey]: url } : prev.loadedUrls,
      }));
      FontUtil.notifyFontListChanged();
      toast.success(this.props.t("Font added successfully"));
    } catch (err) {
      console.error(err);
      toast.error(this.props.t("Import failed"));
    }
  };

  handleDelete = async (e: React.MouseEvent, font: InstalledFont) => {
    e.stopPropagation();
    try {
      await FontUtil.deleteFont(font.key);
      FontUtil.deleteFontMeta(font.key);
      FontUtil.removeFontId(font.key);
      FontUtil.clearFontReferences(font.key);

      const updatedUrls = { ...this.state.loadedUrls };
      if (updatedUrls[font.key]?.startsWith("blob:")) {
        URL.revokeObjectURL(updatedUrls[font.key]);
      }
      delete updatedUrls[font.key];

      this.setState((prev) => ({
        fonts: prev.fonts.filter((f) => f.key !== font.key),
        loadedUrls: updatedUrls,
      }));
      FontUtil.notifyFontListChanged();
      toast.success(this.props.t("Deletion successful"));
    } catch (err) {
      console.error(err);
      toast.error(this.props.t("Deletion failed"));
    }
  };

  getFeaturedFontList = () => {
    const lang = ConfigService.getReaderConfig("lang") || "";
    return lang.startsWith("zh")
      ? [...ChineseFonts, ...NonChineseFonts]
      : [...NonChineseFonts, ...ChineseFonts];
  };

  getFeaturedFamilies = () => {
    const all = this.getFeaturedFontList();
    const families: string[] = [];
    all.forEach((font) => {
      if (!families.includes(font.fontFamily)) {
        families.push(font.fontFamily);
      }
    });
    return families;
  };

  handleOpenFeatured = () => {
    this.setState({ showFeatured: true, expandedFamily: "" });
  };

  handleCloseFeatured = () => {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.setState({
      showFeatured: false,
      downloadingId: "",
      downloadProgress: 0,
    });
  };

  handleToggleFamily = (family: string) => {
    this.setState((prev) => ({
      expandedFamily: prev.expandedFamily === family ? "" : family,
    }));
  };

  isFontInstalled = (fontId: string) => {
    return FontUtil.getFontIds().includes(fontId);
  };

  handleDownloadFeatured = async (font: {
    id: string;
    fontName: string;
    style: string;
    url: string;
  }) => {
    if (this.isFontInstalled(font.id)) {
      toast.success(this.props.t("Font already downloaded"));
      return;
    }
    if (this.state.downloadingId) return;

    this.setState({ downloadingId: font.id, downloadProgress: 0 });
    try {
      const success = await FontUtil.downloadFeaturedFont(font, (progress) => {
        this.setState({ downloadProgress: progress });
      });
      if (success) {
        await this.loadAllFonts();
        toast.success(this.props.t("Download successful"));
      } else {
        toast.error(this.props.t("Download failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error(this.props.t("Download failed"));
    } finally {
      this.setState({ downloadingId: "", downloadProgress: 0 });
    }
  };

  renderFontPreviewStyle = (fontKey: string, url: string) => {
    if (!url) return {};
    return {
      fontFamily: `"${fontKey}"`,
      // @ts-ignore
      "--font-face": `@font-face { font-family: "${fontKey}"; src: url("${url}"); }`,
    } as React.CSSProperties;
  };

  injectFontFace = (fontKey: string, url: string) => {
    if (!url) return null;
    const styleId = `font-preview-${fontKey}`;
    return (
      <style key={styleId}>{`
        @font-face {
          font-family: "${fontKey}";
          src: url("${url}");
        }
      `}</style>
    );
  };

  renderFeaturedPanel = () => {
    const families = this.getFeaturedFamilies();
    const allFonts = this.getFeaturedFontList();
    const { expandedFamily, downloadingId, downloadProgress } = this.state;

    return (
      <div className="font-featured-overlay" onClick={this.handleCloseFeatured}>
        <div
          className="font-featured-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-featured-header">
            <Trans>Featured fonts</Trans>
            <span
              className="font-featured-close icon-close"
              onClick={this.handleCloseFeatured}
            />
          </div>
          <div className="font-featured-list">
            {families.map((family) => (
              <div key={family} className="font-featured-family">
                <div
                  className="font-featured-family-header"
                  onClick={() => this.handleToggleFamily(family)}
                >
                  <span>{family}</span>
                  <span>{expandedFamily === family ? "▲" : "▼"}</span>
                </div>
                {expandedFamily === family &&
                  allFonts
                    .filter((f) => f.fontFamily === family)
                    .map((font) => {
                      const installed = this.isFontInstalled(font.id);
                      const isDownloading = downloadingId === font.id;
                      return (
                        <div key={font.id} className="font-featured-variant">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                            }}
                          >
                            <span>
                              {font.fontName} {font.style}
                            </span>
                            {installed ? (
                              <span style={{ opacity: 0.5, fontSize: 13 }}>
                                <Trans>Installed</Trans>
                              </span>
                            ) : (
                              <button
                                className="font-featured-download-btn"
                                disabled={!!downloadingId && !isDownloading}
                                onClick={() => this.handleDownloadFeatured(font)}
                              >
                                {isDownloading ? (
                                  <Trans>Downloading</Trans>
                                ) : (
                                  <Trans>Download</Trans>
                                )}
                              </button>
                            )}
                          </div>
                          {isDownloading && (
                            <div className="font-featured-progress">
                              <div
                                className="font-featured-progress-bar"
                                style={{
                                  width: `${Math.round(downloadProgress * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { fonts, loadedUrls, isLoading, showFeatured } = this.state;

    return (
      <>
        {fonts.map((font) => this.injectFontFace(font.key, loadedUrls[font.key]))}

        <div className="font-setting-grid">
          {isLoading ? (
            <div className="font-setting-empty">
              <Trans>Loading...</Trans>
            </div>
          ) : fonts.length === 0 ? (
            <div className="font-setting-empty">
              <Trans>No fonts added yet</Trans>
            </div>
          ) : (
            fonts.map((font) => (
              <div key={font.key} className="font-setting-item">
                <div
                  className="font-setting-preview"
                  style={this.renderFontPreviewStyle(
                    font.key,
                    loadedUrls[font.key]
                  )}
                >
                  Aa 字体 123
                </div>
                <div className="font-setting-label" title={font.label}>
                  {font.label}
                </div>
                <div className="font-setting-type">{font.type}</div>
                <span
                  className="font-setting-delete icon-close"
                  onClick={(e) => this.handleDelete(e, font)}
                />
              </div>
            ))
          )}
        </div>

        <input
          ref={this.fileInputRef}
          type="file"
          accept=".ttf,.otf,.woff"
          style={{ display: "none" }}
          onChange={this.handleFileChange}
        />

        <div className="font-setting-actions">
          <div
            className="setting-dialog-new-plugin font-setting-action-btn"
            onClick={this.handleOpenFeatured}
          >
            <span style={{ fontWeight: "bold" }}>
              <Trans>Download featured fonts</Trans>
            </span>
          </div>
          <div
            className="setting-dialog-new-plugin font-setting-action-btn"
            onClick={this.handleImportClick}
          >
            <span style={{ fontWeight: "bold" }}>
              <Trans>Import font</Trans>
            </span>
          </div>
        </div>

        {showFeatured && this.renderFeaturedPanel()}
      </>
    );
  }
}

export default FontSetting;
