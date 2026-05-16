package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// decodeJSON decodes a JSON request body into v.
func decodeJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}

// ── Configuration ────────────────────────────────────────────────────────────

var (
	uploadDir      string
	port           string
	serverEnabled  bool
	allowedOrigins []string
	credentials    struct{ username, password string }
)

func getDockerSecret(name string) string {
	p := "/run/secrets/" + name
	data, err := os.ReadFile(p)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func init() {
	abs, err := filepath.Abs("./uploads")
	if err != nil {
		log.Fatalf("Cannot resolve uploads path: %v", err)
	}
	uploadDir = abs

	port = getEnv("PORT", "8080")
	serverEnabled = os.Getenv("ENABLE_HTTP_SERVER") == "true"

	// Password: Docker secret > env > default
	secretFile := getEnv("SERVER_PASSWORD_FILE", "my_secret")
	password := getDockerSecret(secretFile)
	source := "Docker Secret"
	if password == "" {
		password = os.Getenv("SERVER_PASSWORD")
		source = "environment variable (less secure)"
	}
	if password == "" {
		password = "securePass123"
		source = "default"
	}
	switch source {
	case "Docker Secret":
		log.Println("Using password from Docker Secret")
	case "environment variable (less secure)":
		log.Println("Warning: Using password from environment variable (less secure)")
	default:
		log.Println("Warning: Using default password. Set Docker Secret or SERVER_PASSWORD environment variable for production.")
	}

	credentials.username = getEnv("SERVER_USERNAME", "admin")
	credentials.password = password

	if os.Getenv("SERVER_USERNAME") == "" {
		log.Println("Warning: Using default username. Set SERVER_USERNAME environment variable for production.")
	}

	// Allowed origins
	raw := os.Getenv("ALLOWED_ORIGINS")
	for _, o := range strings.Split(raw, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			allowedOrigins = append(allowedOrigins, o)
		}
	}
	if len(allowedOrigins) == 0 {
		log.Println("Warning: No ALLOWED_ORIGINS configured. All cross-origin requests will be allowed. " +
			"Set ALLOWED_ORIGINS to a comma-separated list of trusted origins to restrict access.")
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// applyCorsHeaders mirrors the JS implementation. Returns true when CORS is allowed.
func applyCorsHeaders(w http.ResponseWriter, r *http.Request) bool {
	origin := r.Header.Get("Origin")
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if origin == "" {
		return false
	}
	allowed := len(allowedOrigins) == 0 // empty list ⟹ allow all origins
	if !allowed {
		for _, o := range allowedOrigins {
			if o == origin {
				allowed = true
				break
			}
		}
	}
	if allowed {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		return true
	}
	return false
}

func getServerOrigin(r *http.Request) string {
	host := r.Host
	if host == "" {
		return ""
	}
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	} else if fwd := r.Header.Get("X-Forwarded-Proto"); fwd != "" {
		scheme = strings.SplitN(fwd, ",", 2)[0]
		scheme = strings.TrimSpace(scheme)
	}
	return scheme + "://" + host
}

func authenticate(r *http.Request) bool {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return false
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Basic" {
		return false
	}
	decoded, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return false
	}
	pair := strings.SplitN(string(decoded), ":", 2)
	if len(pair) != 2 {
		return false
	}
	return pair[0] == credentials.username && pair[1] == credentials.password
}

// sanitizeFilename keeps only the base name and replaces Windows-illegal chars.
func sanitizeFilename(name string) string {
	base := filepath.Base(name)
	// Replace characters illegal on Windows filesystems
	illegal := `\/:*?"<>|`
	for _, c := range illegal {
		base = strings.ReplaceAll(base, string(c), "_")
	}
	return base
}

// resolveSafePath resolves a path under uploadDir and rejects traversal attempts.
func resolveSafePath(segments ...string) (string, error) {
	args := append([]string{uploadDir}, segments...)
	target := filepath.Join(args...)
	rel, err := filepath.Rel(uploadDir, target)
	if err != nil || strings.HasPrefix(rel, "..") || filepath.IsAbs(rel) {
		return "", fmt.Errorf("Invalid path")
	}
	return target, nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writePlain(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(msg))
}

// ── Handlers ──────────────────────────────────────────────────────────────────

