# Cloudflare-Only Deploy Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unused public/DDNS deployment path so the repository documents and ships only the Cloudflare-based deployment flow.

**Architecture:** This cleanup removes the isolated public deployment compose file and support directory, then updates repository documentation to describe only the base Docker stack and the Cloudflare overlay. Because this is a deletion-and-docs change, verification focuses on reference scanning rather than runtime behavior tests.

**Tech Stack:** Git, Docker Compose YAML, Markdown documentation

---

### Task 1: Remove obsolete public deployment assets

**Files:**
- Delete: `docker-compose.public.yml`
- Delete: `deploy/public/.env.example`
- Delete: `deploy/public/Caddyfile`
- Delete: `deploy/public/Dockerfile`
- Delete: `deploy/public/ddns-updater/data/config.json.example`

- [ ] **Step 1: Delete the public deployment files**

Remove the files listed above so the repository no longer contains the public/DDNS deployment path.

- [ ] **Step 2: Delete empty public deployment directories**

Remove `deploy/public/ddns-updater/data`, `deploy/public/ddns-updater`, and `deploy/public` if they are empty after file deletion.

- [ ] **Step 3: Verify the files are gone**

Run: `git status --short`
Expected: deleted entries for the removed public deployment files

### Task 2: Update repository documentation

**Files:**
- Modify: `README.md`
- Review: `documentation/branch-retained-steps.md`

- [ ] **Step 1: Rewrite deployment docs in `README.md`**

Keep the local Docker and Cloudflare instructions, but remove any implication that a separate public/DDNS deployment path still exists in the repository.

- [ ] **Step 2: Check for lingering references**

Run:

```bash
rg -n "docker-compose\.public|deploy/public|ddns-updater" README.md documentation docs .
```

Expected: no matches in active deployment docs or source files

- [ ] **Step 3: Confirm `documentation/branch-retained-steps.md` does not require updates**

Leave it unchanged if it is just historical notes and not active user-facing deployment guidance.

### Task 3: Verify cleanup

**Files:**
- Review: `git diff`

- [ ] **Step 1: Inspect final diff**

Run: `git diff -- README.md docker-compose.public.yml deploy/public docs/superpowers/plans/2026-06-10-cloudflare-only-deploy-cleanup.md`
Expected: removals of the public deploy path, README alignment, and the saved plan

- [ ] **Step 2: Commit when ready**

```bash
git add README.md docs/superpowers/plans/2026-06-10-cloudflare-only-deploy-cleanup.md
git add -u
git commit -m "chore: remove unused public deployment path"
```
