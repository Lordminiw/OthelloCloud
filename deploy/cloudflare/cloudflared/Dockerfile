FROM alpine:3.20

RUN apk add --no-cache ca-certificates curl

RUN set -eux; \
    curl -fsSL -o /usr/local/bin/cloudflared \
      https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-armhf; \
    chmod +x /usr/local/bin/cloudflared

ENTRYPOINT ["/usr/local/bin/cloudflared"]
