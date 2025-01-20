import React, { useEffect } from "react";
import { Route, Switch, HashRouter } from "react-router-dom";
import Manager from "../pages/manager";
import HtmlReader from "../pages/reader";
import _Redirect from "../pages/redirect";
import i18n from "../i18n";
import ConfigService from "../utils/storage/configService";

const Router = () => {
  useEffect(() => {
    const lng = ConfigService.getReaderConfig("lang");

    if (lng) {
      //Compatile with 1.6.0 and older
      if (lng === "zh") {
        i18n.changeLanguage("zhCN");
      } else if (lng === "cht") {
        i18n.changeLanguage("zhTW");
      } else {
        i18n.changeLanguage(lng);
      }
    } else {
      if (navigator.language === "zh-CN" || navigator.language === "zh-SG") {
        i18n.changeLanguage("zhCN");
        ConfigService.setReaderConfig("lang", "zhCN");
      } else if (
        navigator.language === "zh-TW" ||
        navigator.language === "zh-HK"
      ) {
        i18n.changeLanguage("zhTW");
        ConfigService.setReaderConfig("lang", "zhTW");
      } else if (navigator.language === "zh-MO") {
        i18n.changeLanguage("zhMO");
        ConfigService.setReaderConfig("lang", "zhMO");
      } else if (navigator.language.startsWith("ro")) {
        i18n.changeLanguage("ro");
        ConfigService.setReaderConfig("lang", "ro");
      } else if (navigator.language.startsWith("ru")) {
        i18n.changeLanguage("ru");
        ConfigService.setReaderConfig("lang", "ru");
      } else if (navigator.language.startsWith("ja")) {
        i18n.changeLanguage("ja");
        ConfigService.setReaderConfig("lang", "ja");
      } else if (navigator.language.startsWith("bo")) {
        i18n.changeLanguage("bo");
        ConfigService.setReaderConfig("lang", "bo");
      } else if (navigator.language.startsWith("hy")) {
        i18n.changeLanguage("hy");
        ConfigService.setReaderConfig("lang", "hy");
      } else if (navigator.language.startsWith("hu")) {
        i18n.changeLanguage("hu");
        ConfigService.setReaderConfig("lang", "hu");
      } else if (navigator.language.startsWith("hi")) {
        i18n.changeLanguage("hi");
        ConfigService.setReaderConfig("lang", "hi");
      } else if (navigator.language.startsWith("id")) {
        i18n.changeLanguage("id");
        ConfigService.setReaderConfig("lang", "id");
      } else if (navigator.language.startsWith("bg")) {
        i18n.changeLanguage("bg");
        ConfigService.setReaderConfig("lang", "bg");
      } else if (navigator.language.startsWith("it")) {
        i18n.changeLanguage("it");
        ConfigService.setReaderConfig("lang", "it");
      } else if (navigator.language.startsWith("nl")) {
        i18n.changeLanguage("nl");
        ConfigService.setReaderConfig("lang", "nl");
      } else if (navigator.language.startsWith("bn")) {
        i18n.changeLanguage("bn");
        ConfigService.setReaderConfig("lang", "bn");
      } else if (navigator.language.startsWith("tl")) {
        i18n.changeLanguage("tl");
        ConfigService.setReaderConfig("lang", "tl");
      } else if (navigator.language.startsWith("sv")) {
        i18n.changeLanguage("sv");
        ConfigService.setReaderConfig("lang", "sv");
      } else if (navigator.language.startsWith("ga")) {
        i18n.changeLanguage("ga");
        ConfigService.setReaderConfig("lang", "ga");
      } else if (navigator.language.startsWith("th")) {
        i18n.changeLanguage("th");
        ConfigService.setReaderConfig("lang", "th");
      } else if (navigator.language.startsWith("tr")) {
        i18n.changeLanguage("tr");
        ConfigService.setReaderConfig("lang", "tr");
      } else if (navigator.language.startsWith("ar")) {
        i18n.changeLanguage("ar");
        ConfigService.setReaderConfig("lang", "ar");
      } else if (navigator.language.startsWith("fr")) {
        i18n.changeLanguage("fr");
        ConfigService.setReaderConfig("lang", "fr");
      } else if (navigator.language.startsWith("es")) {
        i18n.changeLanguage("es");
        ConfigService.setReaderConfig("lang", "es");
      } else if (navigator.language.startsWith("pt")) {
        i18n.changeLanguage("ptBR");
        ConfigService.setReaderConfig("lang", "ptBR");
      } else if (navigator.language.startsWith("fa")) {
        i18n.changeLanguage("fa");
        ConfigService.setReaderConfig("lang", "fa");
      } else if (navigator.language.startsWith("cs")) {
        i18n.changeLanguage("cs");
        ConfigService.setReaderConfig("lang", "cs");
      } else if (navigator.language.startsWith("de")) {
        i18n.changeLanguage("de");
        ConfigService.setReaderConfig("lang", "de");
      } else if (navigator.language.startsWith("pl")) {
        i18n.changeLanguage("pl");
        ConfigService.setReaderConfig("lang", "pl");
      } else {
        i18n.changeLanguage("en");
        ConfigService.setReaderConfig("lang", "en");
      }
    }
  }, []);
  return (
    <HashRouter>
      <Switch>
        <Route component={Manager} path="/manager" />
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
        <Route component={HtmlReader} path="/pdf" />
        <Route component={_Redirect} path="/" />
      </Switch>
    </HashRouter>
  );
};

export default Router;
