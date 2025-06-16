

//list the folders in ./assets/locales
const fs = require("fs");
const path = require("path");
const localesPath = path.join(__dirname, "./assets/locales");
const folders = fs.readdirSync(localesPath);
let resources = [];
for (let index = 0; index < folders.length; index++) {
  const folder = folders[index];
  resources.push(`./assets/locales/${folder}/translation.json`);
}
console.log(resources);

// // find the missing terms in the english
// const zhdataRaw = fs.readFileSync(
//   path.join(__dirname, "./assets/locales/zh-CN/translation.json"),
//   "utf-8"
// );
// const enDataRaw = fs.readFileSync(path.join(__dirname, "./assets/locales/en/translation.json"),
//   "utf-8"
// );
// //find the missing terms in the target language
// const zhData = JSON.parse(zhdataRaw);
// const enData = JSON.parse(enDataRaw);
// let missingTerms = {};
// for (let index = 0; index < Object.keys(zhData).length; index++) {
//   const term = Object.keys(zhData)[index];
//   if (Object.keys(enData).indexOf(term) === -1) {
//     console.log(zhData[term]);
//     missingTerms[term] = term;
//   }
// }
// console.log(JSON.stringify(missingTerms));
// console.log(Object.keys(zhData).length, Object.keys(enData).length);


// fill out the rest of the terms in the target language
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
