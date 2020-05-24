import React from "react";
import "./settingPanel.css";
import ThemeList from "../themeList/themeList";
import FontSizeList from "../fontSizeList/fontSizeList";
import DropdownList from "../dropdownList/dropdownList";
import SingleControl from "../singleControl/singleControl";
import { Trans, withNamespaces } from "react-i18next";

class SettingPanel extends React.Component {
  componentDidMount() {}
  render() {
    return (
      <div className="setting-panel-parent">
        <div className="setting-panel">
          <div className="setting-panel-title">
            <Trans>Reading Option</Trans>
          </div>
          <SingleControl />
          <ThemeList />
          <FontSizeList />
          <DropdownList />
        </div>
      </div>
    );
  }
}

export default withNamespaces()(SettingPanel as any);
