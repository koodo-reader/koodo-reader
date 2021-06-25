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
    fetch(filePath)
      .then((response) => response.body)
      .then((body) => {
        const reader = body!.getReader();
        return new ReadableStream({
          start(controller) {
            return pump();
            function pump(): any {
              return reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }
                controller.enqueue(value);
                return pump();
              });
            }
          },
        });
      })
      .then((stream) => new Response(stream))
      .then((response) => response.blob())
      .then((blob) => {
        let fileTemp = new File(
          [blob],
          window.navigator.platform.indexOf("Win") > -1
            ? filePath.split("\\").reverse()[0]
            : filePath.split("/").reverse()[0],
          {
            lastModified: new Date().getTime(),
            type: blob.type,
          }
        );
        resolve(fileTemp);
      })
      .catch((err) => {
        console.error(err);
        reject();
      });
  });
};
