---
status: accepted
---

# Secrets are generated locally and never persisted

Every other StarRudder tool keeps its state in the URL and derives reproducible output from a seed, so a result can be shared as a link. The password tool deliberately inverts this: a **Password** or **Passphrase** is the one output where reproducibility equals disclosure, so it exists only in the memory of the current tab — never in a URL, `localStorage`, analytics metadata, or a generation history — while only the generator's settings may be shared. Randomness comes from `crypto.getRandomValues()` with rejection sampling rather than `Math.random()`.

## Considered Options

- Reuse the existing `url-state.ts` + `seeds.ts` convention. Rejected: a link that reproduces a secret is a link that leaks it, and `Math.random()` is not a cryptographic source.
- Generate on a server (as Random.org does). Rejected: it contradicts the site's browser-only promise.

## Consequences

- `src/lib/analytics.ts` is currently a no-op, but a real analytics SDK may be attached later. "No secret in event metadata" must be enforced as a code constraint, not left to an empty function body.
- Requests to share, export, or keep a history of generated secrets should reopen this ADR rather than be treated as small features.
