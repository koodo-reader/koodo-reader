const path = require("path");

module.exports = {
  target: "electron-main",
  entry: "./main.ts",
  output: {
    path: path.resolve(__dirname, "./build"),
    filename: "main.ts",
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx"],
  },
  node: {
    __dirname: false,
  },
};
