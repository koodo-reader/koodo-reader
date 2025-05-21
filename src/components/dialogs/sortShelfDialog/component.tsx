import React from "react";
import "./sortShelfDialog.css";
import { driveList } from "../../../constants/driveList";
import { Trans } from "react-i18next";
import { SortShelfDialogProps, SortShelfDialogState } from "./interface";
import _ from "underscore";
import { ReactSortable } from "react-sortablejs";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
class SortShelfDialog extends React.Component<
  SortShelfDialogProps,
  SortShelfDialogState
> {
  private newShelfInput = React.createRef<HTMLInputElement>();
  constructor(props: SortShelfDialogProps) {
    super(props);
    this.state = {
      sortedShelfList: [],
      currentEditShelf: "",
      newShelfName: "",
    };
  }
  componentDidMount(): void {
    let sortedShelfList =
      ConfigService.getAllListConfig("sortedShelfList") || [];
    let shelfList = ConfigService.getAllMapConfig("shelfList");
    let shelfTitleList = Object.keys(shelfList);
    this.setState({
      sortedShelfList: Array.from(
        new Set([...sortedShelfList, ...shelfTitleList])
      ).map((item, index) => {
        return { name: item, id: index };
      }),
    });
  }
  handleClose = () => {
    this.props.handleSortShelfDialog(false);
  };
  handleRenameShelf = () => {
    if (!this.state.newShelfName) {
      toast(this.props.t("Shelf Title is Empty"));
      this.setState({ currentEditShelf: "", newShelfName: "" });
      return;
    }
    let shelfList = ConfigService.getAllMapConfig("shelfList");
    if (shelfList.hasOwnProperty(this.state.newShelfName)) {
      toast(this.props.t("Duplicate shelf"));
      return;
    }
    //rename shelf
    let newShelfList = this.state.sortedShelfList.map((item) => {
      if (item.name === this.state.currentEditShelf) {
        return { name: this.state.newShelfName, id: item.id };
      }
      return item;
    });
    this.setState({
      sortedShelfList: newShelfList,
    });
    ConfigService.setAllListConfig(
      newShelfList.map((item) => item.name),
      "sortedShelfList"
    );
    let shelfItemList = shelfList[this.state.currentEditShelf];
    ConfigService.deleteMapConfig(this.state.currentEditShelf, "shelfList");
    ConfigService.setOneMapConfig(
      this.state.newShelfName,
      shelfItemList,
      "shelfList"
    );
    toast.success(this.props.t("Renamed successfully"));
    this.setState({ currentEditShelf: "", newShelfName: "" });
  };
  render() {
    return (
      <div
        className="backup-page-container"
        style={{ height: "450px", top: "calc(50% - 225px)" }}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div className="edit-dialog-title">
          <Trans>Edit shelf</Trans>
        </div>
        <div className="import-dialog-option">
          {
            <ReactSortable
              list={this.state.sortedShelfList}
              setList={(newState) =>
                this.setState({ sortedShelfList: newState })
              }
              animation={200}
              delayOnTouchStart={true}
              delay={2}
              scroll={true} // Enable auto-scrolling
              scrollSensitivity={140} // Distance from edge that triggers scrolling (px)
              scrollSpeed={20} // Scrolling speed
              bubbleScroll={true}
              onEnd={() => {
                console.log("onEnd", this.state.sortedShelfList);
                let sortedShelfList = this.state.sortedShelfList.map(
                  (item) => item.name
                );
                ConfigService.setAllListConfig(
                  sortedShelfList,
                  "sortedShelfList"
                );
              }}
            >
              {this.state.sortedShelfList.map((item) => {
                return this.state.currentEditShelf === item.name ? (
                  <div className={`cloud-drive-item `} key={item.id}>
                    <input
                      ref={this.newShelfInput}
                      type="text"
                      name="newShelf"
                      id="sidebar-new-shelf"
                      style={{ marginLeft: "0px" }}
                      className="tag-list-item-new"
                      defaultValue={item.name}
                      onChange={(event) => {
                        this.setState({ newShelfName: event.target.value });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          this.handleRenameShelf();
                        }
                      }}
                    />
                    <span
                      className="icon-check"
                      onClick={async () => {
                        this.handleRenameShelf();
                      }}
                      style={{ fontSize: "20px", marginRight: "15px" }}
                    ></span>
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className={`cloud-drive-item `}
                    onClick={() => {}}
                  >
                    <span className="sort-shelf-label">
                      {this.props.t(item.name)}
                    </span>
                    <span
                      className="icon-edit-line "
                      onClick={async () => {
                        this.setState({
                          currentEditShelf: item.name,
                        });
                        setTimeout(() => {
                          this.newShelfInput.current?.focus();
                        }, 10);
                      }}
                      style={{ fontSize: "20px", marginRight: "15px" }}
                    ></span>
                    <span
                      className="icon-menu "
                      style={{ marginRight: "10px" }}
                    ></span>
                  </div>
                );
              })}
            </ReactSortable>
          }
        </div>
        <div className="import-dialog-back-button">
          {this.props.t("Drag to sort")}
        </div>

        <div
          className="backup-page-close-icon"
          onClick={() => {
            this.handleClose();
          }}
        >
          <span className="icon-close backup-close-icon"></span>
        </div>
      </div>
    );
  }
}

export default SortShelfDialog;
