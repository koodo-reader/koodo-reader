import { useEffect } from "react";
import { Route, Routes, HashRouter } from "react-router-dom";
import { changeLanguage } from "../i18n";
import { ConfigService } from "../assets/lib/kookit-extra-browser.min";
import Manager from "../pages/manager";
import Login from "../pages/login";
import Stats from "../pages/stats";
import HtmlReader from "../pages/reader";
import _Redirect from "../pages/redirect";

const Router = () => {
  useEffect(() => {
    const lng = ConfigService.getReaderConfig("lang");

    if (lng) {
      //Compatile with 1.6.0 and older
      if (lng === "zh") {
        changeLanguage("zhCN");
      } else if (lng === "cht") {
        changeLanguage("zhTW");
      } else {
        changeLanguage(lng);
      }
    } else {
      if (navigator.language === "zh-CN" || navigator.language === "zh-SG") {
        changeLanguage("zhCN");
        ConfigService.setReaderConfig("lang", "zhCN");
      } else if (
        navigator.language === "zh-TW" ||
        navigator.language === "zh-HK"
      ) {
        changeLanguage("zhTW");
        ConfigService.setReaderConfig("lang", "zhTW");
      } else if (navigator.language === "zh-MO") {
        changeLanguage("zhMO");
        ConfigService.setReaderConfig("lang", "zhMO");
      } else if (navigator.language.startsWith("ro")) {
        changeLanguage("ro");
        ConfigService.setReaderConfig("lang", "ro");
      } else if (navigator.language.startsWith("ru")) {
        changeLanguage("ru");
        ConfigService.setReaderConfig("lang", "ru");
      } else if (navigator.language.startsWith("ja")) {
        changeLanguage("ja");
        ConfigService.setReaderConfig("lang", "ja");
      } else if (navigator.language.startsWith("ta")) {
        changeLanguage("ta");
        ConfigService.setReaderConfig("lang", "ta");
      } else if (navigator.language.startsWith("uk")) {
        changeLanguage("uk");
        ConfigService.setReaderConfig("lang", "uk");
      } else if (navigator.language.startsWith("sl")) {
        changeLanguage("sl");
        ConfigService.setReaderConfig("lang", "sl");
      } else if (navigator.language.startsWith("bo")) {
        changeLanguage("bo");
        ConfigService.setReaderConfig("lang", "bo");
      } else if (navigator.language.startsWith("hy")) {
        changeLanguage("hy");
        ConfigService.setReaderConfig("lang", "hy");
      } else if (navigator.language.startsWith("el")) {
        changeLanguage("el");
        ConfigService.setReaderConfig("lang", "el");
      } else if (navigator.language.startsWith("hu")) {
        changeLanguage("hu");
        ConfigService.setReaderConfig("lang", "hu");
      } else if (navigator.language.startsWith("hi")) {
        changeLanguage("hi");
        ConfigService.setReaderConfig("lang", "hi");
      } else if (navigator.language.startsWith("id")) {
        changeLanguage("id");
        ConfigService.setReaderConfig("lang", "id");
      } else if (navigator.language.startsWith("bg")) {
        changeLanguage("bg");
        ConfigService.setReaderConfig("lang", "bg");
      } else if (navigator.language.startsWith("it")) {
        changeLanguage("it");
        ConfigService.setReaderConfig("lang", "it");
      } else if (navigator.language.startsWith("nl")) {
        changeLanguage("nl");
        ConfigService.setReaderConfig("lang", "nl");
      } else if (navigator.language.startsWith("bn")) {
        changeLanguage("bn");
        ConfigService.setReaderConfig("lang", "bn");
      } else if (navigator.language.startsWith("tl")) {
        changeLanguage("tl");
        ConfigService.setReaderConfig("lang", "tl");
      } else if (navigator.language.startsWith("sv")) {
        changeLanguage("sv");
        ConfigService.setReaderConfig("lang", "sv");
      } else if (navigator.language.startsWith("ga")) {
        changeLanguage("ga");
        ConfigService.setReaderConfig("lang", "ga");
      } else if (navigator.language.startsWith("th")) {
        changeLanguage("th");
        ConfigService.setReaderConfig("lang", "th");
      } else if (navigator.language.startsWith("tr")) {
        changeLanguage("tr");
        ConfigService.setReaderConfig("lang", "tr");
      } else if (navigator.language.startsWith("ar")) {
        changeLanguage("ar");
        ConfigService.setReaderConfig("lang", "ar");
      } else if (navigator.language.startsWith("fr")) {
        changeLanguage("fr");
        ConfigService.setReaderConfig("lang", "fr");
      } else if (navigator.language.startsWith("es")) {
        changeLanguage("es");
        ConfigService.setReaderConfig("lang", "es");
      } else if (navigator.language.startsWith("pt")) {
        changeLanguage("ptBR");
        ConfigService.setReaderConfig("lang", "ptBR");
      } else if (navigator.language.startsWith("fa")) {
        changeLanguage("fa");
        ConfigService.setReaderConfig("lang", "fa");
      } else if (navigator.language.startsWith("cs")) {
        changeLanguage("cs");
        ConfigService.setReaderConfig("lang", "cs");
      } else if (navigator.language.startsWith("de")) {
        changeLanguage("de");
        ConfigService.setReaderConfig("lang", "de");
      } else if (navigator.language.startsWith("pl")) {
        changeLanguage("pl");
        ConfigService.setReaderConfig("lang", "pl");
      } else if (navigator.language.startsWith("am")) {
        changeLanguage("am");
        ConfigService.setReaderConfig("lang", "am");
      } else if (navigator.language.startsWith("da")) {
        changeLanguage("da");
        ConfigService.setReaderConfig("lang", "da");
      } else if (navigator.language.startsWith("fi")) {
        changeLanguage("fi");
        ConfigService.setReaderConfig("lang", "fi");
      } else if (navigator.language.startsWith("ie")) {
        changeLanguage("ie");
        ConfigService.setReaderConfig("lang", "ie");
      } else if (navigator.language.startsWith("vi")) {
        changeLanguage("vi");
        ConfigService.setReaderConfig("lang", "vi");
      } else {
        changeLanguage("en");
        ConfigService.setReaderConfig("lang", "en");
      }
    }
  }, []);
  return (
    <HashRouter>
      <Routes>
        <Route element={<Manager />} path="/manager/*" />
        <Route element={<Login />} path="/login" />
        <Route element={<Stats />} path="/stats" />
        <Route element={<HtmlReader />} path="/epub/*" />
        <Route element={<HtmlReader />} path="/mobi/*" />
        <Route element={<HtmlReader />} path="/cbr/*" />
        <Route element={<HtmlReader />} path="/cbt/*" />
        <Route element={<HtmlReader />} path="/cbz/*" />
        <Route element={<HtmlReader />} path="/cb7/*" />
        <Route element={<HtmlReader />} path="/pptx/*" />
        <Route element={<HtmlReader />} path="/ppt/*" />
        <Route element={<HtmlReader />} path="/xps/*" />
        <Route element={<HtmlReader />} path="/oxps/*" />
        <Route element={<HtmlReader />} path="/djvu/*" />
        <Route element={<HtmlReader />} path="/djv/*" />
        <Route element={<HtmlReader />} path="/ofd/*" />
        <Route element={<HtmlReader />} path="/azw3/*" />
        <Route element={<HtmlReader />} path="/azw/*" />
        <Route element={<HtmlReader />} path="/txt/*" />
        <Route element={<HtmlReader />} path="/docx/*" />
        <Route element={<HtmlReader />} path="/doc/*" />
        <Route element={<HtmlReader />} path="/rtf/*" />
        <Route element={<HtmlReader />} path="/md/*" />
        <Route element={<HtmlReader />} path="/fb2/*" />
        <Route element={<HtmlReader />} path="/chm/*" />
        <Route element={<HtmlReader />} path="/html/*" />
        <Route element={<HtmlReader />} path="/htm/*" />
        <Route element={<HtmlReader />} path="/xml/*" />
        <Route element={<HtmlReader />} path="/xhtml/*" />
        <Route element={<HtmlReader />} path="/mhtml/*" />
        <Route element={<HtmlReader />} path="/href/*" />
        <Route element={<HtmlReader />} path="/pdf/*" />
        <Route element={<_Redirect />} path="/" />
      </Routes>
    </HashRouter>
  );
};

export default Router;

