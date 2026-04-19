CREATE TYPE "public"."request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROVISIONED', 'FAILED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_name" text NOT NULL,
	"action_type" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hire_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"personal_email" text NOT NULL,
	"job_title" text NOT NULL,
	"department" text NOT NULL,
	"requested_licenses" text,
	"requested_groups" text,
	"is_special_hire" boolean DEFAULT false NOT NULL,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"tenant_id" text,
	"client_id" text,
	"client_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_hardware" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"category" text NOT NULL,
	"url" text NOT NULL,
	"item_name" text NOT NULL,
	"price" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"host_email" text NOT NULL,
	"additional_attendees" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding_workflows" DROP CONSTRAINT "onboarding_workflows_profile_id_onboarding_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "onboarding_workflows" ADD COLUMN "completed_action_items" text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_tasks" ADD COLUMN "requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_tasks" ADD COLUMN "approver_email" text;--> statement-breakpoint
ALTER TABLE "profile_tasks" ADD COLUMN "provision_entra_group_on_complete" text;--> statement-breakpoint
ALTER TABLE "role_profiles" ADD COLUMN "default_licenses" text;--> statement-breakpoint
ALTER TABLE "role_profiles" ADD COLUMN "default_groups" text;--> statement-breakpoint
ALTER TABLE "workflow_tasks" ADD COLUMN "cost" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "workflow_tasks" ADD COLUMN "requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_tasks" ADD COLUMN "approver_email" text;--> statement-breakpoint
ALTER TABLE "workflow_tasks" ADD COLUMN "provision_entra_group_on_complete" text;--> statement-breakpoint
ALTER TABLE "hire_requests" ADD CONSTRAINT "hire_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hire_requests" ADD CONSTRAINT "hire_requests_profile_id_role_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."role_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hire_requests" ADD CONSTRAINT "hire_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_integrations" ADD CONSTRAINT "organization_integrations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_hardware" ADD CONSTRAINT "profile_hardware_profile_id_role_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_meetings" ADD CONSTRAINT "profile_meetings_profile_id_role_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_workflows" ADD CONSTRAINT "onboarding_workflows_profile_id_role_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."role_profiles"("id") ON DELETE no action ON UPDATE no action;