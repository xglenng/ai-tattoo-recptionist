# AI Tattoo Receptionist — MVP

Initial vertical slice for an AI receptionist SaaS for tattoo artists.

## Stack
- Next.js + TypeScript
- Drizzle ORM
- PostgreSQL
- Zod
- Tailwind
- AI provider abstraction (stubbed)

## Prerequisites
- Node 20+
- Docker / Docker Compose
- npm

## Run

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Current MVP scope
- Multi-tenant organization/artist/client/service/rule schema
- Booking state model
- Business-rule model
- AI tool interfaces
- Mock booking flow
- Next.js dashboard shell

Stripe, Twilio, Google Calendar, and production AI credentials are intentionally not required yet. They will be added as adapters after the core domain is working.
