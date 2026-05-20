package main

import (
	"database/sql"
	"encoding/xml"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

// ── OPDS configuration ────────────────────────────────────────────────────────

var opdsEnabled bool

func init() {
	opdsEnabled = os.Getenv("ENABLE_OPDS") == "true"
}

// ── Atom / OPDS XML types ─────────────────────────────────────────────────────

const (
	atomNS         = "http://www.w3.org/2005/Atom"
	opdsNS         = "http://opds-spec.org/2010/catalog"
	dcNS           = "http://purl.org/dc/terms/"
	opensearchNS   = "http://a9.com/-/spec/opensearch/1.1/"
	opdsMimeAcq    = "application/atom+xml;profile=opds-catalog;kind=acquisition"
	opdsMimeNav    = "application/atom+xml;profile=opds-catalog;kind=navigation"
	opdsMimeFeed   = "application/atom+xml;profile=opds-catalog"
	opdsMimeSearch = "application/opensearchdescription+xml"
)

type atomLink struct {
	Rel   string `xml:"rel,attr,omitempty"`
	Href  string `xml:"href,attr"`
	Type  string `xml:"type,attr,omitempty"`
	Title string `xml:"title,attr,omitempty"`
	Count string `xml:"thr:count,attr,omitempty"`
}

type atomPerson struct {
	Name string `xml:"name"`
}

type atomContent struct {
	Type    string `xml:"type,attr,omitempty"`
	Content string `xml:",chardata"`
}

type dcLanguage struct {
	Lang string `xml:",chardata"`
}

type atomEntry struct {
	XMLName   xml.Name     `xml:"entry"`
	Title     string       `xml:"title"`
	ID        string       `xml:"id"`
	Updated   string       `xml:"updated"`
	Authors   []atomPerson `xml:"author,omitempty"`
	Links     []atomLink   `xml:"link,omitempty"`
	Summary   atomContent  `xml:"summary,omitempty"`
	Content   *atomContent `xml:"content,omitempty"`
	Publisher string       `xml:"dc:publisher,omitempty"`
	Language  string       `xml:"dc:language,omitempty"`
}

type opensearchDesc struct {
	TotalResults int `xml:"opensearch:totalResults"`
	ItemsPerPage int `xml:"opensearch:itemsPerPage"`
	StartIndex   int `xml:"opensearch:startIndex"`
}

type atomFeed struct {
	XMLName      xml.Name    `xml:"feed"`
	Xmlns        string      `xml:"xmlns,attr"`
	XmlnsDC      string      `xml:"xmlns:dc,attr"`
	XmlnsOS      string      `xml:"xmlns:opensearch,attr"`
	XmlnsOPDS    string      `xml:"xmlns:opds,attr"`
	ID           string      `xml:"id"`
	Title        string      `xml:"title"`
	Updated      string      `xml:"updated"`
	Author       atomPerson  `xml:"author"`
	Links        []atomLink  `xml:"link"`
	TotalResults int         `xml:"opensearch:totalResults,omitempty"`
	ItemsPerPage int         `xml:"opensearch:itemsPerPage,omitempty"`
	StartIndex   int         `xml:"opensearch:startIndex,omitempty"`
	Entries      []atomEntry `xml:"entry,omitempty"`
}

// ── Book model from SQLite ────────────────────────────────────────────────────

type opdsBook struct {
	Key         string
	Name        string
	Author      string
	Description string
	Cover       string
	Format      string
	Publisher   string
	Size        int64
	Page        int
}

func openBooksDB() (*sql.DB, error) {
	dbPath := filepath.Join(uploadDir, "config", "books.db")
	return sql.Open("sqlite", dbPath+"?_journal=WAL&mode=ro")
}

func queryBooks(db *sql.DB, search string) ([]opdsBook, error) {
	var (
		rows *sql.Rows
		err  error
	)
	base := `SELECT key, COALESCE(name,''), COALESCE(author,''), COALESCE(description,''),
	                COALESCE(cover,''), COALESCE(format,''), COALESCE(publisher,''),
	                COALESCE(size,0), COALESCE(page,0)
	         FROM books`
	if search != "" {
		like := "%" + search + "%"
		rows, err = db.Query(base+` WHERE name LIKE ? OR author LIKE ? OR description LIKE ?
		                            ORDER BY name`, like, like, like)
	} else {
		rows, err = db.Query(base + ` ORDER BY name`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var books []opdsBook
	for rows.Next() {
		var b opdsBook
		if err := rows.Scan(&b.Key, &b.Name, &b.Author, &b.Description,
			&b.Cover, &b.Format, &b.Publisher, &b.Size, &b.Page); err != nil {
			continue
		}
		books = append(books, b)
	}
	return books, rows.Err()
}

func queryBook(db *sql.DB, key string) (*opdsBook, error) {
	row := db.QueryRow(`SELECT key, COALESCE(name,''), COALESCE(author,''), COALESCE(description,''),
	                           COALESCE(cover,''), COALESCE(format,''), COALESCE(publisher,''),
	                           COALESCE(size,0), COALESCE(page,0)
	                    FROM books WHERE key = ?`, key)
	var b opdsBook
	if err := row.Scan(&b.Key, &b.Name, &b.Author, &b.Description,
		&b.Cover, &b.Format, &b.Publisher, &b.Size, &b.Page); err != nil {
		return nil, err
	}
	return &b, nil
}

// ── Cover file detection ──────────────────────────────────────────────────────

var imageExts = []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}

// findCoverFile finds the cover image for a given book key.
// It first checks the cover field (e.g. "1767196800000.jpg"), then falls back
// to scanning the cover directory for any image with the matching stem.
func findCoverFile(key, coverField string) (string, string) {
	coverDir := filepath.Join(uploadDir, "cover")

	// Try the explicit cover field first
	if coverField != "" {
		candidate := filepath.Join(coverDir, coverField)
		if _, err := os.Stat(candidate); err == nil {
			ext := strings.ToLower(filepath.Ext(coverField))
			return candidate, ext
		}
		// Maybe cover field is just the key, try composing
		for _, ext := range imageExts {
			candidate = filepath.Join(coverDir, key+ext)
			if _, err := os.Stat(candidate); err == nil {
				return candidate, ext
			}
		}
	}

	// Scan for key.* in cover directory
	for _, ext := range imageExts {
		candidate := filepath.Join(coverDir, key+ext)
		if _, err := os.Stat(candidate); err == nil {
			return candidate, ext
		}
	}
	return "", ""
}

func coverMime(ext string) string {
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".bmp":
		return "image/bmp"
	default:
		return "image/jpeg"
	}
}

func bookMime(format string) string {
	switch strings.ToLower(format) {
	case "epub":
		return "application/epub+zip"
	case "pdf":
		return "application/pdf"
	case "mobi":
		return "application/x-mobipocket-ebook"
	case "azw", "azw3":
		return "application/x-mobi8-ebook"
	case "cbz":
		return "application/x-cbz"
	case "cbr":
		return "application/x-cbr"
	case "txt":
		return "text/plain"
	case "fb2":
		return "application/x-fictionbook+xml"
	default:
		return "application/octet-stream"
	}
}

// ── XML helpers ───────────────────────────────────────────────────────────────

func now() string { return time.Now().UTC().Format(time.RFC3339) }

func writeXML(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/atom+xml; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(xml.Header))
	enc := xml.NewEncoder(w)
	enc.Indent("", "  ")
	_ = enc.Encode(v)
}

