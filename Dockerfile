# ── Stage 1: Build the React/web app ─────────────────────────────────────────
FROM node:20-slim AS web-builder
WORKDIR /app

# Copy dependency manifests first for better layer caching:
# this layer is only invalidated when package.json / yarn.lock changes.
COPY package.json yarn.lock ./

### --network-timeout 1000000 as a workaround for slow devices
RUN yarn --ignore-scripts --network-timeout 1000000

# Copy the rest of the source code and build
COPY . .

### Separate `yarn build` layer as a workaround for devices with low RAM.
### If build fails due to OOM, `yarn install` layer will be already cached.
RUN yarn --ignore-scripts \
    && yarn build

# ── Stage 2: Build the Go file server ────────────────────────────────────────
FROM golang:1.25-alpine AS go-builder
WORKDIR /build
COPY httpserver/ .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o httpserver .

# ── Stage 3: Final image ──────────────────────────────────────────────────────
### Nginx or Apache can also be used, Caddy is just smaller in size
FROM caddy:latest

# Copy built website files to Caddy
COPY --from=web-builder /app/build /usr/share/caddy

# Copy compiled Go binary
COPY --from=go-builder /build/httpserver /app/httpserver

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && \
    chmod 755 /app/uploads

# Expose both Caddy (80), httpServer (8080), and KOReader sync server (7200) ports
EXPOSE 80 8080 7200

# Create startup script to run both services
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app' >> /start.sh && \
    echo '/app/httpserver &' >> /start.sh && \
    echo 'caddy run --config /etc/caddy/Caddyfile' >> /start.sh && \
    chmod +x /start.sh

# Set default environment variables (can be overridden at runtime)
ENV ENABLE_HTTP_SERVER=false
ENV SERVER_USERNAME=admin
ENV SERVER_PASSWORD=securePass123
ENV SERVER_PASSWORD_FILE=my_secret
ENV ENABLE_KOREADER_SERVER=false
ENV KOREADER_PORT=7200
ENV KOREADER_ENABLE_REGISTRATION=true

# Define volume for uploads directory
VOLUME ["/app/uploads"]

CMD ["/start.sh"]
