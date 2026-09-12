import React from "react";
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

const FEATURED_COUNT = 100;

class BackgroundSetting extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  fileInputRef = React.createRef<HTMLInputElement>();
  featuredObserver: IntersectionObserver | null = null;

  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
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
    };
  }

  componentDidMount() {
    this.loadAllImages();
    this.setupFeaturedObserver();
  }

  componentWillUnmount() {
    this.featuredObserver?.disconnect();
  }

  setupFeaturedObserver = () => {
    if (typeof IntersectionObserver === "undefined") return;
    this.featuredObserver = new IntersectionObserver(
      (entries) => {
        const newlyVisible: number[] = [];
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(
            (entry.target as HTMLElement).dataset.featuredIndex
          );
          if (index && !this.state.visibleFeatured.has(index)) {
            newlyVisible.push(index);
          }
        });
        if (newlyVisible.length > 0) {
          this.setState((prev) => ({
            visibleFeatured: new Set([
              ...prev.visibleFeatured,
              ...newlyVisible,
            ]),
          }));
        }
      },
      { rootMargin: "300px 0px" }
    );
  };

  registerFeaturedItem = (index: number) => (el: HTMLDivElement | null) => {
    if (!el) return;
    el.dataset.featuredIndex = String(index);
    if (this.featuredObserver) {
      this.featuredObserver.observe(el);
    } else if (!this.state.visibleFeatured.has(index)) {
      this.setState((prev) => ({
        visibleFeatured: new Set([...prev.visibleFeatured, index]),
      }));
    }
  };

  loadAllImages = async () => {
    this.setState({ isLoading: true });
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

    this.setState({ images, loadedUrls, isLoading: false });
  };

  handleImportClick = () => {
    this.fileInputRef.current?.click();
  };

  handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        this.setState((prev) => ({
          images: [...prev.images, newImage],
          loadedUrls: { ...prev.loadedUrls, [id]: dataUrl },
        }));
        toast.success(this.props.t("Import successful"));
      } catch (err) {
        console.error(err);
        toast.error(this.props.t("Import failed"));
      }
    };
    reader.readAsDataURL(file);
  };

  handlePreview = (image: BackgroundImage) => {
    this.setState({ previewImage: image });
  };

  handleClosePreview = () => {
    this.setState({ previewImage: null });
  };

  handleSetAppBackground = (image: BackgroundImage) => {
    ConfigService.setReaderConfig("appBackgroundImage", image.id);
    this.setState({ appBackgroundId: image.id });
    applyAppBackgroundImage();
    toast.success(this.props.t("Change successful"));
  };

  handleClearAppBackground = () => {
    ConfigService.setReaderConfig("appBackgroundImage", "");
    this.setState({ appBackgroundId: "" });
    applyAppBackgroundImage();
    toast.success(this.props.t("Change successful"));
  };

  handleSetReaderBackground = (image: BackgroundImage) => {
    ConfigService.setReaderConfig("readerBackgroundImage", image.id);
    if (image.textColor) {
      ConfigService.setReaderConfig("textColor", image.textColor);
    }
    if (image.backgroundColor) {
      ConfigService.setReaderConfig("backgroundColor", image.backgroundColor);
    }
    this.setState({ readerBackgroundId: image.id });
    this.props.handleReaderBackgroundImage?.(image.id);
    toast.success(this.props.t("Change successful"));
  };

  handleClearReaderBackground = () => {
    ConfigService.setReaderConfig("readerBackgroundImage", "");
    this.setState({ readerBackgroundId: "" });
    this.props.handleReaderBackgroundImage?.("");
    toast.success(this.props.t("Change successful"));
    ConfigService.setReaderConfig("textColor", "");
    ConfigService.setReaderConfig("backgroundColor", "");
  };

  getFeaturedImage = (index: number): BackgroundImage | undefined => {
    const id = BackgroundUtil.getFeaturedBackgroundId(index);
    return this.state.images.find((img) => img.id === id);
  };

  handleFeaturedPreview = (index: number) => {
    const existing = this.getFeaturedImage(index);
    if (existing) {
      this.handlePreview(existing);
    } else {
      this.setState({ previewFeatured: index });
    }
  };

  handleCloseFeaturedPreview = () => {
    this.setState({ previewFeatured: null });
  };

  handleFeaturedSetBackground = async (
    index: number,
    type: "app" | "reader"
  ) => {
    const id = BackgroundUtil.getFeaturedBackgroundId(index);
    if (this.state.downloadingId) return;
    const existing = this.getFeaturedImage(index);
    if (existing) {
      if (type === "app") {
        this.handleSetAppBackground(existing);
      } else {
        this.handleSetReaderBackground(existing);
      }
      return;
    }

    this.setState({ downloadingId: id, downloadProgress: 0 });
    try {
      const dataUrl = await BackgroundUtil.downloadFeaturedBackground(
        index,
        (progress) => this.setState({ downloadProgress: progress })
      );
      if (!dataUrl) {
        toast.error(this.props.t("Download failed"));
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
      this.setState((prev) => ({
        images: [...prev.images, newImage],
        loadedUrls: { ...prev.loadedUrls, [id]: dataUrl },
      }));
      if (type === "app") {
        this.handleSetAppBackground(newImage);
      } else {
        this.handleSetReaderBackground(newImage);
      }
      toast.success(this.props.t("Download successful"));
    } catch (err) {
      console.error(err);
      toast.error(this.props.t("Download failed"));
    } finally {
      this.setState({ downloadingId: "", downloadProgress: 0 });
    }
  };

  handleDelete = async (e: React.MouseEvent, image: BackgroundImage) => {
    e.stopPropagation();
    try {
      await BackgroundUtil.deleteImage(image.id);
      BackgroundUtil.deleteImageMeta(image.id);
      BackgroundUtil.removeImageId(image.id);

      const updatedUrls = { ...this.state.loadedUrls };
      delete updatedUrls[image.id];

      this.setState((prev) => ({
        images: prev.images.filter((img) => img.id !== image.id),
        loadedUrls: updatedUrls,
      }));

      if (this.state.appBackgroundId === image.id) {
        ConfigService.setReaderConfig("appBackgroundImage", "");
        this.setState({ appBackgroundId: "" });
        applyAppBackgroundImage();
      }
      if (this.state.readerBackgroundId === image.id) {
        ConfigService.setReaderConfig("readerBackgroundImage", "");
        this.setState({ readerBackgroundId: "" });
        this.props.handleReaderBackgroundImage?.("");
      }
      toast.success(this.props.t("Deletion successful"));
    } catch (err) {
      console.error(err);
      toast.error(this.props.t("Deletion failed"));
    }
  };

  renderBadge = (image: BackgroundImage) => {
    const isApp = this.state.appBackgroundId === image.id;
    const isReader = this.state.readerBackgroundId === image.id;
    if (!isApp && !isReader) return null;
    return (
      <span className="background-setting-badge">
        {isApp && <Trans>App</Trans>}
        {isApp && isReader && " · "}
        {isReader && <Trans>Reader</Trans>}
      </span>
    );
  };

  renderPreviewActions = (previewImage: BackgroundImage) => {
    const isApp = this.state.appBackgroundId === previewImage.id;
    const isReader = this.state.readerBackgroundId === previewImage.id;
    return (
      <div
        className="background-preview-actions"
        onClick={(e) => e.stopPropagation()}
      >
        {isApp ? (
          <span
            className="change-location-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={this.handleClearAppBackground}
          >
            <Trans>Clear app background</Trans>
          </span>
        ) : (
          <span
            className="change-location-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={() => this.handleSetAppBackground(previewImage)}
          >
            <Trans>Set as app background</Trans>
          </span>
        )}
        {isReader ? (
          <span
            className="change-location-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={this.handleClearReaderBackground}
          >
            <Trans>Clear book background</Trans>
          </span>
        ) : (
          <span
            className="change-location-button"
            style={{ fontSize: "14px", padding: "6px 16px", height: "32px" }}
            onClick={() => this.handleSetReaderBackground(previewImage)}
          >
            <Trans>Set as book background</Trans>
          </span>
        )}
      </div>
    );
  };

  renderFeaturedPreviewActions = (index: number) => {
    const id = BackgroundUtil.getFeaturedBackgroundId(index);
    const isDownloading = this.state.downloadingId === id;
    const percent = Math.round(this.state.downloadProgress * 100);
    const isApp = this.state.appBackgroundId === id;
    const isReader = this.state.readerBackgroundId === id;
    return (
      <div
        className="background-preview-actions"
        onClick={(e) => e.stopPropagation()}
      >
        {isApp ? (
          <span
            className="change-location-button background-apple-button"
            onClick={this.handleClearAppBackground}
          >
            <Trans>Clear app background</Trans>
          </span>
        ) : (
          <span
            className={
              "change-location-button background-apple-button" +
              (isDownloading ? " is-downloading" : "")
            }
            onClick={() => this.handleFeaturedSetBackground(index, "app")}
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
            onClick={this.handleClearReaderBackground}
          >
            <Trans>Clear book background</Trans>
          </span>
        ) : (
          <span
            className={
              "change-location-button background-apple-button" +
              (isDownloading ? " is-downloading" : "")
            }
            onClick={() => this.handleFeaturedSetBackground(index, "reader")}
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

  renderFeaturedSection = () => {
    const { visibleFeatured, appBackgroundId, readerBackgroundId } = this.state;
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
                ref={this.registerFeaturedItem(index)}
                onClick={() => this.handleFeaturedPreview(index)}
              >
                {visibleFeatured.has(index) ? (
                  <img
                    className="background-featured-img"
                    src={BackgroundUtil.getFeaturedThumbnailUrl(index)}
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

  render() {
    const { images, previewImage, previewFeatured, loadedUrls, isLoading } =
      this.state;
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
                  (this.state.appBackgroundId === img.id ||
                  this.state.readerBackgroundId === img.id
                    ? " active-bg-item"
                    : "")
                }
                onClick={() => this.handlePreview(img)}
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
                {this.renderBadge(img)}
                <span
                  className="background-setting-delete icon-close"
                  onClick={(e) => this.handleDelete(e, img)}
                />
              </div>
            ))
          )}
        </div>

        {this.renderFeaturedSection()}

        {/* Hidden file input */}
        <input
          ref={this.fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={this.handleFileChange}
        />

        {/* Import button fixed at bottom-right */}
        <div
          className="setting-dialog-new-plugin"
          onClick={this.handleImportClick}
        >
          <span style={{ fontWeight: "bold" }}>
            <Trans>Import local image</Trans>
          </span>
        </div>

        {/* Preview overlay */}
        {previewImage && (
          <div
            className="background-preview-overlay"
            onClick={this.handleClosePreview}
          >
            <span
              className="background-preview-close icon-close"
              onClick={this.handleClosePreview}
            />
            <img
              className="background-preview-image"
              src={loadedUrls[previewImage.id] || ""}
              alt={previewImage.name}
              onClick={(e) => e.stopPropagation()}
            />
            {this.renderPreviewActions(previewImage)}
          </div>
        )}

        {/* Featured preview overlay */}
        {previewFeatured !== null && !previewImage && (
          <div
            className="background-preview-overlay"
            onClick={this.handleCloseFeaturedPreview}
          >
            <span
              className="background-preview-close icon-close"
              onClick={this.handleCloseFeaturedPreview}
            />
            <img
              className="background-preview-image"
              src={BackgroundUtil.getFeaturedOriginalUrl(previewFeatured)}
              alt={BackgroundUtil.getFeaturedBackgroundId(previewFeatured)}
              onClick={(e) => e.stopPropagation()}
            />
            {this.renderFeaturedPreviewActions(previewFeatured)}
          </div>
        )}
      </>
    );
  }
}

export default BackgroundSetting;
