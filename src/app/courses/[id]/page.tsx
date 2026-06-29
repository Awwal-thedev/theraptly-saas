"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, UserPlus } from "lucide-react"
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
} from "@heroicons/react/24/solid"
import type { ComponentType, SVGProps } from "react"

import { useStoredCourses } from "@/lib/client-store"
import { getCourse } from "@/lib/courses"
import { recordCourseActivity } from "@/lib/recent-courses"
import { WORKER_ROLE_LABELS } from "@/lib/auth/roles"
import { removeAssignment, useAssignments } from "@/lib/assignments"
import { AppShell } from "@/components/app/app-shell"
import { AssignCourseModal } from "@/components/courses/assign-course-modal"
import { Button } from "@/components/ui/button"

const detailStats: {
  label: string
  value: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  bg: string
  border: string
  chip: string
}[] = [
  { label: "Total Learners", value: "0", icon: UsersIcon, bg: "#ECECF9", border: "#C7CCF0", chip: "#162EA3" },
  { label: "Completion Rate", value: "-", icon: CheckCircleIcon, bg: "#E9F9F2", border: "#9BE3C2", chip: "#16A34A" },
  { label: "Average Score", value: "-", icon: ChartBarIcon, bg: "#F9E9E9", border: "#E39B9B", chip: "#CD1515" },
  { label: "Average Duration", value: "-", icon: ClockIcon, bg: "#FBF6E3", border: "#E6D08F", chip: "#D9A30A" },
]

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
function formatDeadline(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  return `${MONTHS_SHORT[(m || 1) - 1]} ${d}, ${y}`
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const storedCourses = useStoredCourses()
  const stored = storedCourses.find((c) => c.id === params.id)
  const course = getCourse(params.id) ?? stored
  const title = course?.name ?? "Untitled course"
  const status = course?.status ?? "Active"
  const assignments = useAssignments(params.id)
  const [assignOpen, setAssignOpen] = useState(false)
  const stats = detailStats.map((s, i) =>
    i === 0 ? { ...s, value: String(assignments.length) } : s
  )

  useEffect(() => {
    if (params.id) recordCourseActivity(params.id)
  }, [params.id])

  return (
    <AppShell breadcrumb={[]}>
      <div className="space-y-7">
        {/* Breadcrumb / back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="font-inter flex items-center gap-2 rounded-lg border border-[#e4e7ec] px-3 py-1.5 text-[14px] font-medium text-[#475367] transition-colors hover:bg-[#f9fafb]"
          >
            <ArrowLeft className="size-4" /> Go Back
          </button>
          <p className="font-inter text-[14px]">
            <Link
              href="/dashboard"
              className="text-[#98a2b3] transition-colors hover:text-foreground hover:underline"
            >
              Course
            </Link>
            <span className="px-1.5 text-[#cbd2dc]">/</span>
            <span className="font-medium text-primary">Course Details</span>
          </p>
        </div>

        {/* Title + actions */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-inter text-[28px] font-semibold tracking-tight text-[#101928]">
              {title}
            </h1>
            <span className="inline-block rounded-md bg-[#E7F6EC] px-2.5 py-1 text-[13px] font-medium text-[#099250]">
              {status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              nativeButton={false}
              className="font-inter h-11 rounded-xl px-5 text-[15px] font-semibold hover:bg-brand-hover"
              render={<Link href={`/courses/${params.id}/preview`} />}
            >
              Preview
            </Button>
            <button
              onClick={() => setAssignOpen(true)}
              className="font-inter flex h-11 items-center gap-2 rounded-xl border border-[#e4e7ec] px-5 text-[15px] font-semibold text-primary transition-colors hover:bg-[#f9fafb]"
            >
              <UserPlus className="size-4" /> Assign
            </button>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid gap-5 lg:grid-cols-2">
          {stats.map(({ label, value, icon: Icon, bg, border, chip }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl border p-6"
              style={{ backgroundColor: bg, borderColor: border }}
            >
              <span
                className="grid size-12 shrink-0 place-items-center rounded-xl text-white shadow-[0px_4px_3px_rgba(0,0,0,0.03)]"
                style={{ backgroundColor: chip }}
              >
                <Icon className="size-6" />
              </span>
              <div className="font-inter">
                <p className="text-[15px] font-medium text-[#6f767e]">{label}</p>
                <p className="text-[24px] font-bold leading-tight text-[#262626]">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {assignments.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-[#eceef2] bg-white p-12 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/empty-state.svg"
                alt=""
                width={160}
                height={160}
                className="size-40"
              />
              <h2 className="font-inter mt-4 text-[22px] font-semibold text-[#101928]">
                No Worker Added Yet
              </h2>
              <p className="font-inter mt-1 text-[15px] text-[#667085]">
                Add your first worker to get started.
              </p>
              <Button
                onClick={() => setAssignOpen(true)}
                className="font-inter mt-6 h-11 rounded-xl px-5 text-[15px] font-semibold hover:bg-brand-hover"
              >
                <Plus className="size-4" /> Add worker
              </Button>
            </div>
          </div>
        ) : (
          /* Assigned workers */
          <div className="overflow-hidden rounded-2xl border border-[#eceef2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <div className="flex items-center justify-between p-5 sm:p-6">
              <h2 className="font-inter-tight text-[18px] font-semibold text-[#101928]">
                Assigned workers ({assignments.length})
              </h2>
              <button
                onClick={() => setAssignOpen(true)}
                className="font-inter inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[14px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                <UserPlus className="size-4" /> Assign worker
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="font-inter-tight w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-y border-[#f0f2f5] bg-[#f9fafb] text-[14px] font-medium text-[#667085]">
                    <th className="px-6 py-3 font-medium">Worker</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Deadline</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-dashed border-[#eceef2] text-[15px] text-[#475367] last:border-0"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#101928]">
                          {a.firstName} {a.lastName}
                        </p>
                        <p className="text-[13px] text-[#667085]">{a.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-[#f2f4f7] px-2 py-0.5 text-[13px] font-medium text-[#475467]">
                          {WORKER_ROLE_LABELS[a.workerRole]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#667085]">
                        {formatDeadline(a.completionDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-[#f79009]" />
                          <span className="text-[14px] font-medium text-[#b54708]">
                            Assigned
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removeAssignment(a.id)}
                          aria-label="Remove worker"
                          className="grid size-8 place-items-center rounded-lg border border-[#e4e7ec] text-[#667085] transition-colors hover:bg-[#fef3f2] hover:text-[#d92d20]"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AssignCourseModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        courseId={params.id}
        courseName={title}
      />
    </AppShell>
  )
}
