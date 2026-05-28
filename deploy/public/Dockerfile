FROM caddy:2.8-builder-alpine AS builder

RUN xcaddy build --with github.com/caddy-dns/porkbun@v0.2.1

FROM caddy:2.8-alpine

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
