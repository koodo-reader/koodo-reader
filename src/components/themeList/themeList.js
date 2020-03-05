import React, { Component } from "react";
import { themeList } from "../../utils/readerConfig";
import ReaderConfig from "../../utils/readerConfig";
import StyleConfig from "../../utils/styleConfig";
import "./themeList.css";
import { connect } from "react-redux";
class ThemeList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentBackgroundIndex: themeList.findIndex(item => {
        return item.theme === this.props.theme;
      })
    };
  }
  handleChangeColor(theme, index) {
    ReaderConfig.set("theme", theme);
    this.setState({
      currentBackgroundIndex: index
    });
    StyleConfig.addDefaultCss();
  }
  render() {
    const renderBackgroundColorList = () => {
      return themeList.map((item, index) => {
        return (
          <li
            key={item.id}
            className={
              index === this.state.currentBackgroundIndex
                ? "active-color background-color-circle"
                : "background-color-circle"
            }
            onClick={() => {
              this.handleChangeColor(item.theme, index);
            }}
            style={{ backgroundColor: item.theme }}
          ></li>
        );
      });
    };
    return (
      <div className="background-color-setting">
        <div className="background-color-text">背景颜色</div>
        <ul className="background-color-list">{renderBackgroundColorList()}</ul>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return { theme: state.settingPanel.theme };
};
const actionCreator = {};
ThemeList = connect(mapStateToProps, actionCreator)(ThemeList);
export default ThemeList;
