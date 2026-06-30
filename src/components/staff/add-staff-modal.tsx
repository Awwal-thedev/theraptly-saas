"use client"

import { useEffect, useState } from "react"
import { Briefcase, GraduationCap, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  SYSTEM_ROLE_LABELS,
  SYSTEM_ROLE_SUMMARY,
  WORKER_ROLE_FOCUS,
  WORKER_ROLE_LABELS,
  WORKER_ROLE_ORDER,
  type SystemRole,
  type WorkerRole,
} from "@/lib/auth/roles"
import { inviteUser } from "@/lib/users"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Managers an admin can add — Owner/Super Admin are not assignable here. */
const MANAGER_ROLES: SystemRole[] = ["hr", "clinical_director", "finance"]
const MANAGER_ITEMS = MANAGER_ROLES.map((value) => ({
  value,
  label: SYSTEM_ROLE_LABELS[value],
}))
const WORKER_ITEMS = WORKER_ROLE_ORDER.map((value) => ({
  value,
  label: WORKER_ROLE_LABELS[value],
}))

type Kind = "manager" | "worker"

export function AddStaffModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [kind, setKind] = useState<Kind>("manager")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [systemRole, setSystemRole] = useState<SystemRole | "">("")
  const [workerRole, setWorkerRole] = useState<WorkerRole | "">("")

  useEffect(() => {
    if (!open) return
    setKind("manager")
    setFirstName("")
    setLastName("")
    setEmail("")
    setSystemRole("")
    setWorkerRole("")
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const baseValid =
    firstName.trim() && lastName.trim() && EMAIL_RE.test(email.trim())
  const roleValid = kind === "manager" ? !!systemRole : !!workerRole
  const valid = baseValid && roleValid

  function submit() {
    if (!valid) return
    const name = `${firstName.trim()} ${lastName.trim()}`.trim()
    inviteUser({
      id: crypto.randomUUID(),
      name,
      email: email.trim(),
      systemRole: kind === "manager" ? (systemRole as SystemRole) : "student",
      workerRole: kind === "worker" ? (workerRole as WorkerRole) : "others",
      status: "invited",
      lastActive: "Invited just now",
    })
    toast.success(
      `${kind === "manager" ? "Manager" : "Worker"} ${name} added — invite on its way.`
    )
    onClose()
  }

  const inputCls =
    "h-12 w-full rounded-[12px] border-[1.5px] border-field bg-surface text-foreground dark:bg-surface-subtle px-4 text-[14px] outline-none transition-colors placeholder:text-[#979797] focus:border-primary focus:ring-3 focus:ring-primary/15 sm:text-[15px]"
  const labelCls =
    "font-inter text-[13px] font-medium text-[#475367] sm:text-[14px]"

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[540px] rounded-2xl bg-surface p-6 shadow-[0_4px_40px_rgba(0,0,0,0.08)] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-inter-tight text-[18px] font-semibold text-[#101928] sm:text-[20px]">
              Add to your team
            </h2>
            <p className="font-inter mt-1 text-[13px] text-[#667085] sm:text-[14px]">
              Add a manager who helps run the facility, or a worker who takes
              assigned training.
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

        {/* Manager / Worker toggle */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <KindCard
            active={kind === "manager"}
            onClick={() => setKind("manager")}
            icon={<Briefcase className="size-5" />}
            title="Manager"
            desc="Runs the facility. Access set by role."
          />
          <KindCard
            active={kind === "worker"}
            onClick={() => setKind("worker")}
            icon={<GraduationCap className="size-5" />}
            title="Worker / Learner"
            desc="Takes assigned training. No admin access."
          />
        </div>

        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="staff-first" className={labelCls}>
                First name
              </label>
              <input
                id="staff-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className={cn(inputCls, "mt-2")}
              />
            </div>
            <div>
              <label htmlFor="staff-last" className={labelCls}>
                Last name
              </label>
              <input
                id="staff-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className={cn(inputCls, "mt-2")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="staff-email" className={labelCls}>
              Email address
            </label>
            <input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@facility.com"
              className={cn(inputCls, "mt-2")}
            />
          </div>

          {kind === "manager" ? (
            <div>
              <label className={labelCls}>Manager role</label>
              <Select
                items={MANAGER_ITEMS}
                value={systemRole}
                onValueChange={(v) => setSystemRole((v ?? "") as SystemRole)}
              >
                <SelectTrigger className="mt-2 !h-12 w-full rounded-[12px] border-field px-4 text-[15px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {MANAGER_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-[15px]">
                      {SYSTEM_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {systemRole && (
                <p className="font-inter mt-2 rounded-lg bg-[#f9fafb] px-3 py-2 text-[13px] leading-relaxed text-[#667085]">
                  {SYSTEM_ROLE_SUMMARY[systemRole]}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className={labelCls}>Worker discipline</label>
              <Select
                items={WORKER_ITEMS}
                value={workerRole}
                onValueChange={(v) => setWorkerRole((v ?? "") as WorkerRole)}
              >
                <SelectTrigger className="mt-2 !h-12 w-full rounded-[12px] border-field px-4 text-[15px]">
                  <SelectValue placeholder="Select a discipline" />
                </SelectTrigger>
                <SelectContent>
                  {WORKER_ROLE_ORDER.map((r) => (
                    <SelectItem key={r} value={r} className="text-[15px]">
                      {WORKER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workerRole && (
                <p className="font-inter mt-2 rounded-lg bg-[#f9fafb] px-3 py-2 text-[13px] leading-relaxed text-[#667085]">
                  Training focus: {WORKER_ROLE_FOCUS[workerRole]}.
                </p>
              )}
            </div>
          )}
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
            onClick={submit}
            disabled={!valid}
            className="font-inter h-12 flex-1 rounded-xl bg-primary text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-[#e4e7ec] disabled:text-[#98a2b3]"
          >
            Add {kind === "manager" ? "manager" : "worker"}
          </button>
        </div>
      </div>
    </div>
  )
}

function KindCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 rounded-xl border-[1.5px] p-4 text-left transition-colors",
        active
          ? "border-primary bg-[#f4f3ff]"
          : "border-[#e5e7ea] bg-surface hover:bg-[#f9fafb]"
      )}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-lg",
          active ? "bg-primary text-white" : "bg-[#f3f4f6] text-[#667085]"
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "font-inter text-[15px] font-semibold",
          active ? "text-primary" : "text-[#101928]"
        )}
      >
        {title}
      </span>
      <span className="font-inter text-[12px] leading-snug text-[#667085]">
        {desc}
      </span>
    </button>
  )
}
