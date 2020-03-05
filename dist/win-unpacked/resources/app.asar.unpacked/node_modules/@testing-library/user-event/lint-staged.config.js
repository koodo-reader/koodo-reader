const micromatch = require("micromatch");

const IGNORE = [
  "**/package.json",
  "**/package-lock.json",
  "**/node_modules/**",
  "**/dist/**"
];

module.exports = {
  "**/*.{js,json}": files => {
    const match = micromatch.not(files, IGNORE);
    return match.map(filename => `prettier --write '${filename}'`);
  },
  "**/*.md": files => {
    const match = micromatch.not(files, IGNORE);
    return match.map(
      filename => `prettier --write --parser markdown '${filename}'`
    );
  }
};
