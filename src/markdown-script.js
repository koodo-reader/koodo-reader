const fs = require("fs");
const path = require("path");
const data = fs.readFileSync(path.join(__dirname, "./poeditor.json"), "utf-8");
const langList = JSON.parse(data);
// let langList = {
//   ar: "Arabic",
// };
const newLangList = [];
const resList = [];
const runScript = async () => {
  for (let index = 0; index < Object.keys(langList).length; index++) {
    try {
      const code = Object.keys(langList)[index];
      if (fs.existsSync(path.join(__dirname, "./assets/locales/" + code))) {
        console.log("folder exist");
        newLangList.push({
          Language: langList[code],
          Code: code,
          View: "[View](./src/assets/locales/" + code + "/translation.json)",
        });
        resList.push("./assets/locales/" + code + "/translation.json");
      } else {
        console.log("folder not exist");
      }
    } catch (error) {
      console.error("Error reading JSON file:", error);
    }
  }
  // console.log(resList);
  console.log(newLangList);
};
runScript();
