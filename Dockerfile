FROM node:17-slim as builder
RUN apt-get update && apt-get install -y jq curl wget python
WORKDIR /app

### Get the latest release source code tarball
RUN tarball_url=$(curl -s https://api.github.com/repos/troyeguo/koodo-reader/releases/latest | jq -r ".tarball_url") \
    && wget -qO- $tarball_url \
    | tar xvfz - --strip 1

### --network-timeout 1000000 as a workaround for slow devices
### when the package being installed is too large, Yarn assumes it's a network problem and throws an error
RUN yarn --network-timeout 1000000

### Separate `yarn build` layer as a workaround for devices with low RAM.
### If build fails due to OOM, `yarn install` layer will be already cached.
RUN yarn build

### Nginx or Apache can also be used, Caddy is just smaller in size
FROM caddy:latest
COPY --from=builder /app/build /usr/share/caddy