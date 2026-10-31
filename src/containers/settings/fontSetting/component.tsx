import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./fontSetting.css";
import { Trans } from "react-i18next";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import FontUtil, {
  translateFontName,
  translateFontStyle,
} from "../../../utils/file/fontUtil";
import { ChineseFonts, NonChineseFonts } from "../../../constants/fontConfig";
import { applyCustomSystemFont } from "../../../utils/reader/launchUtil";
import { useAppStore } from "../../../store/useAppStore";

import { FontItem } from "../../../utils/file/fontUtil";

export interface InstalledFont extends FontItem {
  key: string;
}

export interface SettingInfoState {
  fonts: InstalledFont[];
  loadedUrls: Record<string, string>;
  isLoading: boolean;
  previewFont: InstalledFont | null;
  previewLoading: boolean;
  appFontKey: string;
  readerFontKey: string;
  expandedFamily: string;
  downloadingId: string;
  downloadProgress: number;
}

const FontSetting = () => {
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const { t } = useTranslation();
  const [state, setState] = useState<SettingInfoState>(() => ({
    fonts: [],
    loadedUrls: {},
    isLoading: true,
    previewFont: null,
    previewLoading: false,
    appFontKey: ConfigService.getReaderConfig("systemFont") || "",
    readerFontKey: ConfigService.getReaderConfig("fontFamily") || "",
    expandedFamily: "",
    downloadingId: "",
    downloadProgress: 0,
  }));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stateRef = useLatest(state);

  const loadAllFonts = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    const ids = FontUtil.getFontIds();
    const fonts: InstalledFont[] = [];

    for (const id of ids) {
      const meta = FontUtil.getFontMeta(id);
      if (!meta) continue;
      fonts.push({ key: id, ...meta });
    }

    setState((prev) => ({
      ...prev,
      fonts,
      isLoading: false,
      appFontKey: ConfigService.getReaderConfig("systemFont") || "",
      readerFontKey: ConfigService.getReaderConfig("fontFamily") || "",
    }));
  }, []);

  useEffect(() => {
    loadAllFonts();
    window.addEventListener("font-list-changed", loadAllFonts);
    return () => {
      window.removeEventListener("font-list-changed", loadAllFonts);
      Object.values(stateRef.current.loadedUrls).forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [loadAllFonts]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = "";

    const ext = FontUtil.getFontExtension(file.name);
    if (!FontUtil.isValidFontExtension(ext)) {
      toast.error(t("Only ttf, otf, woff files are supported"));
      return;
    }

    const fontKey = FontUtil.normalizeFontName(file.name);
    if (FontUtil.getFontMeta(fontKey)) {
      toast.error(t("Font already exists"));
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      await FontUtil.saveFont(fontKey, arrayBuffer, ext);
      const label = file.name.replace(/\.[^.]+$/, "");
      FontUtil.saveFontMeta(fontKey, { label, value: fontKey, type: ext });
      FontUtil.addFontId(fontKey);
      const newFont: InstalledFont = {
        key: fontKey,
        label,
        value: fontKey,
        type: ext,
      };
      setState((prev) => ({
        ...prev,
        fonts: [...prev.fonts, newFont],
      }));
      FontUtil.notifyFontListChanged();
      toast.success(t("Font added successfully"));
    } catch (err) {
      console.error(err);
      toast.error(t("Import failed"));
    }
  };

  const handleDelete = async (e: React.MouseEvent, font: InstalledFont) => {
    e.stopPropagation();
    try {
      await FontUtil.deleteFont(font.key);
      FontUtil.deleteFontMeta(font.key);
      FontUtil.removeFontId(font.key);
      FontUtil.clearFontReferences(font.key);

      const updatedUrls = { ...stateRef.current.loadedUrls };
      if (updatedUrls[font.key]?.startsWith("blob:")) {
        URL.revokeObjectURL(updatedUrls[font.key]);
      }
      delete updatedUrls[font.key];

      setState((prev) => ({
        ...prev,
        fonts: prev.fonts.filter((f) => f.key !== font.key),
        loadedUrls: updatedUrls,
        previewFont:
          prev.previewFont?.key === font.key ? null : prev.previewFont,
        previewLoading:
          prev.previewFont?.key === font.key ? false : prev.previewLoading,
        appFontKey: prev.appFontKey === font.key ? "" : prev.appFontKey,
        readerFontKey:
          prev.readerFontKey === font.key ? "" : prev.readerFontKey,
      }));
      FontUtil.notifyFontListChanged();
      toast.success(t("Deletion successful"));
    } catch (err) {
      console.error(err);
      toast.error(t("Deletion failed"));
    }
  };

  const handlePreview = async (font: InstalledFont) => {
    setState((prev) => ({
      ...prev,
      previewFont: font,
      previewLoading: true,
    }));
    let url = stateRef.current.loadedUrls[font.key];
    if (!url) {
      url = await FontUtil.getFontUrl(font.key);
      if (!url) {
        toast.error(t("Import failed"));
        setState((prev) => ({
          ...prev,
          previewFont: null,
          previewLoading: false,
        }));
        return;
      }
      const fontUrl = url;
      setState((prev) => ({
        ...prev,
        loadedUrls: { ...prev.loadedUrls, [font.key]: fontUrl },
      }));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    try {
      await document.fonts.load(`16px "${font.key}"`);
    } catch {
      // font may still render via @font-face injection
    }
    setState((prev) => ({ ...prev, previewLoading: false }));
  };

  const handleClosePreview = () => {
    setState((prev) => ({
      ...prev,
      previewFont: null,
      previewLoading: false,
    }));
  };

  const handleSetAppFont = async (font: InstalledFont) => {
    ConfigService.setReaderConfig("systemFont", font.key);
    await applyCustomSystemFont();
    setState((prev) => ({ ...prev, appFontKey: font.key }));
    FontUtil.notifyFontListChanged();
    toast.success(t("Change successful"));
  };

  const handleClearAppFont = async () => {
    ConfigService.setReaderConfig("systemFont", "");
    await applyCustomSystemFont();
    setState((prev) => ({ ...prev, appFontKey: "" }));
    FontUtil.notifyFontListChanged();
    toast.success(t("Change successful"));
  };

  const handleSetReaderFont = (font: InstalledFont) => {
    ConfigService.setReaderConfig("fontFamily", font.key);
    setState((prev) => ({ ...prev, readerFontKey: font.key }));
    FontUtil.notifyFontListChanged();
    renderBookFunc?.();
    toast.success(t("Change successful"));
  };

  const handleClearReaderFont = () => {
    ConfigService.setReaderConfig("fontFamily", "");
    setState((prev) => ({ ...prev, readerFontKey: "" }));
    FontUtil.notifyFontListChanged();
    renderBookFunc?.();
    toast.success(t("Change successful"));
  };

  const renderBadge = (font: InstalledFont) => {
    const isApp = state.appFontKey === font.key;
    const isReader = state.readerFontKey === font.key;
    if (!isApp && !isReader) return null;
    return (
      <span className="font-setting-badge">
        {isApp && <Trans>App</Trans>}
        {isApp && isReader && " · "}
        {isReader && <Trans>Reader</Trans>}
      </span>
    );
  };

  const renderPreviewActions = (previewFont: InstalledFont) => {
    const isApp = state.appFontKey === previewFont.key;
    const isReader = state.readerFontKey === previewFont.key;
    return (
      <div
        className="font-preview-actions"
        onClick={(e) => e.stopPropagation()}
      >
        {isApp ? (
          <span
            className="change-location-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={handleClearAppFont}
          >
            <Trans>Clear app font</Trans>
          </span>
        ) : (
          <span
            className="change-location-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={() => handleSetAppFont(previewFont)}
          >
            <Trans>Set as app font</Trans>
          </span>
        )}
        {isReader ? (
          <span
            className="change-location-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={handleClearReaderFont}
          >
            <Trans>Clear book font</Trans>
          </span>
        ) : (
          <span
            className="change-location-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={() => handleSetReaderFont(previewFont)}
          >
            <Trans>Set as book font</Trans>
          </span>
        )}
      </div>
    );
  };

  const getFeaturedFontList = () => {
    const lang = ConfigService.getReaderConfig("lang") || "";
    return lang.startsWith("zh")
      ? [...ChineseFonts, ...NonChineseFonts]
      : [...NonChineseFonts, ...ChineseFonts];
  };

  const getFeaturedFamilies = () => {
    const all = getFeaturedFontList();
    const families: string[] = [];
    all.forEach((font) => {
      if (!families.includes(font.fontFamily)) {
        families.push(font.fontFamily);
      }
    });
    return families;
  };

  const handleToggleFamily = (family: string) => {
    setState((prev) => ({
      ...prev,
      expandedFamily: prev.expandedFamily === family ? "" : family,
    }));
  };

  const isFontInstalled = (fontId: string) => {
    return FontUtil.getFontIds().includes(fontId);
  };

  const handleDownloadFeatured = async (font: {
    id: string;
    fontName: string;
    style: string;
    url: string;
  }) => {
    if (isFontInstalled(font.id)) {
      toast.success(t("Font already downloaded"));
      return;
    }
    if (stateRef.current.downloadingId) return;

    setState((prev) => ({
      ...prev,
      downloadingId: font.id,
      downloadProgress: 0,
    }));
    try {
      const success = await FontUtil.downloadFeaturedFont(
        font,
        isAuthed,
        (progress) => {
          setState((prev) => ({ ...prev, downloadProgress: progress }));
        }
      );
      if (success) {
        await loadAllFonts();
        toast.success(t("Download successful"));
      } else {
        toast.error(t("Download failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Download failed"));
    } finally {
      setState((prev) => ({
        ...prev,
        downloadingId: "",
        downloadProgress: 0,
      }));
    }
  };

  const renderFontPreviewStyle = (fontKey: string, url: string) => {
    if (!url) return {};
    return {
      fontFamily: `"${fontKey}"`,
      // @ts-ignore
      "--font-face": `@font-face { font-family: "${fontKey}"; src: url("${url}"); }`,
    } as React.CSSProperties;
  };

  const injectFontFace = (fontKey: string, url: string) => {
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

  const renderFeaturedSection = () => {
    const families = getFeaturedFamilies();
    const allFonts = getFeaturedFontList();
    const { expandedFamily, downloadingId, downloadProgress } = state;

    return (
      <div className="font-featured-section">
        <div className="font-featured-section-title">
          <Trans>Download featured fonts</Trans>
        </div>
        <div className="font-featured-list">
          {families.map((family) => (
            <div key={family} className="font-featured-family">
              <div
                className="font-featured-family-header"
                onClick={() => handleToggleFamily(family)}
              >
                <span>{translateFontName(family, t)}</span>
                <span
                  className="icon-dropdown font-featured-family-icon"
                  style={
                    expandedFamily === family
                      ? { transform: "rotate(180deg)" }
                      : {}
                  }
                ></span>
              </div>
              {expandedFamily === family &&
                allFonts
                  .filter((f) => f.fontFamily === family)
                  .map((font) => {
                    const installed = isFontInstalled(font.id);
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
                            {translateFontName(font.fontName, t)}{" "}
                            {translateFontStyle(font.style, t)}
                          </span>
                          {installed ? (
                            <span
                              style={{
                                opacity: 0.5,
                                fontSize: 13,
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: "transparent",
                              }}
                            >
                              <Trans>Installed</Trans>
                            </span>
                          ) : (
                            <button
                              className="font-featured-download-btn"
                              disabled={!!downloadingId && !isDownloading}
                              onClick={() => handleDownloadFeatured(font)}
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
    );
  };

  const { fonts, loadedUrls, isLoading, previewFont, previewLoading } = state;

  return (
    <>
      {previewFont &&
        injectFontFace(previewFont.key, loadedUrls[previewFont.key])}

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
            <div
              key={font.key}
              className={
                "font-setting-item" +
                (state.appFontKey === font.key ||
                state.readerFontKey === font.key
                  ? " active-font-item"
                  : "")
              }
              onClick={() => handlePreview(font)}
              title={font.label}
            >
              <div className="font-setting-label" title={font.label}>
                {font.label}
              </div>
              <div className="font-setting-type">{font.type}</div>
              {renderBadge(font)}
              <span
                className="font-setting-delete icon-close"
                onClick={(e) => handleDelete(e, font)}
              />
            </div>
          ))
        )}
      </div>

      {renderFeaturedSection()}

      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="font-setting-actions">
        <div
          className="setting-dialog-new-plugin font-setting-action-btn"
          onClick={handleImportClick}
        >
          <span style={{ fontWeight: "bold" }}>
            <Trans>Import local font</Trans>
          </span>
        </div>
      </div>

      {previewFont && (
        <div className="font-preview-overlay" onClick={handleClosePreview}>
          <span
            className="font-preview-close icon-close"
            onClick={handleClosePreview}
          />
          {previewLoading ? (
            <div
              className="font-preview-content font-preview-loading"
              onClick={(e) => e.stopPropagation()}
            >
              <Trans>Loading...</Trans>
            </div>
          ) : (
            <>
              <div
                className="font-preview-content"
                style={renderFontPreviewStyle(
                  previewFont.key,
                  loadedUrls[previewFont.key]
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-preview-sample">Aa 字体 123</div>
                <div className="font-preview-paragraph">
                  <Trans>
                    The quick brown fox jumps over the lazy dog.
                    天地玄黄，宇宙洪荒。
                  </Trans>
                </div>
                <div className="font-preview-name">{previewFont.label}</div>
              </div>
              {renderPreviewActions(previewFont)}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FontSetting;
