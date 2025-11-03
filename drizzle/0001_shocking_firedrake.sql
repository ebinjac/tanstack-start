CREATE TYPE "public"."entry_priority" AS ENUM('normal', 'important', 'flagged', 'needs_action', 'long_pending');--> statement-breakpoint
CREATE TYPE "public"."entry_type" AS ENUM('rfc', 'inc', 'alert', 'mim', 'email_slack', 'fyi');--> statement-breakpoint
CREATE TYPE "public"."sub_application_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."turnover_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "sub_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"sub_application_name" varchar(255) NOT NULL,
	"code" varchar(12),
	"description" text,
	"status" "sub_application_status" DEFAULT 'active' NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "turnover_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"application_id" uuid,
	"sub_application_id" uuid,
	"handover_from" varchar(255) NOT NULL,
	"handover_to" varchar(255) NOT NULL,
	"status" "turnover_status" DEFAULT 'draft' NOT NULL,
	"entries" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turnover_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turnover_id" uuid NOT NULL,
	"entry_type" "entry_type" NOT NULL,
	"priority" "entry_priority" DEFAULT 'normal' NOT NULL,
	"rfc_number" varchar(100),
	"rfc_status" varchar(50),
	"rfc_validated_by" varchar(255),
	"rfc_description" text,
	"inc_number" varchar(100),
	"incident_description" text,
	"alerts_issues" text,
	"mim_link" varchar(2048),
	"mim_slack_link" varchar(2048),
	"email_subject_slack_link" varchar(2048),
	"fyi_info" text,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turnover_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"application_id" uuid,
	"sub_application_id" uuid,
	"snapshot_date" timestamp with time zone NOT NULL,
	"turnover_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turnovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"application_id" uuid,
	"sub_application_id" uuid,
	"handover_from" varchar(255) NOT NULL,
	"handover_to" varchar(255) NOT NULL,
	"status" "turnover_status" DEFAULT 'draft' NOT NULL,
	"turnover_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sub_applications" ADD CONSTRAINT "sub_applications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_drafts" ADD CONSTRAINT "turnover_drafts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_drafts" ADD CONSTRAINT "turnover_drafts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_drafts" ADD CONSTRAINT "turnover_drafts_sub_application_id_sub_applications_id_fk" FOREIGN KEY ("sub_application_id") REFERENCES "public"."sub_applications"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_entries" ADD CONSTRAINT "turnover_entries_turnover_id_turnovers_id_fk" FOREIGN KEY ("turnover_id") REFERENCES "public"."turnovers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_snapshots" ADD CONSTRAINT "turnover_snapshots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_snapshots" ADD CONSTRAINT "turnover_snapshots_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_snapshots" ADD CONSTRAINT "turnover_snapshots_sub_application_id_sub_applications_id_fk" FOREIGN KEY ("sub_application_id") REFERENCES "public"."sub_applications"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnovers" ADD CONSTRAINT "turnovers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnovers" ADD CONSTRAINT "turnovers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnovers" ADD CONSTRAINT "turnovers_sub_application_id_sub_applications_id_fk" FOREIGN KEY ("sub_application_id") REFERENCES "public"."sub_applications"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "sub_apps_app_name_idx" ON "sub_applications" USING btree ("application_id","sub_application_name");--> statement-breakpoint
CREATE INDEX "sub_apps_application_id_idx" ON "sub_applications" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "sub_apps_status_idx" ON "sub_applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "turnover_drafts_team_app_sub_app_status_idx" ON "turnover_drafts" USING btree ("team_id","application_id","sub_application_id","status");--> statement-breakpoint
CREATE INDEX "turnover_drafts_team_id_idx" ON "turnover_drafts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "turnover_drafts_application_id_idx" ON "turnover_drafts" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "turnover_drafts_sub_application_id_idx" ON "turnover_drafts" USING btree ("sub_application_id");--> statement-breakpoint
CREATE INDEX "turnover_drafts_status_idx" ON "turnover_drafts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "turnover_drafts_updated_at_idx" ON "turnover_drafts" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "turnover_entries_turnover_id_idx" ON "turnover_entries" USING btree ("turnover_id");--> statement-breakpoint
CREATE INDEX "turnover_entries_entry_type_idx" ON "turnover_entries" USING btree ("entry_type");--> statement-breakpoint
CREATE INDEX "turnover_entries_priority_idx" ON "turnover_entries" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "turnover_entries_created_at_idx" ON "turnover_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "turnover_entries_updated_at_idx" ON "turnover_entries" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "turnover_entries_turnover_entry_type_idx" ON "turnover_entries" USING btree ("turnover_id","entry_type");--> statement-breakpoint
CREATE UNIQUE INDEX "turnover_snapshots_team_app_sub_app_date_idx" ON "turnover_snapshots" USING btree ("team_id","application_id","sub_application_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "turnover_snapshots_team_id_idx" ON "turnover_snapshots" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "turnover_snapshots_snapshot_date_idx" ON "turnover_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "turnover_snapshots_team_snapshot_date_idx" ON "turnover_snapshots" USING btree ("team_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "turnovers_team_id_idx" ON "turnovers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "turnovers_application_id_idx" ON "turnovers" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "turnovers_sub_application_id_idx" ON "turnovers" USING btree ("sub_application_id");--> statement-breakpoint
CREATE INDEX "turnovers_status_idx" ON "turnovers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "turnovers_turnover_date_idx" ON "turnovers" USING btree ("turnover_date");--> statement-breakpoint
CREATE INDEX "turnovers_team_turnover_date_idx" ON "turnovers" USING btree ("team_id","turnover_date");