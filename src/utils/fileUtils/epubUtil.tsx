import BookModel from "../../model/Book";

declare var window: any;
export const addEpub = (
  file: any,
  md5: string,
  filePath: string = "Unknown Path"
) => {
  return new Promise<BookModel | boolean>((resolve, reject) => {
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (e) => {
      if (!e.target) {
        reject(false);
        throw new Error();
      }
      let cover: any = "";
      const epub = window.ePub(e.target.result);
      epub.loaded.metadata
        .then((metadata: any) => {
          if (!e.target) {
            reject(false);
            throw new Error();
          }
          epub
            .coverUrl()
            .then(async (url: string) => {
              if (url) {
                var reader = new FileReader();
                let blob = await fetch(url).then((r) => r.blob());
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                  cover = reader.result;
                  let key: string,
                    name: string,
                    author: string,
                    description: string,
                    publisher: string;
                  [name, author, description, publisher] = [
                    metadata.title,
                    metadata.creator,
                    metadata.description,
                    metadata.publisher,
                  ];
                  let format =
                    publisher === "mobi"
                      ? "MOBI"
                      : publisher === "azw3"
                      ? "AZW3"
                      : publisher === "txt"
                      ? "TXT"
                      : "EPUB";
                  key = new Date().getTime() + "";
                  let book = new BookModel(
                    key,
                    name,
                    author,
                    description,
                    md5,
                    cover,
                    format,
                    publisher,
                    file.size,
                    file.path || filePath
                  );
                  resolve(book);
                };
              } else {
                cover = "noCover";
                let key: string,
                  name: string,
                  author: string,
                  publisher: string,
                  description: string;
                [name, author, description, publisher] = [
                  metadata.title,
                  metadata.creator,
                  metadata.description,
                  metadata.publisher,
                ];
                let format =
                  publisher === "mobi"
                    ? "MOBI"
                    : publisher === "azw3"
                    ? "AZW3"
                    : publisher === "txt"
                    ? "TXT"
                    : "EPUB";
                key = new Date().getTime() + "";
                let book = new BookModel(
                  key,
                  name,
                  author,
                  description,
                  md5,
                  cover,
                  format,
                  publisher,
                  file.size,
                  file.path || filePath
                );

                resolve(book);
              }
            })
            .catch((err: any) => {
              reject(false);
            });
        })
        .catch(() => {
          reject(false);
        });
    };
  });
};
