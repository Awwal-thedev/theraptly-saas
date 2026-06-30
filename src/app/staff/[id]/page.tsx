"use client"

import { useState } from "react"
import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import {
  BookOpen,
  CheckCircle2,
  Clock,
  MoreVertical,
  Plus,
  XCircle,
} from "lucide-react"
import {
  BookOpenIcon as BookOpenSolid,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid"
import type { ComponentType, SVGProps } from "react"

import { cn } from "@/lib/utils"
import {
  avatarTone,
  initialsOf,
  staffCertificates,
  staffStats,
  staffTrainings,
  type StaffTraining,
} from "@/lib/staff"
import { roleLabel, useFacilityUsers, userKind } from "@/lib/users"
import { AppShell } from "@/components/app/app-shell"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchInput } from "@/components/ui/search-input"

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
        "rounded-2xl border border-[#eceef2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        className
      )}
    >
      {children}
    </div>
  )
}

const STAT_TILES: {
  key: "totalAssigned" | "completed" | "failed" | "active"
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  bg: string
  border: string
  chip: string
}[] = [
  {
    key: "totalAssigned",
    label: "Total Courses Assigned",
    icon: BookOpenSolid,
    bg: "#E9ECF9",
    border: "#9BA7E3",
    chip: "#162EA3",
  },
  {
    key: "completed",
    label: "Courses Completed",
    icon: CheckBadgeIcon,
    bg: "#E9F9F2",
    border: "#9BE3C2",
    chip: "#16A34A",
  },
  {
    key: "failed",
    label: "Failed / Needed Renewal",
    icon: ExclamationTriangleIcon,
    bg: "#F9E9E9",
    border: "#E39B9B",
    chip: "#CD1515",
  },
  {
    key: "active",
    label: "Active / Due Soon",
    icon: ClockIcon,
    bg: "#FDF4E3",
    border: "#F4C97A",
    chip: "#B54708",
  },
]

