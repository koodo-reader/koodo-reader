FROM node:20-alpine as builder
RUN apk add --no-cache jq curl wget python3 git
WORKDIR /app

RUN wget -qO- https://github.com/koodo-reader/koodo-reader/archive/refs/heads/master.tar.gz \
    | tar xvfz - --strip 1

# Install dependencies and build
RUN yarn --ignore-scripts --network-timeout 1000000 && \
    yarn build && \
    # Clean up build dependencies to reduce layer size
    yarn cache clean && \
    rm -rf node_modules && \
    rm -rf .git

FROM caddy:alpine

# Install only Node.js runtime (no npm/yarn)
RUN apk add --no-cache nodejs

# Copy only necessary files
COPY --from=builder /app/build /usr/share/caddy
COPY --from=builder /app/httpServer.js /app/httpServer.js

# Create uploads directory
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

EXPOSE 80 8080

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app && node httpServer.js &' >> /start.sh && \
    echo 'caddy run --config /etc/caddy/Caddyfile' >> /start.sh && \
    chmod +x /start.sh

ENV SERVER_USERNAME=admin
ENV SERVER_PASSWORD=securePass123
ENV PORT=8080

VOLUME ["/app/uploads"]
CMD ["/start.sh"]