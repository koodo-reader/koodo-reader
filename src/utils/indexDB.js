// 数据库访问的工具类
// TODO 使用相应的IndexedDB库以提高查询效率
class IndexDB {
  constructor(dbName, storeName, version = 1) {
    if (!window.indexedDB) {
      console.error(
        "Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available."
      );
      return {};
    }

    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
    this.db = null;

    let request = indexedDB.open(dbName, version);
    request.onsuccess = e => {
      this.db = e.target.result;
    };
    request.onerror = e => {
      console.error(
        "Something bad happened while trying to open:" + e.target.errorCode
      );
    };
    request.onupgradeneeded = e => {
      this.db = e.target.result;
      if (!this.db.objectStoreNames.contains(storeName)) {
        // 存入数据库的所有对象都必须拥有唯一的 key 属性作为键
        this.db.createObjectStore(storeName, { keyPath: "key" });
      } else {
        console.log("DB version changed, db version: ", this.db.version);
      }
    };
  }

  open(success, error) {
    let req = indexedDB.open(this.dbName);
    req.onsuccess = e => {
      console.log(`open database ${this.dbName} successfully`);
      this.db = e.target.result;
      success && success();
    };
    req.onerror = () => {
      console.error(`Can't open database ${this.dbName}`);
      error && error();
    };
  }

  add(value, success, error) {
    const t = this.db.transaction(this.storeName, "readwrite");
    const store = t.objectStore(this.storeName);
    let req = store.add(value);
    req.onsuccess = e => {
      success && success(e.target.result);
      console.log(
        `add data to database ${this.dbName} -> ${this.storeName} successfully`
      );
    };
    req.onerror = () => {
      console.error(
        `Can't add data to database ${this.dbName} -> ${this.storeName}`
      );
      error && error();
    };
  }

  remove(key, success, error) {
    const t = this.db.transaction(this.storeName, "readwrite");
    const store = t.objectStore(this.storeName);
    let req = store.delete(key);
    req.onsuccess = e => {
      console.log(
        `remove data with key ${key} from database ${this.dbName} -> ${this.storeName} successfully`
      );
      success && success(e.target.result);
    };
    req.onerror = () => {
      console.error(
        `Can't remove data with key ${key} from database ${this.dbName} -> ${this.storeName}`
      );
      error && error();
    };
  }

  get(key, success, error) {
    const t = this.db.transaction(this.storeName, "readonly");
    const store = t.objectStore(this.storeName);
    let req = store.get(key);
    req.onsuccess = e => {
      console.log(
        `get data from database ${this.dbName} -> ${this.storeName} successfully`
      );
      success && success(e.target.result);
    };
    req.onerror = () => {
      console.error(
        `Can't get data with key ${key} from ${this.dbName} -> ${this.storeName}`
      );
      error && error();
    };
  }

  getAll(success, error) {
    const t = this.db.transaction(this.storeName, "readonly");
    const store = t.objectStore(this.storeName);
    let req = store.openCursor();
    let result = [];
    req.onsuccess = e => {
      let cursor = e.target.result;
      if (cursor) {
        result.push(cursor.value);
        cursor.continue();
      } else {
        console.log(
          `get all data from database ${this.dbName} -> ${this.storeName} successfully`
        );
        console.log(this);
        success(result);
      }
    };
    req.onerror = () => {
      console.error(
        `Can't get data from database ${this.dbName} -> ${this.storeName}`
      );
      error && error();
    };
  }

  update(value, success, error) {
    const t = this.db.transaction(this.storeName, "readwrite");
    const store = t.objectStore(this.storeName);
    let req = store.put(value);
    req.onsuccess = e => {
      console.log(`update data successfully`);
      success && success(e.target.result);
    };
    req.onerror = () => {
      console.error(`Can't update data`);
      error && error();
    };
  }

  close() {
    this.db.close();
  }
}

export default IndexDB;
