"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import type { OrgType } from "@/lib/auth/types"
import { orgTypes, teamSizes, frameworks } from "@/lib/onboarding-data"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"
import { Splash } from "@/components/brand/splash"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

const steps = ["Organization", "Scale & compliance", "Invite team", "Review"]

interface Draft {
  name: string
  type: OrgType | null
  teamSize: string | null
  frameworks: string[]
  invites: string[]
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function OnboardingPage() {
  const { user, loading, completeOnboarding, signOut } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteInput, setInviteInput] = useState("")
  const [draft, setDraft] = useState<Draft>({
    name: "",
    type: null,
    teamSize: null,
    frameworks: [],
    invites: [],
  })

  // Route guard.
  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
    else if (user.onboarded) router.replace("/dashboard")
  }, [user, loading, router])

  if (loading || !user || user.onboarded) {
    return <Splash label="Loading your workspace…" />
  }

  function validateStep(): boolean {
    setError(null)
    if (step === 0) {
      if (draft.name.trim().length < 2) {
        setError("Please enter your organization name.")
        return false
      }
      if (!draft.type) {
        setError("Select the type that best fits your organization.")
        return false
      }
    }
    if (step === 1) {
      if (!draft.teamSize) {
        setError("Select your team size.")
        return false
      }
      if (draft.frameworks.length === 0) {
        setError("Pick at least one compliance area to track.")
        return false
      }
    }
    return true
  }

  function next() {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function back() {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  function toggleFramework(id: string) {
    setDraft((d) => ({
      ...d,
      frameworks: d.frameworks.includes(id)
        ? d.frameworks.filter((f) => f !== id)
        : [...d.frameworks, id],
    }))
  }

  function addInvite() {
    const email = inviteInput.trim().toLowerCase()
    if (!emailRe.test(email)) {
      setError("Enter a valid email address.")
      return
    }
    if (draft.invites.includes(email)) {
      setInviteInput("")
      return
    }
    setError(null)
    setDraft((d) => ({ ...d, invites: [...d.invites, email] }))
    setInviteInput("")
  }

  async function finish() {
    if (!draft.type || !draft.teamSize) return
    setSubmitting(true)
    try {
      await completeOnboarding({
        name: draft.name.trim(),
        type: draft.type,
        teamSize: draft.teamSize,
        frameworks: draft.frameworks,
      })
      toast.success("Your organization is ready 🎉")
      router.replace("/dashboard")
    } catch {
      toast.error("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo />
        <button
          onClick={signOut}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </header>

      <div className="mx-auto w-full max-w-2xl px-6 pb-16">
        {/* Progress header */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              Step {step + 1} of {steps.length}
            </span>
            <span className="text-muted-foreground">{steps[step]}</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {step === 0 && (
                <StepProfile draft={draft} setDraft={setDraft} />
              )}
              {step === 1 && (
                <StepScale
                  draft={draft}
                  setDraft={setDraft}
                  toggleFramework={toggleFramework}
                />
              )}
              {step === 2 && (
                <StepInvite
                  draft={draft}
                  setDraft={setDraft}
                  inviteInput={inviteInput}
                  setInviteInput={setInviteInput}
                  addInvite={addInvite}
                />
              )}
              {step === 3 && <StepReview draft={draft} />}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 0 || submitting}
              className={cn(step === 0 && "invisible")}
            >
              <ArrowLeft /> Back
            </Button>

            {step < steps.length - 1 ? (
              <Button onClick={next}>
                {step === 2 && draft.invites.length === 0 ? "Skip for now" : "Continue"}
                <ArrowRight />
              </Button>
            ) : (
              <Button onClick={finish} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                {submitting ? "Setting up…" : "Finish setup"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Steps ---------- */

function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6 space-y-1.5">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function StepProfile({
  draft,
  setDraft,
}: {
  draft: Draft
  setDraft: React.Dispatch<React.SetStateAction<Draft>>
}) {
  return (
    <div>
      <StepHeader
        title="Tell us about your organization"
        desc="We'll tailor training programs and compliance tracking to fit."
      />
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            placeholder="e.g. Riverside Community Hospital"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Organization type</Label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {orgTypes.map(({ value, label, icon: Icon }) => {
              const active = draft.type === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, type: value }))}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-primary bg-accent/60 ring-1 ring-primary"
                      : "border-input hover:bg-accent/40"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm font-medium leading-snug">
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepScale({
  draft,
  setDraft,
  toggleFramework,
}: {
  draft: Draft
  setDraft: React.Dispatch<React.SetStateAction<Draft>>
  toggleFramework: (id: string) => void
}) {
  return (
    <div>
      <StepHeader
        title="Scale & compliance"
        desc="How big is your team, and which areas do you need to stay compliant on?"
      />
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Team size</Label>
          <div className="flex flex-wrap gap-2">
            {teamSizes.map((size) => {
              const active = draft.teamSize === size
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, teamSize: size }))}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-accent/40"
                  )}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Compliance areas to track</Label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {frameworks.map((fw) => {
              const active = draft.frameworks.includes(fw.id)
              return (
                <button
                  key={fw.id}
                  type="button"
                  onClick={() => toggleFramework(fw.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-primary bg-accent/60 ring-1 ring-primary"
                      : "border-input hover:bg-accent/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                    )}
                  >
                    {active && <Check className="size-3.5" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{fw.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {fw.desc}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepInvite({
  draft,
  setDraft,
  inviteInput,
  setInviteInput,
  addInvite,
}: {
  draft: Draft
  setDraft: React.Dispatch<React.SetStateAction<Draft>>
  inviteInput: string
  setInviteInput: (v: string) => void
  addInvite: () => void
}) {
  return (
    <div>
      <StepHeader
        title="Invite your team"
        desc="Add colleagues now, or skip and invite them later from settings."
      />
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="colleague@yourclinic.com"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addInvite()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addInvite}>
            <Plus /> Add
          </Button>
        </div>

        {draft.invites.length > 0 ? (
          <ul className="space-y-2">
            {draft.invites.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  {email}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      invites: d.invites.filter((e) => e !== email),
                    }))
                  }
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${email}`}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed bg-background/50 p-6 text-center text-sm text-muted-foreground">
            No invites added yet — that&apos;s okay, you can do this anytime.
          </div>
        )}
      </div>
    </div>
  )
}

function StepReview({ draft }: { draft: Draft }) {
  const typeLabel =
    orgTypes.find((t) => t.value === draft.type)?.label ?? "—"
  return (
    <div>
      <StepHeader
        title="You're all set"
        desc="Review your setup. You can change any of this later in settings."
      />
      <dl className="divide-y rounded-xl border bg-background">
        <Row label="Organization" value={draft.name || "—"} />
        <Row label="Type" value={typeLabel} />
        <Row label="Team size" value={draft.teamSize ?? "—"} />
        <Row
          label="Compliance areas"
          value={draft.frameworks.join(", ") || "—"}
        />
        <Row
          label="Invites"
          value={
            draft.invites.length
              ? `${draft.invites.length} pending`
              : "None yet"
          }
        />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  )
}
