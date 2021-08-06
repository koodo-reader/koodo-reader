const defaultShelf = {
  New: null,
  Study: [],
  Work: [],
  Entertainment: [],
};
class ShelfUtil {
  static setShelf(shelfTitle: string, bookKey: string) {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json!) || defaultShelf;
    if (obj[shelfTitle] === undefined) {
      obj[shelfTitle] = [];
    }
    if (obj[shelfTitle].indexOf(bookKey) === -1) {
      obj[shelfTitle].unshift(bookKey);
    }
    localStorage.setItem("shelfList", JSON.stringify(obj));
  }

  static getShelf() {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json!) || defaultShelf;
    return obj;
  }
  static clearShelf(shelfIndex: number, bookKey: string) {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json!) || defaultShelf;
    let shelfTitle = Object.keys(obj);
    let currentShelfTitle = shelfTitle[shelfIndex];
    let index = obj[currentShelfTitle].indexOf(bookKey);
    obj[currentShelfTitle].splice(index, 1);
    localStorage.setItem("shelfList", JSON.stringify(obj));
  }
  static deletefromAllShelf(bookKey: string) {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json!) || defaultShelf;
    let shelfTitle = Object.keys(obj);
    shelfTitle.splice(0, 1);
    shelfTitle.forEach((item) => {
      let index = obj[item].indexOf(bookKey);
      if (index > -1) {
        obj[item].splice(index, 1);
      }
    });
    localStorage.setItem("shelfList", JSON.stringify(obj));
  }
  static removeShelf(shelfTitle: string) {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json!) || defaultShelf;
    delete obj[shelfTitle];
    localStorage.setItem("shelfList", JSON.stringify(obj));
  }
  static getBookPosition(bookKey: string) {
    let json = localStorage.getItem("shelfList");
    let obj = JSON.parse(json!) || defaultShelf;
    let shelfList: string[] = [];
    for (let item in obj) {
      if (obj[item] && obj[item].indexOf(bookKey) > -1) {
        shelfList.push(item);
      }
    }
    return shelfList;
  }
}

export default ShelfUtil;
