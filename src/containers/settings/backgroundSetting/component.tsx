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

const APP_BG_KEY = "appBackgroundImage";
const READER_BG_KEY = "readerBackgroundImage";

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
      appBackgroundId: ConfigService.getReaderConfig(APP_BG_KEY) || "",
      readerBackgroundId: ConfigService.getReaderConfig(READER_BG_KEY) || "",
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
      images.push({ id, name: meta.name, extension: meta.extension });
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
      const meta = { name: file.name, extension };

      try {
        await BackgroundUtil.saveImage(id, dataUrl);
        BackgroundUtil.saveImageMeta(id, meta);
        BackgroundUtil.addImageId(id);

        const newImage: BackgroundImage = { id, name: file.name, extension };
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
    const dataUrl = this.state.loadedUrls[image.id] || "";
    ConfigService.setReaderConfig(APP_BG_KEY, image.id);
    ConfigService.setReaderConfig(APP_BG_KEY + "_url", dataUrl);
    this.setState({ appBackgroundId: image.id, previewImage: null });
    applyAppBackgroundImage();
    toast.success(this.props.t("Change successful"));
  };

  handleClearAppBackground = () => {
    ConfigService.setReaderConfig(APP_BG_KEY, "");
    ConfigService.setReaderConfig(APP_BG_KEY + "_url", "");
    this.setState({ appBackgroundId: "", previewImage: null });
    applyAppBackgroundImage();
    toast.success(this.props.t("Change successful"));
  };

  handleSetReaderBackground = (image: BackgroundImage) => {
    const dataUrl = this.state.loadedUrls[image.id] || "";
    ConfigService.setReaderConfig(READER_BG_KEY, image.id);
    ConfigService.setReaderConfig(READER_BG_KEY + "_url", dataUrl);
    this.setState({ readerBackgroundId: image.id, previewImage: null });
    toast.success(this.props.t("Change successful"));
  };

  handleClearReaderBackground = () => {
    ConfigService.setReaderConfig(READER_BG_KEY, "");
    ConfigService.setReaderConfig(READER_BG_KEY + "_url", "");
    this.setState({ readerBackgroundId: "", previewImage: null });
    toast.success(this.props.t("Change successful"));
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
        ConfigService.setReaderConfig(APP_BG_KEY, "");
        ConfigService.setReaderConfig(APP_BG_KEY + "_url", "");
        this.setState({ appBackgroundId: "" });
        applyAppBackgroundImage();
      }
      if (this.state.readerBackgroundId === image.id) {
        ConfigService.setReaderConfig(READER_BG_KEY, "");
        ConfigService.setReaderConfig(READER_BG_KEY + "_url", "");
        this.setState({ readerBackgroundId: "" });
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