func handleUpload(w http.ResponseWriter, r *http.Request, dirParam string) {
	ct := r.Header.Get("Content-Type")
	mediaType, params, err := mime.ParseMediaType(ct)
	if err != nil || !strings.HasPrefix(mediaType, "multipart/") {
		writePlain(w, http.StatusBadRequest, "Invalid Content-Type. Expected multipart/form-data")
		return
	}
	boundary := params["boundary"]
	if boundary == "" {
		writePlain(w, http.StatusBadRequest, "Missing boundary in Content-Type")
		return
	}

	mr := multipart.NewReader(r.Body, boundary)
	var fileData []byte
	var filename string

	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			writePlain(w, http.StatusBadRequest, "Error reading multipart data")
			return
		}
		fn := part.FileName()
		if fn != "" {
			filename = fn
			fileData, err = io.ReadAll(part)
			if err != nil {
				writePlain(w, http.StatusInternalServerError, "Internal Server Error")
				return
			}
			log.Printf("Found file: %s, size: %d bytes", filename, len(fileData))
		}
		part.Close()
	}

	if fileData == nil || filename == "" {
		writePlain(w, http.StatusBadRequest, "No valid file uploaded")
		return
	}

	safeFilename := sanitizeFilename(filename)
	if safeFilename == "" || safeFilename == "." || safeFilename == ".." {
		writePlain(w, http.StatusBadRequest, "Invalid filename")
		return
	}

	targetDir, err := resolveSafePath(dirParam)
	if err != nil {
		writePlain(w, http.StatusBadRequest, err.Error())
		return
	}
	filePath, err := resolveSafePath(dirParam, safeFilename)
	if err != nil {
		writePlain(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := os.MkdirAll(targetDir, 0o755); err != nil {
		log.Printf("MkdirAll error: %v", err)
		writePlain(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	if err := os.WriteFile(filePath, fileData, 0o644); err != nil {
		log.Printf("File write error: %v", err)
		writePlain(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"filename":  safeFilename,
		"directory": dirParam,
		"message":   "File uploaded successfully",
	})
}

func handleDownload(w http.ResponseWriter, r *http.Request, dirParam string) {
	filename := r.URL.Query().Get("filename")
	if filename == "" {
		writePlain(w, http.StatusBadRequest, "Missing filename parameter")
		return
	}
	safeFilename := sanitizeFilename(filename)
	if safeFilename == "" || safeFilename == "." || safeFilename == ".." {
		writePlain(w, http.StatusBadRequest, "Invalid filename")
		return
	}
	filePath, err := resolveSafePath(dirParam, safeFilename)
	if err != nil {
		writePlain(w, http.StatusBadRequest, err.Error())
		return
	}
	info, err := os.Stat(filePath)
	if os.IsNotExist(err) {
		writePlain(w, http.StatusNotFound, "File not found")
		return
	}
	if err != nil || info.IsDir() {
		writePlain(w, http.StatusBadRequest, "Invalid file")
		return
	}

	encoded := url.PathEscape(safeFilename)
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", info.Size()))
	w.Header().Set("Content-Disposition",
		fmt.Sprintf(`attachment; filename="%s"; filename*=UTF-8''%s`, encoded, encoded))

	f, err := os.Open(filePath)
	if err != nil {
		writePlain(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	defer f.Close()
	_, _ = io.Copy(w, f)
}

func handleDelete(w http.ResponseWriter, r *http.Request, dirParam string) {
	filename := r.URL.Query().Get("filename")
	if filename == "" {
		writePlain(w, http.StatusBadRequest, "Missing filename parameter")
		return
	}
	safeFilename := sanitizeFilename(filename)
	if safeFilename == "" || safeFilename == "." || safeFilename == ".." {
		writePlain(w, http.StatusBadRequest, "Invalid filename")
		return
	}
	filePath, err := resolveSafePath(dirParam, safeFilename)
	if err != nil {
		writePlain(w, http.StatusBadRequest, err.Error())
		return
	}
	info, err := os.Stat(filePath)
	if os.IsNotExist(err) {
		writePlain(w, http.StatusNotFound, "File not found")
		return
	}
	if err != nil {
		writePlain(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !info.Mode().IsRegular() {
		writePlain(w, http.StatusBadRequest, "Target is not a file")
		return
	}
	if err := os.Remove(filePath); err != nil {
		log.Printf("File delete error: %v", err)
		writePlain(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"filename":  safeFilename,
		"directory": dirParam,
		"message":   "File deleted successfully",
	})
}

type fileEntry struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	Size         *int64 `json:"size"`
	ModifiedTime string `json:"modifiedTime"`
	CreatedTime  string `json:"createdTime"`
}

func handleList(w http.ResponseWriter, r *http.Request, dirParam string) {
	targetDir, err := resolveSafePath(dirParam)
	if err != nil {
		writePlain(w, http.StatusBadRequest, err.Error())
		return
	}
	info, err := os.Stat(targetDir)
	if os.IsNotExist(err) {
		writePlain(w, http.StatusNotFound, "Directory not found")
		return
	}
	if err != nil || !info.IsDir() {
		writePlain(w, http.StatusBadRequest, "Target is not a directory")
		return
	}

	entries, err := os.ReadDir(targetDir)
	if err != nil {
		log.Printf("Directory read error: %v", err)
		writePlain(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	list := make([]fileEntry, 0, len(entries))
	for _, e := range entries {
		fi, err := e.Info()
		if err != nil {
			continue
		}
		entry := fileEntry{
			Name:         e.Name(),
			ModifiedTime: fi.ModTime().UTC().Format(time.RFC3339),
		}
		// birthtime: Go's os.FileInfo doesn't expose birthtime cross-platform,
		// so we fall back to ModTime (same behaviour for Linux containers).
		entry.CreatedTime = getBirthtime(fi)
		if e.IsDir() {
			entry.Type = "directory"
		} else {
			entry.Type = "file"
			sz := fi.Size()
			entry.Size = &sz
		}
		list = append(list, entry)
	}

	// Sort: directories first, then alphabetical
	sortFileList(list)

	writeJSON(w, http.StatusOK, map[string]any{
		"success":    true,
		"directory":  dirParam,
		"files":      list,
		"totalCount": len(list),
	})
}

// getBirthtime returns the best available approximation of file creation time.
// Go's os.FileInfo does not expose birthtime in a cross-platform way, so
// ModTime is used as a portable fallback.
func getBirthtime(fi os.FileInfo) string {
	return fi.ModTime().UTC().Format(time.RFC3339)
}

func sortFileList(list []fileEntry) {
	sort.Slice(list, func(i, j int) bool {
		if list[i].Type != list[j].Type {
			return list[i].Type == "directory"
		}
		return list[i].Name < list[j].Name
	})
}

// ── Router ────────────────────────────────────────────────────────────────────

func handler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	serverOrigin := getServerOrigin(r)
	isCrossOrigin := origin != "" && origin != serverOrigin
	corsAllowed := applyCorsHeaders(w, r)

	// Pre-flight
	if r.Method == http.MethodOptions {
		if isCrossOrigin && !corsAllowed {
			writePlain(w, http.StatusForbidden, "Origin not allowed")
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Block disallowed cross-origin requests
	if isCrossOrigin && !corsAllowed {
		writePlain(w, http.StatusForbidden, "Origin not allowed")
		return
	}

	// Basic Auth
	if !authenticate(r) {
		w.Header().Set("WWW-Authenticate", `Basic realm="Secure File Server"`)
		writePlain(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	dirParam := r.URL.Query().Get("dir")
	path := r.URL.Path

	switch {
	case r.Method == http.MethodPost && path == "/upload":
		handleUpload(w, r, dirParam)
	case r.Method == http.MethodGet && path == "/download":
		handleDownload(w, r, dirParam)
	case r.Method == http.MethodDelete && path == "/delete":
		handleDelete(w, r, dirParam)
	case r.Method == http.MethodGet && path == "/list":
		handleList(w, r, dirParam)
	case opdsEnabled && (path == "/opds" || path == "/opds/" || strings.HasPrefix(path, "/opds/")):
		opdsHandler(w, r)
	default:
		writePlain(w, http.StatusNotFound, "Not Found")
	}
}

func main() {
	// Initialise KOReader sync server (reads env, opens DB if enabled).
	initKoreader()

	if !serverEnabled && !koreaderEnabled {
		log.Println("All servers are disabled.")
		log.Println("  Set ENABLE_HTTP_SERVER=true  to enable the file server.")
		log.Println("  Set ENABLE_KOREADER_SERVER=true to enable the KOReader sync server.")
		log.Println("  Set ENABLE_OPDS=true to enable the OPDS catalog (requires ENABLE_HTTP_SERVER=true).")
		os.Exit(0)
	}

	if opdsEnabled && !serverEnabled {
		log.Println("Warning: ENABLE_OPDS=true but ENABLE_HTTP_SERVER is not true. OPDS catalog will not be available.")
	}

	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Fatalf("Cannot create uploads directory: %v", err)
	}

	// Start KOReader sync server in background if enabled.
	if koreaderEnabled {
		go startKoreaderServer()
	}

	// Start the main file server if enabled.
	if serverEnabled {
		addr := ":" + port
		log.Printf("Secure File Server running at http://localhost%s", addr)
		log.Printf("Username: %s", credentials.username)
		log.Println("Password: [HIDDEN FOR SECURITY]")
		if opdsEnabled {
			log.Printf("OPDS catalog available at http://localhost%s/opds", addr)
		}

		srv := &http.Server{
			Addr:         addr,
			Handler:      http.HandlerFunc(handler),
			ReadTimeout:  5 * time.Minute, // allow large uploads
			WriteTimeout: 5 * time.Minute,
			IdleTimeout:  60 * time.Second,
		}
		log.Fatal(srv.ListenAndServe())
	} else {
		// Block forever while the KOReader goroutine runs.
		select {}
	}
}
