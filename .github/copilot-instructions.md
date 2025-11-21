# Copilot Instructions
## Repo Map & Ownership
- Workspace combines the lightweight `stash-plugin-version-links` plugin and the full `stash` app; keep their histories isolated when committing, and treat the `stash/` tree as **read-only reference** while working on the plugin repo.
- `stash/cmd/stash` boots the Go server and wires together config, logging, manager, API, and embedded UI assets.
- `stash/internal` holds domain logic (API resolvers, manager, build, desktop, identify, DLNA, etc.), while `stash/pkg` contains reusable helpers (db/sqlite, ffmpeg, plugin abstractions, hashing, exec wrappers).
- `stash/ui/v2.5` is the React/Vite frontend that consumes the GraphQL schema in `graphql/schema` and ships via `ui/ui.go`'s `go:embed`.
- `stash-plugin-version-links/main.js` is a browser-side enhancement loaded via `plugin-version-links.yml` and indexed through `index.yml` for distribution.
## Backend Fundamentals (stash)
- GraphQL schema lives under `graphql/schema` and `graphql/schema/types`; `gqlgen.yml` maps it to generated Go in `internal/api`, so schema changes require `make generate` (runs `go run github.com/99designs/gqlgen`).
- Resolvers in `internal/api` should delegate to `internal/manager` services rather than hitting storage directly; manager orchestrates jobs, scrapers, and config to keep business rules centralized.
- Database access is via `pkg/sqlite` with migrations under `pkg/sqlite/migrations`; never mutate schema outside migrations.
- Long-running operations (scan, identify, transcode) are task objects under `internal/manager/task` that accept options structs; follow those patterns for new jobs.
- Auxiliary binaries (e.g., `cmd/phasher`) share packages from `pkg/hash` and `pkg/models`; prefer extending shared packages over duplicating logic.
## Frontend/UI Expectations
- UI uses React 17 + TypeScript with Vite; scripts defined in `ui/v2.5/package.json` rely on pnpm/corepack (run `make pre-ui` once to install).
- GraphQL operations are defined alongside components and generated via `npm run gqlgen`, which outputs typed hooks; every backend schema change needs regenerated UI types.
- Styling mixes SCSS modules and Bootstrap 4; linting uses ESLint + Stylelint + Prettier via `npm run validate`.
- Built assets publish to `ui/v2.5/build` and are embedded by `go:embed`; altering static paths requires mirroring updates in `ui/ui.go`.
- Internationalization strings live in `ui/v2.5/src/locales`; the `extract` script updates message catalogs, so keep IDs stable.
## Build/Test Workflows
- `make server-start` spins up a dev backend using `.local` for data; stop with Ctrl+C and reset using `make server-clean`.
- `make ui-start` runs the Vite dev server (default `http://localhost:3000`) against the running backend; set `VITE_APP_PLATFORM_URL` to target a different API origin (without auth cookies).
- `make validate` aggregates Go unit tests, lints, and UI checks; run before PRs to match CI.
- For focused Go work, use `make fmt`, `make lint`, and `go test ./...`; UI-only changes should run `npm run validate` inside `ui/v2.5`.
- Release builds follow `make pre-ui`, `make generate`, `make ui`, `make build-release`; cross-compiles are done inside `docker/compiler` per `docs/DEVELOPMENT.md`.
## Plugin Version Links repo
- `main.js` runs in the Stash browser session, observing DOM mutations to link plugin versions to GitHub URLs; keep it dependency-free and compatible with the shipped Stash UI structure.
- Only GitHub URLs are linkified by design (`/^https?:\/\/github\.com\//i` guard); extend cautiously to avoid exposing arbitrary links.
- The plugin manifest `plugin-version-links.yml` declares `ui.javascript` assets and version metadata consumed by Stash; its `version` must match the ZIP name and index entry.
- `index.yml` is the plugin source catalog users add to Stash; update `version`, `date`, `path`, `sha256`, and `metadata.url` whenever releasing.
- Release artifacts live under `dist/` (minified JS plus `plugin-version-links-<version>.zip`); regenerate the ZIP before cutting a release and recompute its SHA256 for `index.yml`.
## Cross-cutting Practices & Gotchas
- Enable logging early when debugging backend issues (`cmd/stash/main.go` writes to config-selected files); desktop builds surface fatal errors via `internal/desktop` dialogs.
- Many packages use `go:generate` (e.g., GraphQL, locale assets); run `go generate ./...` or the specific `make` target when touching files with directives.
- UI/Go GraphQL structs must stay in sync; changing enums or field names may require manual overrides in `gqlgen.yml` and UI fragments.
- Large file operations rely on FFmpeg and external binaries configured via `internal/manager/config`; keep those defaults intact unless you understand downstream scripts like `scripts/generate_icons.sh`.
- Plugin repo shares no tooling with the main app; avoid introducing build steps that assume Go or pnpm—ship plain JS/CSS for maximum compatibility.
