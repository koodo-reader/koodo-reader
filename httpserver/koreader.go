package main

// KOReader Sync Server – compatible with koreader/koreader-sync-server
//
// Endpoints (all prefixed with no extra path; KOReader hits them directly):
//   POST   /users/create           – register
//   GET    /users/auth             – check credentials
//   PUT    /syncs/progress         – update reading progress
//   GET    /syncs/progress/{doc}   – get reading progress
//   GET    /healthcheck            – liveness probe
//
// Authentication: HTTP headers  x-auth-user  /  x-auth-key
// The client MD5-hashes the password before sending, so we store it as-is.
//
// Persistence: SQLite at /app/uploads/config/koreader.db
//   (the directory is inside the Docker volume /app/uploads)

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

// ── KOReader server state ─────────────────────────────────────────────────────

var (
	koreaderEnabled             bool
	koreaderPort                string
	koreaderDB                  *sql.DB
	koreaderRegistrationEnabled bool
)

func initKoreader() {
	koreaderEnabled = os.Getenv("ENABLE_KOREADER_SERVER") == "true"
	if !koreaderEnabled {
		return
	}

	koreaderPort = getEnv("KOREADER_PORT", "7200")
	koreaderRegistrationEnabled = getEnv("ENABLE_KOREADER_REGISTRATION", "true") != "false"

	// Ensure the config directory exists inside the uploads volume.
	dbDir := filepath.Join(uploadDir, "config")
	if err := os.MkdirAll(dbDir, 0o755); err != nil {
		log.Fatalf("[koreader] Cannot create config directory: %v", err)
	}

	dbPath := filepath.Join(dbDir, "koreader.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("[koreader] Cannot open SQLite database: %v", err)
	}

	// Single-writer; keep a small pool.
	db.SetMaxOpenConns(1)

	if err := koreaderMigrate(db); err != nil {
		log.Fatalf("[koreader] Migration failed: %v", err)
	}
	koreaderDB = db
	log.Printf("[koreader] KOReader Sync Server enabled on port %s", koreaderPort)
	log.Printf("[koreader] Database: %s", dbPath)
}

func koreaderMigrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			username TEXT PRIMARY KEY,
			password TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS progress (
			username   TEXT    NOT NULL,
			document   TEXT    NOT NULL,
			percentage REAL    NOT NULL DEFAULT 0,
			progress   TEXT    NOT NULL DEFAULT '',
			device     TEXT    NOT NULL DEFAULT '',
			device_id  TEXT    NOT NULL DEFAULT '',
			timestamp  INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY (username, document)
		);
	`)
	return err
}

// ── KOReader HTTP mux ─────────────────────────────────────────────────────────

func startKoreaderServer() {
	mux := http.NewServeMux()
	mux.HandleFunc("/users/create", koreaderHandleCreateUser)
	mux.HandleFunc("/users/auth", koreaderHandleAuth)
	mux.HandleFunc("/syncs/progress", koreaderHandleProgress)     // PUT
	mux.HandleFunc("/syncs/progress/", koreaderHandleGetProgress) // GET /syncs/progress/{doc}
	mux.HandleFunc("/healthcheck", koreaderHandleHealthcheck)

	srv := &http.Server{
		Addr:         ":" + koreaderPort,
		Handler:      http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { koreaderRouter(mux, w, r) }),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	log.Printf("[koreader] Listening on :%s", koreaderPort)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("[koreader] Server error: %v", err)
	}
}

// koreaderRouter applies CORS and routes to the inner mux.
func koreaderRouter(mux *http.ServeMux, w http.ResponseWriter, r *http.Request) {
	// CORS
	origin := r.Header.Get("Origin")
	if origin != "" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, x-auth-user, x-auth-key")
		w.Header().Set("Vary", "Origin")
	}
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	mux.ServeHTTP(w, r)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// koreaderWriteJSON writes a JSON response with the given status and body.
func koreaderWriteJSON(w http.ResponseWriter, status int, v any) {
	writeJSON(w, status, v)
}

// koreaderError writes the canonical KOReader error JSON.
func koreaderError(w http.ResponseWriter, status, code int, message string) {
	koreaderWriteJSON(w, status, map[string]any{
		"code":    code,
		"message": message,
	})
}

// koreaderAuthenticateRequest validates x-auth-user / x-auth-key headers
// and returns the username on success, or "" on failure.
func koreaderAuthenticateRequest(r *http.Request) string {
	username := r.Header.Get("x-auth-user")
	password := r.Header.Get("x-auth-key")
	if username == "" || password == "" {
		return ""
	}
	// username must not contain colon (mirrors original key-field validation)
	if strings.Contains(username, ":") {
		return ""
	}
	var stored string
	err := koreaderDB.QueryRow(
		`SELECT password FROM users WHERE username = ?`, username,
	).Scan(&stored)
	if err != nil || stored != password {
		return ""
	}
	return username
}

// ── Handlers ──────────────────────────────────────────────────────────────────

// POST /users/create
// Body (JSON): { "username": "...", "password": "..." }
// Success 201: { "username": "..." }
// Error   402: username already registered
// Error   403: registration disabled / invalid fields
func koreaderHandleCreateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writePlain(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}

	if !koreaderRegistrationEnabled {
		koreaderError(w, 402, 2005, "User registration is disabled.")
		return
	}

	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &body); err != nil || body.Username == "" || body.Password == "" ||
		strings.Contains(body.Username, ":") {
		koreaderError(w, 403, 2003, "Invalid request")
		return
	}

	_, err := koreaderDB.Exec(
		`INSERT INTO users (username, password) VALUES (?, ?)`,
		body.Username, body.Password,
	)
	if err != nil {
		// SQLite UNIQUE constraint violation
		if strings.Contains(err.Error(), "UNIQUE") {
			koreaderError(w, 402, 2002, "Username is already registered.")
			return
		}
		log.Printf("[koreader] create_user error: %v", err)
		koreaderError(w, 502, 2000, "Unknown server error.")
		return
	}

	koreaderWriteJSON(w, http.StatusCreated, map[string]any{
		"username": body.Username,
	})
}

// GET /users/auth
// Headers: x-auth-user, x-auth-key
// Success 200: { "authorized": "OK" }
// Error   401: Unauthorized
func koreaderHandleAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writePlain(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}
	if koreaderAuthenticateRequest(r) == "" {
		koreaderError(w, 401, 2001, "Unauthorized")
		return
	}
	koreaderWriteJSON(w, http.StatusOK, map[string]any{
		"authorized": "OK",
	})
}

// PUT /syncs/progress
// Headers: x-auth-user, x-auth-key
// Body (JSON): { "document": "...", "progress": "...", "percentage": 0.x, "device": "...", "device_id": "..." }
// Success 200: { "document": "...", "timestamp": <unix> }
func koreaderHandleProgress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writePlain(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}

	username := koreaderAuthenticateRequest(r)
	if username == "" {
		koreaderError(w, 401, 2001, "Unauthorized")
		return
	}

	var body struct {
		Document   string  `json:"document"`
		Progress   string  `json:"progress"`
		Percentage float64 `json:"percentage"`
		Device     string  `json:"device"`
		DeviceID   string  `json:"device_id"`
	}
	if err := decodeJSON(r, &body); err != nil {
		koreaderError(w, 403, 2003, "Invalid request")
		return
	}
	if body.Document == "" || strings.Contains(body.Document, ":") {
		koreaderError(w, 403, 2004, "Field 'document' not provided.")
		return
	}
	if body.Progress == "" || body.Device == "" {
		koreaderError(w, 403, 2003, "Invalid request")
		return
	}

	timestamp := time.Now().Unix()

	_, err := koreaderDB.Exec(`
		INSERT INTO progress (username, document, percentage, progress, device, device_id, timestamp)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(username, document) DO UPDATE SET
			percentage = excluded.percentage,
			progress   = excluded.progress,
			device     = excluded.device,
			device_id  = excluded.device_id,
			timestamp  = excluded.timestamp
	`, username, body.Document, body.Percentage, body.Progress, body.Device, body.DeviceID, timestamp)
	if err != nil {
		log.Printf("[koreader] update_progress error: %v", err)
		koreaderError(w, 502, 2000, "Unknown server error.")
		return
	}

	koreaderWriteJSON(w, http.StatusOK, map[string]any{
		"document":  body.Document,
		"timestamp": timestamp,
	})
}

// GET /syncs/progress/{document}
// Headers: x-auth-user, x-auth-key
// Success 200: { "document": "...", "progress": "...", "percentage": 0.x, "device": "...", "device_id": "...", "timestamp": <unix> }
//
//	or: {} when no progress stored yet
func koreaderHandleGetProgress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writePlain(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}

	username := koreaderAuthenticateRequest(r)
	if username == "" {
		koreaderError(w, 401, 2001, "Unauthorized")
		return
	}

	// Extract document from URL: /syncs/progress/{document}
	doc := strings.TrimPrefix(r.URL.Path, "/syncs/progress/")
	doc = strings.TrimSpace(doc)
	if doc == "" || strings.Contains(doc, ":") {
		koreaderError(w, 403, 2004, "Field 'document' not provided.")
		return
	}

	var (
		percentage float64
		progress   string
		device     string
		deviceID   string
		timestamp  int64
	)
	err := koreaderDB.QueryRow(`
		SELECT percentage, progress, device, device_id, timestamp
		FROM progress
		WHERE username = ? AND document = ?
	`, username, doc).Scan(&percentage, &progress, &device, &deviceID, &timestamp)

	if err == sql.ErrNoRows {
		// Return empty object – mirrors the original server behaviour
		koreaderWriteJSON(w, http.StatusOK, map[string]any{})
		return
	}
	if err != nil {
		log.Printf("[koreader] get_progress error: %v", err)
		koreaderError(w, 502, 2000, "Unknown server error.")
		return
	}

	result := map[string]any{
		"document":   doc,
		"percentage": percentage,
		"progress":   progress,
		"device":     device,
		"timestamp":  timestamp,
	}
	if deviceID != "" {
		result["device_id"] = deviceID
	}
	koreaderWriteJSON(w, http.StatusOK, result)
}

// GET /healthcheck
// Returns: { "state": "OK" }
func koreaderHandleHealthcheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writePlain(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}
	koreaderWriteJSON(w, http.StatusOK, map[string]any{"state": "OK"})
}
