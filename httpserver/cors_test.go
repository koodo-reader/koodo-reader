package main

import (
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

func withAllowedOrigins(t *testing.T, origins []string) {
	t.Helper()
	prev := allowedOrigins
	allowedOrigins = origins
	t.Cleanup(func() { allowedOrigins = prev })
}

func TestParseAllowedOrigins(t *testing.T) {
	got := parseAllowedOrigins(" https://a.example/ , HTTP://B.EXAMPLE:3000,*,  ")
	want := []string{"https://a.example", "http://b.example:3000"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("parseAllowedOrigins = %#v, want %#v", got, want)
	}

	if got := parseAllowedOrigins(" , "); len(got) != 0 {
		t.Fatalf("parseAllowedOrigins of blank value = %#v, want empty", got)
	}
}

func TestBuildAllowedOrigins(t *testing.T) {
	got := buildAllowedOrigins("")
	if !reflect.DeepEqual(got, defaultAllowedOrigins) {
		t.Fatalf("buildAllowedOrigins(\"\") = %#v, want defaults", got)
	}

	got = buildAllowedOrigins("https://reader.example.com/ ,*,https://web.koodoreader.com")
	want := []string{
		"https://web.koodoreader.com",
		"https://web.koodoreader.cn",
		"https://reader.example.com",
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("buildAllowedOrigins = %#v, want %#v", got, want)
	}
}

func TestHandlerRejectsUnknownOrigin(t *testing.T) {
	withAllowedOrigins(t, buildAllowedOrigins(""))

	req := httptest.NewRequest(http.MethodGet, "/list?dir=book", nil)
	req.Header.Set("Origin", "https://attacker.example")
	req.SetBasicAuth(credentials.username, credentials.password)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unknown origin reflected: %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "" {
		t.Fatalf("credentials header set for unknown origin: %q", got)
	}
}

func TestHandlerRejectsUnknownOriginPreflight(t *testing.T) {
	withAllowedOrigins(t, buildAllowedOrigins(""))

	req := httptest.NewRequest(http.MethodOptions, "/delete", nil)
	req.Header.Set("Origin", "https://attacker.example")
	req.Header.Set("Access-Control-Request-Method", "DELETE")
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unknown origin reflected: %q", got)
	}
}

func TestHandlerAllowsAllowlistedOrigin(t *testing.T) {
	withAllowedOrigins(t, buildAllowedOrigins("https://reader.example.com"))

	req := httptest.NewRequest(http.MethodGet, "/not-a-route", nil)
	req.Header.Set("Origin", "https://reader.example.com")
	req.SetBasicAuth(credentials.username, credentials.password)
	rec := httptest.NewRecorder()
	handler(rec, req)

	// Passed the origin check and Basic auth, then fell through to 404.
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "https://reader.example.com" {
		t.Fatalf("Access-Control-Allow-Origin = %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Fatalf("Access-Control-Allow-Credentials = %q", got)
	}
}

func TestHandlerAllowsRequestsWithoutOrigin(t *testing.T) {
	withAllowedOrigins(t, buildAllowedOrigins(""))

	req := httptest.NewRequest(http.MethodGet, "/not-a-route", nil)
	req.SetBasicAuth(credentials.username, credentials.password)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unexpected Access-Control-Allow-Origin: %q", got)
	}
}

func TestHandlerAllowsConfiguredAndDefaultOrigins(t *testing.T) {
	withAllowedOrigins(t, buildAllowedOrigins("https://reader.example.com"))

	for _, origin := range []string{"https://reader.example.com", "https://web.koodoreader.com", "https://web.koodoreader.cn"} {
		req := httptest.NewRequest(http.MethodGet, "/not-a-route", nil)
		req.Header.Set("Origin", origin)
		rec := httptest.NewRecorder()
		handler(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("%s: status = %d, want 401 from auth (origin accepted)", origin, rec.Code)
		}
		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != origin {
			t.Fatalf("%s: Access-Control-Allow-Origin = %q", origin, got)
		}
	}
}

func TestKoreaderRouterOriginPolicy(t *testing.T) {
	withAllowedOrigins(t, buildAllowedOrigins(""))
	mux := http.NewServeMux()
	mux.HandleFunc("/healthcheck", koreaderHandleHealthcheck)

	// Unknown browser origin: rejected before reaching the handler.
	req := httptest.NewRequest(http.MethodGet, "/healthcheck", nil)
	req.Header.Set("Origin", "https://attacker.example")
	rec := httptest.NewRecorder()
	koreaderRouter(mux, rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unknown origin reflected: %q", got)
	}

	// Allowlisted browser origin: served with CORS headers.
	req = httptest.NewRequest(http.MethodGet, "/healthcheck", nil)
	req.Header.Set("Origin", "https://web.koodoreader.cn")
	rec = httptest.NewRecorder()
	koreaderRouter(mux, rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "https://web.koodoreader.cn" {
		t.Fatalf("Access-Control-Allow-Origin = %q", got)
	}

	// Native client (no Origin): served without CORS headers.
	req = httptest.NewRequest(http.MethodGet, "/healthcheck", nil)
	rec = httptest.NewRecorder()
	koreaderRouter(mux, rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unexpected Access-Control-Allow-Origin: %q", got)
	}
}
