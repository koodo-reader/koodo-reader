//左下角的图标外链
import React from "react";
import "./colorOption.css";
import { ColorProps, ColorStates } from "./interface";

class ColorOption extends React.Component<ColorProps, ColorStates> {
  constructor(props: ColorProps) {
    super(props);
    this.state = {
      isLine: false,
    };
  }
  handleChangeOptiion = () => {
    this.setState({ isLine: !this.state.isLine });
  };
  render() {
    const renderLine = () => {
      return ["#FF0000", "#000080", "#0000FF", "#2EFF2E"].map((item, index) => {
        return (
          <div
            className="line-option"
            style={{
              border: `${
                this.props.color === index + 4
                  ? "2px solid rgba(75,75,75,1)"
                  : ""
              }`,
            }}
            key={item}
            onClick={() => {
              this.props.handleColor(index + 4);
            }}
          >
            <div
              className="demo-line"
              style={{ borderBottom: `solid 2px ${item}` }}
            ></div>
          </div>
        );
      });
    };
    const renderColor = () => {
      return ["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"].map((item, index) => {
        return (
          <div
            className="color-option"
            style={{
              backgroundColor: item,
              border: `${
                this.props.color === index ? "2px solid rgba(75,75,75,1)" : ""
              }`,
            }}
            key={item}
            onClick={() => {
              this.props.handleColor(index);
            }}
          ></div>
        );
      });
    };
    return (
      <div className="color-option-container">
        {!this.state.isLine && renderColor()}
        <span
          className="icon-sort popup-color-more"
          onClick={() => {
            this.handleChangeOptiion();
          }}
        ></span>
        {this.state.isLine && renderLine()}
      </div>
    );
  }
}

export default ColorOption;
