# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 4 application called "Postal Wiki Map" - a mapping application for managing postal/location data. The project uses:

- **Framework**: Nuxt 4 with Vue 3 and TypeScript
- **UI Library**: Nuxt UI (configured with custom color variants)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4

## Development Commands

### Running the Application

```bash
bun dev          # Start development server
bun build        # Build for production
bun generate     # Generate static site
bun preview      # Preview production build
```

### Database Operations

```bash
# Prisma commands (use with prisma.config.ts)
bunx prisma migrate dev   # Create and apply migrations
bunx prisma migrate dev --name <name>  # Named migration
bunx prisma db push       # Push schema changes to database
bunx prisma studio        # Open Prisma Studio
bunx prisma generate      # Generate Prisma Client (outputs to app/generated/prisma)
```

### Code Quality

```bash
bunx prettier --write .   # Format code
```

## Architecture

### Project Structure

```
app/
├── app.vue           # Root component with VApp wrapper
├── app.config.ts     # Nuxt UI custom configuration (colors, variants)
├── pages/            # File-based routing
├── assets/style/     # Global styles (Tailwind imports)
└── generated/prisma/ # Auto-generated Prisma Client

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```

### Database Schema

The application uses a single `Posts` model with location-related data:

- **Coordinates**: Stored as string
- **Core fields**: name, address, description, user, pickupTime, station
- **Metadata**: stamp, zipcode (Int), status (Int), format (Int)
- **Timestamps**: createdAt, updatedAt
- **Table name**: Mapped to `posts` table in PostgreSQL

### Prisma Configuration

- Schema path: `prisma/schema.prisma`
- Client output: `app/generated/prisma` (non-standard location)
- Datasource URL: Loaded from `DATABASE_URL` environment variable
- Config file: `prisma.config.ts`

### Nuxt UI Customization

The app uses custom Nuxt UI variants defined in `app/app.config.ts`:

- **Primary color**: Red
- **Custom card variants**: `authn-card`, `no-bg`
- **Custom pageCard variants**: `no-bg`

## Important Notes

- The Prisma Client is generated to a **non-standard location** (`app/generated/prisma`) instead of the default `node_modules/.prisma/client`. When importing Prisma Client, use: `import { PrismaClient } from '~/generated/prisma'`
- The project uses **Bun** as the package manager (referenced in README.md)
- Nuxt 4 uses project references in tsconfig.json - actual TypeScript configs are in `.nuxt/` directory
- Tailwind CSS v4 is imported via Vite plugin, not as PostCSS plugin
