//从本地导入书籍
import React from "react";
import "./importLocal.css";
import BookModel from "../../model/Book";
import localforage from "localforage";
import SparkMD5 from "spark-md5";
import { Trans } from "react-i18next";
import Dropzone from "react-dropzone";
import { ImportLocalProps, ImportLocalState } from "./interface";
import RecordRecent from "../../utils/recordRecent";
import axios from "axios";
import Epub from "epubjs";

declare var window: any;

window.ePub = Epub;

class ImportLocal extends React.Component<ImportLocalProps, ImportLocalState> {
  constructor(props: ImportLocalProps) {
    super(props);
    this.state = {
      isRepeat: false,
    };
  }
  handleAddBook = (book: BookModel) => {
    let bookArr = this.props.books;
    if (bookArr == null) {
      bookArr = [];
    }
    bookArr.push(book);
    RecordRecent.setRecent(book.key);
    console.log(bookArr, "bookArr");
    localforage.setItem("books", bookArr).then(() => {
      this.props.handleFetchBooks();
    });
    this.props.handleMessage("Add Successfully");
    this.props.handleMessageBox(true);
  };
  //获取书籍md5
  doIncrementalTest = (file: any) => {
    //这里假设直接将文件选择框的dom引用传入
    //这里需要用到File的slice( )方法，以下是兼容写法
    let fileName = file.name.split(".");
    let extension = fileName[1];
    if (extension === "epub") {
      var blobSlice =
          (File as any).prototype.slice ||
          (File as any).prototype.mozSlice ||
          (File as any).prototype.webkitSlice,
        chunkSize = 2097152, // 以每片2MB大小来逐次读取
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5(), //创建SparkMD5的实例
        fileReader = new FileReader();

      fileReader.onload = (e) => {
        if (!e.target) {
          throw new Error();
        }
        spark.appendBinary(e.target.result as any); // append array buffer
        currentChunk += 1;
        if (currentChunk < chunks) {
          loadNext();
        } else {
          let md5 = spark.end(); // 完成计算，返回结果
          this.handleBook(file, md5);
        }
      };

      const loadNext = () => {
        var start = currentChunk * chunkSize,
          end = start + chunkSize >= file.size ? file.size : start + chunkSize;

        fileReader.readAsBinaryString(blobSlice.call(file, start, end));
      };

      loadNext();
    } else {
      //this.handleOtherFormat(file, file.name);
    }
  };
  toBase64 = (file: any) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  handleOtherFormat = async (file: any, name: string) => {
    const option = {
      apikey: "47f9a3ea69b4f01bc1c54ee2d17b4c2a",
      input: "base64",
      outputformat: "epub",
      filename: "老人与海.txt",
      file: await this.toBase64(file),
    };
    const data = await axios.post("https://api.convertio.co/convert", option);
    console.log(data, "data1");
    if (data.data.data.id) {
      axios
        .get(`https://api.convertio.co/convert/${data.data.data.id}/dl`)
        .then((res) => {
          fetch(
            "data:" +
              "application/epub+zip" +
              ";base64," +
              res.data.data.content
          )
            .then((res: any) => res.blob())
            .then((blob: any) => {
              console.log(blob, "blob");
              const file = new File([blob], "老人与海.epub", {
                type: "application/epub+zip",
              });
              this.doIncrementalTest(file);
            })
            .catch((err) => {
              console.log(err, "err");
            });
        })
        .catch((err) => {
          console.log(err);
          return;
        });
    } else {
      this.props.handleMessage("Import Failed");
      this.props.handleMessageBox(true);
    }
  };
  handleBook = (file: any, md5: string) => {
    //md5重复不导入
    if (this.props.books) {
      this.props.books.forEach((item) => {
        if (item.md5 === md5) {
          this.setState({ isRepeat: true });
          this.props.handleMessage("Duplicate Book");
          this.props.handleMessageBox(true);
        }
      });
    }
    //解析图书，获取图书数据
    if (!this.state.isRepeat) {
      let reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = (e) => {
        if (!e.target) {
          throw new Error();
        }
        const epub = window.ePub(e.target.result);
        epub.loaded.metadata
          .then((metadata: any) => {
            if (!e.target) {
              throw new Error();
            }
            let name: string,
              author: string,
              content: any,
              description: string,
              book: BookModel;
            [name, author, description, content] = [
              metadata.title,
              metadata.creator,
              metadata.description,
              e.target.result,
            ];
            book = new BookModel(name, author, description, content, md5);
            this.handleAddBook(book);
          })
          .catch(() => {
            console.log("Error occurs");
          });
      };
    }
    this.setState({ isRepeat: false });
  };

  render() {
    return (
      <Dropzone
        onDrop={(acceptedFiles) => {
          acceptedFiles.forEach((item) => {
            this.doIncrementalTest(item);
          });
        }}
        accept={[".epub", ".mobi", ".txt"]}
        multiple={true}
      >
        {({ getRootProps, getInputProps }) => (
          <div className="import-from-local" {...getRootProps()}>
            <Trans>Import from Local</Trans>
            <input
              type="file"
              id="import-book-box"
              className="import-book-box"
              name="file"
              {...getInputProps()}
            />
          </div>
        )}
      </Dropzone>
    );
  }
}

export default ImportLocal;
