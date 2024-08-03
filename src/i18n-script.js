// the translations
const resources = [
  "./assets/locales/ar/translation.json",
  "./assets/locales/bg/translation.json",
  "./assets/locales/bn/translation.json",
  "./assets/locales/bo/translation.json",
  "./assets/locales/cs/translation.json",
  "./assets/locales/da/translation.json",
  "./assets/locales/de/translation.json",
  "./assets/locales/el/translation.json",
  "./assets/locales/en/translation.json",
  "./assets/locales/eo/translation.json",
  "./assets/locales/es/translation.json",
  "./assets/locales/fa/translation.json",
  "./assets/locales/fi/translation.json",
  "./assets/locales/fr/translation.json",
  "./assets/locales/hi/translation.json",
  "./assets/locales/hu/translation.json",
  "./assets/locales/hy/translation.json",
  "./assets/locales/hu/translation.json",
  "./assets/locales/id/translation.json",
  "./assets/locales/ie/translation.json",
  "./assets/locales/it/translation.json",
  "./assets/locales/ja/translation.json",
  "./assets/locales/ko/translation.json",
  "./assets/locales/nl/translation.json",
  "./assets/locales/pl/translation.json",
  "./assets/locales/pt/translation.json",
  "./assets/locales/pt-BR/translation.json",
  "./assets/locales/ro/translation.json",
  "./assets/locales/ru/translation.json",
  "./assets/locales/sl/translation.json",
  "./assets/locales/sv/translation.json",
  "./assets/locales/ta/translation.json",
  "./assets/locales/th/translation.json",
  "./assets/locales/tr/translation.json",
  "./assets/locales/uk/translation.json",
  "./assets/locales/vi/translation.json",
  "./assets/locales/zh-CN/translation.json",
  "./assets/locales/zh-TW/translation.json",
  "./assets/locales/zh-MO/translation.json",
];
const fs = require("fs");
const path = require("path");
const data = fs.readFileSync(
  path.join(__dirname, "./assets/locales/en/translation.json"),
  "utf-8"
);
const referData = JSON.parse(data);
for (let index = 0; index < resources.length; index++) {
  try {
    const resource = resources[index];
    console.log(path.join(__dirname, resource));
    const data = fs.readFileSync(path.join(__dirname, resource), "utf-8");
    const targetData = JSON.parse(data);
    let missingTerms = {};
    for (let index = 0; index < Object.keys(referData).length; index++) {
      const term = Object.keys(referData)[index];
      if (Object.keys(targetData).indexOf(term) === -1) {
        console.log(referData[term]);
        missingTerms[term] = referData[term];
      }
    }
    // console.log(missingTerms);
    const mergedObj = Object.assign({}, targetData, missingTerms);

    fs.writeFileSync(
      path.join(__dirname, resource),
      JSON.stringify(mergedObj, null, 2)
    );
  } catch (error) {
    console.error("Error reading JSON file:", error);
  }
}
