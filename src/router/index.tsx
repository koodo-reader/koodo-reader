import React, { useEffect } from "react";
import { Route, Switch, HashRouter } from "react-router-dom";
import Manager from "../pages/manager";
import EpubReader from "../pages/epubReader";
import Viewer from "../pages/viewer";
import _Redirect from "../pages/redirect";
import i18n from "../i18n";
import OtherUtil from "../utils/otherUtil";

const Router = () => {
  useEffect(() => {
    const lng = OtherUtil.getReaderConfig("lang");
    if (lng) {
      i18n.changeLanguage(lng);
    } else {
      if (navigator.language === "zh-CN" || navigator.language === "zh-SG") {
        i18n.changeLanguage("zh");
      } else if (
        navigator.language === "zh-TW" ||
        navigator.language === "zh-HK"
      ) {
        i18n.changeLanguage("cht");
      } else if (navigator.language === "ru") {
        i18n.changeLanguage("ru");
      } else {
        i18n.changeLanguage("en");
      }
    }
  }, []);
  return (
    <HashRouter>
      <Switch>
        <Route component={Manager} path="/manager" />
        <Route component={EpubReader} path="/epub" />
        <Route component={Viewer} path="/mobi" />
        <Route component={Viewer} path="/azw3" />
        <Route component={Viewer} path="/txt" />
        <Route component={_Redirect} path="/" />
      </Switch>
    </HashRouter>
  );
};

export default Router;
