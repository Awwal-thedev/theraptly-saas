"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronDown,
  FolderUp,
  Loader2,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/brand/logo"
import { Splash } from "@/components/brand/splash"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STEPS = [
  "Org. details",
  "Credentialing",
  "Services",
  "Invite Team Members",
  "Invite Workers",
] as const

const STAFF_OPTIONS = ["1–10", "11–50", "51–200", "201–1000", "1000+"]
const COUNTRY_OPTIONS = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Nigeria",
]
const STATE_OPTIONS = [
  "Alabama",
  "Alaska",
  "Arizona",
  "California",
  "Florida",
  "New York",
  "North Carolina",
  "Texas",
  "Washington",
]
const CITY_OPTIONS = [
  "Atlanta",
  "Charlotte",
  "Chicago",
  "Houston",
  "Los Angeles",
  "Miami",
  "New York",
  "Raleigh",
  "Seattle",
]

const HIPAA_OPTIONS = ["Yes", "No"]

const PRIMARY_BUSINESS_TYPES = [
  "Hospital",
  "Clinic / Practice",
  "Long-term care",
  "Home health",
  "Behavioral health",
  "Rehabilitation center",
  "Other",
]

const ADDITIONAL_BUSINESS_TYPES = [
  "Not applicable",
  "Outpatient",
  "Telehealth",
  "Residential",
  "Diagnostic services",
  "Other",
]

const PROGRAM_SERVICES = [
  "Aging Services",
  "Behavioral Health",
  "Child & Youth Services",
  "Employment & Community Services",
  "Medical Rehabilitation",
  "Opioid Treatment Program",
  "Vision Rehabilitation Services",
]

const TEAM_ROLES = ["Admin", "Supervisor"]
const TEAM_PERMISSIONS = [
  "Full access",
  "Manage courses",
  "Manage staff",
  "View only",
]

