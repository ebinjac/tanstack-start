// db/schema/turnover.ts

import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { teams, applications } from "./teams";

/**
 * Enum for sub-application status
 * @readonly
 * @enum {string}
 */
export const subApplicationStatus = pgEnum('sub_application_status', ['active', 'inactive', 'archived']);

/**
 * Enum for turnover status
 * @readonly
 * @enum {string}
 */
export const turnoverStatus = pgEnum('turnover_status', ['draft', 'active', 'completed', 'archived']);

/**
 * Enum for entry types in multi-entry sections
 * @readonly
 * @enum {string}
 */
export const entryType = pgEnum('entry_type', ['rfc', 'inc', 'alert', 'mim', 'email_slack', 'fyi']);

/**
 * Enum for entry priority/flagging
 * @readonly
 * @enum {string}
 */
export const entryPriority = pgEnum('entry_priority', ['normal', 'important', 'flagged', 'needs_action', 'long_pending']);

/**
 * Sub-Applications table representing sub-applications under applications
 * 
 * This table stores information about sub-applications that belong to parent applications
 * 
 * @table sub_applications
 */
export const subApplications = pgTable("sub_applications", {
  /**
   * Unique identifier for the sub-application
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the parent application
   * @type {string} UUID v4
   * @required
   * @references applications.id
   */
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Name of the sub-application
   * @type {string} Max 255 characters
   * @required
   */
  subApplicationName: varchar("sub_application_name", { length: 255 }).notNull(),
  
  /**
   * Short code/abbreviation for the sub-application
   * @type {string} Max 12 characters
   * @optional
   */
  code: varchar("code", { length: 12 }),
  
  /**
   * Free text description of the sub-application
   * @type {string} Free text
   * @optional
   */
  description: text("description"),
  
  /**
   * Current status of the sub-application
   * @type {'active' | 'inactive' | 'archived'}
   * @required
   * @default 'active'
   */
  status: subApplicationStatus("status").notNull().default('active'),
  
  /**
   * Identifier of the user who created this sub-application record
   * @type {string} Max 255 characters
   * @required
   */
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the sub-application record was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who last updated this sub-application record
   * @type {string} Max 255 characters
   * @optional
   */
  updatedBy: varchar("updated_by", { length: 255 }),
  
  /**
   * Timestamp when the sub-application record was last updated
   * @type {Date} With timezone
   * @optional
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  /**
   * Unique index on application and sub-application name for unique sub-applications per application
   */
  applicationNameIdx: uniqueIndex('sub_apps_app_name_idx').on(table.applicationId, table.subApplicationName),
  
  /**
   * Index on application identifier for application-based queries
   */
  applicationIdIdx: index('sub_apps_application_id_idx').on(table.applicationId),
  
  /**
   * Index on status for filtering by status
   */
  statusIdx: index('sub_apps_status_idx').on(table.status),
}));

/**
 * Turnovers table storing main turnover records
 * 
 * This table stores the main turnover records with handover details
 * 
 * @table turnovers
 */
export const turnovers = pgTable("turnovers", {
  /**
   * Unique identifier for the turnover
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the team
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Reference to the application (optional)
   * @type {string} UUID v4
   * @optional
   * @references applications.id
   */
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  /**
   * Reference to the sub-application (optional)
   * @type {string} UUID v4
   * @optional
   * @references sub_applications.id
   */
  subApplicationId: uuid("sub_application_id")
    .references(() => subApplications.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  /**
   * Name of the outgoing person
   * @type {string} Max 255 characters
   * @required
   */
  handoverFrom: varchar("handover_from", { length: 255 }).notNull(),
  
  /**
   * Name of the incoming person
   * @type {string} Max 255 characters
   * @required
   */
  handoverTo: varchar("handover_to", { length: 255 }).notNull(),
  
  /**
   * Current status of the turnover
   * @type {'draft' | 'active' | 'completed' | 'archived'}
   * @required
   * @default 'draft'
   */
  status: turnoverStatus("status").notNull().default('draft'),
  
  /**
   * Turnover date
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  turnoverDate: timestamp("turnover_date", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who created this turnover record
   * @type {string} Max 255 characters
   * @required
   */
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the turnover record was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who last updated this turnover record
   * @type {string} Max 255 characters
   * @optional
   */
  updatedBy: varchar("updated_by", { length: 255 }),
  
  /**
   * Timestamp when the turnover record was last updated
   * @type {Date} With timezone
   * @optional
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('turnovers_team_id_idx').on(table.teamId),
  
  /**
   * Index on application identifier for application-based queries
   */
  applicationIdIdx: index('turnovers_application_id_idx').on(table.applicationId),
  
  /**
   * Index on sub-application identifier for sub-application-based queries
   */
  subApplicationIdIdx: index('turnovers_sub_application_id_idx').on(table.subApplicationId),
  
  /**
   * Index on status for filtering by status
   */
  statusIdx: index('turnovers_status_idx').on(table.status),
  
  /**
   * Index on turnover date for chronological queries
   */
  turnoverDateIdx: index('turnovers_turnover_date_idx').on(table.turnoverDate),
  
  /**
   * Composite index on team and turnover date for team-specific date queries
   */
  teamTurnoverDateIdx: index('turnovers_team_turnover_date_idx').on(table.teamId, table.turnoverDate),
}));

