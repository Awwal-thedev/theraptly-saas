"use client"

/**
 * Facilities = fully isolated tenants. An account can hold several; switching
 * one swaps the entire workspace (staff, courses, docs, metrics, billing).
 *
 * Interim localStorage model until the backend lands. Seeded with a few demo
 * facilities so the switcher is testable; once signup creates real facilities
 * this store is populated from there instead and the seed drops away.
 */

import { useEffect, useState } from "react"

import type { OrgType } from "@/lib/auth/types"

export interface Facility {
  id: string
  name: string
  type: OrgType
  /** Subscription tier label (billing is per-facility). */
  plan?: string
}

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  hospital: "Hospital",
  clinic: "Clinic",
  long_term_care: "Long-term care",
  home_health: "Home health",
  behavioral_health: "Behavioral health",
  other: "Other",
}

const LIST_KEY = "theraptly:facilities"
const ACTIVE_KEY = "theraptly:active-facility"
const EVT = "theraptly:facilities-changed"

const SEED: Facility[] = [
  { id: "sunrise", name: "Sunrise Behavioral Health", type: "behavioral_health", plan: "Growth" },
  { id: "lakeside", name: "Lakeside Clinic", type: "clinic", plan: "Starter" },
  { id: "cedar", name: "Cedar Home Care", type: "home_health", plan: "Starter" },
]

function dispatch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT))
  }
}

function readList(): Facility[] {
  if (typeof window === "undefined") return SEED
  try {
    const raw = window.localStorage.getItem(LIST_KEY)
    if (!raw) return SEED
    const parsed = JSON.parse(raw) as Facility[]
    return parsed.length ? parsed : SEED
  } catch {
    return SEED
  }
}

function writeList(list: Facility[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LIST_KEY, JSON.stringify(list))
  dispatch()
}

function readActiveId(list: Facility[]): string {
  if (typeof window === "undefined") return list[0]?.id ?? ""
  const stored = window.localStorage.getItem(ACTIVE_KEY)
  if (stored && list.some((f) => f.id === stored)) return stored
  return list[0]?.id ?? ""
}

export function setActiveFacility(id: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACTIVE_KEY, id)
  dispatch()
}

export function addFacility(facility: Facility) {
  const list = readList()
  writeList([...list, facility])
  setActiveFacility(facility.id)
}

/** Replace the whole list (used by signup) and activate the first one. */
export function setFacilities(list: Facility[]) {
  if (!list.length) return
  writeList(list)
  setActiveFacility(list[0].id)
}

/** Patch a single facility (e.g. from the Facility settings tab). */
export function updateFacility(id: string, patch: Partial<Omit<Facility, "id">>) {
  const list = readList()
  writeList(list.map((f) => (f.id === id ? { ...f, ...patch } : f)))
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

/** Reactive view of the facilities list + the active facility. */
export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    const sync = () => {
      const list = readList()
      setFacilities(list)
      setActiveId(readActiveId(list))
    }
    sync()
    return subscribe(sync)
  }, [])

  const active = facilities.find((f) => f.id === activeId) ?? facilities[0]
  return { facilities, activeId, active, setActive: setActiveFacility, addFacility }
}
