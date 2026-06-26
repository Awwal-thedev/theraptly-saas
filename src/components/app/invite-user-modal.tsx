"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Mail, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  CAPABILITY_LABELS,
  CAPABILITY_ORDER,
  NAV_LABELS,
  NAV_ORDER,
  PERMISSIONS,
  SYSTEM_ROLE_LABELS,
  SYSTEM_ROLE_SUMMARY,
  WORKER_ROLE_LABELS,
  type SystemRole,
  type WorkerRole,
} from "@/lib/auth/roles"
import {
  inviteUser,
  updateUser,
  type FacilityUser,
} from "@/lib/users"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** Owners assign any role except super_admin (Theraptly-internal only). */
const ASSIGNABLE_SYSTEM_ROLES: SystemRole[] = [
  "owner",
  "hr",
  "clinical_director",
  "finance",
  "student",
]
const WORKER_ROLES: WorkerRole[] = [
  "front_desk",
  "nurse",
  "doctor",
  "therapist",
  "finance",
  "others",
]

const SYSTEM_ROLE_ITEMS = ASSIGNABLE_SYSTEM_ROLES.map((value) => ({
  value,
  label: SYSTEM_ROLE_LABELS[value],
}))
const WORKER_ROLE_ITEMS = WORKER_ROLES.map((value) => ({
  value,
  label: WORKER_ROLE_LABELS[value],
}))

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Title-case a display name from the email local part for invited users. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? ""
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ") || email
  )
}

/** What a role change adds/removes, derived from the PERMISSIONS matrix. */
function accessDelta(from: SystemRole, to: SystemRole) {
  const fromNav = new Set(PERMISSIONS[from].nav)
  const toNav = new Set(PERMISSIONS[to].nav)
  const fromCap = PERMISSIONS[from].capabilities
  const toCap = PERMISSIONS[to].capabilities

  const gains: string[] = []
  const losses: string[] = []

  NAV_ORDER.forEach((k) => {
    if (toNav.has(k) && !fromNav.has(k)) gains.push(NAV_LABELS[k])
    if (fromNav.has(k) && !toNav.has(k)) losses.push(NAV_LABELS[k])
  })
  CAPABILITY_ORDER.forEach((c) => {
    if (toCap.has(c) && !fromCap.has(c)) gains.push(CAPABILITY_LABELS[c])
    if (fromCap.has(c) && !toCap.has(c)) losses.push(CAPABILITY_LABELS[c])
  })
  return { gains, losses }
}

function DeltaChips({
  label,
  items,
  tone,
}: {
  label: string
  items: string[]
  tone: "gain" | "loss"
}) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="font-inter text-[12px] font-semibold text-[#475367]">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span
            key={it}
            className={cn(
              "font-inter rounded-md px-2 py-0.5 text-[12px] font-medium",
              tone === "gain"
                ? "bg-[#ecfdf3] text-[#027a48]"
                : "bg-[#fef3f2] text-[#b42318]"
            )}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  )
}

