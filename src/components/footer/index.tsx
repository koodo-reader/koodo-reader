import React from "react";

const isCNSite = window.location.hostname === "web.koodoreader.cn";

const Footer = () => {
  if (!isCNSite) return null;

  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px 0",
        fontSize: "12px",
        color: "#999",
        position: "fixed",
        bottom: 0,
        width: "100%",
        backgroundColor: "#fff",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#999", textDecoration: "none" }}
        >
          赣ICP备2025064160号-1
        </a>
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=36082902000244"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#999",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          赣公网安备36082902000244号
        </a>
      </div>
    </div>
  );
};

export default Footer;
