"use client"

/**
 * Tiny localStorage-backed store for user-created rows (courses, documents,
 * staff). Each list page reads `seed + stored` and renders the union.
 *
 * This is an interim layer — when the backend (Supabase or otherwise) lands,
 * the appendX() helpers become server actions and the useStoredX() hooks
 * become real-time queries. The list-page code keeps working unchanged.
 */

import { useEffect, useState } from "react"

const KEYS = {
  courses: "theraptly:store:courses",
  documents: "theraptly:store:documents",
  staff: "theraptly:store:staff",
} as const

type StoreName = keyof typeof KEYS

function read<T>(name: StoreName): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEYS[name])
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(name: StoreName, items: T[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEYS[name], JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(`theraptly:store:${name}-changed`))
}

function subscribe(name: StoreName, onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const evt = `theraptly:store:${name}-changed`
  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(evt, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(evt, handler)
  }
}

/** Append-many helper — most recent first. */
function append<T>(name: StoreName, items: T | T[]): void {
  const list = read<T>(name)
  const incoming = Array.isArray(items) ? items : [items]
  write(name, [...incoming, ...list])
}

/** Remove items matching predicate. */
function removeBy<T>(name: StoreName, predicate: (item: T) => boolean): void {
  const list = read<T>(name)
  write(
    name,
    list.filter((x) => !predicate(x))
  )
}

/** Generic reactive hook. */
function useStored<T>(name: StoreName): T[] {
  const [list, setList] = useState<T[]>([])
  useEffect(() => {
    setList(read<T>(name))
    return subscribe(name, () => setList(read<T>(name)))
  }, [name])
  return list
}

/* ---------------- typed wrappers ---------------- */

import type { Course } from "@/lib/courses"
import type { DocItem } from "@/lib/documents"
import type { StaffMember } from "@/lib/staff"

export function appendCourse(course: Course): void {
  append<Course>("courses", course)
}
export function useStoredCourses(): Course[] {
  return useStored<Course>("courses")
}

export function appendDocument(doc: DocItem): void {
  append<DocItem>("documents", doc)
}
export function updateDocument(
  id: string,
  patch: Partial<DocItem>
): void {
  const list = read<DocItem>("documents")
  write(
    "documents",
    list.map((d) => (d.id === id ? { ...d, ...patch } : d))
  )
}
export function removeDocument(id: string): void {
  removeBy<DocItem>("documents", (d) => d.id === id)
}
export function useStoredDocuments(): DocItem[] {
  return useStored<DocItem>("documents")
}

export function appendStaff(members: StaffMember | StaffMember[]): void {
  append<StaffMember>("staff", members)
}
export function useStoredStaff(): StaffMember[] {
  return useStored<StaffMember>("staff")
}
