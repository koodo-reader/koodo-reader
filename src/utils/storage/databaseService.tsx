import { isElectron } from "react-device-detect";
import { getStorageLocation } from "../common";
import SqlUtil from "../file/sqlUtil";
import localforage from "localforage";
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
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getAllStatement",
          statementType: "string",
          executeType: "all",
          dbName: dbName,
          storagePath: getStorageLocation(),
        });
      return records;
    } else {
      const records = (await localforage.getItem(dbName)) || [];
      return records;
    }
  }
  static async saveAllRecords(records: any[], dbName: string) {
    if (isElectron) {
      for (let record of records) {
        await window
          .require("electron")
          .ipcRenderer.invoke("database-command", {
            statement: "saveStatement",
            statementType: "string",
            executeType: "run",
            dbName: dbName,
            data: record,
            storagePath: getStorageLocation(),
          });
      }
    } else {
      await localforage.setItem(dbName, records);
    }
  }
  static async deleteAllRecords(dbName: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteAllStatement",
        statementType: "string",
        executeType: "run",
        dbName: dbName,
        storagePath: getStorageLocation(),
      });
    } else {
      await localforage.removeItem(dbName);
    }
  }
  static async saveRecord(record: any, dbName: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "saveStatement",
        statementType: "string",
        executeType: "run",
        dbName: dbName,
        data: record,
        storagePath: getStorageLocation(),
      });
    } else {
      let records = await this.getAllRecords(dbName);
      records.push(record);
      await this.saveAllRecords(records, dbName);
    }
  }
  static async deleteRecord(key: string, dbName: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
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
        await this.saveAllRecords(records, dbName);
      }
    }
  }
  static async updateRecord(record: any, dbName: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
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
      await this.saveAllRecords(records, dbName);
    }
  }
  static async getRecord(key: string, dbName: string): Promise<any | null> {
    if (isElectron) {
      let record = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
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
  static async getRecordsByBookKey(
    bookKey: string,
    dbName: string
  ): Promise<any[]> {
    if (isElectron) {
      let records = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getStatement",
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
        .require("electron")
        .ipcRenderer.invoke("database-command", {
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
  static async updateAllRecords(records: any[], dbName: string) {
    if (isElectron) {
      for (let record of records) {
        await window
          .require("electron")
          .ipcRenderer.invoke("database-command", {
            statement: "updateStatement",
            statementType: "string",
            executeType: "run",
            dbName: dbName,
            data: record,
            storagePath: getStorageLocation(),
          });
      }
    } else {
      await this.saveAllRecords(records, dbName);
    }
  }
  static async deleteRecordsByBookKey(bookKey: string, dbName: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
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
        await this.deleteAllRecords(dbName);
      } else {
        await this.saveAllRecords(records, dbName);
      }
    }
  }
}

export default DatabaseService;
