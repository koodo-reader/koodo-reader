import { hot } from "react-hot-loader/root";
import React from "react";
import { Route, Switch, Redirect, HashRouter } from "react-router-dom";
import Manager from "../pages/manager";
import EpubReader from "../pages/epubReader";
import PdfReader from "../pages/pdfReader";
const Router = () => {
  return (
    <HashRouter>
      <Switch>
        <Route component={Manager} path="/manager" />
        <Route component={EpubReader} path="/epub" />
        <Route component={PdfReader} path="/pdf" />
        <Redirect to="/manager/home" />
      </Switch>
    </HashRouter>
  );
};

export default hot(Router);
