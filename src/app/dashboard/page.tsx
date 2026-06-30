"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import {
  BookOpenIcon,
  CheckBadgeIcon,
  UsersIcon,
} from "@heroicons/react/24/solid"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import {
  useStoredCourses,
  useStoredDocuments,
  useStoredStaff,
} from "@/lib/client-store"
import { courses as coursesSeed } from "@/lib/courses"
import { documents as docsSeed } from "@/lib/documents"
import { staff as staffSeed } from "@/lib/staff"
import { AppShell } from "@/components/app/app-shell"
import { PerformanceChart, TrainingCoverage } from "@/components/dashboard/charts"
import { DeadlineRisk } from "@/components/dashboard/deadline-risk"
import { DashboardEmptyState } from "@/components/dashboard/empty-state"
import { MyCourses } from "@/components/dashboard/my-courses"
import { PrebuiltCourses } from "@/components/dashboard/prebuilt-courses"
import { EmptyStateCard } from "@/components/empty-state-card"
import { Button } from "@/components/ui/button"

/** Parse a completion string ("80%" or "8/10") into a 0–100 number. */
function completionPct(completion: string): number | null {
  const pct = completion.match(/(\d+)\s*%/)
  if (pct) return Number(pct[1])
  const frac = completion.match(/(\d+)\s*\/\s*(\d+)/)
  if (frac) {
    const a = Number(frac[1])
    const b = Number(frac[2])
    if (b) return Math.round((a / b) * 100)
  }
  return null
}

function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        className
      )}
    >
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const storedCourses = useStoredCourses()
  const storedDocs = useStoredDocuments()
  const storedStaff = useStoredStaff()

  // Seed + anything created locally.
  const courses = [...storedCourses, ...coursesSeed]

  // Real numbers derived from the current data sources. Backend will swap
  // these for live queries; the calculation shape stays the same.
  const totalCourses = courses.length
  const totalStaffAssigned = courses.reduce(
    (sum, c) => sum + (Number(c.assigned) || 0),
    0
  )
  const completionPcts = courses
    .map((c) => completionPct(c.completion))
    .filter((p): p is number => p != null)
  const averageGrade = completionPcts.length
    ? Math.round(
        completionPcts.reduce((a, b) => a + b, 0) / completionPcts.length
      )
    : null

  const stats = [
    {
      label: "Total Courses",
      value: String(totalCourses),
      icon: BookOpenIcon,
      bg: "#E9F9F2",
      border: "#9BE3C2",
      chip: "#16A34A",
    },
    {
      label: "Total Staff Assigned",
      value: String(totalStaffAssigned),
      icon: UsersIcon,
      bg: "#E9ECF9",
      border: "#9BA7E3",
      chip: "#162EA3",
    },
    {
      label: "Average Grade",
      value: averageGrade != null ? `${averageGrade}%` : "—",
      icon: CheckBadgeIcon,
      bg: "#F9E9E9",
      border: "#E39B9B",
      chip: "#CD1515",
    },
  ] as const

  // Empty when the user hasn't onboarded OR has zero courses/staff/docs.
  const hasNoData =
    totalCourses === 0 &&
    staffSeed.length + storedStaff.length === 0 &&
    docsSeed.length + storedDocs.length === 0
  const showEmptyState = (user && !user.onboarded) || hasNoData

  return (
    <AppShell breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "Training" }]}>
      {showEmptyState ? (
        <DashboardEmptyState />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-inter text-[26px] font-semibold leading-tight tracking-tight text-ink">
                Dashboard
              </h1>
              <p className="font-inter text-[18px] text-ink-muted">
                Here is an overview of your courses
              </p>
            </div>
            <Button
              nativeButton={false}
              className="font-inter h-12 rounded-xl px-5 text-[15px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-brand-hover"
              render={<Link href="/courses/new" />}
            >
              <Plus className="size-4" /> Create Course
            </Button>
          </div>

          {/* Stat cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map(({ label, value, icon: Icon, bg, border, chip }) => (
              <div
                key={label}
                className="flex flex-col gap-8 rounded-[22px] border p-6"
                style={{ backgroundColor: bg, borderColor: border }}
              >
                <span
                  className="grid size-[50px] place-items-center rounded-[13px] text-white shadow-[0px_4px_3px_rgba(0,0,0,0.03)]"
                  style={{ backgroundColor: chip }}
                >
                  <Icon className="size-6" />
                </span>
                <div className="font-inter space-y-1.5">
                  <p className="text-[16px] font-semibold tracking-[-0.16px] text-[#6f767e]">
                    {label}
                  </p>
                  <p className="text-[30px] font-bold leading-[1.4] text-[#262626]">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 sm:p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-inter-tight text-[20px] font-semibold text-ink">
                  Performance of Learners
                </h2>
                <button className="font-inter-tight flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-[15px] font-medium text-ink-body transition-colors hover:bg-surface-subtle">
                  Courses
                </button>
              </div>
              <PerformanceChart />
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="font-inter-tight mb-4 text-[19px] font-semibold text-ink">
                Training Coverage
              </h2>
              <TrainingCoverage />
            </Card>
          </div>

          {/* Deadlines at risk */}
          <DeadlineRisk />

          {/* My Courses */}
          <MyCourses />

          {/* Prebuilt courses */}
          <PrebuiltCourses />
        </div>
      )}
    </AppShell>
  )
}
