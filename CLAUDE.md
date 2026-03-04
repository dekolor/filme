# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MovieTime is a Next.js web application for discovering movies and showtimes at Cinema City locations in Romania. The app features automated nightly data updates via Convex scheduled functions, movie search, and comprehensive cinema/movie information.

## Key Commands

### Development
- `npm run dev` - Start development server with Turbo
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run preview` - Build and start production server

### Code Quality
- `npm run check` - Run linting and type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking
- `npm run format:check` - Check code formatting with Prettier
- `npm run format:write` - Auto-format code with Prettier

### Convex (Database & Backend)
- `npm run convex:dev` - Start Convex development server
- `npm run convex:deploy` - Deploy Convex functions to production
- `npm run export-data` - Export PostgreSQL data for migration (one-time use)

### Testing
- `npx playwright test` - Run Playwright end-to-end tests
- `npx playwright test --ui` - Run tests with UI mode
- `npm run test:unit` - Run Vitest unit tests

## Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Convex (serverless database and functions)
- **UI Components**: Radix UI, shadcn/ui components
- **Testing**: Playwright for E2E testing, Vitest for unit tests
- **Deployment**: Vercel (frontend), Convex Cloud (backend)

### Core Data Models
- **Cinemas**: Cinema locations with coordinates, booking info
- **Movies**: Movie details, posters, descriptions, TMDB integration
- **MovieEvents**: Individual showtimes linking movies to cinemas

### Key Directories
- `src/app/` - Next.js App Router pages and components
- `src/components/` - Reusable UI components (shadcn/ui)
- `convex/` - Convex backend functions, schema, and cron jobs
- `tests/` - Playwright E2E tests and Vitest unit tests

### Convex Functions Structure
The Convex backend is organized into modules:
- `convex/cinemas.ts` - Cinema queries and mutations
- `convex/movies.ts` - Movie queries and mutations (including search)
- `convex/movieEvents.ts` - Showtime queries and mutations
- `convex/dashboard.ts` - Dashboard aggregation query
- `convex/dataFetcher.ts` - Cinema City API data fetching
- `convex/cron.ts` - Scheduled function configuration
- `convex/lib/` - Utility functions (distance, movie deduplication, async batching)

### Data Flow
1. Nightly scheduled function (2 AM UTC) in `convex/cron.ts` triggers data fetch
2. `convex/dataFetcher.ts` fetches Cinema City data and enriches with TMDB
3. Data is stored in Convex database (serverless, real-time)
4. React components use `useQuery` hooks to access Convex functions
5. Server components use `fetchQuery` for server-side data fetching

### Environment Variables
Required environment variables (see `src/env.js`):
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL (client-side)
- `TMDB_API_KEY` - The Movie Database API key (server-side)
- `VERCEL_PROTECTION_BYPASS` - Vercel bypass token (server-side)

## Development Notes

### Convex Setup
The project uses Convex for both database and backend functions. The schema is defined in `convex/schema.ts` with three main tables: `cinemas`, `movies`, and `movieEvents`.

**Key Features**:
- Native array support (no JSON stringification needed)
- Real-time subscriptions via `useQuery` hooks
- Serverless functions with built-in cron scheduling
- Automatic TypeScript type generation

### Testing Strategy
Playwright tests cover key user flows: landing page, movie details, search functionality. Convex is mocked in tests using Vitest mocks defined in `tests/setup.ts`.

### Data Fetching
The app fetches data from Cinema City Romania's API nightly via a Convex scheduled function in `convex/dataFetcher.ts`. The function:
- Fetches cinemas, movies, and showtimes from Cinema City API
- Enriches movies with TMDB data (descriptions, popularity, posters)
- Handles rate limiting with controlled concurrency
- Runs automatically at 2 AM UTC

### Database Schema
Convex stores data with the following structure:
- **externalId fields**: Store original Cinema City API IDs
- **Convex _id fields**: Auto-generated Convex document IDs
- **Relations**: Stored via external IDs (e.g., `filmExternalId`, `cinemaExternalId`)
- **Arrays**: Native array types (attributeIds, attributes)
- **Indexes**: Optimized for common query patterns

### Migration from Prisma/tRPC
The project was migrated from PostgreSQL/Prisma/tRPC to Convex. Key changes:
- tRPC routers replaced with Convex query/mutation functions
- `useQuery` hooks now from `convex/react` instead of `@trpc/react-query`
- Server components use `fetchQuery` from `convex/nextjs`
- Vercel cron replaced with Convex scheduled functions
- PostgreSQL replaced with Convex's built-in database
