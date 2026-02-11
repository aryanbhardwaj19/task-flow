# TaskFlow - Project Management Application

## Overview

TaskFlow is a full-stack project management application built with a Kanban-style task board. It allows users to register/login, create projects, manage tasks across status columns (todo, in_progress, done), invite project members, and configure project settings. The app follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses a three-directory monorepo pattern:
- `client/` — React SPA frontend
- `server/` — Express API backend
- `shared/` — Shared types, schemas, and route definitions used by both client and server

### Frontend Architecture
- **Framework**: React with TypeScript (no SSR, SPA only)
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation via `@hookform/resolvers`
- **Animations**: Framer Motion for Kanban board interactions and page transitions
- **Build Tool**: Vite with HMR in development
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express.js running on Node with TypeScript (via tsx)
- **HTTP Server**: Node's built-in `createServer` wrapping Express
- **Authentication**: JWT-based auth (bcryptjs for password hashing, jsonwebtoken for tokens). Tokens stored in localStorage on the client and sent via `Authorization: Bearer` header.
- **API Design**: RESTful JSON API under `/api/` prefix. Route definitions (paths, input/output schemas) are shared between client and server via `shared/routes.ts`.
- **Storage Layer**: `IStorage` interface in `server/storage.ts` with `DatabaseStorage` implementation. This abstraction allows swapping storage backends.

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver
- **Schema**: Defined in `shared/schema.ts` using Drizzle's `pgTable` definitions
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Schema Validation**: `drizzle-zod` generates Zod schemas from Drizzle table definitions for input validation

### Database Schema
Four tables:
1. **users** — id, username (unique), password (hashed)
2. **projects** — id, name, description, ownerId (FK to users), status (active/archived), createdAt
3. **tasks** — id, title, description, status (todo/in_progress/done), projectId (FK to projects), assigneeId (FK to users, nullable), createdAt
4. **project_members** — id, projectId, userId (many-to-many join table)

Relations are defined using Drizzle's `relations()` helper.

### Shared Route Definitions
`shared/routes.ts` exports an `api` object that defines all API endpoints with their HTTP method, path, Zod input schema, and Zod response schemas. Both client hooks and server routes reference these definitions, ensuring type safety across the stack.

### Build Process
- **Development**: `tsx server/index.ts` runs the server, Vite dev server is set up as middleware for HMR
- **Production Build**: Custom `script/build.ts` uses Vite to build the client and esbuild to bundle the server. Server dependencies are selectively bundled (allowlist) or kept external to optimize cold start times.
- **Output**: Built client goes to `dist/public/`, server bundle to `dist/index.cjs`

### Authentication Flow
1. User registers with username/password → password hashed with bcryptjs → stored in DB
2. User logs in → server verifies credentials → returns JWT token
3. Client stores token in localStorage
4. All authenticated requests include `Authorization: Bearer <token>` header
5. Server middleware `authenticateToken` verifies JWT on protected routes
6. `/api/auth/me` endpoint returns current user from token

### Protected Routes (Client)
The `ProtectedRoute` component checks auth state via `useAuth()` hook. If no user is found, it redirects to `/auth`. Loading state shows a spinner.

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connection string must be provided via `DATABASE_URL` environment variable.
- **JWT Secret**: Configurable via `JWT_SECRET` environment variable (falls back to a default in development).

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit**: ORM and migration tooling for PostgreSQL
- **pg**: PostgreSQL client (node-postgres)
- **express**: HTTP server framework
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token creation and verification
- **zod**: Runtime schema validation (shared between client and server)
- **@tanstack/react-query**: Async state management on the client
- **wouter**: Client-side routing
- **framer-motion**: Animation library for Kanban board
- **date-fns**: Date formatting
- **shadcn/ui components**: Full suite of Radix-based UI primitives

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)