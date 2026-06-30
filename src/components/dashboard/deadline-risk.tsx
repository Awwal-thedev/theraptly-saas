"use client"

import Link from "next/link"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAllAssignments } from "@/lib/assignments"
import { WORKER_ROLE_LABELS } from "@/lib/auth/roles"
import { useStoredCourses } from "@/lib/client-store"
import { courses as coursesSeed } from "@/lib/courses"
import { avatarTone, initialsOf } from "@/lib/staff"

/** Deadlines this close (or already past) count as "at risk". */
const SOON_DAYS = 7

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** Whole days from today (local midnight) to an ISO yyyy-mm-dd date. */
function daysUntil(iso: string): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return null
  const due = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${MONTHS[(m || 1) - 1]} ${d}, ${y}`
}

function relativeLabel(days: number): string {
  if (days < 0) {
    const n = Math.abs(days)
    return `Overdue by ${n} day${n === 1 ? "" : "s"}`
  }
  if (days === 0) return "Due today"
  return `Due in ${days} day${days === 1 ? "" : "s"}`
}

function Avatar({ name }: { name: string }) {
  const { bg, fg } = avatarTone(name)
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {initialsOf(name)}
    </span>
  )
}

function RiskBadge({ days }: { days: number }) {
  const overdue = days < 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold whitespace-nowrap",
        overdue
          ? "bg-[#fee4e2] text-[#b42318]"
          : "bg-[#fef0c7] text-[#b54708]"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          overdue ? "bg-[#d92d20]" : "bg-[#f79009]"
        )}
      />
      {relativeLabel(days)}
    </span>
  )
}

export function DeadlineRisk() {
  const assignments = useAllAssignments()
  const storedCourses = useStoredCourses()

  function courseName(id: string): string {
    return (
      [...storedCourses, ...coursesSeed].find((c) => c.id === id)?.name ??
      "Untitled course"
    )
  }

  const atRisk = assignments
    .map((a) => ({ a, days: daysUntil(a.completionDate) }))
    .filter(
      (x): x is { a: (typeof assignments)[number]; days: number } =>
        x.days != null && x.a.status !== "completed" && x.days <= SOON_DAYS
    )
    .sort((x, y) => x.days - y.days)

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-[#fef3f2] text-[#d92d20]">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <h2 className="font-inter-tight text-[20px] font-semibold text-ink">
              Deadlines at risk
            </h2>
            <p className="font-inter text-[14px] text-ink-muted">
              Assignments due within {SOON_DAYS} days or already overdue.
            </p>
          </div>
        </div>
        {atRisk.length > 0 && (
          <span className="font-inter shrink-0 rounded-full bg-[#fee4e2] px-3 py-1 text-[13px] font-semibold text-[#b42318]">
            {atRisk.length} at risk
          </span>
        )}
      </div>

      {atRisk.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-t border-line-soft px-6 py-10 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-[#ecfdf3] text-[#039855]">
            <CheckCircle2 className="size-6" />
          </span>
          <p className="font-inter-tight text-[16px] font-semibold text-ink">
            No deadlines at risk
          </p>
          <p className="font-inter text-[14px] text-ink-muted">
            Every assigned worker is on track to finish on time.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="font-inter-tight w-full text-left">
              <thead>
                <tr className="border-y border-line-soft bg-surface-subtle text-[14px] font-medium text-ink-muted">
                  <th className="px-6 py-3 font-medium">Worker</th>
                  <th className="px-6 py-3 font-medium">Course</th>
                  <th className="hidden px-6 py-3 font-medium lg:table-cell">
                    Deadline
                  </th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {atRisk.map(({ a, days }) => (
                  <tr
                    key={a.id}
                    className="border-b border-dashed border-line text-[15px] text-ink-body last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${a.firstName} ${a.lastName}`} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">
                            {a.firstName} {a.lastName}
                          </p>
                          <p className="truncate text-[13px] text-ink-muted">
                            {WORKER_ROLE_LABELS[a.workerRole]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {courseName(a.courseId)}
                    </td>
                    <td className="hidden px-6 py-4 text-ink-muted lg:table-cell">
                      {formatDate(a.completionDate)}
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge days={days} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/courses/${a.courseId}`}
                        className="font-inter text-[15px] font-semibold text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stack */}
          <div className="font-inter-tight space-y-3 border-t border-line-soft p-4 md:hidden">
            {atRisk.map(({ a, days }) => (
              <Link
                key={a.id}
                href={`/courses/${a.courseId}`}
                className="block rounded-xl border border-line-soft p-4 transition-colors hover:bg-surface-subtle"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={`${a.firstName} ${a.lastName}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {a.firstName} {a.lastName}
                    </p>
                    <p className="text-[13px] text-ink-muted">
                      {courseName(a.courseId)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <RiskBadge days={days} />
                  <span className="text-[13px] text-ink-muted">
                    {formatDate(a.completionDate)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
