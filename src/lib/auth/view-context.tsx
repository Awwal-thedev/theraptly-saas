"use client"

/**
 * Client-side UI context for the dual-layer role model (PRD Epic 1).
 *
 * Tracks two things that are purely presentational and never touch the
 * underlying identity/token (AC 1.4):
 *   - `view`           → "management" | "learner" (the View Switcher state)
 *   - simulated roles  → DEV ONLY. Lets us preview the app as any system /
 *                        worker role without a separate login. Stripped in
 *                        production builds.
 *
 * The *effective* system role is the simulated one in dev, otherwise the real
 * one derived from the signed-in account.
 */

import * as React from "react"

import { useAuth } from "@/lib/auth/auth-context"
import {
  isElevated,
  systemRoleFromLegacy,
  type SystemRole,
  type WorkerRole,
} from "@/lib/auth/roles"

export type AppView = "management" | "learner"

const VIEW_KEY = "theraptly:app-view"
const SIM_ROLE_KEY = "theraptly:dev-sim-system-role"
const SIM_WORKER_KEY = "theraptly:dev-sim-worker-role"

export const IS_DEV = process.env.NODE_ENV !== "production"

interface AppViewValue {
  view: AppView
  setView: (v: AppView) => void
  /** Effective clearance — what the UI should gate against. */
  systemRole: SystemRole
  /** Effective training track. */
  workerRole: WorkerRole
  /** True when the account may switch into a Management view. */
  elevated: boolean
  /* --- dev simulator (no-ops in production) --- */
  isDev: boolean
  simulatedSystemRole: SystemRole | null
  setSimulatedSystemRole: (r: SystemRole | null) => void
  simulatedWorkerRole: WorkerRole | null
  setSimulatedWorkerRole: (r: WorkerRole | null) => void
}

const AppViewContext = React.createContext<AppViewValue | null>(null)

export function AppViewProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const realSystemRole: SystemRole = user
    ? systemRoleFromLegacy(user.role)
    : "student"

  const [simulatedSystemRole, setSimRoleState] =
    React.useState<SystemRole | null>(null)
  const [simulatedWorkerRole, setSimWorkerState] =
    React.useState<WorkerRole | null>(null)
  const [view, setViewState] = React.useState<AppView>("management")

  // Restore persisted view + dev simulation on mount.
  React.useEffect(() => {
    const savedView = window.localStorage.getItem(VIEW_KEY)
    if (savedView === "management" || savedView === "learner") {
      setViewState(savedView)
    }
    if (IS_DEV) {
      const r = window.localStorage.getItem(SIM_ROLE_KEY)
      if (r) setSimRoleState(r as SystemRole)
      const w = window.localStorage.getItem(SIM_WORKER_KEY)
      if (w) setSimWorkerState(w as WorkerRole)
    }
  }, [])

  const systemRole = IS_DEV
    ? simulatedSystemRole ?? realSystemRole
    : realSystemRole
  const elevated = isElevated(systemRole)

  // A non-elevated account can only ever be in the learner view.
  const effectiveView: AppView = elevated ? view : "learner"

  const setView = React.useCallback(
    (v: AppView) => {
      if (!elevated) return
      setViewState(v)
      window.localStorage.setItem(VIEW_KEY, v)
    },
    [elevated]
  )

  const setSimulatedSystemRole = React.useCallback((r: SystemRole | null) => {
    if (!IS_DEV) return
    setSimRoleState(r)
    if (r) window.localStorage.setItem(SIM_ROLE_KEY, r)
    else window.localStorage.removeItem(SIM_ROLE_KEY)
  }, [])

  const setSimulatedWorkerRole = React.useCallback((r: WorkerRole | null) => {
    if (!IS_DEV) return
    setSimWorkerState(r)
    if (r) window.localStorage.setItem(SIM_WORKER_KEY, r)
    else window.localStorage.removeItem(SIM_WORKER_KEY)
  }, [])

  const workerRole: WorkerRole = IS_DEV
    ? simulatedWorkerRole ?? "others"
    : "others"

  const value = React.useMemo<AppViewValue>(
    () => ({
      view: effectiveView,
      setView,
      systemRole,
      workerRole,
      elevated,
      isDev: IS_DEV,
      simulatedSystemRole,
      setSimulatedSystemRole,
      simulatedWorkerRole,
      setSimulatedWorkerRole,
    }),
    [
      effectiveView,
      setView,
      systemRole,
      workerRole,
      elevated,
      simulatedSystemRole,
      setSimulatedSystemRole,
      simulatedWorkerRole,
      setSimulatedWorkerRole,
    ]
  )

  return (
    <AppViewContext.Provider value={value}>{children}</AppViewContext.Provider>
  )
}

export function useAppView() {
  const ctx = React.useContext(AppViewContext)
  if (!ctx) throw new Error("useAppView must be used within <AppViewProvider>")
  return ctx
}
