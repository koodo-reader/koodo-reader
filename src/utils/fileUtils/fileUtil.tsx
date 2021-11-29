export const fetchMD5FromPath = (filePath: string) => {
  return new Promise<string>((resolve, reject) => {
    var crypto = window.require("crypto");
    var fs = window.require("fs");

    var md5sum = crypto.createHash("md5");
    var s = fs.ReadStream(filePath);
    s.on("data", function (d) {
      md5sum.update(d);
    });

    s.on("end", () => {
      resolve(md5sum.digest("hex"));
    });
    s.on("error", () => {
      reject("");
    });
  });
};
export const fetchFileFromPath = (filePath: string) => {
  return new Promise<File>((resolve, reject) => {
    const fs = window.require("fs");

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const file = new File(
        [data],
        window.navigator.platform.indexOf("Win") > -1
          ? filePath.split("\\").reverse()[0]
          : filePath.split("/").reverse()[0],
        {
          lastModified: new Date().getTime(),
        }
      );
      resolve(file);
    });
  });
};
