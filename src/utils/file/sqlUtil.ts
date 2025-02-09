import { isElectron } from "react-device-detect";
import { SqlStatement } from "../../assets/lib/kookit-extra-browser.min";
declare var window: any;
function addColonToKeys(obj: any): any {
  const newObj: any = {};
  for (const key in obj) {
    newObj[":" + key] = obj[key];
  }
  return newObj;
}
class SqlUtil {
  SQL: any;
  async getConnection() {
    if (!this.SQL) {
      let config = {
        locateFile: (filename) => {
          if (isElectron) {
            const path = window.require("path");
            const { ipcRenderer } = window.require("electron");
            return `${path.join(
              ipcRenderer.sendSync("get-dirname", "ping"),
              "/build/lib/sqljs-wasm/" + filename
            )}`;
          } else {
            return `./lib/sqljs-wasm/${filename}`;
          }
        },
      };
      this.SQL = await window.initSqlJs(config);
      return this.SQL;
    } else {
      return this.SQL;
    }
  }
  async dbBufferToJson(buffer: ArrayBuffer, type: string) {
    let SQL = await this.getConnection();
    let db = new SQL.Database(new Uint8Array(buffer));
    let statement = db.prepare(
      SqlStatement.sqlStatement["getAllStatement"][type]
    );
    let json: any = [];
    while (statement.step()) {
      json.push(SqlStatement.sqliteToJson[type](statement.getAsObject()));
    }
    statement.free();
    db.close();
    return json;
  }
  async JsonToDbBuffer(json: any[], type: string) {
    let SQL = await this.getConnection();
    let db = new SQL.Database();
    db.exec(SqlStatement.sqlStatement["createTableStatement"][type]);
    const statement = db.prepare(
      SqlStatement.sqlStatement["saveStatement"][type].replaceAll("@", ":")
    );
    json.forEach((item) => {
      statement.run(addColonToKeys(SqlStatement.jsonToSqlite[type](item)));
    });
    statement.free();
    let buffer = db.export();
    db.close();
    return buffer.buffer;
  }
}
export default SqlUtil;
