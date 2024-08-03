const fs = require("fs");
const path = require("path");
const data = fs.readFileSync(path.join(__dirname, "./poeditor.json"), "utf-8");
const langList = JSON.parse(data);
// let langList = {
//   ar: "Arabic",
// };
const runScript = async () => {
  for (let index = 0; index < Object.keys(langList).length; index++) {
    try {
      const code = Object.keys(langList)[index];
      const axios = require("axios");
      const qs = require("qs");
      let data = qs.stringify({
        api_token: "",
        id: "504405",
        language: code,
        type: "json",
        filters: "translated",
      });

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://api.poeditor.com/v2/projects/export",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: data,
      };

      let res = await axios.request(config);
      let downloadUrl = res.data.result.url;
      console.log(downloadUrl);
      const response = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(
        path.join(__dirname, "./poeditor/test.json"),
        response.data
      );
      const transList = JSON.parse(
        fs.readFileSync(path.join(__dirname, "./poeditor/test.json"), "utf-8")
      );
      let translation = {};
      // console.log(transList.length, transList[0]);
      for (let index = 0; index < transList.length; index++) {
        const element = transList[index];
        translation[element.term] = element.definition;
      }
      // console.log(translation);
      if (fs.existsSync(path.join(__dirname, "./assets/locales/" + code))) {
        console.log("folder exist");
      } else {
        console.log("folder not exist");
        fs.mkdirSync(path.join(__dirname, "./poeditor/" + code));
        fs.writeFileSync(
          path.join(__dirname, "./poeditor/" + code + "/translation.json"),
          JSON.stringify(translation, null, 2)
        );
      }
    } catch (error) {
      console.error("Error reading JSON file:", error);
    }
  }
};
runScript();
