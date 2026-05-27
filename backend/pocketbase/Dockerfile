FROM alpine:3.20

ARG POCKETBASE_VERSION=0.38.0
ARG TARGETARCH

RUN apk add --no-cache ca-certificates curl unzip tzdata

WORKDIR /pb

RUN set -eux; \
  case "$TARGETARCH" in \
    amd64) ARCH="amd64" ;; \
    arm64) ARCH="arm64" ;; \
    arm) ARCH="armv7" ;; \
    "") ARCH="armv7" ;; \
    *) echo "Unsupported TARGETARCH: $TARGETARCH"; exit 1 ;; \
  esac; \
  curl -fsSL -o /tmp/pocketbase.zip \
    "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_${ARCH}.zip"; \
  unzip /tmp/pocketbase.zip -d /pb; \
  chmod +x /pb/pocketbase; \
  rm /tmp/pocketbase.zip

VOLUME ["/pb_data"]
EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--migrationsDir=/pb_migrations", "--indexFallback"]
