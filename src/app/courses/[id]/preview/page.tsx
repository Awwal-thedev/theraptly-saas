"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronDown,
  ChevronLeft,
  Clock,
  FileText,
  Play,
  ShieldCheck,
} from "lucide-react"
import { CheckCircleIcon } from "@heroicons/react/24/solid"

import { getCourse } from "@/lib/courses"
import { cn } from "@/lib/utils"
import { AppShell } from "@/components/app/app-shell"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/courses/video-player"

const learn = [
  "Recognize workplace hazards and apply preventive strategies.",
  "Respond effectively to emergencies and safety incidents.",
  "Comply with CARF and organizational safety standards.",
  "Understand staff responsibilities for safety and reporting.",
]

const chapters = [
  {
    title: "Chapter 1 - Introduction",
    meta: "8 Lectures • 12 mins",
    lectures: [
      { name: "Introduction", duration: "1:30" },
      { name: "Overview of Key Concepts", duration: "2:15" },
      { name: "Detailed Case Study", duration: "3:00" },
    ],
  },
  {
    title: "Chapter 2 - Core Practices",
    meta: "6 Lectures • 18 mins",
    lectures: [
      { name: "Overview of Key Concepts", duration: "2:15" },
      { name: "Detailed Case Study", duration: "3:00" },
      { name: "Applying Safety Protocols", duration: "2:40" },
    ],
  },
]

const details = [
  { label: "Skill Level", value: "Beginner" },
  { label: "Total Duration", value: "30 mins" },
  { label: "Last Updated", value: "March 21, 2025" },
]

const modules = [
  { name: "Workplace Safety Fundamentals", duration: "1:30" },
  { name: "Emergency Response Procedures", duration: "2:19" },
  { name: "Bloodborne Pathogens", duration: "0:50" },
  { name: "Hazard Communication (GHS)", duration: "1:45" },
  { name: "Infection Control Basics", duration: "2:05" },
  { name: "Patient Privacy & HIPAA", duration: "1:20" },
  { name: "Medication Safety", duration: "1:55" },
  { name: "Fire & Emergency Safety", duration: "2:30" },
  { name: "Documentation Standards", duration: "1:10" },
  { name: "Incident Reporting", duration: "1:40" },
]

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-white/70">
      <Icon className="size-4" />
      {children}
    </span>
  )
}

