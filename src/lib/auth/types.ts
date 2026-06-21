export type UserRole = "admin" | "manager" | "staff"

export type OrgType =
  | "hospital"
  | "clinic"
  | "long_term_care"
  | "home_health"
  | "behavioral_health"
  | "other"

export interface Organization {
  name: string
  type: OrgType
  teamSize: string
  /** Compliance frameworks the org needs to track, e.g. HIPAA, OSHA. */
  frameworks: string[]
}

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  /** Present once the org-setup onboarding wizard is complete. */
  organization?: Organization
  onboarded: boolean
  createdAt: string
}

export interface SignUpInput {
  fullName: string
  email: string
  password: string
  role: UserRole
}

export interface SignInInput {
  email: string
  password: string
}
