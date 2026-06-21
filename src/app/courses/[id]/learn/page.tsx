"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  Presentation,
  RefreshCcw,
} from "lucide-react"
import { CheckCircleIcon } from "@heroicons/react/24/solid"

import { useAuth } from "@/lib/auth/auth-context"
import { getCourse } from "@/lib/courses"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"
import { Splash } from "@/components/brand/splash"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  COURSE_LECTURES as LECTURES,
  COURSE_MODULES as MODULES,
  COURSE_QUIZ_QUESTIONS,
  COURSE_SLIDES as SLIDES,
  NOTE_TAKEAWAYS,
} from "@/lib/course-content"

const TABS = ["Notes", "Slides"] as const
type Tab = (typeof TABS)[number]

const tocModuleMeta: Record<Tab, string[]> = {
  Notes: ["3 Articles • 12 mins", "3 Articles • 6 mins"],
  Slides: ["", ""],
}
const tocItemIcon: Record<Tab, typeof FileText> = {
  Notes: FileText,
  Slides: Presentation,
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total ? done / total : 0
  const r = 15
  const c = 2 * Math.PI * r
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" className="shrink-0">
      <circle cx="19" cy="19" r={r} fill="none" stroke="#eceef2" strokeWidth="4" />
      <circle
        cx="19"
        cy="19"
        r={r}
        fill="none"
        stroke="#5c47ff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 19 19)"
      />
      <text x="19" y="20" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="600" fill="#101928">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

function NotesView({ index }: { index: number }) {
  const lec = LECTURES[index]
  return (
    <article className="font-inter rounded-2xl border border-[#eceef2] bg-white p-6 sm:p-8">
      <span className="inline-block rounded-md bg-[#f4f3ff] px-2 py-0.5 text-[12px] font-semibold text-primary">
        CARF Policy
      </span>
      <h2 className="font-inter-tight mt-3 text-[22px] font-semibold text-[#101928]">
        {lec.title}
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Article {index + 1} of {LECTURES.length}
      </p>

      <div className="mt-6 space-y-4 text-[15px] leading-7 text-[#475367]">
        <p>
          This article covers <strong className="text-[#101928]">{lec.title}</strong> as
          part of the Health &amp; Safety Practices program. It explains the
          CARF-aligned principles your team applies in daily operations and why
          they matter for safe, person-centered care.
        </p>
        <h3 className="font-inter-tight text-[17px] font-semibold text-[#101928]">
          Key takeaways
        </h3>
        <ol className="list-decimal space-y-2 pl-5 marker:text-[#98a2b3]">
          {NOTE_TAKEAWAYS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <div className="rounded-xl border border-[#e0ddff] bg-[#f4f3ff] p-4">
          <p className="text-[14px]">
            <span className="font-semibold text-primary">Tip:</span> These
            points appear in the quiz below — use Next to continue to the
            following article.
          </p>
        </div>
      </div>
    </article>
  )
}

function SlidesView({ index }: { index: number }) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#eceef2] bg-[#101828]">
        <Image
          key={SLIDES[index]}
          src={SLIDES[index]}
          alt={`Slide ${index + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 820px"
          className="object-cover"
        />
      </div>
      <p className="font-inter text-right text-[13px] text-muted-foreground">
        Slide {index + 1} of {SLIDES.length}
      </p>
    </div>
  )
}

function SlideList({
  active,
  onSelect,
}: {
  active: number
  onSelect: (i: number) => void
}) {
  return (
    <div>
      <div className="px-5 py-4">
        <p className="font-inter-tight text-[14px] font-semibold text-[#101928]">
          Slides
        </p>
        <p className="font-inter text-[12px] text-muted-foreground">
          {SLIDES.length} slides
        </p>
      </div>
      <ul className="space-y-2 px-3 pb-4">
        {SLIDES.map((s, idx) => (
          <li key={s}>
            <button
              onClick={() => onSelect(idx)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                idx === active ? "bg-[#f3f4f6]" : "hover:bg-[#f9fafb]"
              )}
            >
              <span
                className={cn(
                  "relative aspect-video w-20 shrink-0 overflow-hidden rounded-md border-2",
                  idx === active ? "border-primary" : "border-[#eceef2]"
                )}
              >
                <Image src={s} alt="" fill sizes="80px" className="object-cover" />
              </span>
              <span
                className={cn(
                  "font-inter text-[13px]",
                  idx === active ? "font-medium text-[#101928]" : "text-[#475367]"
                )}
              >
                Slide {idx + 1}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CourseLearnPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const course = getCourse(params.id)
  const title = course?.name ?? "Health & Safety Practices"

  const STORAGE_KEY = `theraptly:course-progress:${params.id}`

  const [tab, setTab] = useState<Tab>("Notes")
  const [indices, setIndices] = useState<Record<Tab, number>>({
    Notes: 0,
    Slides: 0,
  })
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [restored, setRestored] = useState(false)

  const index = indices[tab]
  const setIndex = (v: number | ((i: number) => number)) =>
    setIndices((prev) => ({
      ...prev,
      [tab]: typeof v === "function" ? v(prev[tab]) : v,
    }))

  // Switching tabs keeps each tab's own position.
  const selectTab = (t: Tab) => setTab(t)

  const handleSelectItem = (i: number) => setIndex(i)

  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
    else if (!user.onboarded) router.replace("/onboarding")
  }, [user, loading, router])

  // Resume where the learner left off — restore tab, per-tab position, and progress.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if ((TABS as readonly string[]).includes(saved.tab)) setTab(saved.tab)
        if (saved.indices && typeof saved.indices === "object") {
          setIndices((prev) => ({ ...prev, ...saved.indices }))
        }
        if (Array.isArray(saved.completed)) setCompleted(new Set(saved.completed))
      }
    } catch {}
    setRestored(true)
  }, [STORAGE_KEY])

  // Mark the screen the learner is viewing as completed.
  useEffect(() => {
    if (!restored) return
    const key = `${tab}:${indices[tab]}`
    setCompleted((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [tab, indices, restored])

  // Persist position + progress on every change.
  useEffect(() => {
    if (!restored) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tab, indices, completed: [...completed] })
      )
    } catch {}
  }, [tab, indices, completed, restored, STORAGE_KEY])

  if (loading || !user || !user.onboarded) {
    return <Splash label="Loading course…" />
  }

  const seqLen = tab === "Slides" ? SLIDES.length : LECTURES.length
  const isLast = index === seqLen - 1
  const ItemIcon = tocItemIcon[tab]

  // Each format tracks its own progress — finishing any one completes the course.
  const tabDone = [...completed].filter((k) => k.startsWith(`${tab}:`)).length

  const goPrev = () => setIndex((i) => Math.max(0, i - 1))
  const goNext = () => {
    if (!isLast) setIndex((i) => i + 1)
    else router.push(`/courses/${params.id}/publish`)
  }

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Shared between the desktop sidebar and the mobile bottom sheet.
  const tocPanel = (
    <>
      <div className="flex border-b border-[#f0f2f5]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => selectTab(t)}
            className={cn(
              "font-inter flex-1 border-b-2 px-4 py-3 text-[14px] font-medium transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-[#667085] hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Slides" ? (
        <SlideList active={index} onSelect={handleSelectItem} />
      ) : (
        <>
          {MODULES.map((modTitle, mi) => (
            <div key={modTitle} className="border-b border-[#f0f2f5]">
              <div className="px-5 py-4">
                <p className="font-inter-tight text-[14px] font-semibold text-[#101928]">
                  {modTitle}
                </p>
                <p className="font-inter text-[12px] text-muted-foreground">
                  {tocModuleMeta[tab][mi]}
                </p>
              </div>
              <ul>
                {LECTURES.map((lec, gi) =>
                  lec.mod !== mi ? null : (
                    <li key={gi}>
                      <button
                        onClick={() => handleSelectItem(gi)}
                        className={cn(
                          "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors",
                          index === gi ? "bg-[#f3f4f6]" : "hover:bg-[#f9fafb]"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-md",
                            index === gi
                              ? "bg-primary text-white"
                              : "bg-[#f4f3ff] text-primary"
                          )}
                        >
                          <ItemIcon className="size-3.5" />
                        </span>
                        <span
                          className={cn(
                            "font-inter min-w-0 flex-1 truncate text-[14px]",
                            index === gi
                              ? "font-medium text-[#101928]"
                              : "text-[#475367]"
                          )}
                        >
                          {lec.title}
                        </span>
                        <span className="font-inter text-[12px] text-muted-foreground">
                          {lec.duration}
                        </span>
                      </button>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}

          <button
            onClick={() =>
              document
                .getElementById("quiz")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#f9fafb]"
          >
            <span className="font-inter-tight text-[14px] font-semibold text-[#101928]">
              Safety Practices Quiz
            </span>
            <span className="font-inter text-[12px] text-muted-foreground">
              10 Questions • 15 mins
            </span>
          </button>
        </>
      )}
    </>
  )

  return (
    <div className="flex min-h-svh flex-col bg-white">
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#f0f2f5] px-5 sm:px-8">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="font-inter hidden text-[14px] font-semibold text-foreground sm:inline">
            {user.fullName}
          </span>
        </div>
      </header>

      {/* Sub bar */}
      <div className="flex flex-col gap-2.5 border-b border-[#f0f2f5] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-8 sm:py-3.5">
        <div className="font-inter flex min-w-0 items-center gap-2 text-[14px]">
          <Link
            href={`/courses/${params.id}/preview`}
            className="flex shrink-0 items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <ChevronLeft className="size-4" /> Back to dashboard
          </Link>
          <span className="text-[#cbd2dc]">/</span>
          <span className="truncate font-medium text-[#2d3748]">{title}</span>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="font-inter text-[13px] font-medium text-[#101928]">
              Your Progress
            </p>
            <p className="font-inter text-[12px] text-muted-foreground">
              {tabDone} of {seqLen} {tab} Completed
            </p>
          </div>
          <ProgressRing done={tabDone} total={seqLen} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Curriculum / slide list — desktop sidebar */}
        <aside className="hidden border-[#f0f2f5] lg:block lg:w-[340px] lg:shrink-0 lg:overflow-y-auto lg:border-r">
          {tocPanel}
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-5 pt-6 pb-24 sm:px-8 lg:pb-6">
          <div className="mx-auto max-w-[820px] space-y-6">
            {tab === "Notes" && <NotesView index={index} />}
            {tab === "Slides" && <SlidesView index={index} />}

            <div className="flex items-center justify-between gap-3">
              <h1 className="font-inter-tight text-[18px] font-semibold text-[#101928]">
                {tab}
              </h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={goPrev}
                  disabled={index === 0}
                  className="font-inter flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] px-4 py-2 text-[14px] font-semibold text-[#475367] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" /> Previous
                </button>
                <Button
                  onClick={goNext}
                  className="font-inter h-10 rounded-xl px-4 text-[14px] font-semibold hover:bg-brand-hover"
                >
                  {isLast ? "Continue" : "Next"} <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="h-px bg-[#f0f2f5]" />

            <section id="quiz" className="space-y-4 scroll-mt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-inter-tight text-[18px] font-semibold text-[#101928]">
                    Editable quiz questions
                  </h2>
                  <p className="font-inter text-[14px] text-muted-foreground">
                    Review and edit the auto-generated questions for this course.
                  </p>
                </div>
                <button className="font-inter flex items-center gap-2 rounded-xl border border-[#e4e7ec] px-4 py-2 text-[14px] font-semibold text-primary transition-colors hover:bg-[#f4f3ff]">
                  <RefreshCcw className="size-4" /> Regenerate Quiz
                </button>
              </div>

              {COURSE_QUIZ_QUESTIONS.map((q, qi) => (
                <div
                  key={qi}
                  className="rounded-2xl border border-[#eceef2] bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-inter text-[15px] font-semibold text-[#101928]">
                      {qi + 1}. {q}
                    </p>
                    <button className="font-inter flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                      <Pencil className="size-3.5" /> Edit
                    </button>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {[1, 2, 3, 4].map((n) => (
                      <label
                        key={n}
                        className="font-inter flex items-center gap-2.5 text-[14px] text-[#475367]"
                      >
                        <input
                          type="radio"
                          name={`q${qi}`}
                          className="size-4 accent-primary"
                        />
                        Option {n}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button className="font-inter flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d0d5dd] py-3.5 text-[14px] font-medium text-[#475367] transition-colors hover:bg-[#f9fafb]">
                <Plus className="size-4" /> Add new question
              </button>
            </section>
          </div>
        </main>
      </div>

      {/* Mobile: bottom tab bar to switch between the three views */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#f0f2f5] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {TABS.map((t) => {
          const Icon = tocItemIcon[t]
          const isActive = tab === t
          return (
            <button
              key={t}
              onClick={() => selectTab(t)}
              className={cn(
                "font-inter flex flex-1 flex-col items-center gap-1 py-2.5 text-[12px] font-medium transition-colors",
                isActive ? "text-primary" : "text-[#667085]"
              )}
            >
              <Icon className="size-5" />
              {t}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
