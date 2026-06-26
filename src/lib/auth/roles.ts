/**
 * Dual-layer role model (PRD: Post-MVP Hierarchical Roles & Permissions).
 *
 * Every account is fundamentally a Student at the data layer. Two orthogonal
 * axes sit on top of that base identity:
 *
 *   - SystemRole  → administrative clearance. Controls which management UI and
 *                   API routes the account may touch. Checked via an O(1)
 *                   dictionary lookup (PERMISSIONS), never a loop.
 *   - WorkerRole  → automated training track. Controls which mandatory courses
 *                   the auto-enrollment engine assigns to the account.
 *
 * The two axes never overwrite each other: promoting a Nurse (workerRole) to
 * Clinical Director (systemRole) leaves their training transcript intact.
 */

/* ------------------------------------------------------------------ */
/* System roles — administrative clearance                            */
/* ------------------------------------------------------------------ */

export type SystemRole =
  | "super_admin"
  | "owner"
  | "hr"
  | "clinical_director"
  | "finance"
  | "student"

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  super_admin: "Super Admin",
  owner: "Owner",
  hr: "HR",
  clinical_director: "Clinical Director",
  finance: "Finance",
  student: "Student",
}

/** Roles that get a Management view + the View Switcher. Students never do. */
export function isElevated(role: SystemRole): boolean {
  return role !== "student"
}

/** One-line plain-English summary of what each system role can do. */
export const SYSTEM_ROLE_SUMMARY: Record<SystemRole, string> = {
  super_admin: "Full cross-tenant access across all facilities.",
  owner: "Full access to everything in this facility, including billing and user management.",
  hr: "Manage staff, assign general courses, and view completion metrics. No billing or clinical scores.",
  clinical_director:
    "Build clinical modules, assign clinical paths, and view granular assessment scores. No billing.",
  finance: "Manage billing, subscription, payment methods, and invoices only.",
  student: "Personal learning only — no administrative access.",
}

/* ------------------------------------------------------------------ */
/* Worker roles — automated training tracks                           */
/* ------------------------------------------------------------------ */

export type WorkerRole =
  | "front_desk"
  | "nurse"
  | "doctor"
  | "therapist"
  | "finance"
  | "others"

export const WORKER_ROLE_LABELS: Record<WorkerRole, string> = {
  front_desk: "Front-desk",
  nurse: "Nurse",
  doctor: "Doctor",
  therapist: "Therapist",
  finance: "Finance",
  others: "Others",
}

/** What each worker-role training track is evaluated on (PRD §Worker Roles). */
export const WORKER_ROLE_FOCUS: Record<WorkerRole, string> = {
  front_desk: "HIPAA Basics, OSHA, facility security",
  nurse: "Infection control, medication-admin safety",
  doctor: "Medical-legal risk, emergency intervention",
  therapist: "Suicide risk assessment, note privacy",
  finance: "Fraud, waste & abuse prevention",
  others: "Baseline corporate & facility safety",
}

export const WORKER_ROLE_ORDER: WorkerRole[] = [
  "front_desk",
  "nurse",
  "doctor",
  "therapist",
  "finance",
  "others",
]

/* ------------------------------------------------------------------ */
/* Capabilities + permission matrix (O(1) lookup, PRD AC 2.1)         */
/* ------------------------------------------------------------------ */

/**
 * Fine-grained capabilities, derived from the Access Control Matrix in the
 * PRD (§2). Used to gate buttons/sections and — once the backend lands — to
 * mirror the server-side route guard (permissionsMatrix[role][capability]).
 */
export type Capability =
  | "manage_billing" // view/edit subscription, payment, invoices
  | "build_courses" // create/generate & edit courses
  | "assign_general_courses" // HIPAA/OSHA baseline assignment
  | "assign_clinical_paths" // clinical module assignment
  | "edit_clinical_modules" // author clinical assessments
  | "view_clinical_scores" // question-by-question assessment logs
  | "view_completion_metrics" // broad pass/fail dashboards
  | "manage_staff" // edit worker details, roster
  | "promote_users" // change another user's system role
  | "manage_facilities" // create/switch/configure facilities
  | "cross_tenant" // Super-Admin global access

export interface Permission {
  /** Management-view nav sections this role can see (keys into NAV defs). */
  nav: NavKey[]
  /** Capability set — membership test is O(1). */
  capabilities: ReadonlySet<Capability>
}

export type NavKey =
  | "dashboard"
  | "documents"
  | "courses"
  | "staff"
  | "billing"
  | "settings"
  | "help"

