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

declare var window: any;

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
    let extension = fileName[fileName.length - 1];
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
          this.props.handleMessage("Import Failed");
          this.props.handleMessageBox(true);
          throw new Error();
        }
        let cover: any = "";
        const epub = window.ePub(e.target.result);
        epub.loaded.metadata
          .then((metadata: any) => {
            console.log(metadata, "medata");
            if (!e.target) {
              throw new Error();
            }
            epub
              .coverUrl()
              .then(async (url: string) => {
                var reader = new FileReader();
                let blob = await fetch(url).then((r) => r.blob());
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                  cover = reader.result;
                  console.log(cover);
                  let name: string,
                    author: string,
                    content: any,
                    description: string,
                    book: BookModel;
                  [name, author, description, content] = [
                    metadata.title,
                    metadata.creator,
                    metadata.description,
                    e.target!.result,
                  ];
                  book = new BookModel(
                    name,
                    author,
                    description,
                    content,
                    md5,
                    cover
                  );
                  this.handleAddBook(book);
                };
              })
              .catch((err: any) => {
                console.log(err, "err");
              });
          })
          .catch(() => {
            this.props.handleMessage("Import Failed");
            this.props.handleMessageBox(true);
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
          if (acceptedFiles.length > 9) {
            this.props.handleMessage("Please import less than 10 books");
            this.props.handleMessageBox(true);
            return;
          }
          if (this.props.books && this.props.books.length > 50) {
            this.props.handleMessage("Please delete some books before import");
            this.props.handleMessageBox(true);
            return;
          }
          for (let i = 0; i < acceptedFiles.length; i++) {
            this.doIncrementalTest(acceptedFiles[i]);
          }
        }}
        accept={[".epub"]}
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
