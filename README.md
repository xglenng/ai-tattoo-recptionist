# AI Tattoo Receptionist MVP

Sprint 2 adds the first real booking engine on top of Sprint 1:

- Artist weekly availability rules
- Services with duration/pricing metadata
- Availability API that excludes booked time
- Temporary booking holds
- Booking confirmation state transition
- Appointment query API
- Tenant/artist scoping on every booking query
- Pure booking/availability logic that can be unit tested independently

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

## Sprint 2 API examples

Availability:

```text
GET /api/availability?organizationId=<ORG>&artistId=<ARTIST>&from=2026-09-17T00:00:00.000Z&to=2026-09-18T00:00:00.000Z&durationMinutes=120
```

Create a booking hold:

```text
POST /api/booking/hold
Content-Type: application/json

{
  "organizationId": "...",
  "artistId": "...",
  "clientId": "...",
  "serviceId": "...",
  "startsAt": "2026-09-17T18:00:00.000Z",
  "depositCents": 20000,
  "priceCents": 40000
}
```

Confirm after a verified payment event:

```text
POST /api/booking/confirm
Content-Type: application/json

{
  "organizationId": "...",
  "appointmentId": "...",
  "depositStatus": "PAID"
}
```

## Important architecture rule

The AI must never decide that a slot is available or that payment succeeded. It asks typed application tools. The booking engine and payment webhook remain authoritative.

## Next sprint

Sprint 3 should wire Google Calendar, Stripe Checkout/webhooks, and proper transactional booking holds/locking before exposing this to beta artists.

## Sprint 2 dashboard data
The dashboard reads live PostgreSQL data through `GET /api/dashboard`. The frontend no longer contains appointment/client/conversation demo arrays. `npm run db:seed` creates demo records in PostgreSQL so the dashboard has data to display. The current MVP selects the first seeded artist; authentication/tenant context will replace that in a later sprint.
