import React from "react";
import "./editDialog.css";

import { Trans } from "react-i18next";
import { EditDialogProps, EditDialogState } from "./interface";
import toast from "react-hot-toast";
import DatabaseService from "../../../utils/storage/databaseService";
import CoverUtil from "../../../utils/file/coverUtil";

class EditDialog extends React.Component<EditDialogProps, EditDialogState> {
  private nameRef = React.createRef<HTMLInputElement>();
  private authorRef = React.createRef<HTMLInputElement>();
  private publisherRef = React.createRef<HTMLInputElement>();
  private descriptionRef = React.createRef<HTMLTextAreaElement>();
  private coverInputRef = React.createRef<HTMLInputElement>();

  constructor(props: EditDialogProps) {
    super(props);
    this.state = { isCheck: false, coverPreview: "" };
  }

  async componentDidMount() {
    if (this.nameRef.current) {
      this.nameRef.current.value = this.props.currentBook.name || "";
    }
    if (this.authorRef.current) {
      this.authorRef.current.value = this.props.currentBook.author || "";
    }
    if (this.publisherRef.current) {
      this.publisherRef.current.value = this.props.currentBook.publisher || "";
    }
    if (this.descriptionRef.current) {
      this.descriptionRef.current.value =
        this.props.currentBook.description || "";
    }
    const cover = await CoverUtil.getCover(this.props.currentBook);
    if (cover) {
      this.setState({ coverPreview: cover });
    }
  }

  handleCancel = () => {
    this.props.handleEditDialog(false);
  };

  handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      this.setState({ coverPreview: base64 });
    };
    reader.readAsDataURL(file);
  };

  handleComfirm = async () => {
    const name = this.nameRef.current?.value || "";
    const author = this.authorRef.current?.value || "";
    const publisher = this.publisherRef.current?.value || "";
    const description = this.descriptionRef.current?.value || "";

    this.props.currentBook.name = name;
    this.props.currentBook.author = author;
    this.props.currentBook.publisher = publisher;
    this.props.currentBook.description = description;

    // Handle cover update: if user picked a new image (base64 data URL)
    const { coverPreview } = this.state;
    if (coverPreview && coverPreview.startsWith("data:")) {
      this.props.currentBook.cover = coverPreview;
      await CoverUtil.addCover(this.props.currentBook);
      this.props.handleRefreshBookCover(this.props.currentBook.key);
    }

    await DatabaseService.updateRecord(this.props.currentBook, "books");
    this.props.handleEditDialog(false);
    this.props.handleFetchBooks();
    toast.success(this.props.t("Edition successful"));
    this.props.handleActionDialog(false);
  };

  render() {
    const { coverPreview } = this.state;
    return (
      <div className="edit-dialog-container">
        <div className="edit-dialog-title">
          <Trans>Edit Book</Trans>
        </div>

        <div className="edit-dialog-body">
          {/* Cover */}
          <div className="edit-dialog-field">
            <span className="edit-dialog-label">
              <Trans>Cover</Trans>
            </span>
            <div
              className="edit-dialog-cover-box"
              onClick={() => this.coverInputRef.current?.click()}
              title={this.props.t("Click to select image")}
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="cover"
                  className="edit-dialog-cover-img"
                />
              ) : (
                <span className="edit-dialog-cover-placeholder">
                  <Trans>Click to select image</Trans>
                </span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={this.coverInputRef}
              style={{ display: "none" }}
              onChange={this.handleCoverSelect}
            />
          </div>

          {/* Book name */}
          <div className="edit-dialog-field">
            <span className="edit-dialog-label">
              <Trans>Book name</Trans>
            </span>
            <input className="edit-dialog-input" ref={this.nameRef} />
          </div>

          {/* Author */}
          <div className="edit-dialog-field">
            <span className="edit-dialog-label">
              <Trans>Author</Trans>
            </span>
            <input className="edit-dialog-input" ref={this.authorRef} />
          </div>

          {/* Publisher */}
          <div className="edit-dialog-field">
            <span className="edit-dialog-label">
              <Trans>Publisher</Trans>
            </span>
            <input className="edit-dialog-input" ref={this.publisherRef} />
          </div>

          {/* Description */}
          <div className="edit-dialog-field">
            <span className="edit-dialog-label">
              <Trans>Description</Trans>
            </span>
            <textarea
              className="edit-dialog-textarea"
              ref={this.descriptionRef}
              rows={3}
            />
          </div>
        </div>

        <div className="edit-dialog-footer">
          <div
            className="add-dialog-cancel"
            onClick={() => {
              this.handleCancel();
            }}
          >
            <Trans>Cancel</Trans>
          </div>
          <div
            className="add-dialog-confirm"
            onClick={() => {
              this.handleComfirm();
            }}
          >
            <Trans>Confirm</Trans>
          </div>
        </div>
      </div>
    );
  }
}

export default EditDialog;
