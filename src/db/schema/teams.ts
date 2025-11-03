// db/schema/teams.ts

import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Enum for team registration approval status
 * @readonly
 * @enum {string}
 */
export const approvalStatus = pgEnum('approval_status', ['pending', 'approved', 'rejected']);

/**
 * Teams table representing organizational teams in the system
 * 
 * This table stores information about teams including their names,
 * user groups, administrative groups, and contact information.
 * 
 * @table teams
 */
export const teams = pgTable("teams", {
  /**
   * Unique identifier for the team
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Unique name of the team
   * @type {string} Max 100 characters
   * @required
   * @unique
   */
  teamName: varchar("team_name", { length: 100 }).notNull().unique(),
  
  /**
   * User group associated with the team
   * @type {string} Max 100 characters
   * @required
   */
  userGroup: varchar("user_group", { length: 100 }).notNull(),
  
  /**
   * Administrative group with elevated permissions
   * @type {string} Max 100 characters
   * @required
   */
  adminGroup: varchar("admin_group", { length: 100 }).notNull(),
  
  /**
   * Name of the primary contact person for the team
   * @type {string} Max 100 characters
   * @required
   */
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  
  /**
   * Email address of the primary contact person
   * @type {string} Max 255 characters
   * @required
   * @format email
   */
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  
  /**
   * Flag indicating whether the team is currently active
   * @type {boolean}
   * @required
   * @default true
   */
  isActive: boolean("is_active").notNull().default(true),
  
  /**
   * Identifier of the user who created this team record
   * @type {string} Max 255 characters
   * @required
   */
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the team record was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who last updated this team record
   * @type {string} Max 255 characters
   * @optional
   */
  updatedBy: varchar("updated_by", { length: 255 }),
  
  /**
   * Timestamp when the team record was last updated
   * @type {Date} With timezone
   * @optional
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  /**
   * Unique index on team name for fast lookups
   */
  teamNameIdx: uniqueIndex('teams_team_name_idx').on(table.teamName),
  
  /**
   * Index on contact email for search operations
   */
  contactEmailIdx: index('teams_contact_email_idx').on(table.contactEmail),
  
  /**
   * Index on active status for filtering active/inactive teams
   */
  isActiveIdx: index('teams_is_active_idx').on(table.isActive),
  
  /**
   * Check constraint to validate email format
   */
  emailCheck: sql`contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`,
}));

/**
 * Team registration requests table storing pending team registrations
 * 
 * This table captures team registration requests that require approval
 * before being converted to actual team records.
 * 
 * @table team_registration_requests
 */
export const teamRegistrationRequests = pgTable("team_registration_requests", {
  /**
   * Unique identifier for the registration request
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Proposed name for the team
   * @type {string} Max 100 characters
   * @required
   */
  teamName: varchar("team_name", { length: 100 }).notNull(),
  
  /**
   * Proposed user group for the team
   * @type {string} Max 100 characters
   * @required
   */
  userGroup: varchar("user_group", { length: 100 }).notNull(),
  
  /**
   * Proposed administrative group for the team
   * @type {string} Max 100 characters
   * @required
   */
  adminGroup: varchar("admin_group", { length: 100 }).notNull(),
  
  /**
   * Name of the proposed primary contact person
   * @type {string} Max 100 characters
   * @required
   */
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  
  /**
   * Email address of the proposed primary contact person
   * @type {string} Max 255 characters
   * @required
   * @format email
   */
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  
  /**
   * Current approval status of the registration request
   * @type {'pending' | 'approved' | 'rejected'}
   * @required
   * @default 'pending'
   */
  status: approvalStatus("status").notNull().default('pending'),
  
  /**
   * Identifier of the user who submitted the registration request
   * @type {string} Max 255 characters
   * @required
   */
  requestedBy: varchar("requested_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the registration request was submitted
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who reviewed the registration request
   * @type {string} Max 255 characters
   * @optional
   */
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  
  /**
   * Timestamp when the registration request was reviewed
   * @type {Date} With timezone
   * @optional
   */
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  
  /**
   * Comments or notes from the review process
   * @type {string} Free text
   * @optional
   */
  comments: text("comments"),
  
  /**
   * Timestamp when the registration request record was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Timestamp when the registration request record was last updated
   * @type {Date} With timezone
   * @optional
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  /**
   * Index on approval status for filtering requests by status
   */
  statusIdx: index('team_reg_status_idx').on(table.status),
  
  /**
   * Index on requester identifier for finding requests by user
   */
  requestedByIdx: index('team_reg_requested_by_idx').on(table.requestedBy),
  
  /**
   * Index on request timestamp for chronological sorting
   */
  requestedAtIdx: index('team_reg_requested_at_idx').on(table.requestedAt),
  
  /**
   * Composite index on status and request timestamp for efficient status-based queries
   */
  statusRequestedAtIdx: index('team_reg_status_requested_at_idx').on(table.status, table.requestedAt),
  
  /**
   * Check constraint to validate email format
   */
  emailCheck: sql`contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`,
}));

