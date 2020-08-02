//左下角的图标外链
import React from "react";
import "./colorOption.css";
import { ColorProps } from "./interface";

class ColorOption extends React.Component<ColorProps> {
  render() {
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
    return <div className="color-option-container">{renderColor()}</div>;
  }
}

export default ColorOption;
