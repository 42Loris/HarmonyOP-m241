// db/schema.ts
import { pgTable, uuid, text, timestamp, integer, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums based on Harmony OP requirements
export const roleEnum = pgEnum("role", ["HR", "IT", "MANAGER", "EMPLOYEE"]);
export const taskTypeEnum = pgEnum("task_type", ["IT_ACCESS", "HARDWARE", "TRAINING", "HR_ADMIN"]);
export const statusEnum = pgEnum("status", ["PENDING", "IN_PROGRESS", "BLOCKED", "DONE"]);
// === NEW: Status for the Approval Flow ===
export const requestStatusEnum = pgEnum("request_status", ["PENDING", "APPROVED", "REJECTED", "PROVISIONED", "FAILED"]);

// Organizations (Tenants / KMUs) 
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users (All actors in the system) 
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").default("EMPLOYEE").notNull(),
  department: text("department"),
  authId: text("auth_id"), 
});

// Role-Based Onboarding Profiles (Old/Legacy version)
export const onboardingProfiles = pgTable("onboarding_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  roleTitle: text("role_title").notNull(),
  department: text("department").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Active Workflows (Event-driven trigger)
export const onboardingWorkflows = pgTable("onboarding_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  newHireId: uuid("new_hire_id").notNull().references(() => users.id),
  profileId: uuid("profile_id").references(() => roleProfiles.id),
  roleTitle: text("role_title").notNull().default("Employee"), 
  department: text("department").notNull().default("General"), 
  startDate: timestamp("start_date").notNull(),
  progressRatio: integer("progress_ratio").default(0).notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workflow Tasks (Instantiated tasks for IT, HR, etc.) 
export const workflowTasks = pgTable("workflow_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull().references(() => onboardingWorkflows.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  taskType: taskTypeEnum("task_type").notNull(),
  assignedUserId: uuid("assigned_user_id").references(() => users.id),
  status: statusEnum("status").default("PENDING").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === UPDATED: Role Profiles (Added Defaults for Microsoft Push) ===
export const roleProfiles = pgTable("role_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(), 
  department: text("department").notNull(), 
  entraGroupId: text("entra_group_id"), 
  
  // New Columns for Provisioning:
  defaultLicenses: text("default_licenses"), // e.g., "E5_License_SKU_ID"
  defaultGroups: text("default_groups"), // Additional Entra Groups (e.g., SharePoint access)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === NEW: Hire Requests (The Approval Pipeline) ===
export const hireRequests = pgTable("hire_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  profileId: uuid("profile_id").notNull().references(() => roleProfiles.id),
  requesterId: uuid("requester_id").notNull().references(() => users.id), // The HR Rep who requested it
  
  // New Hire Details
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  personalEmail: text("personal_email").notNull(), // Where to send initial credentials
  jobTitle: text("job_title").notNull(),
  department: text("department").notNull(),
  
  // Microsoft Provisioning Details
  requestedLicenses: text("requested_licenses"), 
  requestedGroups: text("requested_groups"), 
  isSpecialHire: boolean("is_special_hire").default(false).notNull(), 
  
  // State Machine
  status: requestStatusEnum("status").default("PENDING").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Profile Tasks
export const profileTasks = pgTable("profile_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => roleProfiles.id, { onDelete: 'cascade' }),
  title: text("title").notNull(), 
  taskType: text("task_type").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Profile Meetings
export const profileMeetings = pgTable("profile_meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => roleProfiles.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(), 
  durationMinutes: integer("duration_minutes").notNull().default(60),
  hostEmail: text("host_email").notNull(), 
  additionalAttendees: text("additional_attendees"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Integrations Table
export const organizationIntegrations = pgTable("organization_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull(), 
  tenantId: text("tenant_id"),
  clientId: text("client_id"),
  clientSecret: text("client_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =====================
// === RELATIONS ===
// =====================
export const usersRelations = relations(users, ({ many }) => ({
  workflows: many(onboardingWorkflows),
  hireRequests: many(hireRequests),
}));

export const onboardingWorkflowsRelations = relations(onboardingWorkflows, ({ one, many }) => ({
  newHire: one(users, { fields: [onboardingWorkflows.newHireId], references: [users.id] }),
  tasks: many(workflowTasks),
}));

export const workflowTasksRelations = relations(workflowTasks, ({ one }) => ({
  workflow: one(onboardingWorkflows, { fields: [workflowTasks.workflowId], references: [onboardingWorkflows.id] }),
}));

export const roleProfilesRelations = relations(roleProfiles, ({ one, many }) => ({
  organization: one(organizations, { fields: [roleProfiles.orgId], references: [organizations.id] }),
  defaultTasks: many(profileTasks),
  defaultMeetings: many(profileMeetings), 
  hireRequests: many(hireRequests),
}));

export const profileTasksRelations = relations(profileTasks, ({ one }) => ({
  profile: one(roleProfiles, { fields: [profileTasks.profileId], references: [roleProfiles.id] }),
}));

export const profileMeetingsRelations = relations(profileMeetings, ({ one }) => ({
  profile: one(roleProfiles, { fields: [profileMeetings.profileId], references: [roleProfiles.id] }),
}));

export const organizationIntegrationsRelations = relations(organizationIntegrations, ({ one }) => ({
  organization: one(organizations, { fields: [organizationIntegrations.orgId], references: [organizations.id] }),
}));

export const hireRequestsRelations = relations(hireRequests, ({ one }) => ({
  organization: one(organizations, { fields: [hireRequests.orgId], references: [organizations.id] }),
  profile: one(roleProfiles, { fields: [hireRequests.profileId], references: [roleProfiles.id] }),
  requester: one(users, { fields: [hireRequests.requesterId], references: [users.id] }),
}));

// =====================
// === AUDIT LOGS ===
// =====================

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().notNull(),
  orgId: uuid("org_id").notNull(),
  actorName: text("actor_name").notNull(), // The person who clicked the button
  actionType: text("action_type").notNull(), // e.g., "TERMINATION", "SETTINGS_UPDATE"
  description: text("description").notNull(), // e.g., "Revoked access for John Doe"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});