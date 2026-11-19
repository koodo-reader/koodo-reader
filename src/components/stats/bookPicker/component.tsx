import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOption } from "../types";
import "./bookPicker.css";

export interface BookPickerProps {
  options: BookOption[];
  value: string;
  onSelect: (bookKey: string) => void;
}

const BookPicker = ({ options, value, onSelect }: BookPickerProps) => {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLowerCase();
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(keyword)
  );
  const selectedName = value
    ? options.find((option) => option.key === value)?.name || value
    : t("All books");

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Keep the popover inside the window when the trigger sits near the edge.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const popover = popoverRef.current;
    if (!popover) return;
    const margin = 12;
    const rect = popover.getBoundingClientRect();
    if (rect.left < margin) {
      popover.style.right = `${rect.left - margin}px`;
    }
  }, [isOpen]);

  const handleSelect = (bookKey: string) => {
    onSelect(bookKey);
    setIsOpen(false);
  };

  return (
    <div className="stats-book-picker" ref={wrapperRef}>
      <button
        type="button"
        className="stats-range-pill is-active stats-book-trigger"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="stats-book-trigger-label">{selectedName}</span>
        <span className="icon-dropdown stats-book-trigger-icon" />
      </button>
      {isOpen && (
        <div className="stats-book-popover" role="dialog" ref={popoverRef}>
          <div className="stats-book-popover-title">{t("Filter by book")}</div>
          <input
            className="stats-book-search"
            type="text"
            value={query}
            autoFocus
            placeholder={t("Search {{count}} books", {
              count: options.length,
            })}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="stats-book-list">
            <button
              type="button"
              className={`stats-book-option${value === "" ? " is-selected" : ""}`}
              onClick={() => handleSelect("")}
            >
              <span
                className="icon-check stats-book-check"
                aria-hidden="true"
              />
              <span className="stats-book-option-name">{t("All books")}</span>
            </button>
            {filteredOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`stats-book-option${
                  value === option.key ? " is-selected" : ""
                }`}
                onClick={() => handleSelect(option.key)}
              >
                <span
                  className="icon-check stats-book-check"
                  aria-hidden="true"
                />
                <span className="stats-book-option-text">
                  <span className="stats-book-option-name" title={option.name}>
                    {option.name}
                  </span>
                  <span className="stats-book-option-meta">
                    {option.author || t("Unknown Author")}
                  </span>
                </span>
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="stats-book-empty">{t("No results found")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookPicker;
