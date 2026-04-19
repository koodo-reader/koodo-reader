class Book {
  constructor(
    readonly key: string,
    readonly name: string,
    readonly author: string,
    readonly description: string,
    readonly md5: string,
    readonly cover: string,
    readonly format: string,
    readonly publisher: string,
    readonly size: number,
    readonly page: number,
    readonly path: string,
    readonly charset: string
  ) {}
}

export default Book;
