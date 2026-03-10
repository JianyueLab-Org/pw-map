# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Nuxt 4 application code.
- `app/pages/`: file-based routes (for example, `app/pages/map.vue`).
- `app/components/`: reusable Vue components (PascalCase, e.g., `MapCard.vue`).
- `app/assets/`: styles and bundled assets.
- `app/utils/`: shared client helpers.
- `server/`: API routes, middleware, and server runtime utilities.
- `public/`: static files served as-is (for example, `public/robots.txt`).
- `prisma/`: schema and migrations (`prisma/schema.prisma`). Generated Prisma client is in `app/generated/prisma`.

## Build, Test, and Development Commands

Use Bun for package management and scripts.

- `bun dev`: run Nuxt in development with HMR.
- `bun build`: create a production build.
- `bun preview`: serve the production build locally.
- `bun generate`: generate a static build when needed.
- `bunx prisma migrate dev --name <name>`: create/apply local migrations.
- `bunx prisma db push`: sync schema without creating migrations.
- `bunx prisma studio`: open Prisma Studio.
- `bunx prettier --write .`: format the codebase.

## Coding Style & Naming Conventions

- Stack: TypeScript + Vue 3 on Nuxt 4.
- Indentation: 2 spaces (TS, Vue, CSS), enforced by Prettier.
- Follow Nuxt routing and established component patterns.
- Use descriptive names; components in PascalCase.
- Prisma imports must use:
  `import { PrismaClient } from "~/generated/prisma"`.

## Testing Guidelines

- No test runner is currently configured.
- If adding tests, also add scripts in `package.json` and document usage in the PR.
- Prefer `*.spec.ts` naming and keep placement consistent with the selected framework.

## Commit & Pull Request Guidelines

- Use Conventional Commits (for example, `feat: add map filters`, `fix: handle null coords`).
- PRs should include:
  - concise summary,
  - verification steps,
  - screenshots for UI changes.

## Configuration & Environment

- PostgreSQL is required; set `DATABASE_URL` before Prisma commands.
- Keep generated Prisma artifacts under `app/generated/prisma`.
