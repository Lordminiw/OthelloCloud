# Development workflow

Use `main` as the stable branch for the working Docker deployment. Use `dev` for local feature work and site expansion.

## Branches

Start feature work from `dev`:

```bash
git switch main
git pull
git switch dev
git merge main
```

When a feature is ready for the production Docker version, merge `dev` back into `main`:

```bash
git switch main
git pull
git merge dev
```

## Local frontend development

Install dependencies and start Expo locally:

```bash
cd frontend
npm install
npm run web
```

Set the PocketBase URL in `frontend/.env`:

```bash
EXPO_PUBLIC_POCKETBASE_URL=http://localhost:8090
```

Use a local PocketBase instance or the current running backend while you build and test features. Keep experiments out of production data unless you specifically want to test against it.

## Pre-merge checks

Before merging `dev` back to `main`, run:

```bash
cd frontend
npm run lint
npx tsc --noEmit
```

After merging to `main`, build and start the production Docker stack from `main`:

```bash
git switch main
docker compose up --build -d
```
