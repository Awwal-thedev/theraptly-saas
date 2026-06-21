"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Clock, Plus, X } from "lucide-react"

import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"
import { Splash } from "@/components/brand/splash"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/courses/date-picker"
import { ResultModal } from "@/components/courses/result-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RENEWAL_OPTIONS = [
  "Annual Renewal (12 Months)",
  "Bi-Annual Renewal (6 Months)",
  "Quarterly Renewal (3 Months)",
  "No Renewal",
]
const REMINDER_PRESETS = [
  "30 minutes before",
  "1 hour before",
  "1 day before",
  "1 week before",
  "Custom",
]
const REMINDER_UNITS = ["minutes", "hours", "days", "weeks"]

type Reminder = { id: number; preset: string; amount: string; unit: string }

const triggerClass =
  "font-inter !h-14 w-full rounded-xl border-[#e5e7ea] px-4 text-[15px] text-[#131927] gap-3 focus-visible:border-primary focus-visible:ring-primary/15"

export default function CoursePublishPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [date, setDate] = useState("2026-09-12")
  const [renewal, setRenewal] = useState(RENEWAL_OPTIONS[0])
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: 1, preset: "30 minutes before", amount: "15", unit: "minutes" },
  ])

  const [recipients, setRecipients] = useState<string[]>([])
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")

  const [status, setStatus] = useState<
    "idle" | "publishing" | "success" | "error"
  >("idle")
  // Whether workers were assigned on the successful publish (drives the copy).
  const [assigned, setAssigned] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
    else if (!user.onboarded) router.replace("/onboarding")
  }, [user, loading, router])

  if (loading || !user || !user.onboarded) {
    return <Splash label="Loading…" />
  }

  // skip = publish the course without assigning workers (assignment is optional).
  async function publishCourse(skip = false) {
    setStatus("publishing")
    setAssigned(!skip && recipients.length > 0)
    try {
      await new Promise((res) => setTimeout(res, 900))
      // No backend yet — append ?result=error to the URL to preview the failure state.
      const forceError =
        new URLSearchParams(window.location.search).get("result") === "error"
      if (forceError) throw new Error("publish failed")
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  const publishing = status === "publishing"

  function addEmail() {
    const v = email.trim().replace(/,+$/, "").trim()
    if (!v) return
    if (!EMAIL_RE.test(v)) {
      setEmailError("Enter a valid email address")
      return
    }
    if (recipients.includes(v.toLowerCase())) {
      setEmailError("This email has already been added")
      return
    }
    setRecipients((r) => [...r, v.toLowerCase()])
    setEmail("")
    setEmailError("")
  }

  function onEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addEmail()
    } else if (e.key === "Backspace" && !email && recipients.length) {
      setRecipients((r) => r.slice(0, -1))
    }
  }

  const addReminder = () =>
    setReminders((rs) => [
      ...rs,
      {
        id: rs.reduce((m, r) => Math.max(m, r.id), 0) + 1,
        preset: "1 day before",
        amount: "15",
        unit: "minutes",
      },
    ])
  const removeReminder = (id: number) =>
    setReminders((rs) => rs.filter((r) => r.id !== id))
  const updateReminder = (id: number, patch: Partial<Reminder>) =>
    setReminders((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div className="flex min-h-svh flex-col bg-white">
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#f0f2f5] px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Logo href="/dashboard" />
          <span className="hidden h-6 w-px bg-[#e4e7ec] sm:block" />
          <span className="font-inter-tight hidden text-[16px] font-semibold tracking-[0.2px] text-[#3e3e3e] sm:block">
            Assigning &amp; Publish
          </span>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="font-inter-tight text-[16px] font-bold tracking-[0.2px] text-[#0d0d12] transition-colors hover:text-primary"
        >
          Exit
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 px-5 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto w-full max-w-[920px]">
          {/* Heading */}
          <div className="text-center">
            <h1 className="font-inter-tight text-[28px] font-bold tracking-tight text-[#383838] sm:text-[34px]">
              Assigning &amp; Publish
            </h1>
            <p className="font-inter mx-auto mt-2 max-w-[560px] text-[15px] text-[#424242] sm:text-[16px]">
              Select which staff should take this course, set deadlines, and
              finalize publishing.
            </p>
          </div>

          {/* Assign To */}
          <div className="mt-12 sm:mt-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <label
                htmlFor="assign"
                className="font-inter-tight text-[16px] text-[#666d80] sm:w-[220px] sm:shrink-0 sm:pt-4"
              >
                Assign To
              </label>
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex gap-3">
                  <input
                    id="assign"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError("")
                    }}
                    onKeyDown={onEmailKeyDown}
                    onBlur={addEmail}
                    placeholder="Add people, emails or names"
                    aria-invalid={!!emailError}
                    className={cn(
                      "font-inter h-14 min-w-0 flex-1 rounded-xl border bg-white px-4 text-[15px] text-[#101928] outline-none transition-colors placeholder:text-[#98a2b3] focus:ring-3",
                      emailError
                        ? "border-destructive focus:border-destructive focus:ring-destructive/15"
                        : "border-[#e5e7ea] focus:border-primary focus:ring-primary/15"
                    )}
                  />
                  <Button
                    onClick={addEmail}
                    className="font-inter h-14 shrink-0 rounded-xl px-6 text-[15px] font-semibold hover:bg-brand-hover"
                  >
                    Invite
                  </Button>
                </div>

                {emailError && (
                  <p className="font-inter text-[13px] text-destructive">
                    {emailError}
                  </p>
                )}

                {recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipients.map((r) => (
                      <span
                        key={r}
                        className="font-inter flex items-center gap-1.5 rounded-full border border-[#e0ddff] bg-[#f4f3ff] py-1 pl-3 pr-2 text-[13px] font-medium text-primary"
                      >
                        {r}
                        <button
                          type="button"
                          onClick={() =>
                            setRecipients((list) =>
                              list.filter((x) => x !== r)
                            )
                          }
                          aria-label={`Remove ${r}`}
                          className="grid size-4 place-items-center rounded-full text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 h-px bg-[#eceef2]" />
          </div>

          {/* Settings */}
          <div className="mt-4 divide-y divide-[#eceef2]">
            {/* Training Schedule */}
            <div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="max-w-[440px]">
                <p className="font-inter-tight text-[18px] font-medium text-[#0d0d12]">
                  Training Schedule
                </p>
                <p className="font-inter mt-1 text-[15px] text-[#666d80]">
                  Workers will receive access to this date
                </p>
              </div>
              <div className="w-full sm:w-[360px] sm:shrink-0">
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>

            {/* Renewal Settings */}
            <div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="max-w-[440px]">
                <p className="font-inter-tight text-[18px] font-medium text-[#0d0d12]">
                  Renewal Settings
                </p>
                <p className="font-inter mt-1 text-[15px] text-[#666d80]">
                  Choose a date for staffs to renew this course
                </p>
              </div>
              <div className="w-full sm:w-[360px] sm:shrink-0">
                <Select value={renewal} onValueChange={(v) => setRenewal(v ?? "")}>
                  <SelectTrigger className={triggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RENEWAL_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o} className="py-2.5 text-[15px]">
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reminder */}
            <div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="max-w-[440px]">
                <p className="font-inter-tight text-[18px] font-medium text-[#0d0d12]">
                  Reminder
                </p>
                <p className="font-inter mt-1 text-[15px] text-[#666d80]">
                  Workers will receive email reminders on this date
                </p>
              </div>
              <div className="w-full space-y-3 sm:w-[360px] sm:shrink-0">
                {reminders.map((r) => (
                  <div key={r.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select
                          value={r.preset}
                          onValueChange={(v) =>
                            updateReminder(r.id, { preset: v ?? "" })
                          }
                        >
                          <SelectTrigger className={triggerClass}>
                            <span className="flex flex-1 items-center gap-3">
                              <Clock className="size-5 shrink-0 text-[#667085]" />
                              <SelectValue />
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {REMINDER_PRESETS.map((o) => (
                              <SelectItem
                                key={o}
                                value={o}
                                className="py-2.5 text-[15px]"
                              >
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {reminders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReminder(r.id)}
                          aria-label="Remove reminder"
                          className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e5e7ea] text-[#667085] transition-colors hover:bg-[#f9fafb] hover:text-destructive"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>

                    {r.preset === "Custom" && (
                      <div className="flex items-center gap-2 pl-1">
                        <input
                          type="number"
                          min={1}
                          value={r.amount}
                          onChange={(e) =>
                            updateReminder(r.id, { amount: e.target.value })
                          }
                          className="font-inter h-12 w-20 rounded-xl border border-[#e5e7ea] bg-white px-3 text-[15px] text-[#131927] outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15"
                        />
                        <div className="flex-1">
                          <Select
                            value={r.unit}
                            onValueChange={(v) =>
                              updateReminder(r.id, { unit: v ?? "" })
                            }
                          >
                            <SelectTrigger className="font-inter !h-12 w-full rounded-xl border-[#e5e7ea] px-4 text-[15px] text-[#131927]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {REMINDER_UNITS.map((u) => (
                                <SelectItem
                                  key={u}
                                  value={u}
                                  className="py-2.5 text-[15px]"
                                >
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <span className="font-inter text-[14px] text-[#667085]">
                          before
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addReminder}
                  className="font-inter flex items-center gap-2 px-1 text-[15px] font-medium text-primary transition-colors hover:text-brand-hover"
                >
                  <Plus className="size-4" /> Add reminder
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-12 flex flex-col-reverse gap-3 sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => router.push(`/courses/${params.id}/learn`)}
              disabled={publishing}
              className="font-inter h-12 w-full rounded-xl border border-[#d2d5db] px-10 text-[16px] font-semibold text-[#454353] transition-colors hover:bg-[#f9fafb] disabled:opacity-50 sm:w-auto"
            >
              Back
            </button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => publishCourse(true)}
                disabled={publishing}
                className="font-inter h-12 w-full rounded-xl px-6 text-[16px] font-semibold text-[#667085] transition-colors hover:bg-[#f9fafb] hover:text-foreground disabled:opacity-50 sm:w-auto"
              >
                Skip for now
              </button>
              <Button
                onClick={() => publishCourse(false)}
                disabled={publishing}
                className="font-inter h-12 w-full rounded-xl px-10 text-[16px] font-semibold hover:bg-brand-hover sm:w-auto"
              >
                {publishing ? "Publishing…" : "Publish Course"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Result modal */}
      <ResultModal
        open={status === "success"}
        status="success"
        title="Course added successfully"
        description={
          assigned
            ? "Workers have been assigned and are now enrolled in this course."
            : "Your course has been published and is ready to assign to workers anytime."
        }
        primaryLabel="Back to Dashboard"
        onPrimary={() => router.push("/dashboard")}
        secondaryLabel="Go to Courses"
        onSecondary={() => router.push("/courses")}
      />
      <ResultModal
        open={status === "error"}
        status="error"
        title="Couldn’t publish course"
        description="Something went wrong while publishing and assigning workers. Please try again."
        primaryLabel="Try Again"
        onPrimary={() => publishCourse(!assigned)}
        secondaryLabel="Back to Dashboard"
        onSecondary={() => router.push("/dashboard")}
      />
    </div>
  )
}