export const NAV_LABELS: Record<NavKey, string> = {
  dashboard: "Dashboard",
  documents: "Documents",
  courses: "Courses",
  staff: "Staff Management",
  billing: "Billing",
  settings: "Settings",
  help: "Help Center",
}

/** Display order for the nav rows in the Roles reference. */
export const NAV_ORDER: NavKey[] = [
  "dashboard",
  "documents",
  "courses",
  "staff",
  "billing",
  "settings",
]

export const CAPABILITY_LABELS: Record<Capability, string> = {
  manage_billing: "Manage billing & invoices",
  build_courses: "Build & edit courses",
  assign_general_courses: "Assign general courses",
  assign_clinical_paths: "Assign clinical paths",
  edit_clinical_modules: "Author clinical assessments",
  view_clinical_scores: "View question-level scores",
  view_completion_metrics: "View completion metrics",
  manage_staff: "Manage staff roster",
  promote_users: "Invite & change user roles",
  manage_facilities: "Create & switch facilities",
  cross_tenant: "Cross-tenant access",
}

/** Display order for the capability rows in the Roles reference. */
export const CAPABILITY_ORDER: Capability[] = [
  "manage_staff",
  "promote_users",
  "build_courses",
  "assign_general_courses",
  "assign_clinical_paths",
  "edit_clinical_modules",
  "view_clinical_scores",
  "view_completion_metrics",
  "manage_billing",
  "manage_facilities",
]

/**
 * System roles a facility Owner can assign, in display order. Super Admin is
 * Theraptly-internal only, so it's excluded from the assignable reference.
 */
export const ASSIGNABLE_ROLE_ORDER: SystemRole[] = [
  "owner",
  "hr",
  "clinical_director",
  "finance",
  "student",
]

const cap = (...c: Capability[]): ReadonlySet<Capability> => new Set(c)

export const PERMISSIONS: Record<SystemRole, Permission> = {
  super_admin: {
    nav: ["dashboard", "documents", "courses", "staff", "billing", "settings", "help"],
    capabilities: cap(
      "manage_billing",
      "build_courses",
      "assign_general_courses",
      "assign_clinical_paths",
      "edit_clinical_modules",
      "view_clinical_scores",
      "view_completion_metrics",
      "manage_staff",
      "promote_users",
      "manage_facilities",
      "cross_tenant"
    ),
  },
  owner: {
    nav: ["dashboard", "documents", "courses", "staff", "billing", "settings", "help"],
    capabilities: cap(
      "manage_billing",
      "build_courses",
      "assign_general_courses",
      "assign_clinical_paths",
      "edit_clinical_modules",
      "view_clinical_scores",
      "view_completion_metrics",
      "manage_staff",
      "promote_users",
      "manage_facilities"
    ),
  },
  hr: {
    // No billing, no clinical authoring, no question-by-question scores.
    // User management (invite/promote) is Owner-only, so no promote_users here.
    nav: ["dashboard", "documents", "courses", "staff", "help"],
    capabilities: cap(
      "assign_general_courses",
      "view_completion_metrics",
      "manage_staff"
    ),
  },
  clinical_director: {
    // No billing; full clinical authoring + granular scores.
    nav: ["dashboard", "documents", "courses", "staff", "help"],
    capabilities: cap(
      "build_courses",
      "assign_general_courses",
      "assign_clinical_paths",
      "edit_clinical_modules",
      "view_clinical_scores",
      "view_completion_metrics",
      "manage_staff"
    ),
  },
  finance: {
    // Billing only; cannot build courses, assign paths, or see test metrics.
    nav: ["dashboard", "billing", "help"],
    capabilities: cap("manage_billing"),
  },
  student: {
    // Zero administrative access — Learner view only.
    nav: [],
    capabilities: cap(),
  },
}

/** O(1) capability check. */
export function can(role: SystemRole, capability: Capability): boolean {
  return PERMISSIONS[role].capabilities.has(capability)
}

/* ------------------------------------------------------------------ */
/* Bridge from the legacy flat role until the backend ships dual-axis */
/* ------------------------------------------------------------------ */

import type { UserRole } from "@/lib/auth/types"

/**
 * Maps the current single-field role (admin|manager|staff) onto a system
 * role so the new UI works against today's accounts. Removed once the
 * backend issues an explicit `systemRole` (PRD AC 1.1).
 */
export function systemRoleFromLegacy(role: UserRole): SystemRole {
  switch (role) {
    case "admin":
      return "owner"
    case "manager":
      return "hr"
    case "staff":
      return "student"
    default:
      return "student"
  }
}
