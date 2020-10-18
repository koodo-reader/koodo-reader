import { hot } from "react-hot-loader/root";
import React from "react";
import {
  Route,
  Switch,
  Redirect,
  HashRouter,
  BrowserRouter,
} from "react-router-dom";
import Manager from "../pages/manager";
import EpubReader from "../pages/epubReader";
import isElectron from "is-electron";
const Router = () => {
  return isElectron() ? (
    <BrowserRouter>
      <Switch>
        <Route component={Manager} path="/manager" />
        <Route component={EpubReader} path="/epub" />
        <Redirect to="/manager/home" />
      </Switch>
    </BrowserRouter>
  ) : (
    <HashRouter>
      <Switch>
        <Route component={Manager} path="/manager" />
        <Route component={EpubReader} path="/epub" />
        <Redirect to="/manager/home" />
      </Switch>
    </HashRouter>
  );
};

export default hot(Router);
