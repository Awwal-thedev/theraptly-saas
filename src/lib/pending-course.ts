"use client"

/**
 * Tracks a course that is being generated in the background.
 * Persisted in localStorage so the dashboard banner survives reloads
 * and the generation timer continues across navigation.
 */

const KEY = "theraptly:pending-course"

export interface PendingCourse {
  id: string
  title: string
  /** ms epoch when generation started — used to derive % complete. */
  startedAt: number
  /** Total ms the simulated generation should take. */
  durationMs: number
}

export function readPending(): PendingCourse | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as PendingCourse
  } catch {
    return null
  }
}

export function writePending(p: PendingCourse) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(p))
  window.dispatchEvent(new CustomEvent("theraptly:pending-changed"))
}

export function clearPending() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(KEY)
  window.dispatchEvent(new CustomEvent("theraptly:pending-changed"))
}

export function progressFor(p: PendingCourse): number {
  const elapsed = Date.now() - p.startedAt
  return Math.min(1, Math.max(0, elapsed / p.durationMs))
}

export function isReady(p: PendingCourse): boolean {
  return progressFor(p) >= 1
}

/** Subscribe to pending-course changes (storage + same-tab dispatches). */
export function subscribePending(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener("theraptly:pending-changed", handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener("theraptly:pending-changed", handler)
  }
}
