//全部图书，最近阅读，搜索结果，排序结果的数据
import React, { Component } from "react";
import "./booklist.css";
import Book from "../book/book";
import BookItem from "../bookItem/bookItem";
import { connect } from "react-redux";
import { handleFetchList } from "../../redux/manager.redux";
import RecordRecent from "../../utils/recordRecent";
import ShelfUtil from "../../utils/shelfUtil";
import SortUtil from "../../utils/sortUtil";
class BookList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      books: this.props.books,
      covers: this.props.covers,
      shelfIndex: this.props.shelfIndex,
      isList: this.props.isList,
      isSearch: this.props.isSearch,
      isSort: this.props.isSort,
      sortCode: this.props.sortCode,
      searchBooks: this.props.searchBooks
    };
  }
  UNSAFE_componentWillReceiveProps = nextProps => {
    // console.log(nextProps);
    this.setState({
      books: nextProps.books,
      covers: nextProps.covers,
      shelfIndex: nextProps.shelfIndex,
      isSearch: nextProps.isSearch,
      isSort: nextProps.isSort,
      sortCode: nextProps.sortCode,
      searchBooks: nextProps.searchBooks
    });
    // console.log(this.state.sortCode);
  };

  //根据localstorage列表的数据，得到最近阅读的图书
  handleRecent = items => {
    let recentArr = [];
    for (let i in RecordRecent.getRecent()) {
      recentArr.push(RecordRecent.getRecent()[i].bookKey);
    }
    // console.log(items);
    // RecordRecent.getRecent();
    let recentItems = items.filter(item => {
      // console.log(item.key, recentArr.indexOf(item.key));

      return recentArr.indexOf(item.key) > -1;
    });
    // console.log(recentBooks);
    return recentItems;
  };
  //获取书架数据
  handleShelf(items, index) {
    //获取书架名
    let shelfTitle = Object.keys(ShelfUtil.getShelf());
    // console.log(shelfTitle, index, "shelfTitle");
    //获取当前书架名
    let currentShelfTitle = shelfTitle[index + 1];
    //获取当前书架的图书列表
    let currentShelfList = ShelfUtil.getShelf()[currentShelfTitle];
    // console.log(currentShelfList);
    //根据图书列表获取到图书数据
    let shelfItems = items.filter(item => {
      // console.log(item.key, currentShelfList.indexOf(item.key));

      return currentShelfList.indexOf(item.key) > -1;
    });

    // console.log(recentBooks);
    return shelfItems;
  }
  //控制卡片模式和列表模式的切换
  handleChange = mode => {
    this.setState({ isList: mode });
    localStorage.setItem("isList", mode);
    this.props.handleFetchList();
  };
  //根据搜索图书index获取到搜索出的图书
  handleFilter = (items, arr) => {
    // console.log(arr, "arr");
    let itemArr = [];

    arr.forEach(item => {
      itemArr.push(items[item]);
    });
    return itemArr;
  };
  render() {
    localStorage.setItem("totalBooks", this.props.books.length);

    // console.log(this.state.isList);
    const renderBookList = () => {
      // console.log(this.state.books, "sdgasf");
      //根据不同的场景获取不同的图书数据
      let books =
        this.props.mode === "recent"
          ? this.handleRecent(this.state.books)
          : this.state.shelfIndex !== null
          ? this.handleShelf(this.state.books, this.state.shelfIndex)
          : this.state.isSearch
          ? this.handleFilter(this.state.books, this.props.searchBooks)
          : this.state.isSort
          ? this.handleFilter(
              this.state.books,
              //返回排序后的图书index
              SortUtil.sortBooks(this.state.books, this.state.sortCode)
            )
          : this.state.books;
      // console.log(this.props.covers);
      //根据不同的场景获取不同图书的封面
      let covers =
        this.props.mode === "recent"
          ? this.handleRecent(this.state.covers)
          : this.state.shelfIndex !== null
          ? this.handleShelf(this.state.covers, this.state.shelfIndex)
          : this.state.isSearch
          ? this.handleFilter(this.state.covers, this.props.searchBooks)
          : this.state.isSort
          ? this.handleFilter(
              this.state.covers,
              SortUtil.sortBooks(this.state.books, this.state.sortCode)
            )
          : this.state.covers;
      return books.map((item, index) => {
        // console.log(covers, "djhdhdfh");
        // console.log(this.state.isList, "sdgasf");
        // let mode = this.state.isList;
        // console.log(mode);
        return this.state.isList === "list" ? (
          <BookItem
            key={item.key}
            book={item}
            bookCover={covers[index] ? covers[index].url : null}
          />
        ) : (
          <Book
            key={item.key}
            book={item}
            bookCover={covers[index] ? covers[index].url : null}
          />
        );
      });
    };
    return (
      <div className="book-list-container-parent">
        <div className="book-list-container">
          <div className="book-list-view">
            <div
              className="card-list-mode"
              onClick={() => {
                this.handleChange("card");
              }}
              style={
                this.state.isList === "card"
                  ? {}
                  : { color: "rgba(75,75,75,0.5)" }
              }
            >
              <span className="icon-grid"></span> 卡片模式
            </div>
            <div
              className="list-view-mode"
              onClick={() => {
                this.handleChange("list");
              }}
              style={
                this.state.isList === "list"
                  ? {}
                  : { color: "rgba(75,75,75,0.5)" }
              }
            >
              <span className="icon-list"></span> 列表模式
            </div>
          </div>

          <div className="book-list-item-box">{renderBookList()}</div>
        </div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    books: state.manager.books,
    covers: state.manager.covers,
    epubs: state.manager.epubs,
    mode: state.sidebar.mode,
    shelfIndex: state.sidebar.shelfIndex,
    searchBooks: state.manager.searchBooks,
    isSearch: state.manager.isSearch,
    isSort: state.manager.isSort,
    isList: state.manager.isList,
    sortCode: state.manager.sortCode
  };
};
const actionCreator = { handleFetchList };
BookList = connect(mapStateToProps, actionCreator)(BookList);
export default BookList;
