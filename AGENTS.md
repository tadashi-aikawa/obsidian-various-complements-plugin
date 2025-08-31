# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript source.
  - `src/main.ts`: Obsidian plugin entry.
  - `src/ui/`: Svelte UI components.
  - `src/provider/`, `src/tokenizer/`, `src/util/`, `src/setting/`: core logic and helpers.
- Root artifacts: `manifest.json`, `styles.css`, bundled `main.js`.
- Tests: colocated `*.test.ts` next to sources (e.g., `src/util/strings.test.ts`).

## Build, Test, and Development Commands
- `pnpm dev`: Start esbuild in watch mode. Copies `main.js`, `manifest.json`, `styles.css` to your Obsidian vault if `VAULT_DIR` in `esbuild.config.mjs` is set.
- `pnpm build`: Type-check then production bundle to `main.js`.
- `pnpm typecheck`: Run TypeScript in strict mode without emit.
- `pnpm test` | `pnpm test:watch`: Run Jest tests (with coverage by default).
- `pnpm format`: Prettier check for `*.ts` files.
- `pnpm run ci`: Install, build, and test (used by CI/Release).

## Coding Style & Naming Conventions
- Language: TypeScript (strict). UI in Svelte where applicable.
- Formatting: Prettier with `prettier-plugin-organize-imports` (run `pnpm format`).
- Indentation: Prettier defaults (2 spaces). Avoid inline `any` and prefer explicit types.
- Names: `PascalCase` for types/classes, `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for constants.
- File names: `kebab-case.ts`; tests as `name.test.ts` colocated with the unit under test.

## Testing Guidelines
- Framework: Jest via `esbuild-jest` transform.
- Location: colocated `*.test.ts` near sources.
- Coverage: `pnpm test` generates coverage; keep or improve existing coverage.
- Test style: small, focused cases; prefer deterministic inputs; mock Obsidian APIs as needed.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat:`, `fix:`, `build:`, `style:`). Releases are automated via semantic‑release.
- PR policy: This project generally does not accept PRs except obvious bug fixes, typos/docs, or items explicitly requested in issues/discussions (see `pull_request_template.md`). Open an issue/discussion first.
- PR content: clear description, linked issue, reproduction or before/after notes; attach screenshots only for UI-facing changes.

## Security & Configuration Tips
- Local dev vault: set `VAULT_DIR` in `esbuild.config.mjs` to your Obsidian vault to enable hot-copying during `pnpm dev`.
- External modules: Obsidian and Node builtins are marked external in bundling; avoid relying on unavailable runtime modules.
- Requirements: Node.js 22 (`.mise.toml`), `pnpm` via `corepack`.
