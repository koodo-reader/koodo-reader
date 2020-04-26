//从本地导入书籍
import React from "react";
import "./importLocal.css";
import BookModel from "../../model/Book";
import { connect } from "react-redux";
import localforage from "localforage";
import {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
} from "../../redux/manager.redux";
import SparkMD5 from "spark-md5";
import { stateType } from "../../store";

export interface ImportLocalProps {
  books: BookModel[];
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleFetchBooks: () => void;
}

export interface ImportLocalState {
  isRepeat: boolean;
}

class ImportLocal extends React.Component<ImportLocalProps, ImportLocalState> {
  constructor(props: ImportLocalProps) {
    super(props);
    this.state = {
      isRepeat: false,
    };
  }
  //向indexdb中添加书籍
  handleAddBook = (book: BookModel) => {
    let bookArr = this.props.books;
    if (bookArr == null) {
      bookArr = [];
    }
    bookArr.push(book);
    localforage.setItem("books", bookArr).then(() => {
      this.props.handleFetchBooks();
    });
    this.props.handleMessage("添加成功");
    this.props.handleMessageBox(true);
  };
  //获取书籍md5
  doIncrementalTest = (file: any) => {
    //这里假设直接将文件选择框的dom引用传入

    //这里需要用到File的slice( )方法，以下是兼容写法
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

    function loadNext() {
      var start = currentChunk * chunkSize,
        end = start + chunkSize >= file.size ? file.size : start + chunkSize;

      fileReader.readAsBinaryString(blobSlice.call(file, start, end));
    }

    loadNext();
  };
  handleBook = (file: any, md5: string) => {
    //md5重复不导入
    if (this.props.books !== null) {
      this.props.books.forEach((item) => {
        if (item.md5 === md5) {
          this.setState({ isRepeat: true });
          this.props.handleMessage("文件重复");
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
        const epub = (window as any).ePub({ bookPath: e.target.result });
        epub
          .getMetadata()
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
              metadata.bookTitle,
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
  };
  handleChange = (event: any) => {
    if (!event.target) {
      return;
    }
    event.preventDefault();
    this.setState({ isRepeat: false });
    let file = event.target.files[0];
    this.doIncrementalTest(file);
  };

  render() {
    return (
      <div className="import-from-local">
        从本地导入
        <input
          type="file"
          id="import-book-box"
          accept="application/epub+zip"
          className="import-book-box"
          name="file"
          multiple={true}
          onChange={(event) => {
            this.handleChange(event);
          }}
        />
      </div>
    );
  }
}
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
};
export default connect(mapStateToProps, actionCreator)(ImportLocal);
