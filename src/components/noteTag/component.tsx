import { useEffect, useState } from "react";
import "./noteTag.css";
import { NoteTagProps } from "./interface";
import DeleteIcon from "../deleteIcon";
import { Trans } from "react-i18next";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

const NoteTag = (props: NoteTagProps) => {
  const [tagIndex, setTagIndex] = useState<number[]>([]);
  const [isInput, setIsInput] = useState(false);
  const [isEntered, setIsEntered] = useState(false);

  const tagToIndex = (tag: string[]) => {
    let temp: number[] = [];
    if (!tag) return [];
    for (
      let i = 0;
      i < ConfigService.getAllListConfig("noteTags").length;
      i++
    ) {
      if (tag.indexOf(ConfigService.getAllListConfig("noteTags")[i]) > -1) {
        temp.push(i);
      }
    }
    return temp;
  };

  const indextoTag = (indexList: number[]) => {
    let temp: any = [];
    for (let i = 0; i < indexList.length; i++) {
      temp.push(ConfigService.getAllListConfig("noteTags")[indexList[i]]);
    }
    return temp;
  };

  useEffect(() => {
    if (props.isReading || props.isShowPopupNote) {
      setTagIndex(tagToIndex(props.tag));
    }
  }, [props.tag, props.isReading, props.isShowPopupNote]);

  useEffect(() => {
    if (isInput) {
      document.getElementById("newTag")?.focus();
    }
  }, [isInput]);

  const handleChangeTag = (index: number) => {
    let temp: number[] = [...tagIndex];
    if (tagIndex.indexOf(index) > -1) {
      temp = [...tagIndex];
      let indexResult = temp.indexOf(index);
      temp.splice(indexResult, 1);
      setTagIndex(temp);
      props.handleTag(indextoTag(temp));
    } else {
      temp.push(index);
      setTagIndex(temp);
      props.handleTag(indextoTag(temp));
    }
  };

  const handleAddTag = (event: any) => {
    setIsInput(false);
    if (!event.target.value) {
      return;
    }
    ConfigService.setListConfig(event.target.value, "noteTags");
    setTagIndex(tagToIndex(props.tag));
    props.handleTag(indextoTag(tagToIndex(props.tag)));
  };

  const handleInput = () => {
    setIsInput(true);
  };

  const handleShowTags = (_bool: boolean) => {
    if (document.querySelector(".card-list-container")) {
      (document.querySelector(".card-list-container") as any)?.setAttribute(
        "style",
        `height:calc(100% - ${
          (document.querySelector(".card-list-container") as any)?.offsetTop
        }px)`
      );
    }
  };

  const calculateContainerWidth = () => {
    const noteTags = props.isCard
      ? props.tag
      : ConfigService.getAllListConfig("noteTags");

    if (!noteTags || noteTags.length === 0) {
      return { minWidth: "100%" };
    }

    const baseWidth = 100;
    const tagWidth = 60;
    const addButtonWidth = props.isCard ? 0 : 30;
    const calculatedWidth =
      baseWidth + noteTags.length * tagWidth + addButtonWidth;

    return {
      maxWidth: "100%",
      width: `${Math.max(calculatedWidth, 300)}px`,
    };
  };

  const renderTag = () => {
    let noteTags = props.isCard
      ? props.tag
      : ConfigService.getAllListConfig("noteTags");
    return noteTags.map((item: any, index: number) => {
      return (
        <li
          key={item}
          className={
            tagIndex.indexOf(index) > -1 && !props.isCard
              ? "tag-list-item active-tag "
              : "tag-list-item"
          }
        >
          <div
            className="center"
            onClick={() => {
              handleChangeTag(index);
            }}
          >
            <Trans>{item}</Trans>
          </div>
          <div className="delete-tag-container">
            {tagIndex.indexOf(index) > -1 &&
            !props.isReading &&
            !props.isShowPopupNote &&
            !props.isCard ? (
              <DeleteIcon
                {...({
                  tagName: item,
                  mode: "tags",
                  index: index,
                  handleChangeTag: handleChangeTag,
                } as any)}
              />
            ) : null}
          </div>
        </li>
      );
    });
  };

  return (
    <div className="note-tag-container">
      <ul className="tag-container" style={calculateContainerWidth()}>
        <span
          className="tag-title"
          style={{ marginRight: "10px", marginLeft: "0px" }}
        >
          <Trans>Tags</Trans>
        </span>

        <li
          className="tag-list-item-new"
          onClick={() => {
            handleInput();
          }}
          style={isInput ? { width: "80px" } : {}}
        >
          <div className="center">
            {isInput ? (
              <input
                type="text"
                name="newTag"
                id="newTag"
                onBlur={(event) => {
                  if (!isEntered) {
                    handleAddTag(event);
                  } else {
                    setIsEntered(false);
                  }
                }}
                onKeyDown={(event: any) => {
                  if (event.key === "Enter") {
                    setIsEntered(true);
                    handleAddTag(event);
                  }
                }}
              />
            ) : (
              <span className="icon-add"></span>
            )}
          </div>
        </li>
        {renderTag()}
      </ul>
    </div>
  );
};
export default NoteTag;
