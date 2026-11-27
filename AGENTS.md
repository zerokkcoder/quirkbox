<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues and specs live in this repo's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles map 1:1 to GitHub labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Shipping checks

SEO metadata is snapshotted in `scripts/seo-baseline.json`. When you change copy under `messages/` or a page's `generateMetadata`, refresh it with `npm run seo:audit:baseline` before committing — the pre-commit gate rejects a drifted baseline.

A long-running `next build` can be killed when the tool's output stream drops; that clears `.next/BUILD_ID` and aborts the commit. Rerun the build with buffered output, confirm `BUILD_ID` is newer than every staged file, then commit so the hook reuses it.