const PHONE_COUNTRIES = [
  { code: "US", dial: "+1", flag: "🇺🇸", label: "United States" },
  { code: "GB", dial: "+44", flag: "🇬🇧", label: "United Kingdom" },
  { code: "CA", dial: "+1", flag: "🇨🇦", label: "Canada" },
  { code: "AU", dial: "+61", flag: "🇦🇺", label: "Australia" },
  { code: "NG", dial: "+234", flag: "🇳🇬", label: "Nigeria" },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface OrgDetails {
  legalName: string
  dba: string
  ein: string
  staff: string
  contactName: string
  contactEmail: string
  country: string
  phoneCountry: string
  phone: string
  street: string
  zip: string
  city: string
  state: string
}

type FieldKey = keyof OrgDetails

const REQUIRED_FIELDS: FieldKey[] = [
  "legalName",
  "dba",
  "staff",
  "contactName",
  "contactEmail",
  "country",
  "phone",
]

export default function OnboardingPage() {
  const { user, loading, completeOnboarding, signOut } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [details, setDetails] = useState<OrgDetails>({
    legalName: "",
    dba: "",
    ein: "",
    staff: "",
    contactName: "",
    contactEmail: "",
    country: "",
    phoneCountry: "US",
    phone: "",
    street: "",
    zip: "",
    city: "",
    state: "",
  })
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // Step 2 — Credentialing
  const [licenseNumber, setLicenseNumber] = useState("")
  const [hipaa, setHipaa] = useState("")
  const [hipaaTouched, setHipaaTouched] = useState(false)
  const [files, setFiles] = useState<{ id: string; name: string; size: number }[]>(
    []
  )

  // Step 3 — Services
  const [primaryBusiness, setPrimaryBusiness] = useState("")
  const [additionalBusiness, setAdditionalBusiness] = useState("")
  const [programs, setPrograms] = useState<string[]>([])
  const [servicesTouched, setServicesTouched] = useState(false)

  // Step 4 — Invite Team Members
  const [teamRows, setTeamRows] = useState<
    { id: string; email: string; role: string; permission: string }[]
  >([
    { id: "tm-1", email: "", role: "", permission: "" },
    { id: "tm-2", email: "", role: "", permission: "" },
    { id: "tm-3", email: "", role: "", permission: "" },
  ])

  // Step 5 — Invite Workers
  const [workerInput, setWorkerInput] = useState("")
  const [workerEmails, setWorkerEmails] = useState<string[]>([])
  const [workerError, setWorkerError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
    else if (user.onboarded) router.replace("/dashboard")
  }, [user, loading, router])

  if (loading || !user || user.onboarded) {
    return <Splash label="Loading your workspace…" />
  }

  function setField<K extends FieldKey>(key: K, value: OrgDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }))
  }

  function markTouched(key: FieldKey) {
    setTouched((t) => ({ ...t, [key]: true }))
  }

  function errorFor(key: FieldKey): string | null {
    const v = details[key]
    if (key === "legalName" && !v.trim()) return "Legal business name is required"
    if (key === "dba" && !v.trim()) return "DBA is required"
    if (key === "staff" && !v) return "Select your team size"
    if (key === "contactName" && !v.trim()) return "Primary contact name is required"
    if (key === "contactEmail") {
      if (!v.trim()) return "Primary contact email is required"
      if (!EMAIL_RE.test(v.trim())) return "Enter a valid email address"
    }
    if (key === "country" && !v) return "Select a country"
    if (key === "phone") {
      if (!v.trim()) return "Phone number is required"
      const digits = v.replace(/\D/g, "")
      if (digits.length < 7) return "Enter a valid phone number"
    }
    return null
  }

  function show(key: FieldKey) {
    return (touched[key] || submitAttempted) && !!errorFor(key)
  }

  const stepOneValid = REQUIRED_FIELDS.every((k) => !errorFor(k))
  const stepTwoValid = hipaa === "Yes" || hipaa === "No"
  const hipaaError =
    (hipaaTouched || submitAttempted) && !stepTwoValid
      ? "Please confirm your HIPAA compliance status"
      : null

  const stepThreeValid = !!primaryBusiness && !!additionalBusiness
  const primaryError =
    (servicesTouched || submitAttempted) && !primaryBusiness
      ? "Select your primary business type"
      : null
  const additionalError =
    (servicesTouched || submitAttempted) && !additionalBusiness
      ? "Select your additional business type"
      : null

  function toggleProgram(p: string) {
    setPrograms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  function updateTeamRow(
    id: string,
    patch: Partial<{ email: string; role: string; permission: string }>
  ) {
    setTeamRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    )
  }
  function addTeamRow() {
    setTeamRows((rows) => [
      ...rows,
      {
        id: `tm-${rows.length + 1}-${Math.floor(performance.now())}`,
        email: "",
        role: "",
        permission: "",
      },
    ])
  }
  function removeTeamRow(id: string) {
    setTeamRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows))
  }

  function commitWorkerEmails(raw: string) {
    const parts = raw
      .split(/[,\s]+/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (!parts.length) return
    const bad = parts.find((p) => !EMAIL_RE.test(p))
    if (bad) {
      setWorkerError(`“${bad}” is not a valid email`)
      return
    }
    setWorkerError(null)
    setWorkerEmails((prev) => Array.from(new Set([...prev, ...parts])))
    setWorkerInput("")
  }
  function removeWorkerEmail(email: string) {
    setWorkerEmails((prev) => prev.filter((e) => e !== email))
  }

  function addFiles(list: FileList | File[] | null) {
    if (!list) return
    const incoming = Array.from(list)
    setFiles((prev) => [
      ...prev,
      ...incoming.map((f) => ({
        id: `${f.name}-${f.size}-${prev.length}-${Math.floor(performance.now())}`,
        name: f.name,
        size: f.size,
      })),
    ])
  }
  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  async function finish() {
    setSubmitting(true)
    try {
      await completeOnboarding({
        name: details.legalName.trim(),
        type: "other",
        teamSize: details.staff,
        frameworks: [],
      })
      router.replace("/onboarding/done")
    } catch {
      toast.error("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  function next() {
    if (step === 0) {
      setSubmitAttempted(true)
      if (!stepOneValid) {
        toast.error("Please complete all required fields")
        return
      }
    }
    if (step === 1) {
      setHipaaTouched(true)
      setSubmitAttempted(true)
      if (!stepTwoValid) {
        toast.error("HIPAA compliance confirmation is required")
        return
      }
    }
    if (step === 2) {
      setServicesTouched(true)
      setSubmitAttempted(true)
      if (!stepThreeValid) {
        toast.error("Please select your business types")
        return
      }
    }
    if (step === STEPS.length - 1) {
      // Commit any pending worker email before finishing.
      if (workerInput.trim()) commitWorkerEmails(workerInput)
      finish()
    } else {
      setStep((s) => s + 1)
      setSubmitAttempted(false)
    }
  }

  function skipForNow() {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-svh bg-white pb-32">
      <header className="flex items-center justify-between border-b border-[#f3f4f6] px-6 py-3 sm:px-10">
        <span className="grid size-[50px] place-items-center">
          <LogoMark className="size-[30px]" href="/dashboard" />
        </span>
        <button
          onClick={signOut}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </header>

      <div className="mx-auto w-full max-w-[1080px] px-5 pt-10 sm:pt-[60px]">
        <Stepper current={step} />

        <div className="mx-auto mt-12 max-w-[800px] text-center sm:mt-[60px]">
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-[0.01em] text-[#171a1f] sm:text-[34px]">
            {step === 0 && "Tell us about your organization"}
            {step === 1 && "Credentialing & Documentation"}
            {step === 2 && "Help us understand your Services"}
            {step === 3 && "Invite Team Members"}
            {step === 4 && "Invite your Workers/Staffs"}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#757575] sm:text-[17px]">
            {step === 0 &&
              "Tell us about your organization so we can tailor the compliance analysis to your needs."}
            {step === 1 &&
              "Provide key details about your licenses and documentation to ensure accurate assessments."}
            {step === 2 &&
              "Choose the services that reflect the people you service."}
            {step === 3 &&
              "Invite your team members to your organization to manage your learning system."}
            {step === 4 &&
              "Add your team so they can access assigned trainings and complete compliance requirements."}
          </p>
        </div>

        <div className="mt-12 sm:mt-14">
          {step === 0 && (
            <OrgDetailsStep
              details={details}
              setField={setField}
              markTouched={markTouched}
              show={show}
              errorFor={errorFor}
            />
          )}
          {step === 1 && (
            <CredentialingStep
              licenseNumber={licenseNumber}
              onLicenseNumberChange={setLicenseNumber}
              hipaa={hipaa}
              onHipaaChange={(v) => {
                setHipaa(v)
                setHipaaTouched(true)
              }}
              hipaaError={hipaaError}
              files={files}
              onAddFiles={addFiles}
              onRemoveFile={removeFile}
            />
          )}
          {step === 2 && (
            <ServicesStep
              primaryBusiness={primaryBusiness}
              onPrimaryChange={(v) => {
                setPrimaryBusiness(v)
                setServicesTouched(true)
              }}
              additionalBusiness={additionalBusiness}
              onAdditionalChange={(v) => {
                setAdditionalBusiness(v)
                setServicesTouched(true)
              }}
              primaryError={primaryError}
              additionalError={additionalError}
              programs={programs}
              onToggleProgram={toggleProgram}
            />
          )}
          {step === 3 && (
            <InviteTeamStep
              rows={teamRows}
              onUpdate={updateTeamRow}
              onRemove={removeTeamRow}
              onAdd={addTeamRow}
            />
          )}
          {step === 4 && (
            <InviteWorkersStep
              input={workerInput}
              onInputChange={setWorkerInput}
              emails={workerEmails}
              onCommit={commitWorkerEmails}
              onRemove={removeWorkerEmail}
              error={workerError}
            />
          )}
        </div>

        <div className="mt-14 flex items-center justify-between gap-4 sm:mt-16">
          {step === 0 ? (
            <button
              type="button"
              onClick={skipForNow}
              className="h-[56px] rounded-xl border border-[#e5e5e5] bg-white px-9 text-[17px] font-semibold text-primary transition-colors hover:bg-[#f9fafb]"
            >
              Skip for now
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="h-[56px] rounded-xl border border-[#e5e5e5] bg-white px-9 text-[17px] font-semibold text-primary transition-colors hover:bg-[#f9fafb] disabled:opacity-50"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={next}
            disabled={submitting}
            className={cn(
              "inline-flex h-[56px] items-center justify-center gap-2 rounded-xl px-9 text-[17px] font-semibold text-white transition-colors",
              "bg-primary hover:bg-brand-hover",
              "disabled:bg-[#cbd2dc] disabled:hover:bg-[#cbd2dc]"
            )}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting
              ? "Setting up…"
              : step === STEPS.length - 1
                ? "Complete Onboarding"
                : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Stepper ---------- */

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex w-full items-start">
      {STEPS.map((label, i) => {
        const active = i === current
        const done = i < current
        const colored = active || done
        const isLast = i === STEPS.length - 1
        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "grid size-[30px] place-items-center rounded-full text-[13px] font-semibold transition-colors",
                  colored
                    ? "bg-primary text-white"
                    : "border border-[#d0d5dd] text-[#98a2b3]"
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[13px] font-semibold",
                  colored ? "text-primary" : "text-[#98a2b3]"
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mt-[14px] h-[2px] flex-1",
                  done ? "bg-primary" : "bg-[#d0d5dd]"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Step 1: Org details ---------- */

interface StepProps {
  details: OrgDetails
  setField: <K extends FieldKey>(key: K, value: OrgDetails[K]) => void
  markTouched: (key: FieldKey) => void
  show: (key: FieldKey) => boolean
  errorFor: (key: FieldKey) => string | null
}

function OrgDetailsStep({ details, setField, markTouched, show, errorFor }: StepProps) {
  return (
    <div className="flex flex-col gap-[35px]">
      <TextField
        label="Legal Business Name"
        required
        placeholder="e.g. Zenco Healthcare Ltd"
        value={details.legalName}
        onChange={(v) => setField("legalName", v)}
        onBlur={() => markTouched("legalName")}
        error={show("legalName") ? errorFor("legalName") : null}
      />

      <TextField
        label="Doing Business As (DBA)"
        required
        placeholder="Enter business name (if applicable)"
        value={details.dba}
        onChange={(v) => setField("dba", v)}
        onBlur={() => markTouched("dba")}
        error={show("dba") ? errorFor("dba") : null}
      />

      <Row>
        <TextField
          label="Employer Identification Number (EIN)"
          optional
          placeholder="Enter your EIN (if applicable)"
          value={details.ein}
          onChange={(v) => setField("ein", v)}
        />
        <SelectField
          label="Number of Staff"
          required
          placeholder="Select an option"
          options={STAFF_OPTIONS}
          value={details.staff}
          onChange={(v) => {
            setField("staff", v)
            markTouched("staff")
          }}
          error={show("staff") ? errorFor("staff") : null}
        />
      </Row>

      <Row>
        <TextField
          label="Primary Contact Name"
          required
          placeholder="Enter the full name of the main contact"
          value={details.contactName}
          onChange={(v) => setField("contactName", v)}
          onBlur={() => markTouched("contactName")}
          error={show("contactName") ? errorFor("contactName") : null}
        />
        <TextField
          label="Primary Contact Email"
          required
          type="email"
          placeholder="Enter the email address of the main contact"
          value={details.contactEmail}
          onChange={(v) => setField("contactEmail", v)}
          onBlur={() => markTouched("contactEmail")}
          error={show("contactEmail") ? errorFor("contactEmail") : null}
        />
      </Row>

      <Row>
        <SelectField
          label="Country"
          required
          placeholder="Select an option"
          options={COUNTRY_OPTIONS}
          value={details.country}
          onChange={(v) => {
            setField("country", v)
            markTouched("country")
          }}
          error={show("country") ? errorFor("country") : null}
        />
        <PhoneField
          countryCode={details.phoneCountry}
          onCountryChange={(c) => setField("phoneCountry", c)}
          value={details.phone}
          onChange={(v) => setField("phone", v)}
          onBlur={() => markTouched("phone")}
          error={show("phone") ? errorFor("phone") : null}
        />
      </Row>

      <Row>
        <TextField
          label="Street Address"
          optional
          placeholder="Enter business street address"
          value={details.street}
          onChange={(v) => setField("street", v)}
        />
        <TextField
          label="Zip Code"
          optional
          placeholder="e.g. 27601"
          value={details.zip}
          onChange={(v) => setField("zip", v)}
        />
      </Row>

      <Row>
        <SelectField
          label="City"
          optional
          placeholder="Select an option"
          options={CITY_OPTIONS}
          value={details.city}
          onChange={(v) => setField("city", v)}
        />
        <SelectField
          label="State"
          optional
          placeholder="Select an option"
          options={STATE_OPTIONS}
          value={details.state}
          onChange={(v) => setField("state", v)}
        />
      </Row>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[35px] sm:flex-row sm:gap-[26px]">
      {children}
    </div>
  )
}

function FieldLabel({
  label,
  required,
  optional,
}: {
  label: string
  required?: boolean
  optional?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[16px] font-medium text-black sm:text-[18px]">
        {label}
      </span>
      {required && (
        <span className="text-[16px] font-medium text-primary">*</span>
      )}
      {optional && (
        <span className="text-[15px] font-medium text-primary">(optional)</span>
      )}
    </div>
  )
}

function FieldError({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="text-[13px] font-medium text-destructive">{message}</p>
}

function TextField({
  label,
  required,
  optional,
  placeholder,
  value,
  onChange,
  onBlur,
  type = "text",
  error,
}: {
  label: string
  required?: boolean
  optional?: boolean
  placeholder: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  type?: string
  error?: string | null
}) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <FieldLabel label={label} required={required} optional={optional} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          "h-[60px] w-full rounded-[14px] border-[1.5px] bg-white px-[18px] text-[16px] text-foreground outline-none transition-colors placeholder:text-[#8c8c8c]",
          error
            ? "border-destructive focus:border-destructive focus:ring-3 focus:ring-destructive/15"
            : "border-[#e5e7ea] focus:border-primary focus:ring-3 focus:ring-primary/15"
        )}
      />
      <FieldError message={error ?? null} />
    </div>
  )
}

function SelectField({
  label,
  required,
  optional,
  placeholder,
  options,
  value,
  onChange,
  error,
}: {
  label: string
  required?: boolean
  optional?: boolean
  placeholder: string
  options: string[]
  value: string
  onChange: (v: string) => void
  error?: string | null
}) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <FieldLabel label={label} required={required} optional={optional} />
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "!h-[60px] w-full rounded-[14px] border-[1.5px] bg-white px-[18px] text-[16px] data-[placeholder]:text-[#8c8c8c]",
            error ? "border-destructive" : "border-[#e5e7ea]"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError message={error ?? null} />
    </div>
  )
}

function PhoneField({
  countryCode,
  onCountryChange,
  value,
  onChange,
  onBlur,
  error,
}: {
  countryCode: string
  onCountryChange: (code: string) => void
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  error?: string | null
}) {
  const [open, setOpen] = useState(false)
  const popRef = useRef<HTMLDivElement | null>(null)
  const current =
    PHONE_COUNTRIES.find((c) => c.code === countryCode) ?? PHONE_COUNTRIES[0]

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!popRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  return (
    <div className="flex w-full flex-col gap-2.5">
      <FieldLabel label="Phone Number" required />
      <div
        ref={popRef}
        className={cn(
          "relative flex h-[60px] w-full items-center gap-3 rounded-[14px] border-[1.5px] bg-white pl-3 pr-[18px] transition-colors",
          error
            ? "border-destructive focus-within:ring-3 focus-within:ring-destructive/15"
            : "border-[#e5e7ea] focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-[44px] items-center gap-2 rounded-lg border-r border-[#e5e7ea] pr-3 text-left transition-colors hover:bg-[#f9fafb]"
        >
          <span aria-hidden className="text-[22px] leading-none">
            {current.flag}
          </span>
          <span className="text-[14px] font-medium text-[#475367]">
            {current.dial}
          </span>
          <ChevronDown className="size-3.5 text-[#8c8c8c]" />
        </button>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Enter the phone number of the main contact"
          className="h-full flex-1 bg-transparent text-[16px] text-foreground outline-none placeholder:text-[#8c8c8c]"
        />
        {open && (
          <div className="absolute left-0 top-[68px] z-20 w-[260px] overflow-hidden rounded-xl border border-[#e5e7ea] bg-white shadow-lg">
            {PHONE_COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onCountryChange(c.code)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#f9fafb]",
                  c.code === current.code && "bg-[#f3f4f6]"
                )}
              >
                <span aria-hidden className="text-[20px] leading-none">
                  {c.flag}
                </span>
                <span className="flex-1 text-[14px] font-medium text-[#101928]">
                  {c.label}
                </span>
                <span className="text-[13px] text-[#667085]">{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <FieldError message={error ?? null} />
    </div>
  )
}

/* ---------- Step 2: Credentialing ---------- */

function CredentialingStep({
  licenseNumber,
  onLicenseNumberChange,
  hipaa,
  onHipaaChange,
  hipaaError,
  files,
  onAddFiles,
  onRemoveFile,
}: {
  licenseNumber: string
  onLicenseNumberChange: (v: string) => void
  hipaa: string
  onHipaaChange: (v: string) => void
  hipaaError: string | null
  files: { id: string; name: string; size: number }[]
  onAddFiles: (list: FileList | File[] | null) => void
  onRemoveFile: (id: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="flex flex-col gap-[35px]">
      <Row>
        <TextField
          label="State Healthcare License Number"
          optional
          placeholder="Enter your official license number"
          value={licenseNumber}
          onChange={onLicenseNumberChange}
        />
        <SelectField
          label="HIPAA Compliance Confirmation"
          required
          placeholder="Select an option"
          options={HIPAA_OPTIONS}
          value={hipaa}
          onChange={onHipaaChange}
          error={hipaaError}
        />
      </Row>

      <div className="flex flex-col gap-4">
        <FieldLabel label="Upload your compliance certifications" optional />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            onAddFiles(e.target.files)
            e.target.value = ""
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            onAddFiles(e.dataTransfer.files)
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-6 rounded-[16px] px-8 py-10 text-center transition-colors",
            dragOver
              ? "border-[1.5px] border-solid border-[#0123d0] bg-[#f0f2fd]"
              : "border-[1.5px] border-dashed border-[#dbdbdb] bg-white hover:bg-[#fafbff]"
          )}
        >
          <span
            className={cn(
              "grid size-10 place-items-center rounded-lg",
              dragOver ? "text-[#0123d0]" : "text-[#475367]"
            )}
          >
            <FolderUp className="size-9" />
          </span>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[17px] sm:text-[18px]">
              <span className="text-[#11181c]">Drop your files here or</span>
              <span className="font-semibold text-primary underline underline-offset-2">
                Click to upload
              </span>
            </div>
            <p className="text-[15px] text-[#64696b] sm:text-[16px]">
              PDF, DOCX, JPG, PNG. You may upload multiple files.
            </p>
          </div>
        </button>

        {files.length > 0 && (
          <div className="flex flex-col gap-4">
            {files.map((f) => (
              <UploadedFile
                key={f.id}
                name={f.name}
                size={f.size}
                onRemove={() => onRemoveFile(f.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function fileExt(name: string): "pdf" | "docx" | "jpg" | "png" | "other" {
  const lower = name.toLowerCase()
  if (lower.endsWith(".pdf")) return "pdf"
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "docx"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpg"
  if (lower.endsWith(".png")) return "png"
  return "other"
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function UploadedFile({
  name,
  size,
  onRemove,
}: {
  name: string
  size: number
  onRemove: () => void
}) {
  const ext = fileExt(name)
  const badgeColor =
    ext === "pdf"
      ? "bg-[#d92d20]"
      : ext === "docx"
        ? "bg-[#155eef]"
        : "bg-[#475367]"
  const badgeLabel = ext === "other" ? "FILE" : ext.toUpperCase()
  return (
    <div className="flex items-center justify-between gap-4 rounded-[14px] border-[1.5px] border-[#e2e2e2] bg-white px-5 py-4 sm:px-6 sm:py-[18px]">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="truncate text-[15px] font-semibold text-[#101010] sm:text-[16px]">
          {name}
        </p>
        <div className="flex items-center gap-2">
          <span className="relative grid size-6 place-items-center rounded bg-[#e5e7ea]">
            <span
              className={cn(
                "absolute bottom-0.5 left-0.5 rounded px-1 py-px text-[7px] font-bold leading-none text-white",
                badgeColor
              )}
            >
              {badgeLabel}
            </span>
          </span>
          <span className="text-[14px] text-[#727272] sm:text-[15px]">
            {formatBytes(size)}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="grid size-[52px] shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#3759f1] to-[#2d4ddd] text-white shadow-[inset_2px_0px_8px_2px_rgba(76,107,247,0.2)] transition-opacity hover:opacity-90"
      >
        <Trash2 className="size-5" />
      </button>
    </div>
  )
}

/* ---------- Step 3: Services ---------- */

function ServicesStep({
  primaryBusiness,
  onPrimaryChange,
  additionalBusiness,
  onAdditionalChange,
  primaryError,
  additionalError,
  programs,
  onToggleProgram,
}: {
  primaryBusiness: string
  onPrimaryChange: (v: string) => void
  additionalBusiness: string
  onAdditionalChange: (v: string) => void
  primaryError: string | null
  additionalError: string | null
  programs: string[]
  onToggleProgram: (p: string) => void
}) {
  // Two columns of program checkboxes, balanced.
  const mid = Math.ceil(PROGRAM_SERVICES.length / 2)
  const col1 = PROGRAM_SERVICES.slice(0, mid)
  const col2 = PROGRAM_SERVICES.slice(mid)

  return (
    <div className="flex flex-col gap-[28px]">
      <Row>
        <SelectField
          label="Primary Business Type"
          required
          placeholder="Select an option"
          options={PRIMARY_BUSINESS_TYPES}
          value={primaryBusiness}
          onChange={onPrimaryChange}
          error={primaryError}
        />
        <SelectField
          label="Additional Business Type"
          required
          placeholder="Select an option"
          options={ADDITIONAL_BUSINESS_TYPES}
          value={additionalBusiness}
          onChange={onAdditionalChange}
          error={additionalError}
        />
      </Row>

      <div className="flex flex-col gap-7 pt-2">
        <FieldLabel label="Program Services" />
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 px-1 sm:grid-cols-2 sm:px-6">
          {[col1, col2].map((col, i) => (
            <div key={i} className="flex flex-col gap-8">
              {col.map((p) => (
                <CheckboxOption
                  key={p}
                  label={p}
                  checked={programs.includes(p)}
                  onToggle={() => onToggleProgram(p)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CheckboxOption({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-4 text-left"
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-[4px] transition-colors",
          checked
            ? "bg-primary text-white"
            : "border-[1.74px] border-[#d4d4d4] bg-white"
        )}
      >
        {checked && <Check className="size-4" strokeWidth={3} />}
      </span>
      <span className="text-[17px] font-medium text-[#262626] sm:text-[19px]">
        {label}
      </span>
    </button>
  )
}

/* ---------- Step 4: Invite team members ---------- */

function InviteTeamStep({
  rows,
  onUpdate,
  onRemove,
  onAdd,
}: {
  rows: { id: string; email: string; role: string; permission: string }[]
  onUpdate: (
    id: string,
    patch: Partial<{ email: string; role: string; permission: string }>
  ) => void
  onRemove: (id: string) => void
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-[54px]">
        {rows.map((row, i) => (
          <TeamMemberRow
            key={row.id}
            row={row}
            showLabels={i === 0}
            showRemove={rows.length > 1}
            onUpdate={(patch) => onUpdate(row.id, patch)}
            onRemove={() => onRemove(row.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex w-fit items-center gap-2 rounded-full px-2 py-2 text-[16px] font-semibold text-primary transition-colors hover:bg-[#f3f4ff]"
      >
        <PlusCircle className="size-5" /> Add team member
      </button>
    </div>
  )
}

function TeamMemberRow({
  row,
  showLabels,
  showRemove,
  onUpdate,
  onRemove,
}: {
  row: { id: string; email: string; role: string; permission: string }
  showLabels: boolean
  showRemove: boolean
  onUpdate: (
    patch: Partial<{ email: string; role: string; permission: string }>
  ) => void
  onRemove: () => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
      {/* Email */}
      <div className="flex flex-1 flex-col gap-3">
        {showLabels && (
          <span className="text-[16px] font-medium text-[#131927] sm:text-[18px]">
            Email
          </span>
        )}
        <div className="flex h-[56px] w-full items-center gap-3 rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-[18px] focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
          <MailIcon />
          <input
            type="email"
            value={row.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="Enter team member's email"
            className="h-full flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#9ea2ae] sm:text-[16px]"
          />
        </div>
      </div>

      {/* Role */}
      <div className="flex flex-1 flex-col gap-3">
        {showLabels && (
          <span className="text-[16px] font-medium text-[#131927] sm:text-[18px]">
            Roles
          </span>
        )}
        <Select
          value={row.role || undefined}
          onValueChange={(v) => onUpdate({ role: v })}
        >
          <SelectTrigger className="!h-[56px] w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-[18px] text-[16px] data-[placeholder]:text-[#8c8c8c]">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {TEAM_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permissions */}
      <div className="flex flex-1 flex-col gap-3">
        {showLabels && (
          <span className="text-[16px] font-medium text-[#131927] sm:text-[18px]">
            Permissions
          </span>
        )}
        <Select
          value={row.permission || undefined}
          onValueChange={(v) => onUpdate({ permission: v })}
        >
          <SelectTrigger className="!h-[56px] w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-[18px] text-[16px] data-[placeholder]:text-[#8c8c8c]">
            <SelectValue placeholder="Permissions" />
          </SelectTrigger>
          <SelectContent>
            {TEAM_PERMISSIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove row"
          className={cn(
            "grid size-[56px] shrink-0 place-items-center rounded-[12px] text-[#98a2b3] transition-colors hover:bg-[#f9fafb] hover:text-destructive",
            showLabels && "sm:self-end"
          )}
        >
          <Trash2 className="size-5" />
        </button>
      )}
    </div>
  )
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0 text-[#9ea2ae]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

/* ---------- Step 5: Invite workers ---------- */

function InviteWorkersStep({
  input,
  onInputChange,
  emails,
  onCommit,
  onRemove,
  error,
}: {
  input: string
  onInputChange: (v: string) => void
  emails: string[]
  onCommit: (raw: string) => void
  onRemove: (email: string) => void
  error: string | null
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function downloadTemplate() {
    const blob = new Blob(["email\nfirst.worker@example.com\n"], {
      type: "text/csv",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "theraptly-workers-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCsv(file: File) {
    const text = await file.text()
    const candidates = text
      .split(/[\n,;\r]+/)
      .map((s) => s.trim())
      .filter((s) => EMAIL_RE.test(s))
    if (!candidates.length) {
      toast.error("No valid emails found in that file")
      return
    }
    onCommit(candidates.join(","))
    toast.success(`Imported ${candidates.length} email(s)`)
  }

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex min-h-[56px] w-full flex-wrap items-center gap-2 rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-4 py-3 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
          {emails.map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f4ff] py-1.5 pl-3 pr-1.5 text-[14px] font-medium text-primary"
            >
              {e}
              <button
                type="button"
                aria-label={`Remove ${e}`}
                onClick={() => onRemove(e)}
                className="grid size-5 place-items-center rounded-full transition-colors hover:bg-primary/10"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onBlur={() => input.trim() && onCommit(input)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                onCommit(input)
              } else if (
                e.key === "Backspace" &&
                !input &&
                emails.length > 0
              ) {
                onRemove(emails[emails.length - 1])
              }
            }}
            placeholder={
              emails.length
                ? ""
                : "Add emails separated with commas to invite"
            }
            className="min-w-[200px] flex-1 bg-transparent py-1 text-[15px] text-foreground outline-none placeholder:text-[#979797] sm:text-[16px]"
          />
        </div>
        {error && (
          <p className="text-[13px] font-medium text-destructive">{error}</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleCsv(file)
          e.target.value = ""
        }}
      />

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-[15px] font-semibold text-primary transition-colors hover:bg-[#f3f4ff] sm:text-[16px]"
        >
          <PlusCircle className="size-5" /> Import with .csv file instead
        </button>
        <span className="h-5 w-px bg-[#e5e7ea]" />
        <button
          type="button"
          onClick={downloadTemplate}
          className="rounded-full px-2 py-2 text-[15px] font-semibold text-primary transition-colors hover:bg-[#f3f4ff] sm:text-[16px]"
        >
          Download sample .csv template
        </button>
      </div>
    </div>
  )
}
