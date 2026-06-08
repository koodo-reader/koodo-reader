import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

// A reading position as produced by rendition.getPosition() / stored as
// "recordLocation". We only rely on `percentage` here, but keep the rest so the
// stored furthest location can be replayed through rendition.goToPosition().
export interface BookLocation {
  text?: string;
  count?: string | number;
  chapterTitle?: string;
  chapterDocIndex?: string | number;
  chapterHref?: string;
  percentage?: string;
  cfi?: string;
  page?: string;
  xpath?: string;
  [key: string]: any;
}

const FURTHEST_LOCATION_KEY = "furthestLocation";

const toPercentage = (location: BookLocation | null | undefined): number => {
  if (!location || !location.percentage) return 0;
  const value = parseFloat(location.percentage);
  return isNaN(value) ? 0 : value;
};

// Persist `location` as the furthest-read position for a book, but only when it
// is further along than what we have already recorded.
export const recordFurthestLocation = (
  bookKey: string,
  location: BookLocation
) => {
  if (!bookKey || !location || !location.percentage) return;
  const furthest = getFurthestLocation(bookKey);
  if (toPercentage(location) > toPercentage(furthest)) {
    ConfigService.setObjectConfig(bookKey, location, FURTHEST_LOCATION_KEY);
  }
};

export const getFurthestLocation = (bookKey: string): BookLocation | null => {
  const location = ConfigService.getObjectConfig(
    bookKey,
    FURTHEST_LOCATION_KEY,
    {}
  );
  return location && location.percentage ? location : null;
};
