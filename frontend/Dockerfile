# syntax=docker/dockerfile:1.7
FROM node:20.19.4-bookworm-slim AS build

WORKDIR /app

ARG EXPO_PUBLIC_POCKETBASE_URL=/
ENV EXPO_PUBLIC_POCKETBASE_URL=${EXPO_PUBLIC_POCKETBASE_URL}
ENV npm_config_audit=false
ENV npm_config_fund=false
ENV npm_config_update_notifier=false

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx expo export --platform web

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
