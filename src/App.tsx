import React from "react";
import Reader from "./pages/reader/reader";
import Manager from "./pages/manager/manager";
import "./assets/styles/reset.css";
import "./assets/styles/global.css";
import "./assets/styles/style.css";
import { connect } from "react-redux";
interface AppProps {
  isReading: boolean;
}
class App extends React.Component<AppProps> {
  render() {
    return this.props.isReading ? <Reader /> : <Manager />;
  }
}
const mapStateToProps = (state: { book: { isReading: boolean } }) => {
  return { isReading: state.book.isReading };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(App);