func opdsRequireAuth(w http.ResponseWriter) {
	w.Header().Set("WWW-Authenticate", `Basic realm="OPDS Catalog"`)
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = w.Write([]byte("Unauthorized"))
}

// ── OPDS handlers ─────────────────────────────────────────────────────────────

// handleOPDSRoot serves the OPDS root navigation feed.
func handleOPDSRoot(w http.ResponseWriter, r *http.Request, base string) {
	feed := atomFeed{
		Xmlns:     atomNS,
		XmlnsDC:   dcNS,
		XmlnsOS:   opensearchNS,
		XmlnsOPDS: opdsNS,
		ID:        base + "/opds",
		Title:     "Koodo Reader OPDS Catalog",
		Updated:   now(),
		Author:    atomPerson{Name: "Koodo Reader"},
		Links: []atomLink{
			{Rel: "self", Href: base + "/opds", Type: opdsMimeNav},
			{Rel: "start", Href: base + "/opds", Type: opdsMimeNav},
			{Rel: "search", Href: base + "/opds/search?q={searchTerms}", Type: opdsMimeSearch},
		},
		Entries: []atomEntry{
			{
				Title:   "All Books",
				ID:      base + "/opds/books",
				Updated: now(),
				Links: []atomLink{
					{Rel: "subsection", Href: base + "/opds/books", Type: opdsMimeAcq},
				},
				Summary: atomContent{Content: "Browse all books in the library"},
			},
			{
				Title:   "Search",
				ID:      base + "/opds/search",
				Updated: now(),
				Links: []atomLink{
					{Rel: "search", Href: base + "/opds/search?q={searchTerms}", Type: opdsMimeAcq, Title: "Search books"},
				},
				Summary: atomContent{Content: "Search the library by title, author or description"},
			},
		},
	}
	writeXML(w, http.StatusOK, feed)
}

