import SparkMD5 from "spark-md5";

declare var window: any;
var pdfjsLib = window["pdfjs-dist/build/pdf"];
export const fetchMD5 = (file: any) => {
  return new Promise<string>((resolve, reject) => {
    try {
      if (file.name.indexOf(".pdf") > -1) {
        let fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = (ev) => {
          pdfjsLib
            .getDocument({ data: (ev.target as any).result })
            .promise.then((pdfDoc: any) => {
              resolve(pdfDoc._pdfInfo.fingerprint);
            });
        };
      } else {
        var blobSlice =
            (File as any).prototype.slice ||
            (File as any).prototype.mozSlice ||
            (File as any).prototype.webkitSlice,
          chunkSize = 2097152, // 以每片2MB大小来逐次读取
          chunks = Math.ceil(file.size / chunkSize),
          currentChunk = 0,
          spark = new SparkMD5(), //创建SparkMD5的实例
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
            end =
              start + chunkSize >= file.size ? file.size : start + chunkSize;

          fileReader.readAsBinaryString(blobSlice.call(file, start, end));
        };

        loadNext();
      }
    } catch (error) {
      reject("");
    }
  });
};
