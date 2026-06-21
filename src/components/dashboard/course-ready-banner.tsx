"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"

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
    if (!pending || isReady(pending)) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [pending])

  // Once generation finishes, the tracker has served its purpose. Clear it so
  // it doesn't sit on the dashboard forever — the user can find the course in
  // the Courses list (and the email notification fired separately).
  useEffect(() => {
    if (pending && isReady(pending)) {
      clearPending()
      setPending(null)
    }
  }, [pending, now])

  // Show only while a course is actively being created.
  if (!pending || isReady(pending)) return null

  const pct = Math.round(progressFor(pending) * 100)
  const shortTitle = truncate(pending.title, TITLE_LIMIT)

  function dismiss() {
    clearPending()
    setPending(null)
  }

  // Touching the dispatch dependency keeps lint happy without changing rendering.
  void now

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
