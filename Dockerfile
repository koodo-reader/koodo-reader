FROM node:20-slim as builder
RUN apt-get update && apt-get install -y jq curl wget python3 git
WORKDIR /app

### Get the latest release source code tarball
# RUN tarball_url=$(curl -s https://api.github.com/repos/koodo-reader/koodo-reader/releases/latest | jq -r ".tarball_url") \
#     && wget -qO- $tarball_url \
#     | tar xvfz - --strip 1
RUN git clone https://github.com/koodo-reader/koodo-reader.git . && \
    git checkout master

### --network-timeout 1000000 as a workaround for slow devices
### when the package being installed is too large, Yarn assumes it's a network problem and throws an error
RUN yarn --ignore-scripts --network-timeout 1000000

### Separate `yarn build` layer as a workaround for devices with low RAM.
### If build fails due to OOM, `yarn install` layer will be already cached.
RUN yarn --ignore-scripts\
    && yarn build

### Nginx or Apache can also be used, Caddy is just smaller in size
FROM caddy:latest

# Install Node.js in the Caddy image
RUN apk add --no-cache nodejs npm

# Copy built website files to Caddy
COPY --from=builder /app/build /usr/share/caddy

# Copy httpServer.js
COPY --from=builder /app/httpServer.js /app/httpServer.js

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && \
    chmod 755 /app/uploads

# Expose both Caddy (80) and httpServer (8080) ports
EXPOSE 80 8080

# Create startup script to run both services
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app' >> /start.sh && \
    echo 'node httpServer.js &' >> /start.sh && \
    echo 'caddy run --config /etc/caddy/Caddyfile' >> /start.sh && \
    chmod +x /start.sh

# Set default environment variables (can be overridden at runtime)
ENV SERVER_USERNAME=admin
ENV SERVER_PASSWORD=securePass123
ENV SERVER_PASSWORD_FILE=my_secret

# Define volume for uploads directory
VOLUME ["/app/uploads"]

CMD ["/start.sh"]
