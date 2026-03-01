// db/schema.ts
import { pgTable, uuid, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums based on Harmony OP requirements
export const roleEnum = pgEnum("role", ["HR", "IT", "MANAGER", "EMPLOYEE"]);
export const taskTypeEnum = pgEnum("task_type", ["IT_ACCESS", "HARDWARE", "TRAINING", "HR_ADMIN"]);
export const statusEnum = pgEnum("status", ["PENDING", "IN_PROGRESS", "BLOCKED", "DONE"]);

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

// Role-Based Onboarding Profiles (Old/Legacy version - keeping to avoid breaking changes)
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
  profileId: uuid("profile_id").references(() => onboardingProfiles.id),
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

// === NEW: Role Profiles (Templates for Entra ID Sync) ===
export const roleProfiles = pgTable("role_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(), // e.g., "Software Engineer"
  department: text("department").notNull(), // e.g., "Engineering"
  entraGroupId: text("entra_group_id"), // e.g., "8a7b3c2d..." (from Microsoft)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === NEW: Profile Tasks (Default tasks for a template) ===
export const profileTasks = pgTable("profile_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => roleProfiles.id, { onDelete: 'cascade' }),
  title: text("title").notNull(), // e.g., "Assign GitHub License"
  taskType: text("task_type").notNull(), // Needs to match taskTypeEnum logic
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profileMeetings = pgTable("profile_meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .references(() => roleProfiles.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(), 
  durationMinutes: integer("duration_minutes").notNull().default(60),
  hostEmail: text("host_email").notNull(), 
  
  // === NEW: Store external guests as a comma-separated string ===
  additionalAttendees: text("additional_attendees"), 
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === NEW: Integrations Table ===
export const organizationIntegrations = pgTable("organization_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull(), // e.g., "MICROSOFT_ENTRA"
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
}));

export const onboardingWorkflowsRelations = relations(onboardingWorkflows, ({ one, many }) => ({
  newHire: one(users, {
    fields: [onboardingWorkflows.newHireId],
    references: [users.id],
  }),
  tasks: many(workflowTasks),
}));

export const workflowTasksRelations = relations(workflowTasks, ({ one }) => ({
  workflow: one(onboardingWorkflows, {
    fields: [workflowTasks.workflowId],
    references: [onboardingWorkflows.id],
  }),
}));

export const roleProfilesRelations = relations(roleProfiles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roleProfiles.orgId],
    references: [organizations.id],
  }),
  defaultTasks: many(profileTasks),
  defaultMeetings: many(profileMeetings), // Linked the new meetings table!
}));

export const profileTasksRelations = relations(profileTasks, ({ one }) => ({
  profile: one(roleProfiles, {
    fields: [profileTasks.profileId],
    references: [roleProfiles.id],
  }),
}));

// Add relations mapping for profile meetings
export const profileMeetingsRelations = relations(profileMeetings, ({ one }) => ({
  profile: one(roleProfiles, {
    fields: [profileMeetings.profileId],
    references: [roleProfiles.id],
  }),
}));

export const organizationIntegrationsRelations = relations(organizationIntegrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationIntegrations.orgId],
    references: [organizations.id],
  }),
}));