/**
 * Applications table representing software applications in the system
 * 
 * This table stores comprehensive information about applications including
 * ownership hierarchy, contact information, and metadata.
 * 
 * @table applications
 */
export const applications = pgTable("applications", {
  /**
   * Unique identifier for the application
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the associated team
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  
  /**
   * Asset ID (also known as CAR ID) from external systems
   * @type {number} Integer
   * @required
   */
  assetId: integer("asset_id").notNull(),
  
  /**
   * Full name of the application
   * @type {string} Max 255 characters
   * @required
   */
  applicationName: varchar("application_name", { length: 255 }).notNull(),
  
  /**
   * Three letter abbreviation (extended to 12 chars for flexibility)
   * @type {string} Max 12 characters
   * @required
   */
  tla: varchar("tla", { length: 12 }).notNull(),
  
  /**
   * Lifecycle status from Central API (auto-populated)
   * @type {string} Max 50 characters
   * @optional
   */
  lifeCycleStatus: varchar("life_cycle_status", { length: 50 }),
  
  /**
   * BIA tier from Central API (auto-populated)
   * @type {string} Max 50 characters
   * @optional
   */
  tier: varchar("tier", { length: 50 }),
  
  /**
   * Vice President name from productionSupportOwnerLeader1 (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  vpName: varchar("vp_name", { length: 100 }),
  
  /**
   * Vice President email from productionSupportOwnerLeader1 (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  vpEmail: varchar("vp_email", { length: 255 }),
  
  /**
   * Director name from productionSupportOwner (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  directorName: varchar("director_name", { length: 100 }),
  
  /**
   * Director email from productionSupportOwner (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  directorEmail: varchar("director_email", { length: 255 }),
  
  /**
   * Escalation email for urgent issues (user entered)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  escalationEmail: varchar("escalation_email", { length: 255 }),
  
  /**
   * Primary contact email (user entered)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  contactEmail: varchar("contact_email", { length: 255 }),
  
  /**
   * Team email address (user entered)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  teamEmail: varchar("team_email", { length: 255 }),
  
  /**
   * Application owner name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  applicationOwnerName: varchar("application_owner_name", { length: 100 }),
  
  /**
   * Application owner email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  applicationOwnerEmail: varchar("application_owner_email", { length: 255 }),
  
  /**
   * Application owner band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  applicationOwnerBand: varchar("application_owner_band", { length: 10 }),
  
  /**
   * Application manager name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  applicationManagerName: varchar("application_manager_name", { length: 100 }),
  
  /**
   * Application manager email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  applicationManagerEmail: varchar("application_manager_email", { length: 255 }),
  
  /**
   * Application manager band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  applicationManagerBand: varchar("application_manager_band", { length: 10 }),
  
  /**
   * Application owner leader 1 name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  applicationOwnerLeader1Name: varchar("application_owner_leader1_name", { length: 100 }),
  
  /**
   * Application owner leader 1 email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  applicationOwnerLeader1Email: varchar("application_owner_leader1_email", { length: 255 }),
  
  /**
   * Application owner leader 1 band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  applicationOwnerLeader1Band: varchar("application_owner_leader1_band", { length: 10 }),
  
  /**
   * Application owner leader 2 name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  applicationOwnerLeader2Name: varchar("application_owner_leader2_name", { length: 100 }),
  
  /**
   * Application owner leader 2 email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  applicationOwnerLeader2Email: varchar("application_owner_leader2_email", { length: 255 }),
  
  /**
   * Application owner leader 2 band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  applicationOwnerLeader2Band: varchar("application_owner_leader2_band", { length: 10 }),
  
  /**
   * Owner SVP name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  ownerSvpName: varchar("owner_svp_name", { length: 100 }),
  
  /**
   * Owner SVP email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  ownerSvpEmail: varchar("owner_svp_email", { length: 255 }),
  
  /**
   * Owner SVP band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  ownerSvpBand: varchar("owner_svp_band", { length: 10 }),
  
  /**
   * Business owner name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  businessOwnerName: varchar("business_owner_name", { length: 100 }),
  
  /**
   * Business owner email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  businessOwnerEmail: varchar("business_owner_email", { length: 255 }),
  
  /**
   * Business owner band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  businessOwnerBand: varchar("business_owner_band", { length: 10 }),
  
  /**
   * Business owner leader 1 name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  businessOwnerLeader1Name: varchar("business_owner_leader1_name", { length: 100 }),
  
  /**
   * Business owner leader 1 email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  businessOwnerLeader1Email: varchar("business_owner_leader1_email", { length: 255 }),
  
  /**
   * Business owner leader 1 band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  businessOwnerLeader1Band: varchar("business_owner_leader1_band", { length: 10 }),
  
  /**
   * Production support owner name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  productionSupportOwnerName: varchar("production_support_owner_name", { length: 100 }),
  
  /**
   * Production support owner email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  productionSupportOwnerEmail: varchar("production_support_owner_email", { length: 255 }),
  
  /**
   * Production support owner band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  productionSupportOwnerBand: varchar("production_support_owner_band", { length: 10 }),
  
  /**
   * Production support owner leader 1 name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  productionSupportOwnerLeader1Name: varchar("production_support_owner_leader1_name", { length: 100 }),
  
  /**
   * Production support owner leader 1 email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  productionSupportOwnerLeader1Email: varchar("production_support_owner_leader1_email", { length: 255 }),
  
  /**
   * Production support owner leader 1 band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  productionSupportOwnerLeader1Band: varchar("production_support_owner_leader1_band", { length: 10 }),
  
  /**
   * PMO name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  pmoName: varchar("pmo_name", { length: 100 }),
  
  /**
   * PMO email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  pmoEmail: varchar("pmo_email", { length: 255 }),
  
  /**
   * PMO band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  pmoBand: varchar("pmo_band", { length: 10 }),
  
  /**
   * Unit CIO name from Central API (auto-populated)
   * @type {string} Max 100 characters
   * @optional
   */
  unitCioName: varchar("unit_cio_name", { length: 100 }),
  
  /**
   * Unit CIO email from Central API (auto-populated)
   * @type {string} Max 255 characters
   * @optional
   * @format email
   */
  unitCioEmail: varchar("unit_cio_email", { length: 255 }),
  
  /**
   * Unit CIO band/level from Central API (auto-populated)
   * @type {string} Max 10 characters
   * @optional
   */
  unitCioBand: varchar("unit_cio_band", { length: 10 }),
  
  /**
   * ServiceNow group for support tickets
   * @type {string} Max 255 characters
   * @optional
   */
  snowGroup: varchar("snow_group", { length: 255 }),
  
  /**
   * Slack channel for team communication
   * @type {string} Max 100 characters
   * @optional
   * @format slack-channel
   */
  slackChannel: varchar("slack_channel", { length: 100 }),
  
  /**
   * Free text description of the application
   * @type {string} Free text
   * @optional
   */
  description: text("description"),
  
  /**
   * Current status of the application
   * @type {string} Max 50 characters
   * @required
   * @default 'active'
   */
  status: varchar("status", { length: 50 }).notNull().default('active'),
  
  /**
   * Timestamp of last Central API synchronization
   * @type {Date} With timezone
   * @optional
   */
  lastCentralApiSync: timestamp("last_central_api_sync", { withTimezone: true }),
  
  /**
   * Status of Central API synchronization
   * @type {string} Max 50 characters
   * @optional
   * @default 'pending'
   */
  centralApiSyncStatus: varchar("central_api_sync_status", { length: 50 }).default('pending'),
  
  /**
   * Identifier of the user who created this application record
   * @type {string} Max 255 characters
   * @required
   */
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the application record was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who last updated this application record
   * @type {string} Max 255 characters
   * @required
   */
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the application record was last updated
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => ({
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('applications_team_id_idx').on(table.teamId),
  
  /**
   * Index on application status for filtering
   */
  statusIdx: index('applications_status_idx').on(table.status),
  
  /**
   * Index on TLA for abbreviation searches
   */
  tlaIdx: index('applications_tla_idx').on(table.tla),
  
  /**
   * Index on tier for filtering by application tier
   */
  tierIdx: index('applications_tier_idx').on(table.tier),
  
  /**
   * Index on lifecycle status for filtering by lifecycle phase
   */
  lifeCycleStatusIdx: index('applications_life_cycle_status_idx').on(table.lifeCycleStatus),
  
  /**
   * Composite index on team and status for team-specific status queries
   */
  teamStatusIdx: index('applications_team_status_idx').on(table.teamId, table.status),
  
  /**
   * Composite index on team, status, and creation timestamp for complex queries
   */
  teamStatusCreatedIdx: index('applications_team_status_created_idx')
    .on(table.teamId, table.status, table.createdAt),
  
  /**
   * Check constraint to validate VP email format
   */
  vpEmailCheck: sql`vp_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR vp_email IS NULL`,
  
  /**
   * Check constraint to validate director email format
   */
  directorEmailCheck: sql`director_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR director_email IS NULL`,
  
  /**
   * Check constraint to validate Slack channel format
   */
  slackChannelCheck: sql`slack_channel LIKE '#%' OR slack_channel IS NULL`,
  
  /**
   * Check constraint to validate escalation email format
   */
  escalationEmailCheck: sql`escalation_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR escalation_email IS NULL`,
  
  /**
   * Check constraint to validate contact email format
   */
  contactEmailCheck: sql`contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL`,
  
  /**
   * Check constraint to validate team email format
   */
  teamEmailCheck: sql`team_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR team_email IS NULL`,
  
  /**
   * Check constraint to validate application owner email format
   */
  applicationOwnerEmailCheck: sql`application_owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR application_owner_email IS NULL`,
  
  /**
   * Check constraint to validate application manager email format
   */
  applicationManagerEmailCheck: sql`application_manager_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR application_manager_email IS NULL`,
  
  /**
   * Check constraint to validate business owner email format
   */
  businessOwnerEmailCheck: sql`business_owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR business_owner_email IS NULL`,
  
  /**
   * Check constraint to validate production support owner email format
   */
  productionSupportOwnerEmailCheck: sql`production_support_owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR production_support_owner_email IS NULL`,
}));
