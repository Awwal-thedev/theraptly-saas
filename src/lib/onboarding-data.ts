import {
  Hospital,
  Stethoscope,
  HeartHandshake,
  Home,
  Brain,
  Building2,
  type LucideIcon,
} from "lucide-react"

import type { OrgType } from "@/lib/auth/types"

export const orgTypes: { value: OrgType; label: string; icon: LucideIcon }[] = [
  { value: "hospital", label: "Hospital / Health system", icon: Hospital },
  { value: "clinic", label: "Clinic / Practice", icon: Stethoscope },
  { value: "long_term_care", label: "Long-term care", icon: HeartHandshake },
  { value: "home_health", label: "Home health", icon: Home },
  { value: "behavioral_health", label: "Behavioral health", icon: Brain },
  { value: "other", label: "Other", icon: Building2 },
]

export const teamSizes = [
  "1–10",
  "11–50",
  "51–200",
  "201–1000",
  "1000+",
]

export const frameworks = [
  { id: "HIPAA", label: "HIPAA", desc: "Privacy & security of patient data" },
  { id: "OSHA", label: "OSHA", desc: "Workplace safety standards" },
  { id: "Joint Commission", label: "Joint Commission", desc: "Accreditation readiness" },
  { id: "CMS", label: "CMS", desc: "Medicare / Medicaid conditions" },
  { id: "Bloodborne", label: "Bloodborne pathogens", desc: "Exposure control" },
  { id: "Infection Control", label: "Infection control", desc: "Prevention protocols" },
]