export function InviteUserModal({
  open,
  onClose,
  /** When set, the modal changes this user's role (promotion) instead of inviting. */
  editUser,
}: {
  open: boolean
  onClose: () => void
  editUser?: FacilityUser | null
}) {
  const isEdit = !!editUser
  const [email, setEmail] = useState("")
  const [systemRole, setSystemRole] = useState<SystemRole | "">("")
  const [workerRole, setWorkerRole] = useState<WorkerRole | "">("")

  // Hydrate fields whenever the modal opens (invite = blank, edit = current).
  useEffect(() => {
    if (!open) return
    setEmail(editUser?.email ?? "")
    setSystemRole(editUser?.systemRole ?? "")
    setWorkerRole(editUser?.workerRole ?? "")
  }, [open, editUser])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const emailValid = isEdit || EMAIL_RE.test(email.trim())
  const roleChanged = isEdit && !!systemRole && systemRole !== editUser?.systemRole
  const valid = isEdit
    ? roleChanged
    : emailValid && !!systemRole && !!workerRole

  const delta =
    roleChanged && editUser
      ? accessDelta(editUser.systemRole, systemRole as SystemRole)
      : null

  function handleSubmit() {
    if (!valid) return
    if (isEdit && editUser) {
      // Clearance-only change (AC 3.1): worker role + training record untouched.
      updateUser(editUser.id, { systemRole: systemRole as SystemRole })
      toast.success(
        `${editUser.name}'s role updated — new access applies at their next sign-in.`
      )
    } else {
      const trimmed = email.trim()
      inviteUser({
        id: crypto.randomUUID(),
        name: nameFromEmail(trimmed),
        email: trimmed,
        systemRole: systemRole as SystemRole,
        workerRole: workerRole as WorkerRole,
        status: "invited",
        lastActive: "Invited just now",
      })
      toast.success(`Invitation sent to ${trimmed}`)
    }
    onClose()
  }

  const inputCls =
    "h-12 w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-[#979797] focus:border-primary focus:ring-3 focus:ring-primary/15 sm:text-[15px]"
  const labelCls = "font-inter text-[13px] font-medium text-[#475367] sm:text-[14px]"

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-[0_4px_40px_rgba(0,0,0,0.08)] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-inter-tight text-[18px] font-semibold text-[#101928] sm:text-[20px]">
              {isEdit ? "Change role" : "Invite a user"}
            </h2>
            <p className="font-inter mt-1 text-[13px] text-[#667085] sm:text-[14px]">
              {isEdit
                ? "Change this user's clearance. Their training record is kept; new access applies at their next sign-in."
                : "They'll get an email invite. Access is set by the role you assign."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#667085] transition-colors hover:bg-[#f9fafb]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {/* Email — invite only shows an editable field; edit shows who. */}
          {isEdit ? (
            <div className="flex items-center gap-3 rounded-xl bg-[#f9fafb] px-4 py-3">
              <Mail className="size-5 shrink-0 text-[#98a2b3]" />
              <div className="min-w-0">
                <p className="font-inter truncate text-[14px] font-semibold text-[#101928]">
                  {editUser?.name}
                </p>
                <p className="font-inter truncate text-[13px] text-[#667085]">
                  {editUser?.email}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="invite-email" className={labelCls}>
                Email address
              </label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@facility.com"
                  className={cn(inputCls, "pl-11")}
                />
              </div>
            </div>
          )}

          {/* System role */}
          <div>
            <label className={labelCls}>System role (access)</label>
            <Select
              items={SYSTEM_ROLE_ITEMS}
              value={systemRole}
              onValueChange={(v) => setSystemRole((v ?? "") as SystemRole)}
            >
              <SelectTrigger className="mt-2 !h-12 w-full rounded-[12px] border-[#e5e7ea] px-4 text-[15px]">
                <SelectValue placeholder="Select a system role" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_SYSTEM_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-[15px]">
                    {SYSTEM_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {systemRole && !roleChanged && (
              <p className="font-inter mt-2 rounded-lg bg-[#f9fafb] px-3 py-2 text-[13px] leading-relaxed text-[#667085]">
                {SYSTEM_ROLE_SUMMARY[systemRole]}
              </p>
            )}
          </div>

          {/* Promotion delta — only when the role actually changes */}
          {roleChanged && editUser && delta && (
            <div className="space-y-3 rounded-xl border border-[#eceef2] bg-[#f9fafb] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-inter rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-[#475367] ring-1 ring-[#eceef2]">
                  {SYSTEM_ROLE_LABELS[editUser.systemRole]}
                </span>
                <ArrowRight className="size-4 text-[#98a2b3]" />
                <span className="font-inter rounded-md bg-[#f4f3ff] px-2 py-1 text-[12px] font-semibold text-primary">
                  {SYSTEM_ROLE_LABELS[systemRole as SystemRole]}
                </span>
              </div>
              {delta.gains.length === 0 && delta.losses.length === 0 ? (
                <p className="font-inter text-[13px] text-[#667085]">
                  Same access level — no change to what they can see or do.
                </p>
              ) : (
                <>
                  <DeltaChips label="Gains access to" items={delta.gains} tone="gain" />
                  <DeltaChips label="Loses access to" items={delta.losses} tone="loss" />
                </>
              )}
            </div>
          )}

          {/* Worker role — editable on invite, locked (preserved) on promotion */}
          <div>
            <label className={labelCls}>Worker role (training track)</label>
            {isEdit ? (
              <div className="mt-2 flex h-12 items-center justify-between rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-[#f9fafb] px-4">
                <span className="font-inter text-[15px] text-[#475367]">
                  {workerRole ? WORKER_ROLE_LABELS[workerRole] : "—"}
                </span>
                <span className="font-inter text-[12px] text-[#98a2b3]">
                  Unchanged
                </span>
              </div>
            ) : (
              <Select
                items={WORKER_ROLE_ITEMS}
                value={workerRole}
                onValueChange={(v) => setWorkerRole((v ?? "") as WorkerRole)}
              >
                <SelectTrigger className="mt-2 !h-12 w-full rounded-[12px] border-[#e5e7ea] px-4 text-[15px]">
                  <SelectValue placeholder="Select a worker role" />
                </SelectTrigger>
                <SelectContent>
                  {WORKER_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-[15px]">
                      {WORKER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="font-inter mt-2 text-[12px] text-[#98a2b3]">
              {isEdit
                ? "Promotion keeps their training track and completed courses intact."
                : "Determines which mandatory courses are auto-assigned."}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="font-inter h-12 flex-1 rounded-xl border border-[#e4e7ec] text-[15px] font-semibold text-[#475367] transition-colors hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!valid}
            className="font-inter h-12 flex-1 rounded-xl bg-primary text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-[#e4e7ec] disabled:text-[#98a2b3]"
          >
            {isEdit ? "Update role" : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  )
}
