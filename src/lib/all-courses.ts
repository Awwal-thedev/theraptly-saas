import { courses } from "@/lib/courses"
import { prebuiltCourses } from "@/lib/prebuilt-courses"

export type CourseRow = {
  id: string
  name: string
  category: string
  assigned: number
  role: string
  date: string
  source: "created" | "prebuilt"
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const createdRoles: Record<string, string> = {
  "hipaa-privacy-training": "General",
  "osha-bloodborne-pathogens": "Clinicians",
  "infection-control-basics": "Nurses",
  "fire-emergency-safety": "General",
  "patient-rights-consent": "HR",
}

const prebuiltMeta = [
  { assigned: 14, role: "General", date: "Jan 15, 2024" },
  { assigned: 8, role: "HR", date: "Feb 20, 2024" },
  { assigned: 21, role: "Nurses", date: "Mar 11, 2024" },
  { assigned: 10, role: "Clinicians", date: "Apr 05, 2024" },
  { assigned: 6, role: "Technical Professionals", date: "May 22, 2024" },
  { assigned: 12, role: "Clinicians", date: "Jun 09, 2024" },
]

// Created courses + prebuilt library, listed together.
export const allCourses: CourseRow[] = [
  ...courses.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.type,
    assigned: c.assigned,
    role: createdRoles[c.id] ?? "General",
    date: c.date,
    source: "created" as const,
  })),
  ...prebuiltCourses.map((p, i) => ({
    id: slug(p.title),
    name: p.title,
    category: p.format,
    assigned: prebuiltMeta[i]?.assigned ?? 0,
    role: prebuiltMeta[i]?.role ?? "General",
    date: prebuiltMeta[i]?.date ?? "Jan 01, 2024",
    source: "prebuilt" as const,
  })),
]

export const dateValue = (d: string) => {
  const t = new Date(d).getTime()
  return Number.isNaN(t) ? 0 : t
}
