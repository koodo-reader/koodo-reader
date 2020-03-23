//从本地导入书籍
import React, { Component } from "react";
import "./importLocal.css";
import BookModel from "../../model/Book";
import { connect } from "react-redux";
import localforage from "localforage";
import {
  handleMessageBox,
  handleMessage,
  handleFetchBooks
} from "../../redux/manager.redux";
import SparkMD5 from "spark-md5";
// import Epub from "epubjs/lib/index/";

// global.ePub = Epub;
// @connect(state => state.manager)
class ImportLocal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isRepeat: false
      // md5: null
    };
  }
  //向indexdb中添加书籍
  handleAddBook = book => {
    let bookArr = this.props.books;
    console.log(bookArr, "bookArr");
    if (bookArr == null) {
      bookArr = [];
    }
    bookArr.push(book);
    console.log(bookArr, "sghasfkh");
    localforage.setItem("books", bookArr).then(() => {
      console.log("hadfhafh");
      this.props.handleFetchBooks();
    });
    this.props.handleMessage("添加成功");
    this.props.handleMessageBox(true);
  };
  //获取书籍md5
  doIncrementalTest = file => {
    //这里假设直接将文件选择框的dom引用传入

    //这里需要用到File的slice( )方法，以下是兼容写法
    var blobSlice =
        File.prototype.slice ||
        File.prototype.mozSlice ||
        File.prototype.webkitSlice,
      chunkSize = 2097152, // 以每片2MB大小来逐次读取
      chunks = Math.ceil(file.size / chunkSize),
      currentChunk = 0,
      spark = new SparkMD5(), //创建SparkMD5的实例
      fileReader = new FileReader();

    fileReader.onload = e => {
      // console("Read chunk number (currentChunk + 1) of  chunks ");

      spark.appendBinary(e.target.result); // append array buffer
      currentChunk += 1;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        console.log("Finished loading!");
        let md5 = spark.end(); // 完成计算，返回结果
        // this.setState({ md5: md5 });
        console.log(md5, "sgsgh");
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
  handleBook = (file, md5) => {
    //md5重复不导入
    if (this.props.books !== null) {
      this.props.books.forEach(item => {
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

      reader.onload = e => {
        const epub = global.ePub({ bookPath: e.target.result });
        console.log(epub);
        epub.getMetadata().then(metadata => {
          let name, author, content, description, book;
          [name, author, content, description] = [
            metadata.bookTitle,
            metadata.creator,
            metadata.description,
            e.target.result
          ];
          book = new BookModel(name, author, content, description, md5);
          this.handleAddBook(book);
        });
      };
    }
  };
  handleChange = event => {
    event.preventDefault();
    this.setState({ isRepeat: false });
    let file = event.target.files[0];
    console.log(file);
    this.doIncrementalTest(file);
  };

  render() {
    // const classes = this.props.classes;

    return (
      <div className="import-from-local">
        从本地导入
        <input
          type="file"
          id="import-book-box"
          accept="application/epub+zip"
          className="import-book-box"
          name="file"
          multiple="multiple"
          onChange={event => {
            this.handleChange(event);
          }}
        />
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    books: state.manager.books
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleFetchBooks
};
ImportLocal = connect(mapStateToProps, actionCreator)(ImportLocal);
export default ImportLocal;
