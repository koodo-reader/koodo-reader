FROM node:20-slim as builder
RUN apt-get update && apt-get install -y jq curl wget python3
WORKDIR /app

### Get the latest release source code tarball
RUN tarball_url=$(curl -s https://api.github.com/repos/koodo-reader/koodo-reader/releases/latest | jq -r ".tarball_url") \
    && wget -qO- $tarball_url \
    | tar xvfz - --strip 1

### --network-timeout 1000000 as a workaround for slow devices
### when the package being installed is too large, Yarn assumes it's a network problem and throws an error
RUN yarn --ingore-optional --network-timeout 1000000 && sed 's/^#include .nan_scriptorigin\\.h./\\/\\/ #include nan_scriptorigin.h/' ./node_modules/nan/nan.h > ./node_modules/nan/nan.h.new && mv ./node_modules/nan/nan.h.new ./node_modules/nan/nan.h && electron-builder install-app-deps

### Separate `yarn build` layer as a workaround for devices with low RAM.
### If build fails due to OOM, `yarn install` layer will be already cached.
RUN yarn --ingore-optional\
    && yarn build

### Nginx or Apache can also be used, Caddy is just smaller in size
FROM caddy:latest
COPY --from=builder /app/build /usr/share/caddy