---
applyTo: "httpserver/**"
---

# Go HTTP Server Guidelines

## Purpose

Review rules for the optional Go server used for KOReader and OPDS integration.

## Code Style

- Follow standard Go formatting (`gofmt`)
- Use clear handler and package names matching existing files (`koreader.go`, etc.)
- Keep HTTP handlers small; extract helpers for OPDS/KOReader logic

## Security Considerations

- Validate request paths and query parameters; prevent directory traversal
- Do not expose arbitrary filesystem access beyond configured library roots
- Review authentication on OPDS endpoints if added or changed
- Avoid logging client credentials or book content at default log levels

## Error Handling

- Return appropriate HTTP status codes with concise error bodies
- Handle server shutdown and connection cleanup gracefully

## Testing Guidelines

- New HTTP handlers should have unit tests covering at least one success and one error path
- OPDS/KOReader endpoint changes need integration-level verification with a real client if feasible

## Performance

- Keep handlers non-blocking; use goroutines for long-running operations
- Avoid loading entire book files into memory for metadata-only responses

## Dependencies

- Update `go.mod` / `go.sum` together when adding modules
- Prefer stdlib where the existing code does; match current dependency choices
