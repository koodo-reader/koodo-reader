class StorageUtil {
  static getReaderConfig(key: string) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    return readerConfig[key];
  }

  static setReaderConfig(key: string, value: string) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    readerConfig[key] = value;
    localStorage.setItem("readerConfig", JSON.stringify(readerConfig));
  }
  static getKookitConfig(key: string) {
    let kookitConfig = JSON.parse(localStorage.getItem("kookitConfig")!) || {};
    return kookitConfig[key];
  }

  static setKookitConfig(key: string, value: string) {
    let kookitConfig = JSON.parse(localStorage.getItem("kookitConfig")!) || {};
    kookitConfig[key] = value;
    localStorage.setItem("kookitConfig", JSON.stringify(kookitConfig));
  }
}

export default StorageUtil;
