# blood-match-api

## Dependency Security Overrides

This project uses npm `overrides` in [package.json](package.json) to patch transitive vulnerabilities without forcing breaking framework changes.

Pinned transitive packages:

- `ajv`: `8.18.0`
- `picomatch`: `4.0.4`
- `path-to-regexp`: `8.4.0`

Why this was done:

- `npm audit fix --force` suggested major package shifts that can introduce breaking changes.
- The overrides resolve the reported advisories while keeping the current NestJS major line intact.

When updating dependencies:

- Run `npm audit` after upgrades.
- Keep or adjust these overrides only if upstream dependencies already include patched versions.

## Run With Docker

1. Review `.env.docker` and change any secrets.
2. Build and start services:

```bash
docker compose up --build
```

3. Access the API at `http://localhost:3000`.
4. Access Swagger at `http://localhost:3000/api`.

To stop services:

```bash
docker compose down
```
