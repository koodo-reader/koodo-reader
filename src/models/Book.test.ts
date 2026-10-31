import { describe, expect, it } from "vitest";
import Book from "./Book";

describe("Book model", () => {
  it("stores core metadata", () => {
    const book = new Book(
      "1",
      "Demo",
      "Author",
      "Description",
      "md5",
      "cover",
      "EPUB",
      "Publisher",
      1024,
      10,
      "/tmp/demo.epub",
      "utf-8"
    );

    expect(book.key).toBe("1");
    expect(book.name).toBe("Demo");
    expect(book.author).toBe("Author");
    expect(book.format).toBe("EPUB");
    expect(book.publisher).toBe("Publisher");
    expect(book.size).toBe(1024);
    expect(book.page).toBe(10);
  });
});
