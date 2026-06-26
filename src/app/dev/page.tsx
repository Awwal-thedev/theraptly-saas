"use client"

/**
 * DEV-ONLY preview entry. Lets us enter the app as any system role without
 * real Supabase credentials, to verify role/view UI. Dead in production.
 */

import { DEV_PREVIEW_KEY } from "@/lib/auth/auth-context"
import { IS_DEV } from "@/lib/auth/view-context"
import {
  SYSTEM_ROLE_LABELS,
  WORKER_ROLE_LABELS,
  type SystemRole,
  type WorkerRole,
} from "@/lib/auth/roles"

const SIM_ROLE_KEY = "theraptly:dev-sim-system-role"
const SIM_WORKER_KEY = "theraptly:dev-sim-worker-role"

const ROLES: SystemRole[] = [
  "owner",
  "hr",
  "clinical_director",
  "finance",
  "student",
  "super_admin",
]
const WORKERS: WorkerRole[] = [
  "front_desk",
  "nurse",
  "doctor",
  "therapist",
  "finance",
  "others",
]

export default function DevPreviewPage() {
  function enter(role: SystemRole, worker: WorkerRole) {
    window.localStorage.setItem(DEV_PREVIEW_KEY, "1")
    window.localStorage.setItem(SIM_ROLE_KEY, role)
    window.localStorage.setItem(SIM_WORKER_KEY, worker)
    // Cookie lets the server-side proxy skip auth gating (localStorage isn't
    // visible there). Mirrors the localStorage flag; cleared on sign-out.
    document.cookie = "theraptly-dev-preview=1; path=/; max-age=86400"
    window.location.href = "/dashboard"
  }

  if (!IS_DEV) {
    return (
      <div className="grid min-h-svh place-items-center bg-[#f9fafb] p-8 text-center">
        <p className="font-inter text-[15px] text-[#667085]">
          Dev preview is disabled in production.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-[#f9fafb] px-6 py-16">
      <div className="mx-auto max-w-[640px] space-y-8">
        <div className="space-y-1">
          <p className="font-inter text-[11px] font-bold uppercase tracking-[0.08em] text-[#f59e0b]">
            Dev preview
          </p>
          <h1 className="font-inter text-[24px] font-semibold text-[#101928]">
            Enter the app as a role
          </h1>
          <p className="font-inter text-[14px] text-[#667085]">
            Injects a mock signed-in user (no Supabase). Worker role defaults to
            Others — pick one to preview learner tracks. Sign out from the
            profile menu to exit preview.
          </p>
        </div>

        <div className="space-y-3">
          {ROLES.map((role) => (
            <div
              key={role}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eceef2] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
            >
              <div>
                <p className="font-inter text-[15px] font-semibold text-[#101928]">
                  {SYSTEM_ROLE_LABELS[role]}
                </p>
                <p className="font-inter text-[13px] text-[#667085]">
                  {role === "student"
                    ? "Learner view only"
                    : "Management + Learner views"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => enter(role, "others")}
                className="font-inter rounded-xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Enter
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-[#e4e7ec] bg-white p-4">
          <p className="font-inter mb-3 text-[13px] font-semibold text-[#344054]">
            Or enter as a Student with a specific worker track:
          </p>
          <div className="flex flex-wrap gap-2">
            {WORKERS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => enter("student", w)}
                className="font-inter rounded-lg border border-[#e4e7ec] px-3 py-2 text-[13px] font-medium text-[#475367] transition-colors hover:bg-[#f9fafb]"
              >
                {WORKER_ROLE_LABELS[w]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
