import { hot } from "react-hot-loader/root";
import React from "react";
import { Route, Switch, HashRouter } from "react-router-dom";
import Manager from "../pages/manager";
import EpubReader from "../pages/epubReader";
import _Redirect from "../pages/redirect";

const Router = () => {
  return (
    <HashRouter>
      <Switch>
        <Route component={Manager} path="/manager" />
        <Route component={EpubReader} path="/epub" />
        <Route component={_Redirect} path="/" />
      </Switch>
    </HashRouter>
  );
};

export default hot(Router);
