import CollectionModel from "../../models/Collection";
import BookModel from "../../models/Book";

export interface CollectionItemProps {
  collection: CollectionModel;
  viewMode: string;
  cardScale?: number;
  isSelected: boolean;
  allBooks?: { key: string }[];
  bookIndex?: number;
}
