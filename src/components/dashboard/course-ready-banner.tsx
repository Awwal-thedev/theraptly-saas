"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, X } from "lucide-react"

import {
  clearPending,
  isReady,
  progressFor,
  readPending,
  subscribePending,
  type PendingCourse,
} from "@/lib/pending-course"

const TITLE_LIMIT = 36

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text
}

export function CourseReadyBanner() {
  const [pending, setPending] = useState<PendingCourse | null>(null)
  const [now, setNow] = useState(Date.now())

  // Sync from storage + listen for updates.
  useEffect(() => {
    setPending(readPending())
    return subscribePending(() => setPending(readPending()))
  }, [])

  // Cheap tick while a course is generating so the progress text updates.
  useEffect(() => {
    if (!pending || pending.published || isReady(pending)) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [pending])

  // Once an in-flight generation finishes, clear the tracker — the user can
  // find the course in the Courses list, and the publish flow will fire its
  // own (persistent) "Course published" banner if they actually published it.
  useEffect(() => {
    if (pending && !pending.published && isReady(pending)) {
      clearPending()
      setPending(null)
    }
  }, [pending, now])

  if (!pending) return null

  function dismiss() {
    clearPending()
    setPending(null)
  }

  // ── Persistent "Course published" confirmation ──────────────────────────
  if (pending.published) {
    const shortTitle = truncate(pending.title, TITLE_LIMIT)
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#86efac] bg-[#f0fdf4] px-4 py-2.5 sm:px-5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full">
          <CheckCircle2 className="size-6 text-[#16a34a]" />
        </span>
        <p className="flex-1 text-[13px] text-[#101010] sm:text-[14px]">
          Course{" "}
          <span className="font-bold">“{shortTitle}”</span> was published
          successfully.
        </p>
        <Link
          href={`/courses/${pending.id}`}
          className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#16a34a] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#15803d] sm:text-[14px]"
        >
          View
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notification"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-[#475367] transition-colors hover:bg-black/5"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  // ── In-flight generation tracker ────────────────────────────────────────
  if (isReady(pending)) return null
  const pct = Math.round(progressFor(pending) * 100)
  const shortTitle = truncate(pending.title, TITLE_LIMIT)
  void now // keep ticker dep happy without changing render

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#dbeafe] bg-[#eff6ff] px-4 py-2.5 sm:px-5">
      <span className="grid size-7 shrink-0 place-items-center rounded-full">
        <Loader2 className="size-5 animate-spin text-primary" />
      </span>

      <p className="flex-1 text-[13px] text-[#101010] sm:text-[14px]">
        Generating training resources for{" "}
        <span className="font-bold">“{shortTitle}”</span> — {pct}%
      </p>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-[#475367] transition-colors hover:bg-black/5"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
