// 记录书本打开记录
const defaultShelf = {
  新建书架: null,
  工作学习: [],
  生活百科: [],
  休闲娱乐: []
};
class ShelfUtil {
  static setShelf(shelfTitle, bookKey) {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json) || defaultShelf;
    if (obj[shelfTitle] === undefined) {
      obj[shelfTitle] = [];
    }
    if (obj[shelfTitle].indexOf(bookKey) === -1) {
      obj[shelfTitle].unshift(bookKey);
    }
    // console.log(cfi, "dfhdafhdfh");
    localStorage.setItem("shelfList", JSON.stringify(obj));
  }

  static getShelf() {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json) || defaultShelf;

    return obj || null;
  }
  static clearShelf(shelfIndex, bookKey) {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json) || defaultShelf;
    let shelfTitle = Object.keys(obj);
    // console.log(shelfTitle, index, "shelfTitle");
    let currentShelfTitle = shelfTitle[shelfIndex + 1];
    let index = obj[currentShelfTitle].indexOf(bookKey);
    obj[currentShelfTitle].splice(index, 1);

    localStorage.setItem("shelfList", JSON.stringify(obj));
  }
  static deletefromAllShelf(bookKey) {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json) || defaultShelf;
    // let shelfValues = Object.values(obj);
    let shelfTitle = Object.keys(obj);
    shelfTitle.splice(0, 1);
    shelfTitle.forEach(item => {
      // console.log(obj[item], "item");
      let index = obj[item].indexOf(bookKey);
      if (index > -1) {
        obj[item].splice(index, 1);
      }
    });
    localStorage.setItem("shelfList", JSON.stringify(obj));
    // console.log(shelfValues);
    // shelfValues.forEach(item => {});
  }
  static removeShelf(shelfTitle) {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json) || defaultShelf;
    delete obj.shelfTitle;

    localStorage.setItem("shelfList", JSON.stringify(obj));
  }
}

export default ShelfUtil;
