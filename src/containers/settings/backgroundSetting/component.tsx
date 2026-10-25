import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import "./backgroundSetting.css";
import {
  SettingInfoProps,
  SettingInfoState,
  BackgroundImage,
} from "./interface";
import { Trans } from "react-i18next";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { applyAppBackgroundImage } from "../../../utils/reader/launchUtil";
import BackgroundUtil from "../../../utils/file/backgroundUtil";
import { useAppStore } from "../../../store/useAppStore";

const FEATURED_COUNT = 100;

const BackgroundSetting = () => {
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const handleReaderBackgroundImage = useAppStore(
    (s) => s.handleReaderBackgroundImage
  );
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const featuredObserver = useRef<IntersectionObserver | null>(null);
  const pendingFeaturedElements = useRef<HTMLDivElement[]>([]);

  const [state, setState] = useState<SettingInfoState>({
    images: [],
    loadedUrls: {},
    previewImage: null,
    previewFeatured: null,
    appBackgroundId:
      ConfigService.getReaderConfig("appBackgroundImage") || "",
    readerBackgroundId:
      ConfigService.getReaderConfig("readerBackgroundImage") || "",
    isLoading: true,
    visibleFeatured: new Set<number>(),
    downloadingId: "",
    downloadProgress: 0,
  });

  const setupFeaturedObserver = () => {
    if (typeof IntersectionObserver === "undefined") return;
    const root = document.querySelector(".setting-dialog-info");
    featuredObserver.current = new IntersectionObserver(
      (entries) => {
        const newlyVisible: number[] = [];
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(
            (entry.target as HTMLElement).dataset.featuredIndex
          );
          if (Number.isNaN(index)) return;
          newlyVisible.push(index);
        });
        if (newlyVisible.length > 0) {
          setState((prev) => {
            const next = new Set(prev.visibleFeatured);
            let hasNew = false;
            newlyVisible.forEach((index) => {
              if (!next.has(index)) {
                next.add(index);
                hasNew = true;
              }
            });
            return hasNew ? { ...prev, visibleFeatured: next } : prev;
          });
        }
      },
      { root, rootMargin: "120px 0px" }
    );
    pendingFeaturedElements.current.forEach((el) =>
      featuredObserver.current!.observe(el)
    );
    pendingFeaturedElements.current = [];
  };

  const registerFeaturedItem = (index: number) => {
    return (el: HTMLDivElement | null) => {
      if (!el) return;
      el.dataset.featuredIndex = String(index);
      if (featuredObserver.current) {
        featuredObserver.current.observe(el);
      } else {
        pendingFeaturedElements.current.push(el);
      }
    };
  };

  const loadAllImages = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    const ids = BackgroundUtil.getImageIds();
    const images: BackgroundImage[] = [];
    const loadedUrls: Record<string, string> = {};

    for (const id of ids) {
      const meta = BackgroundUtil.getImageMeta(id);
      if (!meta) continue;
      images.push({
        id,
        name: meta.name,
        extension: meta.extension,
        textColor: meta.textColor,
        backgroundColor: meta.backgroundColor,
      });
      const url = await BackgroundUtil.loadImage(id, meta.extension);
      if (url) loadedUrls[id] = url;
    }

    setState((prev) => ({ ...prev, images, loadedUrls, isLoading: false }));
  };

  useEffect(() => {
    loadAllImages();
    setupFeaturedObserver();
    return () => {
      featuredObserver.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      const id = Date.now().toString();
      const { extension } = BackgroundUtil.convertDataUrl(dataUrl);

      // Analyse dominant color before saving metadata
      const { backgroundColor, textColor } =
        await BackgroundUtil.analyzeImageColors(dataUrl);

      const meta = { name: file.name, extension, backgroundColor, textColor };

      try {
        await BackgroundUtil.saveImage(id, dataUrl);
        BackgroundUtil.saveImageMeta(id, meta);
        BackgroundUtil.addImageId(id);

        const newImage: BackgroundImage = {
          id,
          name: file.name,
          extension,
          backgroundColor,
          textColor,
        };
        setState((prev) => ({
          ...prev,
          images: [...prev.images, newImage],
          loadedUrls: { ...prev.loadedUrls, [id]: dataUrl },
        }));
        toast.success(t("Import successful"));
      } catch (err) {
        console.error(err);
        toast.error(t("Import failed"));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePreview = (image: BackgroundImage) => {
    setState((prev) => ({ ...prev, previewImage: image }));
  };

  const handleClosePreview = () => {
    setState((prev) => ({ ...prev, previewImage: null }));
  };

  const handleSetAppBackground = (image: BackgroundImage) => {
    ConfigService.setReaderConfig("appBackgroundImage", image.id);
    setState((prev) => ({ ...prev, appBackgroundId: image.id }));
    applyAppBackgroundImage();
    toast.success(t("Change successful"));
  };

  const handleClearAppBackground = () => {
    ConfigService.setReaderConfig("appBackgroundImage", "");
    setState((prev) => ({ ...prev, appBackgroundId: "" }));
    applyAppBackgroundImage();
    toast.success(t("Change successful"));
  };

  const handleSetReaderBackground = (image: BackgroundImage) => {
    ConfigService.setReaderConfig("readerBackgroundImage", image.id);
    if (image.textColor) {
      ConfigService.setReaderConfig("textColor", image.textColor);
    }
    if (image.backgroundColor) {
      ConfigService.setReaderConfig("backgroundColor", image.backgroundColor);
    }
    setState((prev) => ({ ...prev, readerBackgroundId: image.id }));
    handleReaderBackgroundImage?.(image.id);
    toast.success(t("Change successful"));
  };

  const handleClearReaderBackground = () => {
    ConfigService.setReaderConfig("readerBackgroundImage", "");
    setState((prev) => ({ ...prev, readerBackgroundId: "" }));
    handleReaderBackgroundImage?.(
"");
    toast.success(t("Change successful"));
    ConfigService.setReaderConfig("textColor", "");
    ConfigService.setReaderConfig("backgroundColor", "");
  };

  const getFeaturedImage = (index: number): BackgroundImage | undefined => {
    const id = BackgroundUtil.getFeaturedBackgroundId(index);
    return state.images.find((img) => img.id === id);
  };

  const handleFeaturedPreview = (index: number) => {
    const existing = getFeaturedImage(index);
    if (existing) {
      handlePreview(existing);
    } else {
      setState((prev) => ({ ...prev, previewFeatured: index }));
    }
  };

  const handleCloseFeaturedPreview = () => {
    setState((prev) => ({ ...prev, previewFeatured: null }));
  };

  const handleFeaturedSetBackground = async (
    index: number,
    type: "app" | "reader"
  ) => {
    const id = BackgroundUtil.getFeaturedBackgroundId(index);
    if (state.downloadingId) return;
    const existing = getFeaturedImage(index);
    if (existing) {
      if (type === "app") {
        handleSetAppBackground(existing);
      } else {
        handleSetReaderBackground(existing);
      }
      return;
    }

    setState((prev) => ({
      ...prev,
      downloadingId: id,
      downloadProgress: 0,
    }));
    try {
      const dataUrl = await BackgroundUtil.downloadFeaturedBackground(
        index,
        isAuthed,
        (progress) =>
          setState((prev) => ({ ...prev, downloadProgress: progress }))
      );
      if (!dataUrl) {
        toast.error(t("Download failed"));
        return;
      }
      const meta = BackgroundUtil.getImageMeta(id);
      const newImage: BackgroundImage = {
        id,
        name: meta?.name || id,
        extension: meta?.extension || "png",
        backgroundColor: meta?.backgroundColor,
        textColor: meta?.textColor,
      };
      setState((prev) => ({
        ...prev,
        images: [...prev.images, newImage],
        loadedUrls: { ...prev.loadedUrls, [id]: dataUrl },
      }));
      if (type === "app") {
        handleSetAppBackground(newImage);
      } else {
        handleSetReaderBackground(newImage);
      }
      toast.success(t("Download successful"));
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

  const handleDelete = async (e: React.MouseEvent, image: BackgroundImage) => {
    e.stopPropagation();
    try {
      await BackgroundUtil.deleteImage(image.id);
      BackgroundUtil.deleteImageMeta(image.id);
      BackgroundUtil.removeImageId(image.id);

      const updatedUrls = { ...state.loadedUrls };
      delete updatedUrls[image.id];

      setState((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== image.id),
        loadedUrls: updatedUrls,
      }));

      if (state.appBackgroundId === image.id) {
        ConfigService.setReaderConfig("appBackgroundImage", "");
        setState((prev) => ({ ...prev, appBackgroundId: "" }));
        applyAppBackgroundImage();
      }
      if (state.readerBackgroundId === image.id) {
        ConfigService.setReaderConfig("readerBackgroundImage", "");
        setState((prev) => ({ ...prev, readerBackgroundId: "" }));
    handleReaderBackgroundImage?.("");
      }
      toast.success(t("Deletion successful"));
    } catch (err) {
      console.error(err);
      toast.error(t("Deletion failed"));
    }
  };

  const renderBadge = (image: BackgroundImage) => {
    const isApp = state.appBackgroundId === image.id;
    const isReader = state.readerBackgroundId === image.id;
    if (!isApp && !isReader) return null;
    return (
      <span className="background-setting-badge">
        {isApp && <Trans>App</Trans>}
        {isApp && isReader && " · "}
        {isReader && <Trans>Reader</Trans>}
      </span>
    );
  };

  const renderPreviewActions = (previewImage: BackgroundImage) => {
    const isApp = state.appBackgroundId === previewImage.id;
    const isReader = state.readerBackgroundId === previewImage.id;
    return (
      <div
        className="background-preview-actions"
        onClick={(e) => e.stopPropagation()}
      >
        {isApp ? (
          <span
            className="change-location-button background-apple-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={handleClearAppBackground}
          >
            <Trans>Clear app background</Trans>
          </span>
        ) : (
          <span
            className="change-location-button background-apple-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={() => handleSetAppBackground(previewImage)}
          >
            <Trans>Set as app background</Trans>
          </span>
        )}
        {isReader ? (
          <span
            className="change-location-button background-apple-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={handleClearReaderBackground}
          >
            <Trans>Clear book background</Trans>
          </span>
        ) : (
          <span
            className="change-location-button background-apple-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={() => handleSetReaderBackground(previewImage)}
          >
            <Trans>Set as book background</Trans>
          </span>
        )}
      </div>
    );
  };

  const renderFeaturedPreviewActions = (index: number) => {
    const id = BackgroundUtil.getFeaturedBackgroundId(index);
    const isDownloading = state.downloadingId === id;
    const percent = Math.round(state.downloadProgress * 100);
    const isApp = state.appBackgroundId === id;
    const isReader = state.readerBackgroundId === id;
    return (
      <div
        className="background-preview-actions"
        onClick={(e) => e.stopPropagation()}
      >
        {isApp ? (
          <span
            className="change-location-button background-apple-button"
            onClick={handleClearAppBackground}
          >
            <Trans>Clear app background</Trans>
          </span>
        ) : (
          <span
            className={
              "change-location-button background-apple-button" +
              (isDownloading ? " is-downloading" : "")
            }
            onClick={() => handleFeaturedSetBackground(index, "app")}
          >
            {isDownloading ? (
              <span>
                <Trans>Downloading</Trans> {percent}%
              </span>
            ) : (
              <Trans>Set as app background</Trans>
            )}
          </span>
        )}
        {isReader ? (
          <span
            className="change-location-button background-apple-button"
            onClick={handleClearReaderBackground}
          >
            <Trans>Clear book background</Trans>
          </span>
        ) : (
          <span
            className={
              "change-location-button background-apple-button" +
              (isDownloading ? " is-downloading" : "")
            }
            onClick={() => handleFeaturedSetBackground(index, "reader")}
          >
            {isDownloading ? (
              <span>
                <Trans>Downloading</Trans> {percent}%
              </span>
            ) : (
              <Trans>Set as book background</Trans>
            )}
          </span>
        )}
      </div>
    );
  };

  const renderFeaturedSection = () => {
    const { visibleFeatured, appBackgroundId, readerBackgroundId } = state;
    const indices = Array.from({ length: FEATURED_COUNT }, (_, i) => i + 1);
    return (
      <div className="background-featured-section">
        <div className="background-featured-section-title">
          <Trans>Download featured backgrounds</Trans>
          <span className="background-featured-section-note">
            <Trans>Generated with AI</Trans>
          </span>
        </div>
        <div className="background-featured-grid">
          {indices.map((index) => {
            const id = BackgroundUtil.getFeaturedBackgroundId(index);
            const isActive =
              appBackgroundId === id || readerBackgroundId === id;
            return (
              <div
                key={index}
                className={
                  "background-featured-item" +
                  (isActive ? " active-bg-item" : "")
                }
                ref={registerFeaturedItem(index)}
                onClick={() => handleFeaturedPreview(index)}
              >
                {visibleFeatured.has(index) ? (
                  <img
                    className="background-featured-img"
                    src={BackgroundUtil.getFeaturedThumbnailUrl(
                      index,
                      isAuthed
                    )}
                    alt={id}
                    loading="lazy"
                  />
                ) : (
                  <div className="background-featured-img background-featured-placeholder" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const { images, previewImage, previewFeatured, loadedUrls, isLoading } =
    state;

  return (
    <>
      <div className="background-setting-grid">
        {isLoading ? (
          <div className="background-setting-empty">
            <Trans>Loading...</Trans>
          </div>
        ) : images.length === 0 ? (
          <div className="background-setting-empty">
            <Trans>No background images added yet</Trans>
          </div>
        ) : (
          images.map((img) => (
            <div
              key={img.id}
              className={
                "background-setting-item" +
                (state.appBackgroundId === img.id ||
                state.readerBackgroundId === img.id
                  ? " active-bg-item"
                  : "")
              }
              onClick={() => handlePreview(img)}
              title={img.name}
            >
              {loadedUrls[img.id] ? (
                <img
                  className="background-setting-img"
                  src={loadedUrls[img.id]}
                  alt={img.name}
                />
              ) : (
                <div className="background-setting-img background-setting-placeholder" />
              )}
              {renderBadge(img)}
              <span
                className="background-setting-delete icon-close"
                onClick={(e) => handleDelete(e, img)}
              />
            </div>
          ))
        )}
      </div>

      {renderFeaturedSection()}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Import button fixed at bottom-right */}
      <div className="setting-dialog-new-plugin" onClick={handleImportClick}>
        <span style={{ fontWeight: "bold" }}>
          <Trans>Import local image</Trans>
        </span>
      </div>

      {/* Preview overlay */}
      {previewImage && (
        <div
          className="background-preview-overlay"
          onClick={handleClosePreview}
        >
          <span
            className="background-preview-close icon-close"
            onClick={handleClosePreview}
          />
          <img
            className="background-preview-image"
            src={loadedUrls[previewImage.id] || ""}
            alt={previewImage.name}
            onClick={(e) => e.stopPropagation()}
          />
          {renderPreviewActions(previewImage)}
        </div>
      )}

      {/* Featured preview overlay */}
      {previewFeatured !== null && !previewImage && (
        <div
          className="background-preview-overlay"
          onClick={handleCloseFeaturedPreview}
        >
          <span
            className="background-preview-close icon-close"
            onClick={handleCloseFeaturedPreview}
          />
          <img
            className="background-preview-image"
            src={BackgroundUtil.getFeaturedOriginalUrl(
              previewFeatured,
              isAuthed
            )}
            alt={BackgroundUtil.getFeaturedBackgroundId(previewFeatured)}
            onClick={(e) => e.stopPropagation()}
          />
          {renderFeaturedPreviewActions(previewFeatured)}
        </div>
      )}
    </>
  );
};

export default BackgroundSetting;
