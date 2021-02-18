FROM node:lts-stretch
WORKDIR /app
ADD . .
RUN yarn ; yarn build

FROM nginx:stable
WORKDIR /app
COPY --from=0 /app/build /usr/share/nginx/html