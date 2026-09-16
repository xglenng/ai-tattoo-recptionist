import "dotenv/config";
import { db } from "./index";
import { organizations, users, artists, services, businessRules } from "./schema";

async function main() {
  const [org] = await db.insert(organizations).values({
    name: "Embellished Studios",
    slug: "demo-tattoo"
  }).returning();

  const [user] = await db.insert(users).values({
    organizationId: org.id,
    email: "artist@example.com",
    name: "Val Glenn",
    role: "OWNER"
  }).returning();

  const [artist] = await db.insert(artists).values({
    organizationId: org.id,
    userId: user.id,
    displayName: "Val Glenn",
    hourlyRateCents: 20000,
    minimumPriceCents: 15000,
    aiMode: "ASSISTED"
  }).returning();

  await db.insert(services).values({
    organizationId: org.id,
    artistId: artist.id,
    name: "Tattoo Session",
    durationMinutes: 180,
    pricingType: "HOURLY",
    hourlyRateCents: 20000
  });

  await db.insert(businessRules).values([
    { organizationId: org.id, artistId: artist.id, category: "BOOKING", rule: "Appointments require a $200 deposit." },
    { organizationId: org.id, artistId: artist.id, category: "BOOKING", rule: "Do not book appointments less than 48 hours ahead." },
    { organizationId: org.id, artistId: artist.id, category: "SERVICES", rule: "Artist does not tattoo faces, hands, or necks." }
  ]);

  console.log("Seeded Embellished Studios:", org.slug);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
