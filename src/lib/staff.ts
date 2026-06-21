export type StaffRole =
  | "Clinician"
  | "Therapist"
  | "Assistant"
  | "Direct Support Professional (DSP)"
  | "Supervisor"

export interface StaffMember {
  id: string
  name: string
  email: string
  role: StaffRole
  invitedDaysAgo: number
  online: boolean
  jobTitle?: string
}

export interface StaffTraining {
  id: string
  name: string
  category: string
  progress: number // 0..100
  deadline: string
  status: "In progress" | "Attended" | "Failed" | "Completed"
  due?: "soon" | "passed"
}

export interface StaffCertificate {
  id: string
  name: string
  completionDate: string
  approved: boolean
}

/**
 * Roster for the current organization. Empty until backend wiring is in
 * place — the staff page shows its empty state automatically.
 */
export const staff: StaffMember[] = []

export function findStaff(id: string): StaffMember | undefined {
  return staff.find((s) => s.id === id)
}

export const staffStats = {
  totalAssigned: 0,
  completed: 0,
  failed: 0,
  active: 0,
}

export const staffTrainings: StaffTraining[] = []

export const staffCertificates: StaffCertificate[] = []

/** Pleasant pastel palette keyed off name initial — used for avatar fallbacks. */
export function avatarTone(name: string): { bg: string; fg: string } {
  const tones = [
    { bg: "#FEE4E2", fg: "#B42318" },
    { bg: "#FEF0C7", fg: "#B54708" },
    { bg: "#D1FADF", fg: "#027A48" },
    { bg: "#D1E9FF", fg: "#175CD3" },
    { bg: "#E0EAFF", fg: "#3538CD" },
    { bg: "#F4EBFF", fg: "#6941C6" },
    { bg: "#FCE7F6", fg: "#C11574" },
    { bg: "#FEE6E2", fg: "#B93815" },
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return tones[Math.abs(hash) % tones.length]
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
