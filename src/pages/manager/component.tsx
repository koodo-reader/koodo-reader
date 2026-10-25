import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./manager.css";
import Sidebar from "../../containers/sidebar";
import Header from "../../containers/header";
import DeleteDialog from "../../components/dialogs/deleteDialog";
import EditDialog from "../../components/dialogs/editDialog";
import AddDialog from "../../components/dialogs/addDialog";
import SortDialog from "../../components/dialogs/sortBookDialog";
import LocalFileDialog from "../../components/dialogs/localFileDialog";
import ImportDialog from "../../components/dialogs/importDialog";
import OPDSDialog from "../../components/dialogs/opdsDialog";
import AutoImportDialog from "../../components/dialogs/autoImportDialog";
import { ManagerProps, ManagerState } from "./interface";
import { Trans } from "react-i18next";
import SettingDialog from "../../components/dialogs/settingDialog";
import { Route, Routes } from "react-router-dom";
import { routes } from "../../router/routes";
import LoadingDialog from "../../components/dialogs/loadingDialog";
import { Toaster } from "react-hot-toast";
import DetailDialog from "../../components/dialogs/detailDialog";
import { Tooltip } from "react-tooltip";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import SortShelfDialog from "../../components/dialogs/sortShelfDialog";
import CollectionDialog from "../../components/dialogs/collectionDialog";
import CollectionDetailDialog from "../../components/dialogs/collectionDetailDialog";
import AddCollectionDialog from "../../components/dialogs/addCollectionDialog";
import PopupNote from "../../components/popups/popupNote";
import toast from "react-hot-toast";
import { supportedFormats } from "../../utils/common";
import {
  isBookDragEvent,
  isExternalFileDragEvent,
} from "../../utils/reader/bookDrag";
import Footer from "../../components/footer";
import ProtectionOverlay from "../../components/protection";
import { useAppStore } from "../../store/useAppStore";

