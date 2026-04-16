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

class BackgroundSetting extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  fileInputRef = React.createRef<HTMLInputElement>();

  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      images: [],
      loadedUrls: {},
      previewImage: null,
      appBackgroundId:
        ConfigService.getReaderConfig("appBackgroundImage") || "",
      readerBackgroundId:
        ConfigService.getReaderConfig("readerBackgroundImage") || "",
      isLoading: true,
    };
  }

  componentDidMount() {
    this.loadAllImages();
  }

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

  render() {
    const { images, previewImage, loadedUrls, isLoading } = this.state;
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
      </>
    );
  }
}

export default BackgroundSetting;
