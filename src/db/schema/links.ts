// db/schema/links.ts

import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { teams, applications } from "./teams";

/**
 * Enum for link visibility levels
 * @readonly
 * @enum {string}
 */
export const linkVisibility = pgEnum('link_visibility', ['public', 'private', 'team']);

/**
 * Enum for link status
 * @readonly
 * @enum {string}
 */
export const linkStatus = pgEnum('link_status', ['active', 'inactive', 'archived']);

/**
 * Categories table for organizing links
 * 
 * This table stores high-level categories for link organization
 * 
 * @table link_categories
 */
export const linkCategories = pgTable("link_categories", {
  /**
   * Unique identifier for the category
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Name of the category
   * @type {string} Max 100 characters
   * @required
   */
  name: varchar("name", { length: 100 }).notNull(),
  
  /**
   * Optional description of the category
   * @type {string} Free text
   * @optional
   */
  description: text("description"),
  
  /**
   * Color code for the category (hex color)
   * @type {string} Max 7 characters
   * @optional
   */
  color: varchar("color", { length: 7 }),
  
  /**
   * Icon name for the category
   * @type {string} Max 50 characters
   * @optional
   */
  icon: varchar("icon", { length: 50 }),
  
  /**
   * Reference to the team that owns this category
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Identifier of the user who created this category
   * @type {string} Max 255 characters
   * @required
   */
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the category was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who last updated this category
   * @type {string} Max 255 characters
   * @optional
   */
  updatedBy: varchar("updated_by", { length: 255 }),
  
  /**
   * Timestamp when the category was last updated
   * @type {Date} With timezone
   * @optional
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  /**
   * Unique index on team and category name for team-specific unique categories
   */
  teamNameIdx: uniqueIndex('link_categories_team_name_idx').on(table.teamId, table.name),
  
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('link_categories_team_id_idx').on(table.teamId),
}));

/**
 * Tags table for flexible link labeling
 * 
 * This table stores tags that can be applied to links for cross-category organization
 * 
 * @table link_tags
 */
export const linkTags = pgTable("link_tags", {
  /**
   * Unique identifier for the tag
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Name of the tag
   * @type {string} Max 50 characters
   * @required
   */
  name: varchar("name", { length: 50 }).notNull(),
  
  /**
   * Optional description of the tag
   * @type {string} Free text
   * @optional
   */
  description: text("description"),
  
  /**
   * Color code for the tag (hex color)
   * @type {string} Max 7 characters
   * @optional
   */
  color: varchar("color", { length: 7 }),
  
  /**
   * Reference to the team that owns this tag
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Identifier of the user who created this tag
   * @type {string} Max 255 characters
   * @required
   */
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the tag was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who last updated this tag
   * @type {string} Max 255 characters
   * @optional
   */
  updatedBy: varchar("updated_by", { length: 255 }),
  
  /**
   * Timestamp when the tag was last updated
   * @type {Date} With timezone
   * @optional
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  /**
   * Unique index on team and tag name for team-specific unique tags
   */
  teamNameIdx: uniqueIndex('link_tags_team_name_idx').on(table.teamId, table.name),
  
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('link_tags_team_id_idx').on(table.teamId),
  
  /**
   * Index on tag name for search operations
   */
  nameIdx: index('link_tags_name_idx').on(table.name),
}));

/**
 * Links table storing all link information
 * 
 * This table stores comprehensive information about links including
 * URLs, metadata, and organizational information.
 * 
 * @table links
 */
