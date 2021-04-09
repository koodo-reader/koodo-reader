import React from "react";
import "./arrow.css";
const Arrow = () => {
  return (
    <div className="arrow-container">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        className="circle"
      >
        <g
          transform="translate(48 48) rotate(180)"
          fill="none"
          stroke="rgba(75,75,75)"
          strokeWidth="1.5"
        >
          <circle cx="24" cy="24" r="24" stroke="none" />
          <circle cx="24" cy="24" r="23.25" fill="none" />
        </g>
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="7"
        height="40.5"
        viewBox="0 0 9 64.5"
        className="arrow"
      >
        <g transform="translate(-799.5 -100)">
          <line
            y2="59"
            transform="translate(804 163.5) rotate(180)"
            fill="none"
            stroke="rgba(75,75,75)"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M4.5,0,9,8H0Z"
            transform="translate(799.5 100)"
            fill="rgba(75,75,75)"
          />
        </g>
      </svg>
    </div>
  );
};

export default Arrow;