// handleOPDSBooks serves the full acquisition feed of all books (or search results).
func handleOPDSBooks(w http.ResponseWriter, r *http.Request, base, search string) {
	db, err := openBooksDB()
	if err != nil {
		log.Printf("OPDS: failed to open books.db: %v", err)
		http.Error(w, "Database unavailable", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	books, err := queryBooks(db, search)
	if err != nil {
		log.Printf("OPDS: query error: %v", err)
		http.Error(w, "Query error", http.StatusInternalServerError)
		return
	}

	title := "All Books"
	selfHref := base + "/opds/books"
	if search != "" {
		title = fmt.Sprintf("Search results for \"%s\"", search)
		selfHref = base + "/opds/search?q=" + search
	}

	feed := atomFeed{
		Xmlns:        atomNS,
		XmlnsDC:      dcNS,
		XmlnsOS:      opensearchNS,
		XmlnsOPDS:    opdsNS,
		ID:           selfHref,
		Title:        title,
		Updated:      now(),
		Author:       atomPerson{Name: "Koodo Reader"},
		TotalResults: len(books),
		ItemsPerPage: len(books),
		StartIndex:   1,
		Links: []atomLink{
			{Rel: "self", Href: selfHref, Type: opdsMimeAcq},
			{Rel: "start", Href: base + "/opds", Type: opdsMimeNav},
			{Rel: "search", Href: base + "/opds/search?q={searchTerms}", Type: opdsMimeSearch},
		},
	}

	for _, b := range books {
		entry := buildEntry(b, base)
		feed.Entries = append(feed.Entries, entry)
	}

	writeXML(w, http.StatusOK, feed)
}

// handleOPDSBook serves the acquisition feed for a single book.
func handleOPDSBook(w http.ResponseWriter, r *http.Request, base, key string) {
	db, err := openBooksDB()
	if err != nil {
		log.Printf("OPDS: failed to open books.db: %v", err)
		http.Error(w, "Database unavailable", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	b, err := queryBook(db, key)
	if err != nil {
		http.Error(w, "Book not found", http.StatusNotFound)
		return
	}

	feed := atomFeed{
		Xmlns:     atomNS,
		XmlnsDC:   dcNS,
		XmlnsOS:   opensearchNS,
		XmlnsOPDS: opdsNS,
		ID:        base + "/opds/book/" + key,
		Title:     b.Name,
		Updated:   now(),
		Author:    atomPerson{Name: "Koodo Reader"},
		Links: []atomLink{
			{Rel: "self", Href: base + "/opds/book/" + key, Type: opdsMimeAcq},
			{Rel: "start", Href: base + "/opds", Type: opdsMimeNav},
		},
		Entries: []atomEntry{buildEntry(*b, base)},
	}
	writeXML(w, http.StatusOK, feed)
}

// handleOPDSCover serves the cover image for a book.
func handleOPDSCover(w http.ResponseWriter, r *http.Request, key string) {
	db, err := openBooksDB()
	if err != nil {
		http.Error(w, "Database unavailable", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	b, err := queryBook(db, key)
	if err != nil {
		http.Error(w, "Book not found", http.StatusNotFound)
		return
	}

	coverPath, ext := findCoverFile(b.Key, b.Cover)
	if coverPath == "" {
		http.Error(w, "Cover not found", http.StatusNotFound)
		return
	}

	f, err := os.Open(coverPath)
	if err != nil {
		http.Error(w, "Cannot open cover", http.StatusInternalServerError)
		return
	}
	defer f.Close()

	w.Header().Set("Content-Type", coverMime(ext))
	http.ServeContent(w, r, filepath.Base(coverPath), time.Time{}, f)
}

// handleOPDSDownload serves the book file for download.
func handleOPDSDownload(w http.ResponseWriter, r *http.Request, key string) {
	db, err := openBooksDB()
	if err != nil {
		http.Error(w, "Database unavailable", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	b, err := queryBook(db, key)
	if err != nil {
		http.Error(w, "Book not found", http.StatusNotFound)
		return
	}

	format := strings.ToLower(b.Format)
	bookPath := filepath.Join(uploadDir, "book", b.Key+"."+format)
	if _, err := os.Stat(bookPath); os.IsNotExist(err) {
		http.Error(w, "Book file not found", http.StatusNotFound)
		return
	}

	f, err := os.Open(bookPath)
	if err != nil {
		http.Error(w, "Cannot open book file", http.StatusInternalServerError)
		return
	}
	defer f.Close()

	filename := b.Name
	if filename == "" {
		filename = b.Key
	}
	filename += "." + format

	w.Header().Set("Content-Type", bookMime(format))
	w.Header().Set("Content-Disposition",
		fmt.Sprintf(`attachment; filename="%s"`, strings.ReplaceAll(filename, `"`, `'`)))
	http.ServeContent(w, r, filename, time.Time{}, f)
}

// handleOPDSSearch serves the OpenSearch description document.
func handleOPDSSearchDesc(w http.ResponseWriter, r *http.Request, base string) {
	type osParam struct {
		Name  string `xml:"name,attr"`
		Value string `xml:"value,attr"`
	}
	type osURL struct {
		Type     string `xml:"type,attr"`
		Template string `xml:"template,attr"`
	}
	type osDesc struct {
		XMLName     xml.Name `xml:"OpenSearchDescription"`
		Xmlns       string   `xml:"xmlns,attr"`
		ShortName   string   `xml:"ShortName"`
		Description string   `xml:"Description"`
		InputEnc    string   `xml:"InputEncoding"`
		URL         osURL    `xml:"Url"`
	}

	desc := osDesc{
		Xmlns:       "http://a9.com/-/spec/opensearch/1.1/",
		ShortName:   "Koodo Reader",
		Description: "Search books by title, author or description",
		InputEnc:    "UTF-8",
		URL: osURL{
			Type:     opdsMimeAcq,
			Template: base + "/opds/search?q={searchTerms}",
		},
	}
	w.Header().Set("Content-Type", "application/opensearchdescription+xml; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(xml.Header))
	enc := xml.NewEncoder(w)
	enc.Indent("", "  ")
	_ = enc.Encode(desc)
}

// ── Entry builder ─────────────────────────────────────────────────────────────

func buildEntry(b opdsBook, base string) atomEntry {
	format := strings.ToLower(b.Format)
	entry := atomEntry{
		Title:   b.Name,
		ID:      base + "/opds/book/" + b.Key,
		Updated: now(),
		Links: []atomLink{
			// Acquisition link (download)
			{
				Rel:  "http://opds-spec.org/acquisition",
				Href: base + "/opds/download/" + b.Key + "." + format,
				Type: bookMime(format),
			},
		},
		Summary:   atomContent{Type: "text", Content: b.Description},
		Publisher: b.Publisher,
	}

	if b.Author != "" {
		entry.Authors = []atomPerson{{Name: b.Author}}
	}

	// Cover image links
	coverPath, ext := findCoverFile(b.Key, b.Cover)
	if coverPath != "" {
		mime := coverMime(ext)
		entry.Links = append(entry.Links,
			atomLink{
				Rel:  "http://opds-spec.org/image",
				Href: base + "/opds/cover/" + b.Key,
				Type: mime,
			},
			atomLink{
				Rel:  "http://opds-spec.org/image/thumbnail",
				Href: base + "/opds/cover/" + b.Key,
				Type: mime,
			},
		)
	}

	return entry
}

// ── OPDS router ───────────────────────────────────────────────────────────────

func opdsHandler(w http.ResponseWriter, r *http.Request) {
	// Auth check
	if !authenticate(r) {
		opdsRequireAuth(w)
		return
	}

	base := getServerOrigin(r)
	path := r.URL.Path

	switch {
	// Root catalog
	case path == "/opds" || path == "/opds/":
		handleOPDSRoot(w, r, base)

	// All books acquisition feed
	case path == "/opds/books":
		handleOPDSBooks(w, r, base, "")

	// Search feed
	case path == "/opds/search":
		q := r.URL.Query().Get("q")
		handleOPDSBooks(w, r, base, q)

	// OpenSearch description
	case path == "/opds/search.xml":
		handleOPDSSearchDesc(w, r, base)

	// Single book feed: /opds/book/{key}
	case strings.HasPrefix(path, "/opds/book/"):
		key := strings.TrimPrefix(path, "/opds/book/")
		key = strings.Trim(key, "/")
		if key == "" {
			http.Error(w, "Missing book key", http.StatusBadRequest)
			return
		}
		handleOPDSBook(w, r, base, key)

	// Cover image: /opds/cover/{key}
	case strings.HasPrefix(path, "/opds/cover/"):
		key := strings.TrimPrefix(path, "/opds/cover/")
		key = strings.Trim(key, "/")
		if key == "" {
			http.Error(w, "Missing book key", http.StatusBadRequest)
			return
		}
		handleOPDSCover(w, r, key)

	// Book file download: /opds/download/{key}.{format}
	case strings.HasPrefix(path, "/opds/download/"):
		filename := strings.TrimPrefix(path, "/opds/download/")
		filename = strings.Trim(filename, "/")
		// Strip extension to get key
		key := filename
		if idx := strings.LastIndex(filename, "."); idx > 0 {
			key = filename[:idx]
		}
		if key == "" {
			http.Error(w, "Missing book key", http.StatusBadRequest)
			return
		}
		handleOPDSDownload(w, r, key)

	default:
		http.Error(w, "Not Found", http.StatusNotFound)
	}
}