export default function CoursePreviewPage() {
  const params = useParams<{ id: string }>()
  const course = getCourse(params.id)
  const title = course?.name ?? "Health & Safety Practices"
  const [open, setOpen] = useState<number[]>([0])

  const toggle = (i: number) =>
    setOpen((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    )

  return (
    <AppShell breadcrumb={[]}>
      <div className="space-y-6">
        {/* Hero banner */}
        <div className="rounded-2xl bg-[#101828] p-6 text-white sm:p-8">
          <Link
            href={`/courses/${params.id}`}
            className="font-inter inline-flex items-center gap-1.5 text-[14px] font-medium text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft className="size-4" /> Back to dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="font-inter text-[26px] font-semibold tracking-tight sm:text-[28px]">
                {title}
              </h1>
              <p className="font-inter mt-1 text-[15px] text-white/60">
                Mandatory annual training aligned with CARF 1.H.4.a-b
              </p>
              <div className="my-5 h-px bg-white/10" />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <span className="font-inter inline-flex items-center gap-1.5 rounded-full bg-[#12B76A] px-3 py-1 text-[13px] font-medium text-white">
                  <ShieldCheck className="size-4" /> Approved by: John K.{" "}
                  <span className="text-white/80">(Admin)</span>
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-white/70">
                  <span className="size-2 rounded-full bg-[#12B76A]" /> Active
                </span>
                <MetaChip icon={Clock}>10 min read</MetaChip>
                <MetaChip icon={CheckCircleIcon}>Pass mark: 80%</MetaChip>
              </div>
            </div>
            <Button
              nativeButton={false}
              className="font-inter h-11 shrink-0 rounded-xl px-6 text-[15px] font-semibold hover:bg-brand-hover"
              render={<Link href={`/courses/${params.id}/learn`} />}
            >
              View Course
            </Button>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2">
            <div className="space-y-8 rounded-2xl border border-[#eceef2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-6">
              <VideoPlayer src="/videos/preview.mp4" poster="/auth/showcase-2.jpg" />

              {/* Overview */}
            <section className="space-y-3">
              <h2 className="font-inter-tight text-[20px] font-semibold text-[#101928]">
                Course Overview
              </h2>
              <p className="font-inter text-[15px] leading-7 text-[#475367]">
                This course ensures all personnel understand and apply
                CARF-aligned safety principles in daily operations. It covers
                essential workplace safety measures, emergency response
                protocols, and staff responsibilities in maintaining a safe
                therapeutic environment.
              </p>
              <p className="font-inter text-[15px] leading-7 text-[#475367]">
                Designed to meet CARF Standards 1.H.4.a-b, this training is a
                mandatory annual requirement for all staff.
              </p>
            </section>

            {/* What You'll Learn */}
            <section className="space-y-3">
              <h2 className="font-inter-tight text-[20px] font-semibold text-[#101928]">
                What You&apos;ll Learn
              </h2>
              <ul className="space-y-2.5">
                {learn.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-[#12B76A]" />
                    <span className="font-inter text-[15px] text-[#475367]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Course Contents */}
            <section className="space-y-3">
              <h2 className="font-inter-tight text-[20px] font-semibold text-[#101928]">
                Course Contents
              </h2>
              <div className="overflow-hidden rounded-2xl border border-[#eceef2]">
                {chapters.map((ch, i) => {
                  const isOpen = open.includes(i)
                  return (
                    <div
                      key={ch.title + i}
                      className="border-b border-[#f0f2f5] last:border-0"
                    >
                      <button
                        onClick={() => toggle(i)}
                        className="flex w-full items-center justify-between gap-3 bg-[#f9fafb] px-5 py-4 text-left"
                      >
                        <span className="font-inter-tight text-[15px] font-semibold text-[#101928]">
                          {ch.title}
                          <span className="ml-2 font-inter text-[13px] font-normal text-muted-foreground">
                            {ch.meta}
                          </span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "size-5 shrink-0 text-[#667085] transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>
                      {isOpen && (
                        <ul className="divide-y divide-[#f0f2f5]">
                          {ch.lectures.map((lec, j) => (
                            <li
                              key={lec.name + j}
                              className="flex items-center justify-between gap-3 px-5 py-3.5"
                            >
                              <span className="flex items-center gap-3">
                                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#f4f3ff] text-primary">
                                  <Play className="size-3.5 translate-x-px fill-current" />
                                </span>
                                <span className="font-inter text-[14px] text-[#475367]">
                                  {lec.name}
                                </span>
                              </span>
                              <span className="font-inter text-[13px] text-muted-foreground">
                                {lec.duration}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
                {/* Quiz */}
                <div className="flex items-center justify-between gap-3 border-t border-[#f0f2f5] bg-[#f9fafb] px-5 py-4">
                  <span className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#fef2e0] text-[#dc6803]">
                      <FileText className="size-3.5" />
                    </span>
                    <span className="font-inter-tight text-[15px] font-semibold text-[#101928]">
                      Quiz
                    </span>
                  </span>
                  <span className="font-inter text-[13px] text-muted-foreground">
                    10 Questions • 15 mins
                  </span>
                </div>
              </div>
            </section>
            </div>
          </div>

          {/* Sidebar: Course Details */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-[#eceef2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] lg:sticky lg:top-2">
              <h3 className="font-inter-tight text-[18px] font-semibold text-[#101928]">
                Course Details
              </h3>
              <dl className="mt-4 space-y-3.5">
                {details.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <dt className="font-inter text-[14px] text-[#667085]">
                      {d.label}
                    </dt>
                    <dd className="font-inter text-[14px] font-medium text-[#101928]">
                      {d.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="my-5 h-px bg-[#f0f2f5]" />

              <div className="mb-3 flex items-center justify-between">
                <p className="font-inter-tight text-[15px] font-semibold text-[#101928]">
                  Included Modules ({modules.length})
                </p>
                <button className="font-inter text-[13px] font-semibold text-primary hover:underline">
                  View all
                </button>
              </div>
              <ul className="space-y-3">
                {modules.slice(0, 5).map((m) => (
                  <li key={m.name} className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f4f3ff] text-primary">
                      <Play className="size-4 translate-x-px fill-current" />
                    </span>
                    <span className="min-w-0">
                      <span className="font-inter block truncate text-[14px] font-medium text-[#101928]">
                        {m.name}
                      </span>
                      <span className="font-inter text-[12px] text-muted-foreground">
                        Video • {m.duration}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
