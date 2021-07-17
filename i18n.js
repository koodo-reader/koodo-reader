const translationEN = require("./src/assets/locales/en/translation.json");
const translationCN = require("./src/assets/locales/cn/translation.json");
const translationRU = require("./src/assets/locales/ru/translation.json");
const translationTW = require("./src/assets/locales/tw/translation.json");

console.log(typeof translationCN);

for (let item in translationCN) {
  if (!translationEN[item]) {
    translationEN[item] = item;
  }
  if (!translationRU[item]) {
    translationRU[item] = item;
  }
  if (!translationTW[item]) {
    translationTW[item] = translationCN[item];
  }
}
let dataEN = JSON.stringify(translationEN, null, 2);
let dataRU = JSON.stringify(translationRU, null, 2);
let dataTW = JSON.stringify(translationTW, null, 2);
const fs = require("fs");
fs.writeFile("./src/assets/locales/en/translation.json", dataEN, (err) => {
  if (err) throw err;
  fs.writeFile("./src/assets/locales/ru/translation.json", dataRU, (err) => {
    if (err) throw err;
    fs.writeFile("./src/assets/locales/tw/translation.json", dataTW, (err) => {
      if (err) throw err;
      console.log("Data written to file");
    });
  });
});

console.log("This is after the write call");
