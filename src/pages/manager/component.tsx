import { useEffect, useRef, useState } from "react";
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
import { Route, Switch } from "react-router-dom";
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

const Manager = (props: ManagerProps) => {
  const [state, setState] = useState<ManagerState>({
    totalBooks: parseInt(ConfigService.getReaderConfig("totalBooks")) || 0,
    isDrag: false,
  });
  const isDraggingFromAppRef = useRef(false);
  const prevBooksRef = useRef(props.books);

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
    props.handleFetchBooks();
    props.handleFetchPlugins();
    props.handleFetchNotes();
    props.handleFetchBookmarks();
    props.handleFetchBookSortCode();
    props.handleFetchNoteSortCode();
    props.handleFetchViewMode();

    props.handleReadingState(false);
    document.addEventListener("dragstart", handleDocumentDragStart, true);
    document.addEventListener("dragend", handleDocumentDragEnd, true);
    document.addEventListener("dragenter", handleExternalDragEnter, true);
    // Auto switch to configured startup shelf
    const startupShelf = ConfigService.getReaderConfig("startupShelf");
    if (startupShelf) {
      const shelfList = ConfigService.getAllMapConfig("shelfList") || {};
      if (shelfList.hasOwnProperty(startupShelf)) {
        props.handleShelf(startupShelf);
        props.handleMode("shelf");
        props.history.push("/manager/shelf");
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
    if (props.books && state.totalBooks !== props.books.length) {
      const totalBooks = props.books.length;
      setState((prev) =>
        prev.totalBooks === totalBooks ? prev : { ...prev, totalBooks }
      );
      ConfigService.setReaderConfig("totalBooks", totalBooks.toString());
    }
    if (props.books && props.books.length === 1 && !prevBooks) {
      props.history.push("/manager/home");
    }
    prevBooksRef.current = props.books;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.books]);

  let { books } = props;
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
      {props.isShowPopupNote && (
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
              toast.error(props.t("Unsupported file format") + ": " + ext);
              continue;
            }
            await props.importBookFunc(file);
          }
          if (
            ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
            ConfigService.getItem("defaultSyncOption")
          ) {
            await props.cloudSyncFunc();
          }
        }}
        onClick={() => {
          props.handleEditDialog(false);
          props.handleDeleteDialog(false);
          props.handleAddDialog(false);
          props.handleDetailDialog(false);
          props.handleLoadingDialog(false);
          if (!props.isAuthed) {
            props.handleNewDialog(false);
            props.handleShowSupport(false);
          }
          props.handleLocalFileDialog(false);
          props.handleImportDialog(false);
          props.handleOPDSDialog(false);
          props.handleAutoImportDialog(false);
          props.handleShowPopupNote(false);
          props.handleSortShelfDialog(false);
          props.handleSetting(false);
          props.handleCollectionDialog(false);
          props.handleCollectionDetailDialog(false);
          props.handleAddCollectionDialog(false);
          handleDrag(false);
        }}
        style={
          props.isSettingOpen ||
          props.isOpenImportDialog ||
          props.isOpenOPDSDialog ||
          props.isOpenAutoImportDialog ||
          props.isOpenSortShelfDialog ||
          props.isShowNew ||
          props.isShowSupport ||
          props.isOpenDeleteDialog ||
          props.isOpenEditDialog ||
          props.isOpenLocalFileDialog ||
          props.isDetailDialog ||
          props.isShowPopupNote ||
          props.isOpenAddDialog ||
          props.isOpenCollectionDialog ||
          props.isOpenCollectionDetailDialog ||
          props.isOpenAddCollectionDialog ||
          props.isShowLoading ||
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
      {props.isOpenDeleteDialog && <DeleteDialog />}
      {props.isOpenEditDialog && <EditDialog />}
      {props.isOpenAddDialog && <AddDialog />}
      {props.isShowLoading && <LoadingDialog />}
      {props.isSortDisplay && <SortDialog />}
      {props.isOpenLocalFileDialog && <LocalFileDialog />}
      {props.isOpenImportDialog && <ImportDialog />}
      {props.isOpenOPDSDialog && <OPDSDialog />}
      {props.isOpenAutoImportDialog && <AutoImportDialog />}
      {props.isOpenSortShelfDialog && <SortShelfDialog />}
      {props.isSettingOpen && <SettingDialog />}
      {props.isDetailDialog && <DetailDialog />}
      {props.isOpenCollectionDialog && <CollectionDialog />}
      {props.isOpenCollectionDetailDialog && <CollectionDetailDialog />}
      {props.isOpenAddCollectionDialog && <AddCollectionDialog />}
      {(!books || books.length === 0) && state.totalBooks ? null : (
        <Switch>
          {routes.map((ele) => (
            <Route
              render={() => <ele.component />}
              key={ele.path}
              path={ele.path}
            />
          ))}
        </Switch>
      )}
      <Footer />
    </div>
  );
};
export default Manager;
