#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$REPO_ROOT" ]]; then
  echo "Error: could not find a git repository from script location: $SCRIPT_DIR" >&2
  exit 1
fi

cd "$REPO_ROOT"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: expected to run on branch 'main', but found '$CURRENT_BRANCH'." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit, stash, or remove local changes before deploying." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not on PATH." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: docker compose is not available." >&2
  exit 1
fi

echo "Fetching latest changes from origin..."
git fetch origin

LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git rev-parse origin/main)"

if [[ "$LOCAL_HEAD" == "$REMOTE_HEAD" ]]; then
  echo "main is already up to date with origin/main."
else
  echo "Fast-forwarding main to origin/main..."
  git merge --ff-only origin/main
fi

echo "Stopping current Cloudflare stack..."
docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml down

echo "Rebuilding and starting Cloudflare stack..."
docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml up --build -d

echo "Deploy complete."
