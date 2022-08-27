import React, { useEffect } from "react";
import { Route, Switch, HashRouter } from "react-router-dom";
import Manager from "../pages/manager";
import HtmlReader from "../pages/htmlReader";
import DjvuReader from "../pages/djvuReader";
import PDFReader from "../pages/pdfReader";
import _Redirect from "../pages/redirect";
import i18n from "../i18n";
import StorageUtil from "../utils/serviceUtils/storageUtil";

const Router = () => {
  useEffect(() => {
    const lng = StorageUtil.getReaderConfig("lang");
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
      } else if (navigator.language.startsWith("ro")) {
        i18n.changeLanguage("ro");
      } else if (navigator.language.startsWith("ru")) {
        i18n.changeLanguage("ru");
      } else if (navigator.language.startsWith("jp")) {
        i18n.changeLanguage("jp");
      } else if (navigator.language.startsWith("fr")) {
        i18n.changeLanguage("fr");
      } else if (navigator.language.startsWith("es")) {
        i18n.changeLanguage("es");
      } else if (navigator.language.startsWith("pt")) {
        i18n.changeLanguage("ptBR");
      } else if (navigator.language.startsWith("fa")) {
        i18n.changeLanguage("fa");
      } else if (navigator.language.startsWith("cs")) {
        i18n.changeLanguage("cs");
      } else if (navigator.language.startsWith("de")) {
        i18n.changeLanguage("de");
      } else if (navigator.language.startsWith("pl")) {
        i18n.changeLanguage("pl");
      } else {
        i18n.changeLanguage("en");
      }
    }
  }, []);
  return (
    <HashRouter>
      <Switch>
        <Route component={Manager} path="/manager" />
        <Route component={DjvuReader} path="/djvu" />
        <Route component={HtmlReader} path="/epub" />
        <Route component={HtmlReader} path="/mobi" />
        <Route component={HtmlReader} path="/cbr" />
        <Route component={HtmlReader} path="/cbt" />
        <Route component={HtmlReader} path="/cbz" />
        <Route component={HtmlReader} path="/azw3" />
        <Route component={HtmlReader} path="/txt" />
        <Route component={HtmlReader} path="/docx" />
        <Route component={HtmlReader} path="/md" />
        <Route component={HtmlReader} path="/rtf" />
        <Route component={HtmlReader} path="/fb2" />
        <Route component={HtmlReader} path="/html" />
        <Route component={HtmlReader} path="/htm" />
        <Route component={HtmlReader} path="/xml" />
        <Route component={HtmlReader} path="/xhtml" />
        <Route component={HtmlReader} path="/href" />
        <Route component={PDFReader} path="/pdf" />
        <Route component={_Redirect} path="/" />
      </Switch>
    </HashRouter>
  );
};

export default Router;
