import React from "react";
import "./settingPanel.css";
import ThemeList from "../../components/themeList";
import FontSizeList from "../../components/fontSizeList";
import DropdownList from "../../components/dropdownList";
import SingleControl from "../../components/singleControl";
import { Trans } from "react-i18next";

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

export default SettingPanel;
