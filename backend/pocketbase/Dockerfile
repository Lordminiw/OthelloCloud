FROM golang:1.25-alpine AS builder

ARG POCKETBASE_VERSION=v0.38.0

RUN apk add --no-cache git

WORKDIR /src
RUN git clone --depth 1 --branch ${POCKETBASE_VERSION} https://github.com/pocketbase/pocketbase.git .

WORKDIR /src/examples/base
ARG TARGETARCH
RUN set -eux; \
  case "$TARGETARCH" in \
    amd64) export GOARCH=amd64 ;; \
    arm64) export GOARCH=arm64 ;; \
    arm) export GOARCH=arm; export GOARM=7 ;; \
    "") export GOARCH=amd64 ;; \
    *) echo "Unsupported TARGETARCH: $TARGETARCH"; exit 1 ;; \
  esac; \
  CGO_ENABLED=0 GOOS=linux go build -o /out/pocketbase .

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /pb
COPY --from=builder /out/pocketbase /usr/local/bin/pocketbase
COPY pb_migrations /pb_migrations

VOLUME ["/pb_data"]
EXPOSE 8090

CMD ["pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--migrationsDir=/pb_migrations", "--indexFallback"]
