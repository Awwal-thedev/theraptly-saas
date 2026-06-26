"use client"

/**
 * Facility users (the access/clearance lens on the roster). Each account
 * carries both role axes — a System Role (clearance) and a Worker Role
 * (training track). This is the same person who appears in Staff Management;
 * that screen is the training lens, this is the permissions lens.
 *
 * Interim localStorage model until the backend lands. Seeded with the Owner
 * (every facility has one); invited users append here from the invite flow.
 */

import { useEffect, useState } from "react"

import type { SystemRole, WorkerRole } from "@/lib/auth/roles"

export type UserStatus = "active" | "invited" | "suspended"

export interface FacilityUser {
  id: string
  name: string
  email: string
  systemRole: SystemRole
  workerRole: WorkerRole
  status: UserStatus
  /** Human label, e.g. "Just now", "2 days ago", or an invite date. */
  lastActive?: string
}

const KEY = "theraptly:facility-users"
const EVT = "theraptly:facility-users-changed"

const SEED: FacilityUser[] = [
  {
    id: "owner-self",
    name: "Jane Doe",
    email: "jane@demo.com",
    systemRole: "owner",
    workerRole: "others",
    status: "active",
    lastActive: "Just now",
  },
]

function dispatch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT))
  }
}

function read(): FacilityUser[] {
  if (typeof window === "undefined") return SEED
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return SEED
    return JSON.parse(raw) as FacilityUser[]
  } catch {
    return SEED
  }
}

function write(list: FacilityUser[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(list))
  dispatch()
}

export function inviteUser(user: FacilityUser) {
  write([...read(), user])
}

export function updateUser(id: string, patch: Partial<FacilityUser>) {
  write(read().map((u) => (u.id === id ? { ...u, ...patch } : u)))
}

export function removeUser(id: string) {
  write(read().filter((u) => u.id !== id))
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

/** Reactive view of the facility's users. */
export function useFacilityUsers(): FacilityUser[] {
  const [users, setUsers] = useState<FacilityUser[]>([])
  useEffect(() => {
    const sync = () => setUsers(read())
    sync()
    return subscribe(sync)
  }, [])
  return users
}
