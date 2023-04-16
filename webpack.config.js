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
    extensions: [".ts", "*", ".mjs", ".js", ".json", ".tsx"],
  },
  node: {
    __dirname: false,
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
      },
    ],
  },
  plugins: [new HardSourceWebpackPlugin()],
};