/**
 * Turnover entries table storing individual entries within turnovers
 * 
 * This table stores individual entries for RFC, INC, Alerts, MIM, Email/Slack, and FYI sections
 * 
 * @table turnover_entries
 */
export const turnoverEntries = pgTable("turnover_entries", {
  /**
   * Unique identifier for the turnover entry
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the parent turnover
   * @type {string} UUID v4
   * @required
   * @references turnovers.id
   */
  turnoverId: uuid("turnover_id")
    .notNull()
    .references(() => turnovers.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Type of the entry
   * @type {'rfc' | 'inc' | 'alert' | 'mim' | 'email_slack' | 'fyi'}
   * @required
   */
  entryType: entryType("entry_type").notNull(),
  
  /**
   * Priority/flagging status of the entry
   * @type {'normal' | 'important' | 'flagged' | 'needs_action' | 'long_pending'}
   * @required
   * @default 'normal'
   */
  priority: entryPriority("priority").notNull().default('normal'),
  
  /**
   * RFC Number (for RFC entries)
   * @type {string} Max 100 characters
   * @optional
   */
  rfcNumber: varchar("rfc_number", { length: 100 }),
  
  /**
   * RFC Status (for RFC entries)
   * @type {string} Max 50 characters
   * @optional
   */
  rfcStatus: varchar("rfc_status", { length: 50 }),
  
  /**
   * RFC Validated By (for RFC entries)
   * @type {string} Max 255 characters
   * @optional
   */
  rfcValidatedBy: varchar("rfc_validated_by", { length: 255 }),
  
  /**
   * RFC Description (for RFC entries)
   * @type {string} Free text
   * @optional
   */
  rfcDescription: text("rfc_description"),
  
  /**
   * INC Number (for INC entries)
   * @type {string} Max 100 characters
   * @optional
   */
  incNumber: varchar("inc_number", { length: 100 }),
  
  /**
   * Incident Description (for INC entries)
   * @type {string} Free text
   * @optional
   */
  incidentDescription: text("incident_description"),
  
  /**
   * Alerts/Issues (for Alert entries)
   * @type {string} Free text
   * @optional
   */
  alertsIssues: text("alerts_issues"),
  
  /**
   * MIM Link (for MIM entries)
   * @type {string} Max 2048 characters
   * @optional
   */
  mimLink: varchar("mim_link", { length: 2048 }),
  
  /**
   * MIM Slack Link (for MIM entries)
   * @type {string} Max 2048 characters
   * @optional
   */
  mimSlackLink: varchar("mim_slack_link", { length: 2048 }),
  
  /**
   * Email Subject/Slack Link (for Email/Slack entries)
   * @type {string} Max 2048 characters
   * @optional
   */
  emailSubjectSlackLink: varchar("email_subject_slack_link", { length: 2048 }),
  
  /**
   * FYI information (for FYI entries)
   * @type {string} Free text
   * @optional
   */
  fyiInfo: text("fyi_info"),
  
  /**
   * Comments for the entry
   * @type {string} Free text
   * @optional
   */
  comments: text("comments"),
  
  /**
   * Timestamp when the entry was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Timestamp when the entry was last updated
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  /**
   * Index on turnover identifier for turnover-based queries
   */
  turnoverIdIdx: index('turnover_entries_turnover_id_idx').on(table.turnoverId),
  
  /**
   * Index on entry type for filtering by entry type
   */
  entryTypeIdx: index('turnover_entries_entry_type_idx').on(table.entryType),
  
  /**
   * Index on priority for filtering by priority
   */
  priorityIdx: index('turnover_entries_priority_idx').on(table.priority),
  
  /**
   * Index on creation timestamp for chronological queries
   */
  createdAtIdx: index('turnover_entries_created_at_idx').on(table.createdAt),
  
  /**
   * Index on last updated timestamp for staleness detection
   */
  updatedAtIdx: index('turnover_entries_updated_at_idx').on(table.updatedAt),
  
  /**
   * Composite index on turnover and entry type for organized entry queries
   */
  turnoverEntryTypeIdx: index('turnover_entries_turnover_entry_type_idx').on(table.turnoverId, table.entryType),
}));

