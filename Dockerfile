# ── Stage 1: Final image ─────────────────────────────────────────────────────
# React app is pre-built in CI (native runner) and Go binary is cross-compiled
# in CI, so no build stages are needed here. This eliminates all QEMU-emulated
# build overhead when targeting linux/arm64.
### Nginx or Apache can also be used, Caddy is just smaller in size
FROM caddy:latest

# Copy pre-built website files (built by CI runner, platform-independent)
COPY build/ /usr/share/caddy

# Copy pre-compiled Go binary for the target platform
ARG TARGETARCH
COPY httpserver/httpserver-linux-${TARGETARCH} /app/httpserver

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
ENV ENABLE_KOREADER_REGISTRATION=true
ENV ENABLE_OPDS=false

# Define volume for uploads directory
VOLUME ["/app/uploads"]

CMD ["/start.sh"]
