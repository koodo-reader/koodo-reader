const fs = require("fs");
const path = require("path");

const translatedDir = path.join(__dirname, "../translated");
const localesDir = path.join(__dirname, "../src/assets", "locales");

const files = fs.readdirSync(translatedDir).filter((f) => f.endsWith(".json"));

let totalMerged = 0;

for (const file of files) {
  const translatedPath = path.join(translatedDir, file);
  const localesPath = path.join(localesDir, file);

  if (!fs.existsSync(localesPath)) {
    console.warn(`⚠️  Skipped: ${file} (not found in locales)`);
    continue;
  }

  const translated = JSON.parse(fs.readFileSync(translatedPath, "utf-8"));
  const locales = JSON.parse(fs.readFileSync(localesPath, "utf-8"));

  const mergedCount = Object.keys(translated).length;
  const merged = { ...locales, ...translated };

  fs.writeFileSync(localesPath, JSON.stringify(merged, null, 2), "utf-8");

  totalMerged += mergedCount;
  console.info(`✅ ${file}: merged ${mergedCount} entries`);
}

console.info(`\nDone. Total entries merged: ${totalMerged}`);