export const links = pgTable("links", {
  /**
   * Unique identifier for the link
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Title of the link
   * @type {string} Max 255 characters
   * @required
   */
  title: varchar("title", { length: 255 }).notNull(),
  
  /**
   * Original URL
   * @type {string} Max 2048 characters
   * @required
   */
  originalUrl: varchar("original_url", { length: 2048 }).notNull(),
  
  /**
   * Shortened URL (if applicable)
   * @type {string} Max 2048 characters
   * @optional
   */
  shortUrl: varchar("short_url", { length: 2048 }),
  
  /**
   * Optional description of the link
   * @type {string} Free text
   * @optional
   */
  description: text("description"),
  
  /**
   * Reference to the team that owns this link
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Optional reference to a specific application
   * @type {string} UUID v4
   * @optional
   * @references applications.id
   */
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  /**
   * Reference to the category this link belongs to
   * @type {string} UUID v4
   * @optional
   * @references link_categories.id
   */
  categoryId: uuid("category_id")
    .references(() => linkCategories.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  /**
   * Visibility level of the link
   * @type {'public' | 'private' | 'team'}
   * @required
   * @default 'team'
   */
  visibility: linkVisibility("visibility").notNull().default('team'),
  
  /**
   * Status of the link
   * @type {'active' | 'inactive' | 'archived'}
   * @required
   * @default 'active'
   */
  status: linkStatus("status").notNull().default('active'),
  
  /**
   * Whether the link is pinned/favorited
   * @type {boolean}
   * @required
   * @default false
   */
  isPinned: boolean("is_pinned").notNull().default(false),
  
  /**
   * Number of times the link has been clicked
   * @type {number} Integer
   * @required
   * @default 0
   */
  clickCount: integer("click_count").notNull().default(0),
  
  /**
   * Timestamp when the link was last accessed
   * @type {Date} With timezone
   * @optional
   */
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  
  /**
   * Identifier of the user who created this link
   * @type {string} Max 255 characters
   * @required
   */
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the link was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who last updated this link
   * @type {string} Max 255 characters
   * @optional
   */
  updatedBy: varchar("updated_by", { length: 255 }),
  
  /**
   * Timestamp when the link was last updated
   * @type {Date} With timezone
   * @optional
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('links_team_id_idx').on(table.teamId),
  
  /**
   * Index on application identifier for application-based queries
   */
  applicationIdIdx: index('links_application_id_idx').on(table.applicationId),
  
  /**
   * Index on category identifier for category-based queries
   */
  categoryIdIdx: index('links_category_id_idx').on(table.categoryId),
  
  /**
   * Index on visibility for filtering by visibility
   */
  visibilityIdx: index('links_visibility_idx').on(table.visibility),
  
  /**
   * Index on status for filtering by status
   */
  statusIdx: index('links_status_idx').on(table.status),
  
  /**
   * Index on pinned status for quick access to pinned links
   */
  isPinnedIdx: index('links_is_pinned_idx').on(table.isPinned),
  
  /**
   * Index on creation timestamp for chronological sorting
   */
  createdAtIdx: index('links_created_at_idx').on(table.createdAt),
  
  /**
   * Index on last accessed timestamp for usage analytics
   */
  lastAccessedAtIdx: index('links_last_accessed_at_idx').on(table.lastAccessedAt),
  
  /**
   * Composite index on team and status for team-specific status queries
   */
  teamStatusIdx: index('links_team_status_idx').on(table.teamId, table.status),
  
  /**
   * Composite index on team and visibility for team-specific visibility queries
   */
  teamVisibilityIdx: index('links_team_visibility_idx').on(table.teamId, table.visibility),
  
  /**
   * Composite index on team and pinned status for quick access to team pinned links
   */
  teamPinnedIdx: index('links_team_pinned_idx').on(table.teamId, table.isPinned),
  
  /**
   * Check constraint to validate URL format
   */
  urlCheck: sql`original_url ~* '^https?://[^\s/$.?#].[^\s]*$'`,
  
  /**
   * Check constraint to validate short URL format if provided
   */
  shortUrlCheck: sql`short_url IS NULL OR short_url ~* '^https?://[^\s/$.?#].[^\s]*$'`,
}));

/**
 * Link tag associations table for many-to-many relationship between links and tags
 * 
 * This table connects links with their associated tags
 * 
 * @table link_tag_associations
 */
export const linkTagAssociations = pgTable("link_tag_associations", {
  /**
   * Unique identifier for the association
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the link
   * @type {string} UUID v4
   * @required
   * @references links.id
   */
  linkId: uuid("link_id")
    .notNull()
    .references(() => links.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Reference to the tag
   * @type {string} UUID v4
   * @required
   * @references link_tags.id
   */
  tagId: uuid("tag_id")
    .notNull()
    .references(() => linkTags.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Timestamp when the association was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  /**
   * Unique index on link and tag for preventing duplicate associations
   */
  linkTagIdx: uniqueIndex('link_tag_associations_link_tag_idx').on(table.linkId, table.tagId),
  
  /**
   * Index on link identifier for finding all tags for a link
   */
  linkIdIdx: index('link_tag_associations_link_id_idx').on(table.linkId),
  
  /**
   * Index on tag identifier for finding all links with a tag
   */
  tagIdIdx: index('link_tag_associations_tag_id_idx').on(table.tagId),
}));

/**
 * Link access log table for tracking link usage
 * 
 * This table stores access logs for analytics and usage tracking
 * 
 * @table link_access_logs
 */
export const linkAccessLogs = pgTable("link_access_logs", {
  /**
   * Unique identifier for the access log entry
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the link that was accessed
   * @type {string} UUID v4
   * @required
   * @references links.id
   */
  linkId: uuid("link_id")
    .notNull()
    .references(() => links.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Identifier of the user who accessed the link (if available)
   * @type {string} Max 255 characters
   * @optional
   */
  accessedBy: varchar("accessed_by", { length: 255 }),
  
  /**
   * IP address of the accessor
   * @type {string} Max 45 characters (IPv6 compatible)
   * @optional
   */
  ipAddress: varchar("ip_address", { length: 45 }),
  
  /**
   * User agent string of the accessor
   * @type {string} Max 500 characters
   * @optional
   */
  userAgent: varchar("user_agent", { length: 500 }),
  
  /**
   * Referer URL if available
   * @type {string} Max 2048 characters
   * @optional
   */
  referer: varchar("referer", { length: 2048 }),
  
  /**
   * Timestamp when the link was accessed
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  accessedAt: timestamp("accessed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  /**
   * Index on link identifier for finding all access logs for a link
   */
  linkIdIdx: index('link_access_logs_link_id_idx').on(table.linkId),
  
  /**
   * Index on access timestamp for chronological queries
   */
  accessedAtIdx: index('link_access_logs_accessed_at_idx').on(table.accessedAt),
  
  /**
   * Composite index on link and access timestamp for efficient link analytics
   */
  linkAccessedAtIdx: index('link_access_logs_link_accessed_at_idx').on(table.linkId, table.accessedAt),
}));