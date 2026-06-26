"use client"

/**
 * Training tracks (PRD Epic 4): the asset-mapping config that links each
 * Worker Role to a mandatory course collection. When a user's worker role is
 * set or changed, the auto-enrollment engine assigns the courses mapped here.
 *
 * Interim localStorage model until the backend lands; the mapping holds course
 * ids, resolved against the course library at render time.
 */

import { useEffect, useState } from "react"

import type { WorkerRole } from "@/lib/auth/roles"

export type TrackMap = Record<WorkerRole, string[]>

const KEY = "theraptly:training-tracks"
const EVT = "theraptly:training-tracks-changed"

const EMPTY: TrackMap = {
  front_desk: [],
  nurse: [],
  doctor: [],
  therapist: [],
  finance: [],
  others: [],
}

function dispatch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT))
  }
}

function read(): TrackMap {
  if (typeof window === "undefined") return { ...EMPTY }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    // Merge onto EMPTY so any newly-added worker roles always have an array.
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<TrackMap>) }
  } catch {
    return { ...EMPTY }
  }
}

function write(map: TrackMap) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(map))
  dispatch()
}

export function addCourseToTrack(role: WorkerRole, courseId: string) {
  const map = read()
  if (map[role].includes(courseId)) return
  write({ ...map, [role]: [...map[role], courseId] })
}

export function removeCourseFromTrack(role: WorkerRole, courseId: string) {
  const map = read()
  write({ ...map, [role]: map[role].filter((id) => id !== courseId) })
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(EVT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(EVT, handler)
  }
}

/** Reactive view of the worker-role → course-ids mapping. */
export function useTrainingTracks(): TrackMap {
  const [map, setMap] = useState<TrackMap>(EMPTY)
  useEffect(() => {
    const sync = () => setMap(read())
    sync()
    return subscribe(sync)
  }, [])
  return map
}
