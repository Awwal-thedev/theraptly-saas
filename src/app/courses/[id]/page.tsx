"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, UserPlus } from "lucide-react"
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
} from "@heroicons/react/24/solid"
import type { ComponentType, SVGProps } from "react"

import { getCourse } from "@/lib/courses"
import { recordCourseActivity } from "@/lib/recent-courses"
import { AppShell } from "@/components/app/app-shell"
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

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const course = getCourse(params.id)
  const title = course?.name ?? "Course Details"
  const status = course?.status ?? "Active"

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
            <button className="font-inter flex h-11 items-center gap-2 rounded-xl border border-[#e4e7ec] px-5 text-[15px] font-semibold text-primary transition-colors hover:bg-[#f9fafb]">
              <UserPlus className="size-4" /> Assign
            </button>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid gap-5 lg:grid-cols-2">
          {detailStats.map(({ label, value, icon: Icon, bg, border, chip }) => (
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

        {/* Empty state */}
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
            <Button className="font-inter mt-6 h-11 rounded-xl px-5 text-[15px] font-semibold hover:bg-brand-hover">
              <Plus className="size-4" /> Add worker
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
