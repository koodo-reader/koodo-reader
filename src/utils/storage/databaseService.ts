import { isElectron } from "react-device-detect";
import { getStorageLocation } from "../common";
import localforage from "localforage";
import SqlUtil from "../file/sqlUtil";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { LocalFileManager } from "../file/localFile";
declare var window: any;

class DatabaseService {
  static async getDbBuffer(dbName: string) {
    let sqlUtil = new SqlUtil();
    let records = await this.getAllRecords(dbName);
    return sqlUtil.JsonToDbBuffer(records, dbName);
  }

  static async getAllRecords(dbName: string) {
    if (isElectron) {
      let records = await window
        .electronAPI
        .invoke("database-command", {
          statement: "getAllStatement",
          statementType: "string",
          executeType: "all",
          dbName: dbName,
          storagePath: getStorageLocation(),
        });
      return records;
    } else {
      if (ConfigService.getItem("isUseLocal") === "yes") {
        let sqlUtil = new SqlUtil();
        let dbBuffer = await LocalFileManager.readFile(
          dbName + ".db",
          "config"
        );
        if (!dbBuffer) {
          return [];
        }
        let records = sqlUtil.dbBufferToJson(dbBuffer, dbName);
        return records;
      } else {
        const records = (await localforage.getItem(dbName)) || [];
        return records;
      }
    }
  }
  static async saveAllRecords(records: any[], dbName: string, isRecord = true) {
    if (isElectron) {
      for (let record of records) {
        try {
          await window
            .electronAPI
            .invoke("database-command", {
              statement: "saveStatement",
              statementType: "string",
              executeType: "run",
              dbName: dbName,
              data: record,
              storagePath: getStorageLocation(),
            });
        } catch (error) {
          console.error("Error saving record:", error);
        }

        if (isRecord) {
          ConfigService.setSyncRecord(
            {
              type: "database",
              catergory: "sqlite",
              name: dbName,
              key: record.key,
            },
            { operation: "save", time: Date.now() }
          );
        }
      }
    } else {
      if (ConfigService.getItem("isUseLocal") === "yes") {
        let sqlUtil = new SqlUtil();
        let dbBuffer = await sqlUtil.JsonToDbBuffer(records, dbName);
        await LocalFileManager.saveFile(dbName + ".db", dbBuffer, "config");
      } else {
        await localforage.setItem(dbName, records);
      }
      for (let record of records) {
        if (isRecord) {
          ConfigService.setSyncRecord(
            {
              type: "database",
              catergory: "sqlite",
              name: dbName,
              key: record.key,
            },
            { operation: "save", time: Date.now() }
          );
        }
      }
    }
  }
  static async deleteAllRecords(dbName: string, isRecord = true) {
    let records = await this.getAllRecords(dbName);
    for (let record of records) {
      if (isRecord) {
        ConfigService.setSyncRecord(
          {
            type: "database",
            catergory: "sqlite",
            name: dbName,
            key: record.key,
          },
          { operation: "delete", time: Date.now() }
        );
      }
    }
    if (isElectron) {
      await window.electronAPI.invoke("database-command", {
        statement: "deleteAllStatement",
        statementType: "string",
        executeType: "run",
        dbName: dbName,
        storagePath: getStorageLocation(),
      });
    } else {
      if (ConfigService.getItem("isUseLocal") === "yes") {
        await LocalFileManager.deleteFile(dbName + ".db", "config");
      } else {
        await localforage.removeItem(dbName);
      }
    }
  }
  static async saveRecord(record: any, dbName: string, isRecord = true) {
    if (isElectron) {
      await window.electronAPI.invoke("database-command", {
        statement: "saveStatement",
        statementType: "string",
        executeType: "run",
        dbName: dbName,
        data: record,
        storagePath: getStorageLocation(),
      });
    } else {
      let records = await this.getAllRecords(dbName);
      // Replace by key instead of appending: the old push() left TWO rows for
      // the same key whenever the sync pulled a row this device already had
      // (e.g. a renamed book), so the stale copy stayed visible next to the
      // new one. The Electron path goes through INSERT OR REPLACE in sqlite
      // and never had this problem - match it.
      const existingIndex = records.findIndex(
        (row: any) => row?.key === record.key
      );
      if (existingIndex > -1) {
        records[existingIndex] = record;
      } else {
        records.push(record);
      }
      // isRecord=false: write the table WITHOUT re-stamping every row.
      // saveAllRecords with isRecord=true marks EACH row save@Date.now(), so a
      // single-row write re-stamped the whole library's records - a sync does
      // many of them and then uploads the churned map, which is how a cloud
      // `delete` record for a row got overwritten by a fresh `save` and the
      // deleted book came back on every device. This method stamps its own
      // single record below.
      await this.saveAllRecords(records, dbName, false);
    }
    if (isRecord) {
      ConfigService.setSyncRecord(
        {
          type: "database",
          catergory: "sqlite",
          name: dbName,
          key: record.key,
        },
        { operation: "save", time: Date.now() }
      );
    }
  }
  static async deleteRecord(key: string, dbName: string, isRecord = true) {
    if (isElectron) {
      await window.electronAPI.invoke("database-command", {
        statement: "deleteStatement",
        statementType: "string",
        executeType: "run",
        dbName: dbName,
        data: key,
        storagePath: getStorageLocation(),
      });
    } else {
      let records = await this.getAllRecords(dbName);
      records = records.filter((b) => b.key !== key);
      if (records.length === 0) {
        await this.deleteAllRecords(dbName);
      } else {
        // isRecord=false: only the deleted key gets a record (stamped below);
        // re-stamping the remaining rows here would churn every other book's
        // record time on each delete (see saveRecord for the full story).
        await this.saveAllRecords(records, dbName, false);
      }
    }
    if (isRecord) {
      ConfigService.setSyncRecord(
        { type: "database", catergory: "sqlite", name: dbName, key: key },
        { operation: "delete", time: Date.now() }
      );
    }
  }
  static async updateRecord(record: any, dbName: string, isRecord = true) {
    if (isElectron) {
      await window.electronAPI.invoke("database-command", {
        statement: "updateStatement",
        statementType: "string",
        executeType: "run",
        dbName: dbName,
        data: record,
        storagePath: getStorageLocation(),
      });
    } else {
      let records = await this.getAllRecords(dbName);
      records = records.map((b) => {
        if (b.key === record.key) {
          return record;
        }
        return b;
      });
      // isRecord=false: only the updated key gets a record (stamped below) -
      // see saveRecord for why re-stamping every row here is dangerous.
      await this.saveAllRecords(records, dbName, false);
    }
    if (isRecord) {
      ConfigService.setSyncRecord(
        {
          type: "database",
          catergory: "sqlite",
          name: dbName,
          key: record.key,
        },
        { operation: "update", time: Date.now() }
      );
    }
  }
  static async getRecord(key: string, dbName: string): Promise<any | null> {
    if (isElectron) {
      let record = await window
        .electronAPI
        .invoke("database-command", {
          statement: "getStatement",
          statementType: "string",
          executeType: "get",
          dbName: dbName,
          data: key,
          storagePath: getStorageLocation(),
        });
      return record;
    } else {
      let records = await this.getAllRecords(dbName);
      for (let record of records) {
        if (record.key === key) {
          return record;
        }
      }
      return null;
    }
  }
  static async getAllRecordKeys(dbName: string): Promise<string[]> {
    if (isElectron) {
      let keys = await window
        .electronAPI
        .invoke("database-command", {
          statement: "getKeysStatement",
          statementType: "string",
          executeType: "all",
          dbName: dbName,
          storagePath: getStorageLocation(),
        });
      return keys.map((k: any) => k.key);
    } else {
      let records = await this.getAllRecords(dbName);
      return records.map((record) => record.key);
    }
  }
  static async getRecordsByBookKey(
    bookKey: string,
    dbName: string
  ): Promise<any[]> {
    if (isElectron) {
      let records = await window
        .electronAPI
        .invoke("database-command", {
          statement: "getByBookKeyStatement",
          statementType: "string",
          executeType: "all",
          dbName: dbName,
          data: bookKey,
          storagePath: getStorageLocation(),
        });
      return records;
    } else {
      let records = await this.getAllRecords(dbName);
      return records.filter((record) => record.bookKey === bookKey);
    }
  }
  static async getRecordsByBookKeys(
    bookKeys: string[],
    dbName: string
  ): Promise<any[]> {
    if (isElectron) {
      let records = await window
        .electronAPI
        .invoke("database-command", {
          statement: "getByBookKeysStatement",
          statementType: "function",
          executeType: "all",
          dbName: dbName,
          data: bookKeys,
          storagePath: getStorageLocation(),
        });
      return records;
    } else {
      let records = await this.getAllRecords(dbName);
      return records.filter((record) => bookKeys.includes(record.bookKey));
    }
  }
  static async getRecordsByKeys(
    keys: string[],
    dbName: string
  ): Promise<any[]> {
    if (isElectron) {
      let records = await window
        .electronAPI
        .invoke("database-command", {
          statement: "getByKeysStatement",
          statementType: "function",
          executeType: "all",
          dbName: dbName,
          data: keys,
          storagePath: getStorageLocation(),
        });
      return records;
    } else {
      let records = await this.getAllRecords(dbName);
      return records.filter((record) => keys.includes(record.key));
    }
  }
  static async updateAllRecords(
    records: any[],
    dbName: string,
    isRecord = true
  ) {
    if (isElectron) {
      for (let record of records) {
        try {
          await window
            .electronAPI
            .invoke("database-command", {
              statement: "updateStatement",
              statementType: "string",
              executeType: "run",
              dbName: dbName,
              data: record,
              storagePath: getStorageLocation(),
            });
        } catch (error) {
          console.error("Error updating record:", error);
        }

        if (isRecord) {
          ConfigService.setSyncRecord(
            {
              type: "database",
              catergory: "sqlite",
              name: dbName,
              key: record.key,
            },
            { operation: "update", time: Date.now() }
          );
        }
      }
    } else {
      // isRecord=false: the loop after this branch already stamps each updated
      // record as `update`. Letting saveAllRecords keep its default true would
      // ALSO mark every row passed in as save@Date.now(), so one update of a
      // few rows re-stamped them all as saves and churned the sync map (same
      // bug class as saveRecord/deleteRecord/updateRecord - see saveRecord).
      await this.saveAllRecords(records, dbName, false);
    }
    for (let record of records) {
      if (isRecord) {
        ConfigService.setSyncRecord(
          {
            type: "database",
            catergory: "sqlite",
            name: dbName,
            key: record.key,
          },
          { operation: "update", time: Date.now() }
        );
      }
    }
  }
  static async deleteRecordsByBookKey(bookKey: string, dbName: string) {
    let records = await this.getRecordsByBookKey(bookKey, dbName);
    for (let record of records) {
      ConfigService.setSyncRecord(
        {
          type: "database",
          catergory: "sqlite",
          name: dbName,
          key: record.key,
        },
        { operation: "delete", time: Date.now() }
      );
    }
    if (isElectron) {
      await window.electronAPI.invoke("database-command", {
        statement: "deleteByBookKeyStatement",
        statementType: "string",
        executeType: "run",
        dbName: dbName,
        data: bookKey,
        storagePath: getStorageLocation(),
      });
    } else {
      let records = await this.getAllRecords(dbName);
      records = records.filter((b) => b.bookKey !== bookKey);
      if (records.length === 0) {
        // every row belonged to this bookKey and is already delete-stamped above
        await this.deleteAllRecords(dbName, false);
      } else {
        // isRecord=false: this method already stamped `delete` for every record
        // of bookKey above. saveAllRecords with its default true re-stamps EVERY
        // REMAINING row save@Date.now(), so deleting one book's notes/bookmarks
        // churned the whole table's records and could overwrite a cloud `delete`
        // record with a fresh `save` - the same defect as saveRecord above.
        await this.saveAllRecords(records, dbName, false);
      }
    }
  }
  static async dumpDatabase(_dbName: string) {
    return;
  }
}

export default DatabaseService;
