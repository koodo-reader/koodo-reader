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

const Router = () => {
  return (
    <HashRouter>
      <Switch>
        <Route component={Manager} path="/manager" />
        <Route component={Manager} exact path="/" />
        <Route component={EpubReader} path="/epub" />
        {/* <Route component={_Redirect} path="/redirect" />
        <Redirect to="/redirect" /> */}
      </Switch>
    </HashRouter>
  );
};

export default hot(Router);
