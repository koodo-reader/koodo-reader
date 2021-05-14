const path = require("path");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");

module.exports = {
  target: "electron-main",
  entry: "./main.js",
  output: {
    path: path.resolve(__dirname, "./build"),
    filename: "main.js",
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx"],
  },
  node: {
    __dirname: false,
  },
  plugins: [new HardSourceWebpackPlugin()],
};
