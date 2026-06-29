"use client"

/**
 * Manual course → worker assignments. Courses are no longer auto-assigned by
 * worker role; an admin assigns each worker to a specific course from the
 * course-details screen. Interim localStorage store until the backend lands.
 */

import { useEffect, useState } from "react"

import type { WorkerRole } from "@/lib/auth/roles"

export type AssignmentStatus = "assigned" | "in_progress" | "completed"

export interface CourseAssignment {
  id: string
  courseId: string
  email: string
  firstName: string
  lastName: string
  /** Worker discipline (what kind of worker), not a system-access role. */
  workerRole: WorkerRole
  /** Target completion date (ISO yyyy-mm-dd). */
  completionDate: string
  /** Human label for when the assignment was made. */
  assignedAt: string
  status: AssignmentStatus
}

const KEY = "theraptly:store:assignments"
const EVT = "theraptly:store:assignments-changed"

function read(): CourseAssignment[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CourseAssignment[]) : []
  } catch {
    return []
  }
}

function write(list: CourseAssignment[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function assignCourse(assignment: CourseAssignment) {
  write([assignment, ...read()])
}

export function removeAssignment(id: string) {
  write(read().filter((a) => a.id !== id))
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

/** Reactive assignments for one course. */
export function useAssignments(courseId: string): CourseAssignment[] {
  const [list, setList] = useState<CourseAssignment[]>([])
  useEffect(() => {
    const sync = () => setList(read().filter((a) => a.courseId === courseId))
    sync()
    return subscribe(sync)
  }, [courseId])
  return list
}
