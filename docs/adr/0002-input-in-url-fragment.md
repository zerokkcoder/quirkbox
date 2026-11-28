---
status: accepted
---

# Tool input lives in the URL fragment, never in the query string

Every other StarRudder tool keeps its shareable state in URL query parameters through `src/lib/url-state.ts`, and the password tool deliberately keeps its result entirely in memory (ADR-0001). The timestamp tool needs a third shape: a colleague should be able to open a link and see the same **Instant**, while a timestamp pasted from a production log, a trace, or a JWT claim must never reach a server. We therefore store the input in the URL **fragment** (`#v=...`), which browsers never send in an HTTP request, and read it only on the client inside an effect. The value never enters `searchParams`, analytics metadata, `localStorage`, or server-visible history.

## Considered Options

- Query parameter (`?v=...`) using the existing `url-state.ts` convention. Rejected: Next.js server components receive `searchParams`, so a pasted value would appear in server requests and logs. Conversion itself is still local, but that contradicts the site's "0 uploads" promise in a way a reader would reasonably call a leak.
- No URL state at all, as in ADR-0001. Rejected: a **Unix Timestamp** is not a secret, and a reproducible, shareable instant is a real developer need. Here reproducibility does not equal disclosure.

## Consequences

- `ShareToXButton` keeps linking to the fixed tool page. The fragment is a user-side permalink, not a marketing URL, and the share intent must not carry the input.
- The fragment is read and written client-side (`location.hash` + `hashchange`), never through `useSearchParams`; SSR renders a skeleton so the current time and the input never cause a hydration mismatch.
- `src/lib/analytics.ts` is a no-op today, but `docs/funy-tool-tech-stack-plan.md` plans a real SDK. "No input value in event metadata" must be enforced as a code constraint, not left to an empty function body.
- Moving to query parameters, adding conversion history, or exporting pasted inputs should reopen this ADR rather than be treated as small features.
