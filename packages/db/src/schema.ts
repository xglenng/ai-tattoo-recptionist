import {
  pgTable, uuid, text, timestamp, boolean, integer, date, jsonb
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timezone: text("timezone").notNull().default("America/Denver"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("OWNER"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const artists = pgTable("artists", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  bookingEnabled: boolean("booking_enabled").default(true).notNull(),
  minimumPriceCents: integer("minimum_price_cents").default(15000).notNull(),
  hourlyRateCents: integer("hourly_rate_cents").default(20000).notNull(),
  aiMode: text("ai_mode").default("ASSISTED").notNull()
});

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  notes: text("notes"),
  smsOptIn: boolean("sms_opt_in").default(false).notNull(),
  marketingOptIn: boolean("marketing_opt_in").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  artistId: uuid("artist_id").references(() => artists.id).notNull(),
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  pricingType: text("pricing_type").notNull(),
  basePriceCents: integer("base_price_cents"),
  hourlyRateCents: integer("hourly_rate_cents"),
  requiresConsultation: boolean("requires_consultation").default(false).notNull(),
  requiresArtistApproval: boolean("requires_artist_approval").default(false).notNull(),
  active: boolean("active").default(true).notNull()
});

export const businessRules = pgTable("business_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  artistId: uuid("artist_id").references(() => artists.id).notNull(),
  category: text("category").notNull(),
  rule: text("rule").notNull(),
  priority: integer("priority").default(100).notNull(),
  active: boolean("active").default(true).notNull()
});

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  artistId: uuid("artist_id").references(() => artists.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  serviceId: uuid("service_id").references(() => services.id),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: text("status").default("TENTATIVE").notNull(),
  priceCents: integer("price_cents"),
  depositCents: integer("deposit_cents"),
  depositStatus: text("deposit_status").default("PENDING").notNull(),
  calendarEventId: text("calendar_event_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  artistId: uuid("artist_id").references(() => artists.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  channel: text("channel").notNull(),
  status: text("status").default("OPEN").notNull(),
  aiEnabled: boolean("ai_enabled").default(true).notNull(),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversations.id).notNull(),
  senderType: text("sender_type").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  externalMessageId: text("external_message_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversations.id).notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  latencyMs: integer("latency_ms"),
  success: boolean("success").default(true).notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const agentActions = pgTable("agent_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentRunId: uuid("agent_run_id").references(() => agentRuns.id).notNull(),
  toolName: text("tool_name").notNull(),
  arguments: jsonb("arguments").notNull(),
  result: jsonb("result"),
  success: boolean("success").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
