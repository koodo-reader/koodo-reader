class ConfigService {
  static getReaderConfig(key: string) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    return readerConfig[key];
  }

  static setReaderConfig(key: string, value: string, isRecord = true) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    readerConfig[key] = value;
    localStorage.setItem("readerConfig", JSON.stringify(readerConfig));
    if (isRecord) {
      console.log(key, "sadfs2342df");
      ConfigService.setSyncRecord(
        {
          type: "config",
          catergory: "readerConfig",
          name: "mobile",
          key: key,
        },
        {
          operation: "update",
          time: Date.now(),
        }
      );
    }
  }

  static getAllListConfig(key: string) {
    let itemArr =
      localStorage.getItem(key) !== "{}" && localStorage.getItem(key)
        ? JSON.parse(localStorage.getItem(key) || "")
        : [];
    return itemArr || [];
  }
  static deleteListConfig(itemName: string, key: string) {
    let itemArr = this.getAllListConfig(key);
    const index = itemArr.indexOf(itemName);
    if (index > -1) {
      itemArr.splice(index, 1);
    }
    this.setAllListConfig(itemArr, key);
  }
  static setListConfig(itemName: string, key: string) {
    let itemArr = this.getAllListConfig(key);
    const index = itemArr.indexOf(itemName);
    if (index > -1) {
      itemArr.splice(index, 1);
      itemArr.unshift(itemName);
    } else {
      itemArr.unshift(itemName);
    }

    this.setAllListConfig(itemArr, key);
  }
  static setAllListConfig(itemArr: string[], key: string, isRecord = true) {
    localStorage.setItem(key, JSON.stringify(itemArr));
    if (isRecord) {
      ConfigService.setSyncRecord(
        {
          type: "config",
          catergory: "listConfig",
          name: "general",
          key: key,
        },
        {
          operation: "update",
          time: Date.now(),
        }
      );
    }
  }

  static setObjectConfig(
    itemName: string,
    item: any,
    key: string,
    isRecord = true
  ) {
    let obj = this.getAllObjectConfig(key);
    obj[itemName] = item;
    if (isRecord) {
      ConfigService.setSyncRecord(
        {
          type: "config",
          catergory: "objectConfig",
          name: key,
          key: itemName,
        },
        {
          operation: "update",
          time: Date.now(),
        }
      );
    }
    this.setAllObjectConfig(obj, key);
  }

  static getObjectConfig(itemName: string, key: string, defaultValue: any) {
    let obj = this.getAllObjectConfig(key);
    return obj[itemName] || defaultValue;
  }
  static getAllObjectConfig(key: string) {
    let json = localStorage.getItem(key);
    let obj = JSON.parse(json!) || {};
    return obj;
  }
  static setAllObjectConfig(obj: any, key: string) {
    localStorage.setItem(key, JSON.stringify(obj));
  }
  static deleteObjectConfig(itemName: string, key: string) {
    let obj = this.getAllObjectConfig(key);
    delete obj[itemName];
    ConfigService.setSyncRecord(
      {
        type: "config",
        catergory: "objectConfig",
        name: key,
        key: itemName,
      },
      {
        operation: "delete",
        time: Date.now(),
      }
    );
    this.setAllObjectConfig(obj, key);
  }
  static getAllMapConfig(key: string) {
    let json = localStorage.getItem(key);
    let obj = JSON.parse(json!) || {};
    return obj;
  }
  static getMapConfig(objectName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    return obj[objectName] || [];
  }
  static setAllMapConfig(obj: any, key: string) {
    localStorage.setItem(key, JSON.stringify(obj));
  }
  static setMapConfig(objectName: string, itemName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    if (obj[objectName] === undefined) {
      obj[objectName] = [];
    }
    if (itemName && obj[objectName].indexOf(itemName) === -1) {
      obj[objectName].unshift(itemName);
    }
    ConfigService.setSyncRecord(
      {
        type: "config",
        catergory: "mapConfig",
        name: key,
        key: objectName,
      },
      {
        operation: "update",
        time: Date.now(),
      }
    );
    this.setAllMapConfig(obj, key);
  }
  static setOneMapConfig(
    objectName: string,
    itemArr: string[],
    key: string,
    isRecord = true
  ) {
    console.log(objectName, itemArr, key, "sad68568fsdf");
    let obj = this.getAllMapConfig(key);
    obj[objectName] = itemArr;
    console.log(obj, key, "sadfsds254f");
    if (isRecord) {
      ConfigService.setSyncRecord(
        {
          type: "config",
          catergory: "mapConfig",
          name: key,
          key: objectName,
        },
        {
          operation: "update",
          time: Date.now(),
        }
      );
    }
    console.log(obj, key, "sadfsdf");
    this.setAllMapConfig(obj, key);
  }
  static deleteFromMapConfig(
    objectName: string,
    itemName: string,
    key: string
  ) {
    let obj = this.getAllMapConfig(key);
    let index = obj[objectName].indexOf(itemName);
    obj[objectName].splice(index, 1);
    ConfigService.setSyncRecord(
      {
        type: "config",
        catergory: "mapConfig",
        name: key,
        key: objectName,
      },
      {
        operation: "update",
        time: Date.now(),
      }
    );
    this.setAllMapConfig(obj, key);
  }
  static deleteFromAllMapConfig(itemName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    let objectNameList = Object.keys(obj);
    objectNameList.forEach((item) => {
      let index = obj[item].indexOf(itemName);
      if (index > -1) {
        obj[item].splice(index, 1);
        ConfigService.setSyncRecord(
          {
            type: "config",
            catergory: "mapConfig",
            name: key,
            key: item,
          },
          {
            operation: "update",
            time: Date.now(),
          }
        );
      }
    });
    this.setAllMapConfig(obj, key);
  }
  static deleteMapConfig(objectName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    delete obj[objectName];
    ConfigService.setSyncRecord(
      {
        type: "config",
        catergory: "mapConfig",
        name: key,
        key: objectName,
      },
      {
        operation: "delete",
        time: Date.now(),
      }
    );
    this.setAllMapConfig(obj, key);
  }
  static getFromAllMapConfig(itemName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    let objectNameList: string[] = [];
    for (let item in obj) {
      if (obj[item] && obj[item].indexOf(itemName) > -1) {
        objectNameList.push(item);
      }
    }
    return objectNameList;
  }
  static getSyncRecord(syncId: {
    type: string;
    catergory: string;
    name: string;
    key: string;
  }) {
    let syncRecord = JSON.parse(localStorage.getItem("syncRecord") || "{}");
    return (
      syncRecord[
        syncId.type +
          "." +
          syncId.catergory +
          "." +
          syncId.name +
          "." +
          syncId.key
      ] || { operation: "", time: 0 }
    );
  }
  static getAllSyncRecord() {
    let syncRecord = JSON.parse(localStorage.getItem("syncRecord") || "{}");
    return syncRecord;
  }

  static setSyncRecord(
    syncId: {
      type: string;
      catergory: string;
      name: string;
      key: string;
    },
    record: {
      operation: string;
      time: number;
    }
  ) {
    let syncRecord = JSON.parse(localStorage.getItem("syncRecord") || "{}");
    syncRecord[
      syncId.type +
        "." +
        syncId.catergory +
        "." +
        syncId.name +
        "." +
        syncId.key
    ] = record;
    localStorage.setItem("syncRecord", JSON.stringify(syncRecord));
  }

  static setAllSyncRecord(syncRecord: any) {
    localStorage.setItem("syncRecord", JSON.stringify(syncRecord));
  }
}

export default ConfigService;
