import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, lt } from 'drizzle-orm';
import { db } from '@db/index';
import { appointments, availabilityRules } from '@db/schema';
import { getAvailableSlots } from '@booking/index';
import { z } from 'zod';

const querySchema = z.object({
  organizationId: z.string().uuid(),
  artistId: z.string().uuid(),
  from: z.coerce.date(),
  to: z.coerce.date(),
  durationMinutes: z.coerce.number().int().positive().max(1440),
  slotIntervalMinutes: z.coerce.number().int().positive().max(240).optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { organizationId, artistId, from, to, durationMinutes, slotIntervalMinutes } = parsed.data;
  if (to <= from) return NextResponse.json({ error: 'to must be after from' }, { status: 400 });

  const rules = await db.select().from(availabilityRules).where(and(eq(availabilityRules.organizationId, organizationId), eq(availabilityRules.artistId, artistId), eq(availabilityRules.active, true)));
  const busyRows = await db.select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(and(
      eq(appointments.organizationId, organizationId),
      eq(appointments.artistId, artistId),
      lt(appointments.startsAt, to),
      gte(appointments.endsAt, from),
    ));

  const slots = getAvailableSlots(rules, busyRows, { from, to, durationMinutes, slotIntervalMinutes });
  return NextResponse.json({ slots });
}
