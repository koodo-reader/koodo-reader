/**
 * Cross-platform replacement for the sed command in postinstall.
 * Patches nan.h to comment out the #include nan_scriptorigin.h line.
 */
const fs = require("fs");
const path = require("path");

const nanHPath = path.join(__dirname, "..", "node_modules", "nan", "nan.h");

if (!fs.existsSync(nanHPath)) {
  console.info("nan.h not found, skipping patch.");
  process.exit(0);
}

let content = fs.readFileSync(nanHPath, "utf8");
const patched = content.replace(
  /^#include [<"]nan_scriptorigin\.h[>"]/m,
  "// #include nan_scriptorigin.h"
);

if (content === patched) {
  console.info("nan.h already patched or pattern not found, skipping.");
} else {
  fs.writeFileSync(nanHPath, patched, "utf8");
  console.info("nan.h patched successfully.");
}
