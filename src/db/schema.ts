// src/db/schema.ts
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
  assigned_to: string | null;        // ✅ snake_case
  assigned_by: string | null;        // ✅ snake_case
  source: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;            // ✅ snake_case
  created_at: string;                // ✅ snake_case
  completed_at: string | null;       // ✅ snake_case
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

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

export type InsertBusiness = Omit<Business, 'id' | 'created_at'>
export type InsertEmployee = Omit<Employee, 'id' | 'created_at'>
export type InsertTask = Omit<Task, 'id' | 'created_at'>
export type InsertAutomationRule = Omit<AutomationRule, 'id'>
export type InsertProfile = Omit<Profile, 'id' | 'created_at' | 'updated_at'>

// ============================================
// UPDATE TYPES (for updating records)
// ============================================

export type UpdateBusiness = Partial<InsertBusiness>
export type UpdateEmployee = Partial<InsertEmployee>
export type UpdateTask = Partial<InsertTask>
export type UpdateAutomationRule = Partial<InsertAutomationRule>
export type UpdateProfile = Partial<InsertProfile>

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