# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MovieTime is a Next.js web application for discovering movies and showtimes at Cinema City locations in Romania. The app features automated nightly data updates, movie search, and comprehensive cinema/movie information.

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

### Database
- `npm run db:generate` - Generate Prisma client and run migrations
- `npm run db:migrate` - Deploy migrations to production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

### Testing
- `npx playwright test` - Run Playwright end-to-end tests
- `npx playwright test --ui` - Run tests with UI mode

## Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: tRPC API routes, Prisma ORM, PostgreSQL (Neon)
- **UI Components**: Radix UI, shadcn/ui components
- **Testing**: Playwright for E2E testing
- **Deployment**: Vercel

### Core Data Models
- **Cinema**: Cinema locations with coordinates, booking info
- **Movie**: Movie details, posters, descriptions, TMDB integration
- **MovieEvent**: Individual showtimes linking movies to cinemas

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable UI components (shadcn/ui)
- `src/server/` - tRPC API setup and routers
- `src/scripts/` - Data fetching and seeding scripts
- `prisma/` - Database schema and migrations
- `tests/` - Playwright E2E tests

### tRPC API Structure
The API is organized into three main routers:
- `cinemaRouter` - Cinema-related operations
- `movieRouter` - Movie-related operations  
- `movieEventRouter` - Showtime-related operations

### Data Flow
1. Nightly cron job (`/api/cron/fetch-movies`) fetches Cinema City data
2. Data is processed and stored in PostgreSQL via Prisma
3. tRPC API serves data to Next.js frontend
4. React components render movie/cinema information

### Environment Variables
Required environment variables (see `src/env.js`):
- `DATABASE_URL` - PostgreSQL connection string
- `CRON_SECRET` - Secret for cron job authentication
- `TMDB_API_KEY` - The Movie Database API key
- `VERCEL_PROTECTION_BYPASS` - Vercel bypass token

## Development Notes

### Database Setup
The project uses PostgreSQL with Prisma. Run `npm run db:generate` after schema changes and `npm run db:push` to apply changes to the database.

### Testing Strategy
Playwright tests cover key user flows: landing page, movie details, search functionality. Tests are located in the `tests/` directory with page objects and selectors organized in subdirectories.

### Data Fetching
The app fetches data from Cinema City Romania's API nightly. The fetching logic is in `src/scripts/fetchData.ts` and triggered via the cron API route.