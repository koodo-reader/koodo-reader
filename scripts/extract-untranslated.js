#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * 提取每个语言文件中value和en.json中同一个键的value相同的词条，
 * 并将结果输出到 untranslated/ 目录下的对应文件中。
 */

const fs = require("fs");
const path = require("path");

function loadJson(filepath) {
  const content = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(content);
}

function saveJson(filepath, data) {
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filepath, content, "utf-8");
}

function extractUntranslated() {
  const localesDir = "../src/assets/locales";
  const outputDir = "../untranslated";

  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 加载 en.json 作为参考
  const enFilepath = path.join(localesDir, "en.json");
  const enData = loadJson(enFilepath);

  // 获取所有符合条件的语言文件
  const langFiles = fs
    .readdirSync(localesDir)
    .filter(
      (f) => f.endsWith(".json") && f !== "en.json" && !f.startsWith("index")
    )
    .sort();

  console.info(`${"文件".padEnd(15)} ${"未翻译条目数".padStart(10)}`);
  console.info("-".repeat(30));

  for (const langFile of langFiles) {
    const filepath = path.join(localesDir, langFile);
    const data = loadJson(filepath);

    // 提取value与en.json中同一键的value相同的条目
    const untranslated = Object.fromEntries(
      Object.entries(data).filter(([k, v]) => enData[k] === v)
    );

    const outPath = path.join(outputDir, langFile);
    saveJson(outPath, untranslated);

    const count = Object.keys(untranslated).length;
    console.info(
      `${langFile.padEnd(15)} ${String(count).padStart(10)} 条  ->  ${outPath}`
    );
  }
  console.info(`提取完成！结果已保存到 ${outputDir}/ 目录。`);
}

extractUntranslated();
