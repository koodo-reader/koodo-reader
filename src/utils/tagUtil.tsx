class TagUtil {
  static setTags(tagName: string) {
    let tagArr =
      localStorage.getItem("noteTags") !== "{}" &&
      localStorage.getItem("noteTags")
        ? JSON.parse(localStorage.getItem("noteTags") || "")
        : [];
    const index = tagArr.indexOf(tagName);
    if (index > -1) {
      tagArr.splice(index, 1);
      tagArr.unshift(tagName);
    } else {
      tagArr.unshift(tagName);
    }

    localStorage.setItem("noteTags", JSON.stringify(tagArr));
  }

  static clear(tagName: string) {
    let tagArr =
      localStorage.getItem("noteTags") !== "{}" &&
      localStorage.getItem("noteTags")
        ? JSON.parse(localStorage.getItem("noteTags") || "")
        : [];
    const index = tagArr.indexOf(tagName);
    if (index > -1) {
      tagArr.splice(index, 1);
    }
    localStorage.setItem("noteTags", JSON.stringify(tagArr));
  }
  static getAllTags() {
    let tagArr =
      localStorage.getItem("noteTags") !== "{}" &&
      localStorage.getItem("noteTags")
        ? JSON.parse(localStorage.getItem("noteTags") || "")
        : [];
    return tagArr || [];
  }
}

export default TagUtil;