const Manager = () => {
  const books = useAppStore((s) => s.manager.books);
  const isShowPopupNote = useAppStore((s) => s.manager.isShowPopupNote);
  const importBookFunc = useAppStore((s) => s.book.importBookFunc);
  const cloudSyncFunc = useAppStore((s) => s.book.cloudSyncFunc);
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const isSettingOpen = useAppStore((s) => s.manager.isSettingOpen);
  const isOpenImportDialog = useAppStore((s) => s.backupPage.isOpenImportDialog);
  const isOpenOPDSDialog = useAppStore((s) => s.backupPage.isOpenOPDSDialog);
  const isOpenAutoImportDialog = useAppStore(
    (s) => s.backupPage.isOpenAutoImportDialog
  );
  const isOpenSortShelfDialog = useAppStore(
    (s) => s.backupPage.isOpenSortShelfDialog
  );
  const isShowNew = useAppStore((s) => s.manager.isShowNew);
  const isShowSupport = useAppStore((s) => s.manager.isShowSupport);
  const isOpenDeleteDialog = useAppStore((s) => s.book.isOpenDeleteDialog);
  const isOpenEditDialog = useAppStore((s) => s.book.isOpenEditDialog);
  const isOpenLocalFileDialog = useAppStore(
    (s) => s.backupPage.isOpenLocalFileDialog
  );
  const isDetailDialog = useAppStore((s) => s.manager.isDetailDialog);
  const isOpenAddDialog = useAppStore((s) => s.book.isOpenAddDialog);
  const isOpenCollectionDialog = useAppStore(
    (s) => s.collection.isOpenCollectionDialog
  );
  const isOpenCollectionDetailDialog = useAppStore(
    (s) => s.collection.isOpenCollectionDetailDialog
  );
  const isOpenAddCollectionDialog = useAppStore(
    (s) => s.collection.isOpenAddCollectionDialog
  );
  const isShowLoading = useAppStore((s) => s.manager.isShowLoading);
  const isSortDisplay = useAppStore((s) => s.manager.isSortDisplay);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const handleFetchPlugins = useAppStore((s) => s.handleFetchPlugins);
  const handleFetchNotes = useAppStore((s) => s.handleFetchNotes);
  const handleFetchBookmarks = useAppStore((s) => s.handleFetchBookmarks);
  const handleFetchBookSortCode = useAppStore(
    (s) => s.handleFetchBookSortCode
  );
  const handleFetchNoteSortCode = useAppStore(
    (s) => s.handleFetchNoteSortCode
  );
  const handleFetchViewMode = useAppStore((s) => s.handleFetchViewMode);
  const handleReadingState = useAppStore((s) => s.handleReadingState);
  const handleShelf = useAppStore((s) => s.handleShelf);
  const handleMode = useAppStore((s) => s.handleMode);
  const handleEditDialog = useAppStore((s) => s.handleEditDialog);
  const handleDeleteDialog = useAppStore((s) => s.handleDeleteDialog);
  const handleAddDialog = useAppStore((s) => s.handleAddDialog);
  const handleDetailDialog = useAppStore((s) => s.handleDetailDialog);
  const handleLoadingDialog = useAppStore((s) => s.handleLoadingDialog);
  const handleNewDialog = useAppStore((s) => s.handleNewDialog);
  const handleShowSupport = useAppStore((s) => s.handleShowSupport);
  const handleLocalFileDialog = useAppStore((s) => s.handleLocalFileDialog);
  const handleImportDialog = useAppStore((s) => s.handleImportDialog);
  const handleOPDSDialog = useAppStore((s) => s.handleOPDSDialog);
  const handleAutoImportDialog = useAppStore((s) => s.handleAutoImportDialog);
  const handleShowPopupNote = useAppStore((s) => s.handleShowPopupNote);
  const handleSortShelfDialog = useAppStore((s) => s.handleSortShelfDialog);
  const handleSetting = useAppStore((s) => s.handleSetting);
  const handleCollectionDialog = useAppStore((s) => s.handleCollectionDialog);
  const handleCollectionDetailDialog = useAppStore(
    (s) => s.handleCollectionDetailDialog
  );
  const handleAddCollectionDialog = useAppStore(
    (s) => s.handleAddCollectionDialog
  );
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState<ManagerState>({
    totalBooks: parseInt(ConfigService.getReaderConfig("totalBooks")) || 0,
    isDrag: false,
  });
  const isDraggingFromAppRef = useRef(false);
  const prevBooksRef = useRef(books);

  const handleDrag = (isDrag: boolean) => {
    setState((prev) => ({ ...prev, isDrag }));
  };

  const handleDocumentDragStart = (e: DragEvent) => {
    if (isBookDragEvent(e)) {
      isDraggingFromAppRef.current = true;
    }
  };
  const handleDocumentDragEnd = () => {
    if (isDraggingFromAppRef.current) {
      handleDrag(false);
    }
    isDraggingFromAppRef.current = false;
  };
  const handleExternalDragEnter = (e: DragEvent) => {
    if (isExternalFileDragEvent(e)) {
      handleDrag(true);
    }
  };

  useEffect(() => {
    handleFetchBooks();
    handleFetchPlugins();
    handleFetchNotes();
    handleFetchBookmarks();
    handleFetchBookSortCode();
    handleFetchNoteSortCode();
    handleFetchViewMode();

    handleReadingState(false);
    document.addEventListener("dragstart", handleDocumentDragStart, true);
    document.addEventListener("dragend", handleDocumentDragEnd, true);
    document.addEventListener("dragenter", handleExternalDragEnter, true);
    // Auto switch to configured startup shelf
    const startupShelf = ConfigService.getReaderConfig("startupShelf");
    if (startupShelf) {
      const shelfList = ConfigService.getAllMapConfig("shelfList") || {};
      if (shelfList.hasOwnProperty(startupShelf)) {
        handleShelf(startupShelf);
        handleMode("shelf");
        navigate("/manager/shelf");
      }
    }
    return () => {
      document.removeEventListener(
        "dragstart",
        handleDocumentDragStart,
        true
      );
      document.removeEventListener("dragend", handleDocumentDragEnd, true);
      document.removeEventListener(
        "dragenter",
        handleExternalDragEnter,
        true
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prevBooks = prevBooksRef.current;
    if (books && state.totalBooks !== books.length) {
      const totalBooks = books.length;
      setState((prev) =>
        prev.totalBooks === totalBooks ? prev : { ...prev, totalBooks }
      );
      ConfigService.setReaderConfig("totalBooks", totalBooks.toString());
    }
    if (books && books.length === 1 && !prevBooks) {
      navigate("/manager/home");
    }
    prevBooksRef.current = books;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books]);

  const PopupProps = {
    chapterDocIndex: 0,
    chapter: "test",
  };
  return (
    <div
      className="manager"
      onDragEnter={(e) => {
        if (isExternalFileDragEvent(e)) {
          handleDrag(true);
        }
      }}
    >
      <ProtectionOverlay />
      <Tooltip id="my-tooltip" style={{ zIndex: 25 }} />
      {isShowPopupNote && (
        <div
          className="popup-box-container"
          style={{
            marginLeft: 0,
            height: "360px",
          }}
        >
          <PopupNote {...(PopupProps as any)} />
        </div>
      )}

      <div
        className={`drag-background${state.isDrag ? " drag-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDrag(false);
          const collectFiles = (entry: FileSystemEntry): Promise<File[]> => {
            return new Promise((resolve) => {
              if (entry.isFile) {
                (entry as FileSystemFileEntry).file(
                  (file) => resolve([file]),
                  () => resolve([])
                );
              } else if (entry.isDirectory) {
                const reader = (
                  entry as FileSystemDirectoryEntry
                ).createReader();
                const readAll = (
                  collected: FileSystemEntry[] = []
                ): Promise<FileSystemEntry[]> =>
                  new Promise((res) => {
                    reader.readEntries(
                      (results) => {
                        if (results.length === 0) {
                          res(collected);
                        } else {
                          readAll([...collected, ...Array.from(results)]).then(
                            res
                          );
                        }
                      },
                      () => res(collected)
                    );
                  });
                readAll().then((entries) =>
                  Promise.all(entries.map(collectFiles)).then((arrays) =>
                    resolve(([] as File[]).concat(...arrays))
                  )
                );
              } else {
                resolve([]);
              }
            });
          };
          const items = e.dataTransfer.items;
          let allFiles: File[] = [];
          if (items && items.length > 0) {
            const entries: FileSystemEntry[] = [];
            for (let i = 0; i < items.length; i++) {
              const entry = items[i].webkitGetAsEntry();
              if (entry) entries.push(entry);
            }
            const fileArrays = await Promise.all(entries.map(collectFiles));
            allFiles = ([] as File[]).concat(...fileArrays);
          }
          for (const file of allFiles) {
            const ext = "." + file.name.split(".").pop()?.toLowerCase();
            if (!supportedFormats.includes(ext)) {
              toast.error(t("Unsupported file format") + ": " + ext);
              continue;
            }
            await importBookFunc(file);
          }
          if (
            ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
            ConfigService.getItem("defaultSyncOption")
          ) {
            await cloudSyncFunc();
          }
        }}
        onClick={() => {
          handleEditDialog(false);
          handleDeleteDialog(false);
          handleAddDialog(false);
          handleDetailDialog(false);
          handleLoadingDialog(false);
          if (!isAuthed) {
            handleNewDialog(false);
            handleShowSupport(false);
          }
          handleLocalFileDialog(false);
          handleImportDialog(false);
          handleOPDSDialog(false);
          handleAutoImportDialog(false);
          handleShowPopupNote(false);
          handleSortShelfDialog(false);
          handleSetting(false);
          handleCollectionDialog(false);
          handleCollectionDetailDialog(false);
          handleAddCollectionDialog(false);
          handleDrag(false);
        }}
        style={
          isSettingOpen ||
          isOpenImportDialog ||
          isOpenOPDSDialog ||
          isOpenAutoImportDialog ||
          isOpenSortShelfDialog ||
          isShowNew ||
          isShowSupport ||
          isOpenDeleteDialog ||
          isOpenEditDialog ||
          isOpenLocalFileDialog ||
          isDetailDialog ||
          isShowPopupNote ||
          isOpenAddDialog ||
          isOpenCollectionDialog ||
          isOpenCollectionDetailDialog ||
          isOpenAddCollectionDialog ||
          isShowLoading ||
          state.isDrag
            ? {}
            : {
                display: "none",
              }
        }
      >
        {state.isDrag && (
          <div className="drag-info">
            <p className="arrow-text">
              <Trans>Drop your books here</Trans>
            </p>
          </div>
        )}
      </div>
      <Sidebar />
      <Toaster
        toastOptions={{
          style: {
            padding: "8px 10px",
            wordWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "normal",
            overflowWrap: "break-word",
          },
        }}
      />
      <Header {...({ handleDrag: handleDrag } as any)} />
      {isOpenDeleteDialog && <DeleteDialog />}
      {isOpenEditDialog && <EditDialog />}
      {isOpenAddDialog && <AddDialog />}
      {isShowLoading && <LoadingDialog />}
      {isSortDisplay && <SortDialog />}
      {isOpenLocalFileDialog && <LocalFileDialog />}
      {isOpenImportDialog && <ImportDialog />}
      {isOpenOPDSDialog && <OPDSDialog />}
      {isOpenAutoImportDialog && <AutoImportDialog />}
      {isOpenSortShelfDialog && <SortShelfDialog />}
      {isSettingOpen && <SettingDialog />}
      {isDetailDialog && <DetailDialog />}
      {isOpenCollectionDialog && <CollectionDialog />}
      {isOpenCollectionDetailDialog && <CollectionDetailDialog />}
      {isOpenAddCollectionDialog && <AddCollectionDialog />}
      {(!books || books.length === 0) && state.totalBooks ? null : (
        <Routes>
          {routes.map((ele) => (
            <Route
              element={<ele.component />}
              key={ele.path}
              path={ele.path}
            />
          ))}
        </Routes>
      )}
      <Footer />
    </div>
  );
};
export default Manager;
