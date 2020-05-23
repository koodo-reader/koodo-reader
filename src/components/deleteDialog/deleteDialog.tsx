import React from "react";
import { connect } from "react-redux";
import "./deleteDialog.css";
import {
  handleFetchBooks,
  handleMessageBox,
  handleMessage,
} from "../../redux/actions/manager";
import { handleDeleteDialog } from "../../redux/actions/book";
import {
  handleFetchBookmarks,
  handleFetchNotes,
  handleFetchDigests,
  handleFetchHighlighters,
} from "../../redux/actions/reader";
import DeleteUtil from "../../utils/deleteUtil";
import localforage from "localforage";
import ShelfUtil from "../../utils/shelfUtil";
import RecordRecent from "../../utils/recordRecent";
import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import DigestModel from "../../model/Digest";
import HighligherModel from "../../model/Highlighter";
import BookmarkModel from "../../model/Bookmark";
import { stateType } from "../../redux/store";
import { Trans } from "react-i18next";
import { withNamespaces } from "react-i18next";

export interface DeleteDialogProps {
  books: BookModel[];
  isOpenDeleteDialog: boolean;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  digests: DigestModel[];
  highlighters: HighligherModel[];
  mode: string;
  shelfIndex: number;
  handleFetchBooks: () => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
  handleFetchDigests: () => void;
  handleFetchHighlighters: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}

class DeleteDialog extends React.Component<DeleteDialogProps> {
  handleCancel = () => {
    this.props.handleDeleteDialog(false);
  };
  handleDeleteOther = () => {
    if (this.props.bookmarks !== null) {
      let bookmarkArr = DeleteUtil.deleteBookmarks(
        this.props.bookmarks,
        this.props.currentBook.key
      );
      if (bookmarkArr.length === 0) {
        localforage.removeItem("bookmarks").then(() => {
          this.props.handleFetchBookmarks();
        });
      } else {
        localforage.setItem("bookmarks", bookmarkArr).then(() => {
          this.props.handleFetchBookmarks();
        });
      }
    }
    if (this.props.notes !== null) {
      let noteArr = DeleteUtil.deleteNotes(
        this.props.notes,
        this.props.currentBook.key
      );
      if (noteArr.length === 0) {
        localforage.removeItem("notes").then(() => {
          this.props.handleFetchNotes();
        });
      } else {
        localforage.setItem("notes", noteArr).then(() => {
          this.props.handleFetchNotes();
        });
      }
    }
    // console.log(this.props.notes, "notes");
    if (this.props.digests !== null) {
      let digestArr = DeleteUtil.deleteDigests(
        this.props.digests,
        this.props.currentBook.key
      );
      if (digestArr.length === 0) {
        localforage.removeItem("digests").then(() => {
          this.props.handleFetchDigests();
        });
      } else {
        localforage.setItem("digests", digestArr).then(() => {
          this.props.handleFetchDigests();
        });
      }
    }
    if (this.props.highlighters !== null) {
      let highlighterArr = DeleteUtil.deleteHighlighters(
        this.props.highlighters,
        this.props.currentBook.key
      );
      if (highlighterArr.length === 0) {
        localforage.removeItem("highlighters").then(() => {
          this.props.handleFetchHighlighters();
        });
      } else {
        localforage.setItem("highlighters", highlighterArr).then(() => {
          this.props.handleFetchHighlighters();
        });
      }
    }
  };
  handleComfirm = () => {
    //从列表删除和从图书库删除判断
    if (this.props.mode === "shelf") {
      ShelfUtil.clearShelf(this.props.shelfIndex, this.props.currentBook.key);
      this.props.handleDeleteDialog(false);
    } else {
      this.props.books !== null &&
        localforage
          .setItem(
            "books",
            DeleteUtil.deleteBook(this.props.books, this.props.currentBook.key)
          )
          .then(() => {
            this.props.handleDeleteDialog(false);
            this.props.handleFetchBooks();
          });
      //从书架删除
      ShelfUtil.deletefromAllShelf(this.props.currentBook.key);
      //从阅读记录删除
      RecordRecent.clear(this.props.currentBook.key);
      //删除书签，笔记，书摘，高亮
      this.handleDeleteOther();
    }

    this.props.handleMessage("Delete Successfully");
    this.props.handleMessageBox(true);
  };
  render() {
    return (
      <div className="delete-dialog-container">
        {this.props.mode !== "shelf" ? (
          <div className="delete-dialog-title">
            <Trans>Delete This Book</Trans>
          </div>
        ) : (
          <div className="delete-dialog-title">
            <Trans>Delete from Shelf</Trans>
          </div>
        )}

        <div className="delete-dialog-book">
          <div className="delete-dialog-book-title">
            {this.props.currentBook.name}
          </div>
        </div>
        {this.props.mode !== "shelf" ? (
          <div className="delete-dialog-other-option">
            <Trans>
              This action will delete all the notes, bookmarks and digests of
              this book
            </Trans>
          </div>
        ) : (
          <div className="delete-dialog-other-option">
            <Trans>This action won't delete the original book</Trans>
          </div>
        )}
        <div
          className="delete-dialog-cancel"
          onClick={() => {
            this.handleCancel();
          }}
        >
          <Trans>Cancel</Trans>
        </div>
        <div
          className="delete-dialog-comfirm"
          onClick={() => {
            this.handleComfirm();
          }}
        >
          <Trans>Delete</Trans>
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    highlighters: state.reader.highlighters,
    mode: state.sidebar.mode,
    shelfIndex: state.sidebar.shelfIndex,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleDeleteDialog,
  handleFetchBookmarks,
  handleFetchNotes,
  handleFetchDigests,
  handleFetchHighlighters,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(DeleteDialog as any));
