"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  WORKER_ROLE_LABELS,
  WORKER_ROLE_ORDER,
  type WorkerRole,
} from "@/lib/auth/roles"
import { assignCourse } from "@/lib/assignments"
import { DatePicker } from "@/components/courses/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const WORKER_ITEMS = WORKER_ROLE_ORDER.map((value) => ({
  value,
  label: WORKER_ROLE_LABELS[value],
}))

export function AssignCourseModal({
  open,
  onClose,
  courseId,
  courseName,
}: {
  open: boolean
  onClose: () => void
  courseId: string
  courseName: string
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [workerRole, setWorkerRole] = useState<WorkerRole | "">("")
  const [completionDate, setCompletionDate] = useState("")

  useEffect(() => {
    if (open) {
      setFirstName("")
      setLastName("")
      setEmail("")
      setWorkerRole("")
      setCompletionDate("")
    }
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

  const valid =
    firstName.trim() &&
    lastName.trim() &&
    EMAIL_RE.test(email.trim()) &&
    workerRole &&
    completionDate

  function submit() {
    if (!valid) return
    const fn = firstName.trim()
    assignCourse({
      id: crypto.randomUUID(),
      courseId,
      email: email.trim(),
      firstName: fn,
      lastName: lastName.trim(),
      workerRole: workerRole as WorkerRole,
      completionDate,
      assignedAt: "Just now",
      status: "assigned",
    })
    toast.success(`Course assigned to ${fn}`)
    onClose()
  }

  const inputCls =
    "h-12 w-full rounded-[12px] border-[1.5px] border-field bg-surface text-foreground dark:bg-surface-subtle px-4 text-[14px] outline-none transition-colors placeholder:text-[#979797] focus:border-primary focus:ring-3 focus:ring-primary/15 sm:text-[15px]"
  const labelCls = "font-inter text-[13px] font-medium text-[#475367] sm:text-[14px]"

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl bg-surface p-6 shadow-[0_4px_40px_rgba(0,0,0,0.08)] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-inter-tight text-[18px] font-semibold text-[#101928] sm:text-[20px]">
              Assign worker
            </h2>
            <p className="font-inter mt-1 text-[13px] text-[#667085] sm:text-[14px]">
              Invite a worker to take{" "}
              <span className="font-semibold text-[#101928]">“{courseName}”</span>.
              They'll receive an email to start.
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
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="assign-first" className={labelCls}>
                First name
              </label>
              <input
                id="assign-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className={cn(inputCls, "mt-2")}
              />
            </div>
            <div>
              <label htmlFor="assign-last" className={labelCls}>
                Last name
              </label>
              <input
                id="assign-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className={cn(inputCls, "mt-2")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="assign-email" className={labelCls}>
              Email address
            </label>
            <input
              id="assign-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@facility.com"
              className={cn(inputCls, "mt-2")}
            />
          </div>

          <div>
            <label className={labelCls}>Worker type</label>
            <Select
              items={WORKER_ITEMS}
              value={workerRole}
              onValueChange={(v) => setWorkerRole((v ?? "") as WorkerRole)}
            >
              <SelectTrigger className="mt-2 !h-12 w-full rounded-[12px] border-field px-4 text-[15px]">
                <SelectValue placeholder="Select worker type" />
              </SelectTrigger>
              <SelectContent>
                {WORKER_ITEMS.map((w) => (
                  <SelectItem key={w.value} value={w.value} className="text-[15px]">
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={labelCls}>Completion deadline</label>
            <div className="mt-2">
              <DatePicker value={completionDate} onChange={setCompletionDate} />
            </div>
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
            onClick={submit}
            disabled={!valid}
            className="font-inter h-12 flex-1 rounded-xl bg-primary text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-[#e4e7ec] disabled:text-[#98a2b3]"
          >
            Assign worker
          </button>
        </div>
      </div>
    </div>
  )
}
