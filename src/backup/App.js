import React, { Component } from "react";
import Reader from "./containers/reader/reader";
import Manager from "./containers/manager/manager";
import "./assets/styles/reset.css";
import "./assets/styles/style.css";
import { connect } from "react-redux";
// @connect(state => state.book)
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return this.props.isReading ? <Reader /> : <Manager />;
  }
}
const mapStateToProps = state => {
  return { isReading: state.book.isReading };
};
const actionCreator = {};
App = connect(mapStateToProps, actionCreator)(App);
export default App;