/**
 * Turnover snapshots table for daily historical snapshots
 * 
 * This table stores read-only daily snapshots of turnover data for auditing and historical tracking
 * 
 * @table turnover_snapshots
 */
export const turnoverSnapshots = pgTable("turnover_snapshots", {
  /**
   * Unique identifier for the snapshot
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the team
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Reference to the application (optional)
   * @type {string} UUID v4
   * @optional
   * @references applications.id
   */
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  /**
   * Reference to the sub-application (optional)
   * @type {string} UUID v4
   * @optional
   * @references sub_applications.id
   */
  subApplicationId: uuid("sub_application_id")
    .references(() => subApplications.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  /**
   * Snapshot date (the date this snapshot represents)
   * @type {Date} With timezone
   * @required
   */
  snapshotDate: timestamp("snapshot_date", { withTimezone: true }).notNull(),
  
  /**
   * Complete turnover data in JSON format
   * @type {object} JSON
   * @required
   */
  turnoverData: jsonb("turnover_data").notNull().$type<any>(),
  
  /**
   * Timestamp when the snapshot was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  /**
   * Unique index on team, application, sub-application, and snapshot date for preventing duplicate snapshots
   */
  teamAppSubAppDateIdx: uniqueIndex('turnover_snapshots_team_app_sub_app_date_idx')
    .on(table.teamId, table.applicationId, table.subApplicationId, table.snapshotDate),
  
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('turnover_snapshots_team_id_idx').on(table.teamId),
  
  /**
   * Index on snapshot date for date-based queries
   */
  snapshotDateIdx: index('turnover_snapshots_snapshot_date_idx').on(table.snapshotDate),
  
  /**
   * Composite index on team and snapshot date for team-specific date queries
   */
  teamSnapshotDateIdx: index('turnover_snapshots_team_snapshot_date_idx').on(table.teamId, table.snapshotDate),
}));

/**
 * Turnover drafts table for auto-saving and persistence
 *
 * This table stores draft turnover data that can be auto-saved and later restored
 *
 * @table turnover_drafts
 */
export const turnoverDrafts = pgTable("turnover_drafts", {
  /**
   * Unique identifier for the draft
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the team
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Reference to the application (optional)
   * @type {string} UUID v4
   * @optional
   * @references applications.id
   */
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  /**
   * Reference to the sub-application (optional)
   * @type {string} UUID v4
   * @optional
   * @references sub_applications.id
   */
  subApplicationId: uuid("sub_application_id")
    .references(() => subApplications.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  /**
   * Name of the outgoing person
   * @type {string} Max 255 characters
   * @required
   */
  handoverFrom: varchar("handover_from", { length: 255 }).notNull(),
  
  /**
   * Name of the incoming person
   * @type {string} Max 255 characters
   * @required
   */
  handoverTo: varchar("handover_to", { length: 255 }).notNull(),
  
  /**
   * Current status of the draft
   * @type {'draft' | 'active' | 'completed' | 'archived'}
   * @required
   * @default 'draft'
   */
  status: turnoverStatus("status").notNull().default('draft'),
  
  /**
   * Complete turnover entries data in JSON format
   * @type {object} JSON
   * @required
   */
  entries: jsonb("entries").notNull().$type<any>(),
  
  /**
   * Timestamp when the draft was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Timestamp when the draft was last updated
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  /**
   * Unique index on team, application, sub-application, and status for preventing duplicate drafts
   */
  teamAppSubAppStatusIdx: uniqueIndex('turnover_drafts_team_app_sub_app_status_idx')
    .on(table.teamId, table.applicationId, table.subApplicationId, table.status),
  
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('turnover_drafts_team_id_idx').on(table.teamId),
  
  /**
   * Index on application identifier for application-based queries
   */
  applicationIdIdx: index('turnover_drafts_application_id_idx').on(table.applicationId),
  
  /**
   * Index on sub-application identifier for sub-application-based queries
   */
  subApplicationIdIdx: index('turnover_drafts_sub_application_id_idx').on(table.subApplicationId),
  
  /**
   * Index on status for filtering by status
   */
  statusIdx: index('turnover_drafts_status_idx').on(table.status),
  
  /**
   * Index on last updated timestamp for finding recently updated drafts
   */
  updatedAtIdx: index('turnover_drafts_updated_at_idx').on(table.updatedAt),
}));