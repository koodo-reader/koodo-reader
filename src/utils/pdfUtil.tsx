import BookModel from "../model/Book";

declare var window: any;
var pdfjsLib = window["pdfjs-dist/build/pdf"];
export const addPdf = (data: ArrayBuffer, md5: string, bookName: string) => {
  return new Promise<BookModel | boolean>((resolve, reject) => {
    pdfjsLib
      .getDocument({ data: data })
      .promise.then((pdfDoc_: any) => {
        let pdfDoc = pdfDoc_;
        pdfDoc.getMetadata().then(async (metadata: any) => {
          let cover: any = "noCover";
          let key: string,
            name: string,
            author: string,
            publisher: string,
            description: string;
          [name, author, description, publisher] = [
            metadata.info.Title || bookName,
            metadata.info.Author || "Unknown Authur",
            "pdf",
            metadata.info.publisher,
          ];
          let format = "PDF";
          key = new Date().getTime() + "";
          let book = new BookModel(
            key,
            name,
            author,
            description,
            md5,
            cover,
            format,
            publisher
          );
          resolve(book);
        });
      })
      .catch((err: any) => {
        reject(false);
      });
  });
};
