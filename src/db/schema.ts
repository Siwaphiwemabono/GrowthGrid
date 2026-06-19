// src/db/schema.ts
// ============================================
// DRIZZLE TABLE DEFINITIONS
// (For migrations and type-safe queries)
// ============================================
import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  boolean, 
  integer,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  password_changed: boolean("password_changed").default(false),
  role: text("role").default("employee"),
  business_id: uuid("business_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  business_name: text("business_name").notNull(),
  industry: text("industry").notNull(),
  business_size: text("business_size"),
  created_at: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_owner_id: uuid("business_owner_id").notNull(),
  business_id: uuid("business_id").notNull(),
  profile_id: uuid("profile_id"),
  email: text("email").notNull(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  role: text("role").default("employee"),
  created_at: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  business_id: uuid("business_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assigned_to: uuid("assigned_to"),
  assigned_by: uuid("assigned_by"),
  source: text("source"),
  status: text("status").default("Available"),
  priority: text("priority").default("Medium"),
  due_date: timestamp("due_date"),
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
  industry: text("industry"),
  assigned_to_email: text("assigned_to_email"),
});

export const automationRules = pgTable("automation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").default(false),
  link: text("link"),
  created_at: timestamp("created_at").defaultNow(),
});

// ============================================
// DATABASE TABLE TYPES
// These types match your Supabase tables
// ============================================

export type Business = {
  id: string;
  user_id: string;
  business_name: string;
  industry: string;
  business_size: string | null;
  created_at: string;
}

export type Employee = {
  id: string;
  business_owner_id: string;
  business_id: string;
  profile_id: string | null;
  email: string;
  name: string;
  surname: string;
  role: string;
  created_at: string;
}

export type Task = {
  id: number;
  business_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  source: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  industry: string | null;
  assigned_to_email: string | null;
}

export type AutomationRule = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
}

export type Profile = {
  id: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  password_changed: boolean;
  role: string;
  business_id: string | null;
  created_at: string;
  updated_at: string;
}

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

export type InsertBusiness = Omit<Business, 'id' | 'created_at'>
export type InsertEmployee = Omit<Employee, 'id' | 'created_at'>
export type InsertTask = Omit<Task, 'id' | 'created_at'>
export type InsertAutomationRule = Omit<AutomationRule, 'id'>
export type InsertProfile = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
export type InsertNotification = Omit<Notification, 'id' | 'created_at'>

// ============================================
// UPDATE TYPES (for updating records)
// ============================================

export type UpdateBusiness = Partial<InsertBusiness>
export type UpdateEmployee = Partial<InsertEmployee>
export type UpdateTask = Partial<InsertTask>
export type UpdateAutomationRule = Partial<InsertAutomationRule>
export type UpdateProfile = Partial<InsertProfile>
export type UpdateNotification = Partial<InsertNotification>

// ============================================
// REQUEST/RESPONSE TYPES (for API routes)
// ============================================

export type RegisterRequest = {
  name: string;
  surname: string;
  email: string;
  password: string;
  businessName: string;
  industry: string;
  businessSize?: string;
  hasEmployees?: string;
  employeeEmails?: string;
}

export type RegisterResponse = {
  success: boolean;
  message: string;
  userId?: string;
  businessId?: string;
  error?: string;
}

export type LoginRequest = {
  email: string;
  password: string;
}

export type LoginResponse = {
  success: boolean;
  message: string;
  user?: Profile;
  token?: string;
  error?: string;
}

// ============================================
// RE-EXPORT THE DB CLIENT
// ============================================

export { db } from './db'