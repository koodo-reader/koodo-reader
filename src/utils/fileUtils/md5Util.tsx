import SparkMD5 from "spark-md5";

declare var window: any;
var pdfjsLib = window["pdfjs-dist/build/pdf"];
export const fetchMD5 = (file: any) => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      let md5 = await getFileMD5(file);
      if (file.name.indexOf(".pdf") > -1) {
        let fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = (ev) => {
          pdfjsLib
            .getDocument({ data: (ev.target as any).result })
            .promise.then((pdfDoc: any) => {
              resolve(pdfDoc._pdfInfo.fingerprint + "-" + md5);
            })
            .catch((err: any) => {
              resolve(md5);
            });
        };
      } else {
        resolve(md5);
      }
    } catch (error) {
      reject("");
    }
  });
};
export const getFileMD5 = (file: any) => {
  return new Promise<string>((resolve, reject) => {
    try {
      var blobSlice =
          (File as any).prototype.slice ||
          (File as any).prototype.mozSlice ||
          (File as any).prototype.webkitSlice,
        chunkSize = 2097152,
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5(),
        fileReader = new FileReader();
      fileReader.onload = async (e) => {
        if (!e.target) {
          reject("");

          throw new Error();
        }
        spark.appendBinary(e.target.result as any); // append array buffer
        currentChunk += 1;
        if (currentChunk < chunks) {
          loadNext();
        } else {
          resolve(spark.end());
        }
      };

      const loadNext = () => {
        var start = currentChunk * chunkSize,
          end = start + chunkSize >= file.size ? file.size : start + chunkSize;

        fileReader.readAsBinaryString(blobSlice.call(file, start, end));
      };

      loadNext();
    } catch (error) {
      reject("");
    }
  });
};
