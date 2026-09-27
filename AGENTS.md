<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project documentation

Before adding, moving, or reviewing application code, read and follow
[`docs/FSD_ARCHITECTURE.md`](docs/FSD_ARCHITECTURE.md).

- When creating or reviewing reusable UI components, read and follow
  [`docs/COMMON_COMPONENT_RULES.md`](docs/COMMON_COMPONENT_RULES.md).
- When implementing or reviewing service-wide behavior and UI policies, read and
  follow [`docs/SERVICE_COMMON_RULES.md`](docs/SERVICE_COMMON_RULES.md).

- New application code must follow the documented Feature-Sliced Design layers,
  import direction, and public API rules.
- Keep the root `app/` directory as a thin Next.js App Router adapter. Put product
  code in the FSD structure under `src/`.
- Respect the Server/Client module boundary and the separate ownership of the
  Next.js server cache and TanStack Query browser cache.
- Send API-specific request DTOs directly. Handle successful responses as
  `ApiResponse<T>` (`code`, `message`, `data`), and handle failures using RFC
  9457 Problem Details with the service `code` (`DOMAIN-HTTP-NNN`).
- Use only the approved project stack unless the user explicitly approves a
  change.
