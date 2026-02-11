# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts the Nuxt 4 app. File-based routing lives in `app/pages/`, reusable UI in `app/components/`, styles in `app/assets/`, and shared helpers in `app/utils/`.
- `server/` contains server-side code (API routes, middleware, and runtime utilities).
- `public/` is for static assets served as-is (e.g., `public/robots.txt`).
- `prisma/` holds the database schema (`prisma/schema.prisma`) and migrations. Prisma client output is generated to `app/generated/prisma`.
- Nuxt build artifacts are written to `.nuxt/`.

## Build, Test, and Development Commands
Use Bun as the package manager.
- `bun dev`: start the Nuxt dev server with HMR.
- `bun build`: create a production build.
- `bun generate`: create a static site build (if applicable).
- `bun preview`: serve the production build locally.
- `bunx prisma migrate dev --name <name>`: run local migrations.
- `bunx prisma db push`: sync schema changes without migrations.
- `bunx prisma studio`: open Prisma Studio.
- `bunx prettier --write .`: format the codebase.

## Coding Style & Naming Conventions
- Language stack: TypeScript + Vue 3 (Nuxt 4). Follow Nuxt file-based routing and existing component patterns.
- Indentation: 2 spaces for TS/Vue/CSS (enforced by Prettier).
- Naming: descriptive, PascalCase components (e.g., `MapCard.vue`), route pages under `app/pages/` (e.g., `app/pages/map.vue`).
- Prisma client imports must use: `import { PrismaClient } from "~/generated/prisma"`.

## Testing Guidelines
- No formal test framework is configured. If you add tests, document the framework and add scripts to `package.json`.
- Keep test placement and naming consistent with the chosen framework (e.g., `*.spec.ts`).

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits (e.g., `feat: add map filters`, `fix: handle null coords`).
- PRs should include: a short summary, steps to verify, and screenshots for UI changes.

## Configuration & Environment
- PostgreSQL is required. Set `DATABASE_URL` in your environment before running Prisma commands.
- Ensure generated Prisma artifacts are kept in `app/generated/prisma` and not moved.
