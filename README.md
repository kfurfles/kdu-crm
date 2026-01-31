# crm-kdu

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Fastify, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Fastify** - Fast, low-overhead web framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Node.js** - Runtime environment
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Husky** - Git hooks for code quality
- **PWA** - Progressive Web App support
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Environment Setup

This project uses local `.env` files in each application.

1. Copy `.env.example` to `.env` in each app:

```bash
# Proxy
cp apps/proxy/.env.example apps/proxy/.env

# Server
cp apps/server/.env.example apps/server/.env

# Web
cp apps/web/.env.example apps/web/.env
```

2. Update the values in each `.env` file (especially `DATABASE_URL` in `apps/server/.env`)

3. Apply the schema to your database:

```bash
pnpm run db:push
```

See `ENV_SETUP.md` for detailed configuration guide.

## Development

### Option 1: With Proxy (Recommended for secure development)

The proxy provides a unified entry point with secure httpOnly cookies:

```bash
pnpm run dev:proxy
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

- **Application**: http://localhost:4200
- **API**: http://localhost:4200/api/*
- **RPC**: http://localhost:4200/rpc/*

See `PROXY_MIGRATION.md` for setup details.

### Option 2: Direct Access (Legacy)

Run services individually:

```bash
pnpm run dev
```

- **Web**: http://localhost:3001
- **API**: http://localhost:3000

Note: This requires CORS configuration and uses less secure cookie settings.

## Git Hooks and Formatting

- Initialize hooks: `pnpm run prepare`
- Format and lint fix: `pnpm run check`

## Project Structure

```
crm-kdu/
├── apps/
│   ├── proxy/       # Proxy server (unified entry point)
│   │   ├── .env     # Proxy configuration
│   │   └── .env.example
│   ├── server/      # Backend API (Fastify, oRPC)
│   │   ├── .env     # Server configuration
│   │   └── .env.example
│   └── web/         # Frontend (React + TanStack Router)
│       ├── .env     # Frontend configuration
│       └── .env.example
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   ├── db/          # Database schema & queries
│   └── config/      # Shared TypeScript configuration
```

## Available Scripts

### Development
- `pnpm run dev:proxy`: Start proxy + backend + frontend (recommended)
- `pnpm run dev`: Start all applications in development mode
- `pnpm run dev:web`: Start only the web application
- `pnpm run dev:server`: Start only the server

### Build & Deploy
- `pnpm run build`: Build all applications
- `pnpm run check-types`: Check TypeScript types across all apps

### Database
- `pnpm run db:push`: Push schema changes to database
- `pnpm run db:studio`: Open database studio UI
- `pnpm run db:start`: Start PostgreSQL in Docker
- `pnpm run db:stop`: Stop PostgreSQL container

### Code Quality
- `pnpm run check`: Run Biome formatting and linting
- `pnpm run fix`: Auto-fix formatting and linting issues

### PWA
- `cd apps/web && pnpm run generate-pwa-assets`: Generate PWA assets

## Architecture

This project uses a proxy-based architecture for security and simplicity:

```
Browser → Proxy :4200 → Backend :3000
              ↓
         Frontend :3001
          (dev only)
```

Benefits:
- Secure httpOnly cookies
- No CORS complexity
- Single entry point
- sameSite: strict in production

See `PROXY_MIGRATION.md` for migration details.
