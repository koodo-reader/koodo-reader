class ThemeUtil {
  static setThemes(themeName: string) {
    let themeArr =
      localStorage.getItem("themeColors") !== "{}" &&
      localStorage.getItem("themeColors")
        ? JSON.parse(localStorage.getItem("themeColors") || "")
        : [];
    const index = themeArr.indexOf(themeName);
    if (index > -1) {
      themeArr.splice(index, 1);
      themeArr.unshift(themeName);
    } else {
      themeArr.unshift(themeName);
    }

    localStorage.setItem("themeColors", JSON.stringify(themeArr));
  }

  static clear(themeName: string) {
    let themeArr =
      localStorage.getItem("themeColors") !== "{}" &&
      localStorage.getItem("themeColors")
        ? JSON.parse(localStorage.getItem("themeColors") || "")
        : [];
    const index = themeArr.indexOf(themeName);
    if (index > -1) {
      themeArr.splice(index, 1);
    }
    localStorage.setItem("themeColors", JSON.stringify(themeArr));
  }
  static getAllThemes() {
    let themeArr =
      localStorage.getItem("themeColors") !== "{}" &&
      localStorage.getItem("themeColors")
        ? JSON.parse(localStorage.getItem("themeColors") || "")
        : [];
    return themeArr || [];
  }
}

export default ThemeUtil;
