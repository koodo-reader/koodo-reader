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
        StorageUtil.setReaderConfig("lang", "zh");
      } else if (
        navigator.language === "zh-TW" ||
        navigator.language === "zh-HK"
      ) {
        i18n.changeLanguage("cht");
        StorageUtil.setReaderConfig("lang", "cht");
      } else if (navigator.language.startsWith("ro")) {
        i18n.changeLanguage("ro");
        StorageUtil.setReaderConfig("lang", "ro");
      } else if (navigator.language.startsWith("ru")) {
        i18n.changeLanguage("ru");
        StorageUtil.setReaderConfig("lang", "ru");
      } else if (navigator.language.startsWith("jp")) {
        i18n.changeLanguage("jp");
        StorageUtil.setReaderConfig("lang", "jp");
      } else if (navigator.language.startsWith("hy")) {
        i18n.changeLanguage("hy");
        StorageUtil.setReaderConfig("lang", "hy");
      } else if (navigator.language.startsWith("id")) {
        i18n.changeLanguage("id");
        StorageUtil.setReaderConfig("lang", "id");
      } else if (navigator.language.startsWith("bg")) {
        i18n.changeLanguage("bg");
        StorageUtil.setReaderConfig("lang", "bg");
      } else if (navigator.language.startsWith("it")) {
        i18n.changeLanguage("it");
        StorageUtil.setReaderConfig("lang", "it");
      } else if (navigator.language.startsWith("nl")) {
        i18n.changeLanguage("nl");
        StorageUtil.setReaderConfig("lang", "nl");
      } else if (navigator.language.startsWith("bn")) {
        i18n.changeLanguage("bn");
        StorageUtil.setReaderConfig("lang", "bn");
      } else if (navigator.language.startsWith("th")) {
        i18n.changeLanguage("th");
        StorageUtil.setReaderConfig("lang", "th");
      } else if (navigator.language.startsWith("tr")) {
        i18n.changeLanguage("tr");
        StorageUtil.setReaderConfig("lang", "tr");
      } else if (navigator.language.startsWith("ar")) {
        i18n.changeLanguage("ar");
        StorageUtil.setReaderConfig("lang", "ar");
      } else if (navigator.language.startsWith("fr")) {
        i18n.changeLanguage("fr");
        StorageUtil.setReaderConfig("lang", "fr");
      } else if (navigator.language.startsWith("es")) {
        i18n.changeLanguage("es");
        StorageUtil.setReaderConfig("lang", "es");
      } else if (navigator.language.startsWith("pt")) {
        i18n.changeLanguage("ptBR");
        StorageUtil.setReaderConfig("lang", "ptBR");
      } else if (navigator.language.startsWith("fa")) {
        i18n.changeLanguage("fa");
        StorageUtil.setReaderConfig("lang", "fa");
      } else if (navigator.language.startsWith("cs")) {
        i18n.changeLanguage("cs");
        StorageUtil.setReaderConfig("lang", "cs");
      } else if (navigator.language.startsWith("de")) {
        i18n.changeLanguage("de");
        StorageUtil.setReaderConfig("lang", "de");
      } else if (navigator.language.startsWith("pl")) {
        i18n.changeLanguage("pl");
        StorageUtil.setReaderConfig("lang", "pl");
      } else {
        i18n.changeLanguage("en");
        StorageUtil.setReaderConfig("lang", "en");
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
        <Route component={HtmlReader} path="/cb7" />
        <Route component={HtmlReader} path="/azw3" />
        <Route component={HtmlReader} path="/azw" />
        <Route component={HtmlReader} path="/txt" />
        <Route component={HtmlReader} path="/docx" />
        <Route component={HtmlReader} path="/md" />
        <Route component={HtmlReader} path="/fb2" />
        <Route component={HtmlReader} path="/html" />
        <Route component={HtmlReader} path="/htm" />
        <Route component={HtmlReader} path="/xml" />
        <Route component={HtmlReader} path="/xhtml" />
        <Route component={HtmlReader} path="/mhtml" />
        <Route component={HtmlReader} path="/href" />
        <Route component={PDFReader} path="/pdf" />
        <Route component={_Redirect} path="/" />
      </Switch>
    </HashRouter>
  );
};

export default Router;