export default function StaffProfilePage() {
  const params = useParams<{ id: string }>()
  const users = useFacilityUsers()
  const member = users.find((u) => u.id === params.id)
  if (users.length === 0) return null // store still hydrating
  if (!member) notFound()
  const { bg: tBg, fg: tFg } = avatarTone(member.name)

  return (
    <AppShell
      breadcrumb={[
        { label: "Home", href: "/dashboard" },
        { label: "Staff Management", href: "/staff" },
        { label: "Staff Profile" },
      ]}
    >
      <div className="space-y-6">
        {/* Profile header */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <span
              className="relative grid size-[88px] shrink-0 place-items-center rounded-full text-[26px] font-semibold sm:size-[100px] sm:text-[30px]"
              style={{ backgroundColor: tBg, color: tFg }}
            >
              {initialsOf(member.name)}
              <span className="absolute bottom-1 right-1 size-4 rounded-full border-[3px] border-white bg-[#16A34A]" />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <h1 className="font-inter text-[24px] font-semibold leading-tight tracking-tight text-[#101928] sm:text-[28px]">
                {member.name}
              </h1>
              <p className="font-inter text-[14px] text-[#667085] sm:text-[15px]">
                {member.email}
              </p>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold sm:text-[13px]",
                  userKind(member) === "manager"
                    ? "bg-[#f4f3ff] text-primary"
                    : "bg-[#dcfce7] text-[#15803d]"
                )}
              >
                {roleLabel(member)}
              </span>
            </div>
            <Button
              nativeButton={false}
              className="font-inter h-12 rounded-xl px-5 text-[15px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-brand-hover"
              render={<Link href="/courses" />}
            >
              <Plus className="size-4" /> Assign Course
            </Button>
          </div>
        </Card>

        {/* Stat tiles — same visual language as the dashboard */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_TILES.map(({ key, label, icon: Icon, bg, border, chip }) => (
            <div
              key={key}
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
                <p className="text-[15px] font-semibold tracking-[-0.16px] text-[#6f767e] sm:text-[16px]">
                  {label}
                </p>
                <p className="text-[28px] font-bold leading-[1.4] text-[#262626] sm:text-[30px]">
                  {staffStats[key]}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trainings */}
        <TrainingsTable />

        {/* Certificates */}
        <CertificatesTable />
      </div>
    </AppShell>
  )
}

/* ---------- Trainings ---------- */

function TrainingsTable() {
  const [query, setQuery] = useState("")
  const filtered = staffTrainings.filter((t) =>
    t.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <Card>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <h2 className="font-inter-tight text-[20px] font-semibold text-[#101928]">
          Trainings
        </h2>
        <SearchInput
          inputSize="sm"
          wrapperClassName="w-full sm:w-72"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for courses..."
        />
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <table className="font-inter-tight w-full text-left">
          <thead>
            <tr className="border-y border-[#f0f2f5] bg-[#f9fafb] text-[15px] font-medium text-[#667085]">
              <th className="px-6 py-3 font-medium">Course Name</th>
              <th className="px-6 py-3 font-medium">Progress</th>
              <th className="px-6 py-3 font-medium">Deadline</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr
                key={t.id}
                className="border-b border-[#f0f2f5] text-[17px] font-medium text-[#475367] last:border-0"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <CourseIcon blue={i % 2 === 1} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#101928]">
                        {t.name}
                      </p>
                      <p className="truncate text-[13px] font-normal text-[#667085]">
                        {t.category}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="w-[210px] px-6 py-4">
                  <ProgressBar value={t.progress} />
                </td>
                <td className="w-[200px] px-6 py-4">
                  <DeadlineCell training={t} />
                </td>
                <td className="w-[170px] px-6 py-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="w-[150px] px-6 py-4">
                  <TrainingAction training={t} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No trainings match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 border-t border-[#f0f2f5] p-4 md:hidden">
        {filtered.map((t, i) => (
          <div
            key={t.id}
            className="rounded-xl border border-[#f0f2f5] p-4"
          >
            <div className="flex items-start gap-3">
              <CourseIcon blue={i % 2 === 1} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#101928]">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.category}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <div className="mt-4 space-y-3">
              <ProgressBar value={t.progress} />
              <div className="flex items-center justify-between gap-3 text-[15px]">
                <DeadlineCell training={t} />
                <TrainingAction training={t} />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No trainings match “{query}”.
          </p>
        )}
      </div>
    </Card>
  )
}

/* ---------- Certificates ---------- */

function CertificatesTable() {
  const [query, setQuery] = useState("")
  const filtered = staffCertificates.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <Card>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <h2 className="font-inter-tight text-[20px] font-semibold text-[#101928]">
          Certificates Earned
        </h2>
        <SearchInput
          inputSize="sm"
          wrapperClassName="w-full sm:w-72"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for courses..."
        />
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <table className="font-inter-tight w-full text-left">
          <thead>
            <tr className="border-y border-[#f0f2f5] bg-[#f9fafb] text-[15px] font-medium text-[#667085]">
              <th className="px-6 py-3 font-medium">Certificates/Courses</th>
              <th className="px-6 py-3 font-medium">Completion Date</th>
              <th className="px-6 py-3 font-medium">Certificate</th>
              <th className="px-6 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr
                key={c.id}
                className="border-b border-[#f0f2f5] text-[17px] font-medium text-[#475367] last:border-0"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <CourseIcon blue={i % 2 === 1} />
                    <span className="font-semibold text-[#101928]">
                      {c.name}
                    </span>
                  </div>
                </td>
                <td className="w-[200px] px-6 py-4">{c.completionDate}</td>
                <td className="w-[170px] px-6 py-4">
                  {c.approved ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-[13px] font-semibold text-[#15803d]">
                      <CheckCircle2 className="size-3.5" /> Approved
                    </span>
                  ) : (
                    <span className="text-[13px] text-[#667085]">—</span>
                  )}
                </td>
                <td className="w-[120px] px-6 py-4">
                  <Link
                    href="#"
                    className="font-sans text-[16px] font-semibold text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No certificates match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 border-t border-[#f0f2f5] p-4 md:hidden">
        {filtered.map((c, i) => (
          <div key={c.id} className="rounded-xl border border-[#f0f2f5] p-4">
            <div className="flex items-start gap-3">
              <CourseIcon blue={i % 2 === 1} />
              <p className="flex-1 font-semibold text-[#101928]">{c.name}</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[15px]">
              <span className="text-muted-foreground">{c.completionDate}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-[13px] font-semibold text-[#15803d]">
                <CheckCircle2 className="size-3.5" /> Approved
              </span>
              <Link
                href="#"
                className="font-sans font-semibold text-primary hover:underline"
              >
                View
              </Link>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No certificates match “{query}”.
          </p>
        )}
      </div>
    </Card>
  )
}

/* ---------- Shared cells ---------- */

function CourseIcon({ blue }: { blue: boolean }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg text-white",
        blue ? "bg-primary" : "bg-[#101928]"
      )}
    >
      <BookOpen className="size-4" />
    </span>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#eaecf0]">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="text-[13px] font-medium text-[#475367]">{value}%</span>
    </div>
  )
}

function DeadlineCell({ training }: { training: StaffTraining }) {
  if (training.due === "passed") {
    return (
      <span className="text-[14px] font-semibold text-[#b42318]">
        {training.deadline}
      </span>
    )
  }
  if (training.due === "soon") {
    return (
      <span className="text-[14px] font-semibold text-[#b54708]">
        {training.deadline}
      </span>
    )
  }
  return <span className="text-[15px] text-[#475367]">{training.deadline}</span>
}

function StatusBadge({ status }: { status: StaffTraining["status"] }) {
  const tone = {
    "In progress": { bg: "#FEF0C7", fg: "#B54708", Icon: Clock },
    Attended: { bg: "#E0EAFF", fg: "#3538CD", Icon: CheckCircle2 },
    Completed: { bg: "#DCFCE7", fg: "#15803d", Icon: CheckCircle2 },
    Failed: { bg: "#FEE4E2", fg: "#B42318", Icon: XCircle },
  }[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      <tone.Icon className="size-3.5" />
      {status}
    </span>
  )
}

function TrainingAction({ training }: { training: StaffTraining }) {
  if (training.status === "Failed") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-[#e4e7ec] bg-white px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-[#f9fafb]"
        >
          Retry
        </button>
        <TrainingMenu />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <Link
        href="#"
        className="font-sans text-[16px] font-semibold text-primary hover:underline"
      >
        View
      </Link>
      <TrainingMenu />
    </div>
  )
}

function TrainingMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More actions"
        className="grid size-8 place-items-center rounded-lg border border-[#e4e7ec] text-[#667085] outline-none transition-colors hover:bg-[#f9fafb] data-[popup-open]:bg-[#f3f4f6]"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem className="py-2 text-[14px]">
          View course
        </DropdownMenuItem>
        <DropdownMenuItem className="py-2 text-[14px]">
          Send reminder
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" className="py-2 text-[14px]">
          Remove assignment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
