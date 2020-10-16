import { hot } from "react-hot-loader/root";
import React from "react";
import {
  Route,
  Switch,
  HashRouter,
  Redirect,
  BrowserRouter,
} from "react-router-dom";
import Manager from "../pages/manager";
import EpubReader from "../pages/epubReader";
const Router = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route component={Manager} path="/manager" />
        <Route component={EpubReader} path="/epub" />
        <Redirect to="/manager/home" />
      </Switch>
    </BrowserRouter>
  );
};

export default hot(Router);
