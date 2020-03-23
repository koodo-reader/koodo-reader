import React, { Component } from "react";
import "./settingPanel.css";
import { connect } from "react-redux";
import ThemeList from "../themeList/themeList";
import FontSizeList from "../fontSizeList/fontSizeList";
import DropdownList from "../dropdownList/dropdownList";
import SingleControl from "../singleControl/singleControl";
class SettingPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="setting-panel-parent">
        <div className="setting-panel">
          <div className="setting-panel-title">阅读选项</div>
          <SingleControl />
          <ThemeList />
          <FontSizeList />
          <DropdownList/>
        </div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return { books: state.manager.books };
};
const actionCreator = {};
SettingPanel = connect(mapStateToProps, actionCreator)(SettingPanel);
export default SettingPanel;
