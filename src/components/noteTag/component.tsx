import React from "react";
import "./noteTag.css";
import { NoteTagProps, NoteTagState } from "./interface";
import TagUtil from "../../utils/tagUtil";
import { Trans } from "react-i18next";

class NoteTag extends React.Component<NoteTagProps, NoteTagState> {
  constructor(props: NoteTagProps) {
    super(props);
    this.state = {
      tagIndex: [],
      isInput: false,
    };
  }
  componentDidMount() {
    if (this.props.isReading) {
      this.setState({ tagIndex: this.tagToIndex(this.props.tag) });
    }
  }
  componentWillReceiveProps(nextProps: NoteTagProps) {
    if (
      this.props.isReading &&
      nextProps.tag &&
      nextProps.tag.length > 0 &&
      this.props.tag !== nextProps.tag
    ) {
      this.setState({ tagIndex: this.tagToIndex(nextProps.tag) });
    }
  }
  tagToIndex = (tag: string[]) => {
    let temp = [];
    if (!tag) return [];
    for (let i = 0; i < TagUtil.getAllTags().length; i++) {
      if (tag.indexOf(TagUtil.getAllTags()[i]) > -1) {
        temp.push(i);
      }
    }
    return temp;
  };
  indextoTag = (tagIndex: number[]) => {
    let temp = [];
    for (let i = 0; i < tagIndex.length; i++) {
      temp.push(TagUtil.getAllTags()[tagIndex[i]]);
    }
    return temp;
  };
  handleChangeTag = (index: number, item: string) => {
    let temp: number[] = [...this.state.tagIndex];
    if (this.state.tagIndex.indexOf(index) > -1) {
      temp = [...this.state.tagIndex];
      let indexResult = temp.indexOf(index);
      temp.splice(indexResult, 1);
      this.setState({ tagIndex: temp });
      this.props.handleTag(this.indextoTag(temp));
    } else {
      temp.push(index);
      this.setState({ tagIndex: temp });
      this.props.handleTag(this.indextoTag(temp));
    }
  };
  handleAddTag = (event: any) => {
    this.setState({ isInput: false });
    if (!event.target.value) {
      return;
    }
    TagUtil.setTags(event.target.value);
  };
  handleInput = () => {
    this.setState({ isInput: true });
  };
  render() {
    const renderTag = () => {
      let tagNotes = TagUtil.getAllTags();
      return tagNotes.map((item: any, index: number) => {
        return (
          <li
            key={item}
            className={
              this.state.tagIndex.indexOf(index) > -1
                ? "tag-list-item active-tag "
                : "tag-list-item"
            }
            onClick={() => {
              this.handleChangeTag(index, item);
            }}
          >
            <div className="center">
              <Trans>{item}</Trans>
            </div>
          </li>
        );
      });
    };
    return (
      <div
        className="note-tag-container"
        style={this.props.isReading ? { width: "1999px" } : {}}
      >
        {this.props.isReading ? null : (
          <span className="tag-title">
            <Trans>All Tags</Trans>
          </span>
        )}

        <ul className="tag-container">
          <li
            className="tag-list-item-new"
            onClick={() => {
              this.handleInput();
            }}
          >
            <div className="center">
              {this.state.isInput ? (
                <input
                  type="text"
                  name="newTag"
                  id="newTag"
                  onBlur={(event) => {
                    this.handleAddTag(event);
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
  }
}
export default NoteTag;
