"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CloudUpload,
  FileText,
  Loader2,
  Maximize2,
  Menu,
  Minimize2,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  COURSE_LECTURES,
  COURSE_MODULES,
  COURSE_QUIZ,
  COURSE_SLIDES,
  COURSE_SOURCE_DOC,
  NOTE_CITATIONS,
  NOTE_TAKEAWAYS,
  type QuizQuestion,
} from "@/lib/course-content"
import { useAuth } from "@/lib/auth/auth-context"
import { appendCourse } from "@/lib/client-store"
import { readPending, writePending } from "@/lib/pending-course"
import { DatePicker } from "@/components/courses/date-picker"
import { ResultModal } from "@/components/courses/result-modal"
import { TimePicker } from "@/components/courses/time-picker"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TOTAL_STEPS = 8
const GENERATION_MS = 90_000

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "new-course"
  )
}

const CUSTOM = "Others (Custom)"

const CATEGORIES = [
  "Organization-Wide Policies",
  "Health, Safety, and Prevention",
  "General Clinical / Service-Delivery",
  "Core Treatment Program Standards",
  "Core Support Program Standards",
  "Specific Population Designations",
  "CCBHC Add-Ons",
  "Suicide Prevention",
  "Orientation-Specific Trainings",
  "Crisis Programs/Contact Centers",
  "Detoxification/Withdrawal Management",
  "Office-Based Opioid Treatment",
  "Court Treatment Programs",
  "Health Home Programs",
  CUSTOM,
]

type PhiStatus = "analyzing" | "clean" | "warning"

interface UploadedDoc {
  id: string
  name: string
  size: number
  ext: "pdf" | "docx" | "other"
  phi: PhiStatus
}

const PHI_KEYWORDS = ["patient", "phi", "medical", "client", "record", "diagnos"]

const ROLE_CUSTOM = "Others (Custom)"
const ROLES = [
  "Clinician",
  "Nurse",
  "Case Manager",
  "Peer Support Specialist",
  "Admin / Front Desk",
  "Billing / Finance",
  "HR",
  "Compliance / Quality",
  ROLE_CUSTOM,
]
const ROLES_SELECT_ALL = ROLES.filter((r) => r !== ROLE_CUSTOM)

const CONTENT_TYPES = ["Notes & Slides", "Notes only", "Slides only"]
const NOTE_COUNT_OPTIONS = ["5", "8", "10", "12", "15", "20"]

const DIFFICULTY_OPTIONS = ["Easy", "Moderate", "Hard"]
const QUESTION_TYPES = [
  "Multiple Choice",
  "True / False",
  "Short Answer",
  "Mixed",
]
const QUIZ_DURATIONS = ["~5 mins", "~10 mins", "~15 mins", "~20 mins", "~30 mins"]

/**
 * Placeholder document-analysis result. When the upload pipeline ships,
 * replace this with a real call that reads from the uploaded docs and
 * returns the inferred fields.
 */
interface CourseAnalysis {
  title: string
  description: string
  detectedCategory: string
  contentType: string
  notesCount: string
  deadlineDays: number
  objectives: string[]
}

interface QuizConfig {
  title: string
  questionCount: number
  difficulty: string
  questionType: string
  duration: string
  passMark: number
  attempts: number
}

function buildQuizFromAnalysis(a: CourseAnalysis): QuizConfig {
  return {
    title: `${a.title.replace(/Training$/i, "").trim()} Quiz`,
    questionCount: 15,
    difficulty: "Moderate",
    questionType: "Multiple Choice",
    duration: "~15 mins",
    passMark: 80,
    attempts: 2,
  }
}

function buildAnalysisFromDocs(_docs: UploadedDoc[]): CourseAnalysis {
  return {
    title: "HIPAA Privacy and Security Training",
    description:
      "This course provides essential training on the HIPAA Privacy and Security Rules, helping healthcare professionals understand how to safeguard Protected Health Information (PHI). Participants will learn best practices for handling patient data, preventing security breaches, and maintaining full compliance with federal and state regulations.",
    detectedCategory: "Cybersecurity and Technology",
    contentType: "Notes & Slides",
    notesCount: "12",
    deadlineDays: 30,
    objectives: [
      "To train staff on HIPAA compliance in behavioral health.",
      "Learn how to handle PHI securely",
      "Understand HIPAA privacy rules",
    ],
  }
}

function fileExt(name: string): UploadedDoc["ext"] {
  const lower = name.toLowerCase()
  if (lower.endsWith(".pdf")) return "pdf"
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "docx"
  return "other"
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function NewCoursePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const adminName = user?.fullName || user?.email || ""
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // Step 2 — uploads
  const [docs, setDocs] = useState<UploadedDoc[]>([])

  // Step 3 — audience
  const [audience, setAudience] = useState<"general" | "specific" | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [customRole, setCustomRole] = useState("")

  // Step 4 — course details. Defaults arrive from a document-analysis call when
  // we enter the step; users can then edit anything.
  const [details, setDetails] = useState<CourseAnalysis | null>(null)
  const [step4Touched, setStep4Touched] = useState(false)

  // Step 5 — quiz. Seeded from the details when we first enter the step.
  const [quiz, setQuiz] = useState<QuizConfig | null>(null)
  const [step5Touched, setStep5Touched] = useState(false)

  // Step 8 — Assigning & Publish
  const [assignInput, setAssignInput] = useState("")
  const [assignees, setAssignees] = useState<string[]>([])
  const [deadlineEnabled, setDeadlineEnabled] = useState(true)
  const [dueDate, setDueDate] = useState("")
  const [dueTime, setDueTime] = useState("")
  const [reminders, setReminders] = useState<string[]>(["30 minutes before"])

  // Confirm Course Review attestation + result
  const [attestOpen, setAttestOpen] = useState(false)
  const [publishStatus, setPublishStatus] = useState<
    "idle" | "publishing" | "success" | "error"
  >("idle")

  // Deep-link support — the dashboard "View" banner and the step 6 CTA both
  // route here with ?step=7 to drop the user into the review screen. When
  // we land that way we hydrate enough state from the pending-course store
  // so the review screen has the right title/slug.
  useEffect(() => {
    const target = Number(searchParams.get("step") || "")
    if (!target || target < 1 || target > TOTAL_STEPS) return
    const pending = readPending()
    if (target >= 4 && pending && !details) {
      const seed: CourseAnalysis = {
        ...buildAnalysisFromDocs([]),
        title: pending.title,
      }
      setDetails(seed)
      if (target >= 5 && !quiz) setQuiz(buildQuizFromAnalysis(seed))
    }
    setStep(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isCustom = category === CUSTOM
  const stepOneValid =
    isCustom ? customCategory.trim().length > 0 : category.trim().length > 0
  const categoryError =
    submitAttempted && !stepOneValid
      ? isCustom
        ? "Enter a custom category to continue"
        : "Select a category to continue"
      : null

  function next() {
    if (step === 1) {
      setSubmitAttempted(true)
      if (!stepOneValid) {
        toast.error(
          isCustom
            ? "Please enter your custom category"
            : "Please select a category"
        )
        return
      }
    }
    if (step === 2) {
      if (docs.length === 0) {
        toast.error("Upload at least one document")
        return
      }
      if (docs.some((d) => d.phi === "analyzing")) {
        toast.error("Please wait while we analyze your documents")
        return
      }
    }
    if (step === 3) {
      if (!audience) {
        toast.error("Choose who this course is for")
        return
      }
      if (audience === "specific") {
        if (roles.length === 0) {
          toast.error("Select at least one role")
          return
        }
        if (roles.includes(ROLE_CUSTOM) && !customRole.trim()) {
          toast.error("Enter your custom role")
          return
        }
      }
      // Entering step 4 — seed details from the document analysis if we
      // haven't done so yet (so going back/forward keeps user edits).
      const chosenCategory =
        category === CUSTOM ? customCategory.trim() : category
      if (!details) {
        setDetails({
          ...buildAnalysisFromDocs(docs),
          detectedCategory: chosenCategory,
        })
      } else if (details.detectedCategory !== chosenCategory) {
        // Step 1 changed since we last seeded — keep user's other edits but
        // re-sync the category from their actual selection.
        setDetails({ ...details, detectedCategory: chosenCategory })
      }
    }
    if (step === 4) {
      setStep4Touched(true)
      if (!details) return
      if (!details.title.trim()) {
        toast.error("Course title is required")
        return
      }
      if (!details.description.trim()) {
        toast.error("Short description is required")
        return
      }
      if (details.deadlineDays <= 0) {
        toast.error("Deadline must be at least 1 day")
        return
      }
      if (details.objectives.filter((o) => o.trim()).length === 0) {
        toast.error("Add at least one learning objective")
        return
      }
      // Seed the quiz from the course details on first transition into step 5.
      if (!quiz && details) {
        setQuiz(buildQuizFromAnalysis(details))
      }
    }
    if (step === 5) {
      setStep5Touched(true)
      if (!quiz) return
      if (!quiz.title.trim()) {
        toast.error("Quiz title is required")
        return
      }
      if (quiz.questionCount <= 0) {
        toast.error("Quiz needs at least one question")
        return
      }
      if (quiz.passMark < 1 || quiz.passMark > 100) {
        toast.error("Pass mark must be between 1 and 100")
        return
      }
      if (quiz.attempts <= 0) {
        toast.error("Attempts must be at least 1")
        return
      }
      // Kick off the simulated background generation when we cross into step 6.
      if (details) {
        writePending({
          id: slugify(details.title),
          title: details.title,
          startedAt: Date.now(),
          durationMs: GENERATION_MS,
        })
      }
    }
    // Step 8 — the Next/Publish button opens the attestation modal instead of
    // immediately advancing. The wizard advances after the user confirms.
    if (step === 8) {
      setAttestOpen(true)
      return
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
      setSubmitAttempted(false)
    }
  }

  async function publishCourse() {
    setAttestOpen(false)
    setPublishStatus("publishing")
    // Simulate a publish — `?result=error` in the URL forces the error path,
    // so the modal can be previewed without rolling the dice.
    const forceError = searchParams.get("result") === "error"
    await new Promise((r) => window.setTimeout(r, 900))
    if (!forceError && details) {
      // Persist the new course so it shows up in /courses, /dashboard, etc.
      // The shape mirrors the existing `Course` seed type — when the backend
      // lands this becomes a server action and the same fields get returned.
      const today = new Date()
      const date = today.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      const slug = slugify(details.title)
      appendCourse({
        id: slug,
        name: details.title,
        type: details.detectedCategory || "General",
        assigned: assignees.length,
        completion: "0%",
        date,
        status: "Active",
      })
      // Surface a "Course published" notification on the dashboard until the
      // user dismisses it. Same store as the in-flight tracker, different
      // status — banner picks which UI to render off `published`.
      writePending({
        id: slug,
        title: details.title,
        startedAt: Date.now(),
        durationMs: 0,
        published: true,
      })
    }
    setPublishStatus(forceError ? "error" : "success")
  }
  function back() {
    if (step > 1) setStep((s) => s - 1)
  }

  function addDocuments(list: FileList | File[] | null) {
    if (!list) return
    const incoming = Array.from(list)
    if (!incoming.length) return
    const seeds: UploadedDoc[] = incoming.map((f) => ({
      id: `doc-${f.name}-${f.size}-${Math.floor(performance.now())}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      name: f.name,
      size: f.size,
      ext: fileExt(f.name),
      phi: "analyzing",
    }))
    setDocs((prev) => [...prev, ...seeds])

    // Simulate PHI analysis — flag docs with PHI-related keywords as warning.
    seeds.forEach((d) => {
      const flagged = PHI_KEYWORDS.some((k) =>
        d.name.toLowerCase().includes(k)
      )
      window.setTimeout(() => {
        setDocs((prev) =>
          prev.map((x) =>
            x.id === d.id ? { ...x, phi: flagged ? "warning" : "clean" } : x
          )
        )
      }, 1500)
    })
  }

  function removeDoc(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  function toggleRole(role: string) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
    if (role === ROLE_CUSTOM && roles.includes(ROLE_CUSTOM)) {
      setCustomRole("")
    }
  }
  function updateDetails<K extends keyof CourseAnalysis>(
    key: K,
    value: CourseAnalysis[K]
  ) {
    setDetails((d) => (d ? { ...d, [key]: value } : d))
  }
  function updateObjective(i: number, value: string) {
    setDetails((d) => {
      if (!d) return d
      const next = [...d.objectives]
      next[i] = value
      return { ...d, objectives: next }
    })
  }
  function addObjective() {
    setDetails((d) =>
      d ? { ...d, objectives: [...d.objectives, ""] } : d
    )
  }
  function updateQuiz<K extends keyof QuizConfig>(key: K, value: QuizConfig[K]) {
    setQuiz((q) => (q ? { ...q, [key]: value } : q))
  }

  function removeObjective(i: number) {
    setDetails((d) =>
      d
        ? {
            ...d,
            objectives: d.objectives.filter((_, idx) => idx !== i),
          }
        : d
    )
  }

  function toggleSelectAll() {
    const allSelected = ROLES_SELECT_ALL.every((r) => roles.includes(r))
    if (allSelected) {
      setRoles((prev) => prev.filter((r) => !ROLES_SELECT_ALL.includes(r)))
    } else {
      setRoles((prev) => Array.from(new Set([...prev, ...ROLES_SELECT_ALL])))
    }
  }

  function commitAssignees(raw: string) {
    const parts = raw
      .split(/[,\s]+/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (!parts.length) return
    setAssignees((prev) => Array.from(new Set([...prev, ...parts])))
    setAssignInput("")
  }
  function removeAssignee(value: string) {
    setAssignees((prev) => prev.filter((a) => a !== value))
  }
  function addReminder() {
    setReminders((prev) => [...prev, "1 hour before"])
  }
  function updateReminder(index: number, value: string) {
    setReminders((prev) => prev.map((r, i) => (i === index ? value : r)))
  }
  function removeReminder(index: number) {
    setReminders((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex min-h-svh flex-col bg-white">
      {/* Top bar */}
      <header className="flex shrink-0 items-stretch">
        <div className="flex w-[200px] shrink-0 items-center border-b border-r border-black/10 px-5 py-4">
          <Logo href="/dashboard" />
        </div>
        <div className="flex flex-1 items-center justify-between gap-6 border-b border-black/10 px-5 py-4 sm:px-8">
          <p className="font-inter-tight text-[14px] font-medium text-[#3e3e3e] sm:text-[15px]">
            Step {step} of {TOTAL_STEPS}
          </p>
          <button
            type="button"
            onClick={() => router.push("/courses")}
            className="font-inter-tight text-[15px] font-bold text-[#0d0d12] hover:text-primary sm:text-[16px]"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Progress strip */}
      <div className="relative h-1.5 w-full bg-[#dbdbdb]">
        <div
          className="absolute inset-y-0 left-0 rounded-r-full bg-primary transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Body */}
      <main className="flex flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14">
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col",
            step === 7
              ? "max-w-[1400px]"
              : step === 3 || step === 4 || step === 5 || step === 8
                ? "max-w-[1024px]"
                : "max-w-[640px]"
          )}
        >
          {/* Title */}
          <div className="px-2 text-center">
            <h1 className="font-display text-[22px] font-bold leading-snug tracking-tight text-[#383838] sm:text-[26px] md:text-[28px] md:leading-[38px]">
              {step === 1 && "What category best fits the course you're creating?"}
              {step === 2 && "Upload Training Documents"}
              {step === 3 && "Who is this course for?"}
              {step === 4 && "Course Details"}
              {step === 5 && "Course Quiz"}
              {step === 6 && "Your course is being created…"}
              {step === 7 && "Review your course"}
              {step === 8 && "Assigning & Publish"}
              {step > 8 && `Step ${step}`}
            </h1>
            {step === 2 && (
              <p className="font-inter mx-auto mt-3 max-w-[520px] text-[14px] font-medium text-[#424242] sm:text-[15px]">
                Upload your policy or compliance documents. We will analyze them
                and convert them into courses and quizzes automatically.
              </p>
            )}
            {step === 3 && (
              <p className="font-inter mx-auto mt-3 max-w-[560px] text-[14px] font-medium text-[#424242] sm:text-[15px]">
                Training will be automatically assigned to staff based on your
                selection here.
              </p>
            )}
            {step === 4 && (
              <p className="font-inter mx-auto mt-3 max-w-[680px] text-[14px] font-medium text-[#424242] sm:text-[15px]">
                We pre-filled these from your uploaded document. Tweak anything
                you&apos;d like before publishing.
              </p>
            )}
            {step === 5 && (
              <p className="font-inter mx-auto mt-3 max-w-[680px] text-[14px] font-medium text-[#424242] sm:text-[15px]">
                Configure how the quiz will assess your learners. Defaults are
                generated from your course content.
              </p>
            )}
            {step === 6 && (
              <p className="font-inter mx-auto mt-3 max-w-[620px] text-[14px] font-medium text-[#424242] sm:text-[15px]">
                We&apos;re reviewing your document to create the course.
                <br />
                You&apos;ll receive an email notification once the course is
                complete and ready for review.
              </p>
            )}
            {step === 7 && (
              <p className="font-inter mx-auto mt-3 max-w-[680px] text-[14px] font-medium text-[#424242] sm:text-[15px]">
                Have a look through the notes, slides, and quiz we generated.
                The learner experience uses the exact same content.
              </p>
            )}
            {step === 8 && (
              <p className="font-inter mx-auto mt-3 max-w-[620px] text-[14px] font-medium text-[#424242] sm:text-[15px]">
                Select which staff should take this course, set deadlines, and
                finalize publishing.
              </p>
            )}
          </div>

          {/* Step content */}
          <div className="mt-10 flex-1 px-1 sm:mt-12 sm:px-6">
            {step === 1 && (
              <div className="flex flex-col gap-2.5">
                <FieldLabel label="Category" required />
                <Select
                  value={category || undefined}
                  onValueChange={(raw) => {
                    const v = raw ?? ""
                    setCategory(v)
                    if (v !== CUSTOM) setCustomCategory("")
                    setSubmitAttempted(false)
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "!h-12 w-full rounded-[12px] border-[1.5px] bg-white px-5 text-[15px] data-[placeholder]:text-[#979797]",
                      categoryError ? "border-destructive" : "border-[#e5e7ea]"
                    )}
                  >
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[320px]">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-[14px]">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isCustom && (
                  <input
                    autoFocus
                    type="text"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value)
                      setSubmitAttempted(false)
                    }}
                    placeholder="Enter your custom category"
                    className={cn(
                      "mt-2 h-12 w-full rounded-[12px] border-[1.5px] bg-white px-5 text-[15px] outline-none transition-colors placeholder:text-[#979797] focus:ring-3 focus:ring-primary/15",
                      categoryError
                        ? "border-destructive focus:border-destructive"
                        : "border-[#e5e7ea] focus:border-primary"
                    )}
                  />
                )}

                {categoryError && (
                  <p className="text-[12px] font-medium text-destructive">
                    {categoryError}
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <UploadStep
                docs={docs}
                onAdd={addDocuments}
                onRemove={removeDoc}
              />
            )}

            {step === 3 && (
              <AudienceStep
                audience={audience}
                onAudienceChange={setAudience}
                roles={roles}
                onToggleRole={toggleRole}
                onSelectAll={toggleSelectAll}
                customRole={customRole}
                onCustomRoleChange={setCustomRole}
              />
            )}

            {step === 4 && details && (
              <CourseDetailsStep
                details={details}
                onUpdate={updateDetails}
                onUpdateObjective={updateObjective}
                onAddObjective={addObjective}
                onRemoveObjective={removeObjective}
                showErrors={step4Touched}
              />
            )}

            {step === 5 && quiz && (
              <CourseQuizStep
                quiz={quiz}
                onUpdate={updateQuiz}
                showErrors={step5Touched}
              />
            )}

            {step === 6 && (
              <GeneratingStep
                onReview={() => setStep(7)}
              />
            )}

            {step === 7 && (
              <ReviewCourseStep
                title={details?.title ?? "Your course"}
              />
            )}

            {step === 8 && (
              <AssignPublishStep
                assignInput={assignInput}
                onAssignInputChange={setAssignInput}
                assignees={assignees}
                onAddAssignees={commitAssignees}
                onRemoveAssignee={removeAssignee}
                deadlineEnabled={deadlineEnabled}
                onToggleDeadline={setDeadlineEnabled}
                dueDate={dueDate}
                onDueDateChange={setDueDate}
                dueTime={dueTime}
                onDueTimeChange={setDueTime}
                reminders={reminders}
                onAddReminder={addReminder}
                onUpdateReminder={updateReminder}
                onRemoveReminder={removeReminder}
              />
            )}

            {step > 8 && (
              <div className="rounded-2xl border border-dashed border-[#e5e7ea] bg-[#fafafb] py-16 text-center">
                <p className="text-[15px] font-semibold text-[#475467]">
                  Step {step} content coming next
                </p>
                <p className="mt-2 text-[13px] text-[#98a2b3]">
                  Share the next Figma node and I&apos;ll wire it up.
                </p>
              </div>
            )}
          </div>

          {/* Buttons (step 6 renders its own CTAs inside GeneratingStep) */}
          {step !== 6 && (
            <div className="mt-10 flex items-center justify-between gap-3 sm:mt-12">
              <button
                type="button"
                onClick={back}
                disabled={step === 1}
                className="h-12 rounded-[12px] border-[1.3px] border-[#d2d5db] bg-white px-8 text-[15px] font-semibold text-[#454353] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={next}
                className="h-12 rounded-[12px] bg-primary px-8 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                {step === 8
                  ? "Publish Course"
                  : step === TOTAL_STEPS
                    ? "Finish"
                    : "Next"}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Confirm Course Review attestation modal */}
      <ConfirmReviewModal
        open={attestOpen}
        onClose={() => setAttestOpen(false)}
        courseTitle={details?.title ?? "this course"}
        defaultReviewer={adminName}
        onConfirm={publishCourse}
        loading={publishStatus === "publishing"}
      />

      {/* Result modal after publishing */}
      <ResultModal
        open={publishStatus === "success"}
        status="success"
        title="Course Published"
        description="You have successfully created a new course. You can assign it to your team now, or manage it later from the training dashboard."
        primaryLabel="Assign to Workers"
        onPrimary={() => {
          const slug = details ? slugify(details.title) : "new-course"
          router.push(`/courses/${slug}/preview`)
        }}
        secondaryLabel="Go to Dashboard"
        onSecondary={() => router.push("/dashboard")}
      />
      <ResultModal
        open={publishStatus === "error"}
        status="error"
        title="Couldn't publish course"
        description="Something went wrong while publishing. Please check your details and try again, or contact support if it persists."
        primaryLabel="Try again"
        onPrimary={() => setPublishStatus("idle")}
        secondaryLabel="Go to Dashboard"
        onSecondary={() => router.push("/dashboard")}
      />
    </div>
  )
}

function FieldLabel({
  label,
  required,
}: {
  label: string
  required?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[14px] font-medium text-black sm:text-[15px]">
        {label}
      </span>
      {required && (
        <span className="text-[14px] font-medium text-primary">*</span>
      )}
    </div>
  )
}

/* ---------- Step 2: Upload Training Documents ---------- */

function UploadStep({
  docs,
  onAdd,
  onRemove,
}: {
  docs: UploadedDoc[]
  onAdd: (list: FileList | File[] | null) => void
  onRemove: (id: string) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files)
          e.target.value = ""
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          onAdd(e.dataTransfer.files)
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-5 rounded-[16px] px-6 py-12 text-center transition-colors",
          dragOver
            ? "border-[1.5px] border-solid border-primary bg-[#f3f4ff]"
            : "border border-dashed border-[#dbdbdb] bg-[#fcfcfc] hover:bg-[#fafbff]"
        )}
      >
        <span
          className={cn(
            "grid size-[52px] place-items-center",
            dragOver ? "text-primary" : "text-[#475367]"
          )}
        >
          <CloudUpload className="size-12" strokeWidth={1.6} />
        </span>
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[15px] sm:text-[16px]">
            <span className="text-[#11181c]">Drop your files here or</span>
            <span className="font-semibold text-primary underline underline-offset-2">
              Click to upload
            </span>
          </div>
          <p className="text-[13px] text-[#64696b] sm:text-[14px]">
            PDF, DOCX. You may upload multiple files.
          </p>
        </div>
      </button>

      {docs.length > 0 && (
        <div className="flex flex-col gap-3.5">
          {docs.map((d) => (
            <div key={d.id} className="flex flex-col gap-2.5">
              <DocCard doc={d} onRemove={() => onRemove(d.id)} />
              <PhiBanner status={d.phi} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DocCard({ doc, onRemove }: { doc: UploadedDoc; onRemove: () => void }) {
  const tone =
    doc.ext === "pdf"
      ? "bg-[#d92d20]"
      : doc.ext === "docx"
        ? "bg-[#155eef]"
        : "bg-[#475367]"
  const label = doc.ext === "other" ? "FILE" : doc.ext.toUpperCase()
  return (
    <div className="flex items-center gap-4 rounded-[14px] border-[1.5px] border-[#e2e2e2] bg-white px-4 py-3.5 sm:px-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#fee4e2]">
        <span
          className={cn(
            "rounded px-1 py-px text-[8px] font-bold leading-none text-white",
            tone
          )}
        >
          {label}
        </span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-[14px] font-semibold text-[#101010] sm:text-[15px]">
          {doc.name}
        </p>
        <p className="text-[12px] text-[#727272] sm:text-[13px]">
          {formatBytes(doc.size)}
        </p>
        <p className="text-[12px] text-[#16a34a] sm:text-[13px]">
          {doc.phi === "analyzing" ? "Analyzing…" : "Upload completed!"}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${doc.name}`}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-[#d92d20] transition-colors hover:bg-[#fee4e2]"
      >
        <Trash2 className="size-5" />
      </button>
    </div>
  )
}

function PhiBanner({ status }: { status: PhiStatus }) {
  if (status === "analyzing") {
    return (
      <div className="flex items-center gap-2.5 rounded-[10px] border border-dashed border-[#e5e7ea] bg-[#fafafb] px-4 py-2.5">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
        <p className="text-[13px] text-[#475367] sm:text-[14px]">
          Scanning document for Protected Health Information (PHI)…
        </p>
      </div>
    )
  }
  if (status === "clean") {
    return (
      <div className="flex items-start gap-3 rounded-[10px] border border-[#16a34a] bg-[#f0fdf4] px-4 py-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#16a34a]" />
        <p className="text-[13px] leading-relaxed text-[#101828] sm:text-[14px]">
          <span className="font-bold text-[#15803d]">SUCCESS:</span> No Protected
          Health Information (PHI) detected. Uploads are not subject to HIPAA
          restrictions. Authorized sharing is permitted.
        </p>
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-[10px]">
      <div className="bg-[#f5c01a] px-4 py-2">
        <p className="text-[13px] font-bold tracking-wide text-[#101010] sm:text-[14px]">
          PHI WARNING
        </p>
      </div>
      <div className="flex items-start gap-3 border-[1.5px] border-t-0 border-[#f5c01a] bg-[#fef2f1] px-4 py-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#b42318]" />
        <p className="text-[13px] leading-relaxed text-[#101828] sm:text-[14px]">
          <span className="font-bold text-[#b42318]">WARNING:</span> Protected
          Health Information (PHI) detected. Ensure all uploads comply with
          HIPAA regulations. Unauthorized disclosure is strictly prohibited.
        </p>
      </div>
    </div>
  )
}

/* ---------- Step 4: Course Details ---------- */

function CourseDetailsStep({
  details,
  onUpdate,
  onUpdateObjective,
  onAddObjective,
  onRemoveObjective,
  showErrors,
}: {
  details: CourseAnalysis
  onUpdate: <K extends keyof CourseAnalysis>(
    key: K,
    value: CourseAnalysis[K]
  ) => void
  onUpdateObjective: (i: number, value: string) => void
  onAddObjective: () => void
  onRemoveObjective: (i: number) => void
  showErrors: boolean
}) {
  const titleError = showErrors && !details.title.trim()
  const descError = showErrors && !details.description.trim()
  const objectivesError =
    showErrors && details.objectives.filter((o) => o.trim()).length === 0

  return (
    <div className="flex flex-col gap-7">
      <FormRow label="Course Title">
        <input
          type="text"
          value={details.title}
          onChange={(e) => onUpdate("title", e.target.value)}
          placeholder="Enter course title"
          className={cn(
            "h-12 w-full rounded-[12px] border-[1.5px] bg-white px-4 text-[15px] outline-none transition-colors placeholder:text-[#979797] focus:ring-3",
            titleError
              ? "border-destructive focus:border-destructive focus:ring-destructive/15"
              : "border-[#e5e7ea] focus:border-primary focus:ring-primary/15"
          )}
        />
      </FormRow>

      <FormRow label="Short Description">
        <textarea
          rows={5}
          value={details.description}
          onChange={(e) => onUpdate("description", e.target.value)}
          placeholder="Describe what this course covers"
          className={cn(
            "min-h-[140px] w-full resize-y rounded-[12px] border-[1.5px] bg-white px-4 py-3 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-[#979797] focus:ring-3 sm:text-[15px]",
            descError
              ? "border-destructive focus:border-destructive focus:ring-destructive/15"
              : "border-[#e5e7ea] focus:border-primary focus:ring-primary/15"
          )}
        />
      </FormRow>

      <FormRow label="Category">
        <div className="flex h-12 w-full items-center rounded-[12px] bg-[#f5f6fa] px-4 text-[15px] text-[#101010]">
          {details.detectedCategory}
        </div>
      </FormRow>

      <FormRow label="Content Type">
        <Select
          value={details.contentType || undefined}
          onValueChange={(v) => onUpdate("contentType", v ?? "")}
        >
          <SelectTrigger className="!h-12 w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-4 text-[15px] data-[placeholder]:text-[#979797]">
            <SelectValue placeholder="Select content type" />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-[14px]">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormRow>

      <FormRow label="No of Notes / Slides">
        <Select
          value={details.notesCount || undefined}
          onValueChange={(v) => onUpdate("notesCount", v ?? "")}
        >
          <SelectTrigger className="!h-12 w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-4 text-[15px] data-[placeholder]:text-[#979797]">
            <SelectValue placeholder="Select count" />
          </SelectTrigger>
          <SelectContent>
            {NOTE_COUNT_OPTIONS.map((n) => (
              <SelectItem key={n} value={n} className="text-[14px]">
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormRow>

      <FormRow label="Deadline to Complete Course">
        <DeadlineStepper
          value={details.deadlineDays}
          onChange={(v) => onUpdate("deadlineDays", v)}
        />
      </FormRow>

      <div className="border-t border-[#e5e7ea]" />

      <div className="flex flex-col gap-5">
        <h2 className="text-[18px] font-bold text-[#0d0d12] sm:text-[20px]">
          Learning Objectives
        </h2>
        <FormRow label="Objectives">
          <div className="flex flex-col gap-3">
            {details.objectives.map((obj, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-12 flex-1 items-center rounded-[12px] border-[1.5px] bg-white px-4 transition-colors focus-within:ring-3",
                    objectivesError && !obj.trim()
                      ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/15"
                      : "border-[#e5e7ea] focus-within:border-primary focus-within:ring-primary/15"
                  )}
                >
                  <span className="mr-1.5 text-[14px] font-medium text-[#475367] sm:text-[15px]">
                    {i + 1}.
                  </span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => onUpdateObjective(i, e.target.value)}
                    placeholder="Describe a learning outcome"
                    className="h-full flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#979797] sm:text-[15px]"
                  />
                </div>
                {details.objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveObjective(i)}
                    aria-label={`Remove objective ${i + 1}`}
                    className="grid size-10 shrink-0 place-items-center rounded-lg text-[#98a2b3] transition-colors hover:bg-[#f9fafb] hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={onAddObjective}
              className="inline-flex w-fit items-center gap-2 rounded-full px-2 py-1.5 text-[14px] font-semibold text-primary transition-colors hover:bg-[#f3f4ff]"
            >
              <Plus className="size-4" /> Add objective
            </button>
          </div>
        </FormRow>
      </div>
    </div>
  )
}

function QuizCard({
  index,
  q,
  editing,
  onEdit,
  onDone,
  onUpdateQuestion,
  onUpdateOption,
  onSetCorrect,
  onUpdateExplanation,
}: {
  index: number
  q: QuizQuestion
  editing: boolean
  onEdit: () => void
  onDone: () => void
  onUpdateQuestion: (v: string) => void
  onUpdateOption: (oi: number, v: string) => void
  onSetCorrect: (oi: number) => void
  onUpdateExplanation: (v: string) => void
}) {
  return (
    <li
      className={cn(
        "rounded-2xl bg-[#f7f7f9] p-5 transition-shadow sm:p-6",
        editing && "ring-2 ring-primary/30"
      )}
    >
      {/* Header — number + question + Edit/Done */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-2">
          <span className="font-inter text-[15px] font-semibold text-[#101928] sm:text-[16px]">
            {index + 1}.
          </span>
          {editing ? (
            <textarea
              value={q.question}
              onChange={(e) => onUpdateQuestion(e.target.value)}
              rows={2}
              autoFocus
              className="flex-1 resize-none rounded-lg border-[1.5px] border-[#e4e7ec] bg-white px-3 py-2 text-[15px] font-semibold leading-snug text-[#101928] outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/10 sm:text-[16px]"
            />
          ) : (
            <p className="flex-1 font-inter text-[15px] font-semibold text-[#101928] sm:text-[16px]">
              {q.question}
            </p>
          )}
        </div>
        {editing ? (
          <button
            type="button"
            onClick={onDone}
            className="font-inter shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover sm:text-[14px]"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="font-inter shrink-0 rounded-lg border border-[#e4e7ec] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#475367] transition-colors hover:bg-white hover:text-primary sm:text-[14px]"
          >
            Edit
          </button>
        )}
      </div>

      {/* Options — identical layout in both modes */}
      <ul className="mt-3 flex flex-col gap-2 pl-1 sm:pl-2">
        {q.options.map((opt, oi) => {
          const isCorrect = q.correctIndex === oi
          return (
            <li
              key={oi}
              className="flex items-center gap-3 text-[14px] sm:text-[15px]"
            >
              {editing ? (
                <button
                  type="button"
                  onClick={() => onSetCorrect(oi)}
                  aria-label={
                    isCorrect
                      ? "Correct answer"
                      : "Mark this option as correct"
                  }
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
                    isCorrect
                      ? "border-primary bg-primary"
                      : "border-[#cbd5e1] bg-white hover:border-primary"
                  )}
                >
                  {isCorrect && (
                    <span className="size-1.5 rounded-full bg-white" />
                  )}
                </button>
              ) : (
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]",
                    isCorrect
                      ? "border-primary bg-primary"
                      : "border-[#cbd5e1] bg-white"
                  )}
                >
                  {isCorrect && (
                    <span className="size-1.5 rounded-full bg-white" />
                  )}
                </span>
              )}
              {editing ? (
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => onUpdateOption(oi, e.target.value)}
                  className={cn(
                    "h-8 flex-1 rounded-lg border-[1.5px] border-[#e4e7ec] bg-white px-2 outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/10",
                    isCorrect ? "font-medium text-[#101928]" : "text-[#475367]"
                  )}
                />
              ) : (
                <span
                  className={cn(
                    isCorrect ? "font-medium text-[#101928]" : "text-[#475367]"
                  )}
                >
                  {opt}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {/* Explanation — inline in both modes, editable when editing */}
      <div className="mt-3 flex flex-col gap-1 pl-1 sm:pl-2">
        <p className="text-[13px] font-semibold text-[#15803d] sm:text-[14px]">
          Explanation:
        </p>
        {editing ? (
          <textarea
            value={q.explanation}
            onChange={(e) => onUpdateExplanation(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border-[1.5px] border-[#e4e7ec] bg-white px-2 py-1.5 text-[13px] leading-relaxed text-[#101828] outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/10 sm:text-[14px]"
          />
        ) : (
          <p className="text-[13px] text-[#667085] sm:text-[14px]">
            {q.explanation}
          </p>
        )}
      </div>
    </li>
  )
}

function FormRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 md:grid md:grid-cols-[180px_1fr] md:items-start md:gap-6">
      <p className="pt-3 text-[14px] font-medium text-[#667085] sm:text-[15px]">
        {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function DeadlineStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex h-12 w-full items-center rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white pl-4 pr-2 transition-colors focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#979797] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="mr-2 text-[14px] text-[#667085] sm:text-[15px]">days</span>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label="Increase deadline"
          className="grid h-5 w-7 place-items-center rounded text-[#475367] transition-colors hover:bg-[#f9fafb]"
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          aria-label="Decrease deadline"
          className="grid h-5 w-7 place-items-center rounded text-[#475367] transition-colors hover:bg-[#f9fafb]"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ---------- Step 7: Review the generated course ---------- */

function ReviewCourseStep({ title }: { title: string }) {
  const [tab, setTab] = useState<"Notes" | "Slides">("Notes")
  const [noteIndex, setNoteIndex] = useState(0)
  const [slideIndex, setSlideIndex] = useState(0)
  // Editable quiz state — seeded once from the shared content.
  const [quizDraft, setQuizDraft] = useState<QuizQuestion[]>(() =>
    COURSE_QUIZ.map((q) => ({ ...q, options: [...q.options] }))
  )
  // Which question is currently expanded for editing (only one at a time).
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Citation grounding — clicking a citation badge highlights the matching
  // passage in the Sources panel and opens the drawer below xl.
  const [activeCitation, setActiveCitation] = useState<number | null>(null)
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false)
  const [tocDrawerOpen, setTocDrawerOpen] = useState(false)

  function jumpToCitation(id: number) {
    setActiveCitation(id)
    setSourcesDrawerOpen(true)
    // Defer to next frame so the drawer's content is in the DOM.
    window.setTimeout(() => {
      const el = document.querySelector(
        `[data-citation-anchor="${id}"]`
      ) as HTMLElement | null
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 60)
  }

  function updateQuestion(qi: number, value: string) {
    setQuizDraft((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, question: value } : q))
    )
  }
  function updateOption(qi: number, oi: number, value: string) {
    setQuizDraft((prev) =>
      prev.map((q, i) =>
        i === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) }
          : q
      )
    )
  }
  function setCorrect(qi: number, oi: number) {
    setQuizDraft((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, correctIndex: oi } : q))
    )
  }
  function updateExplanation(qi: number, value: string) {
    setQuizDraft((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, explanation: value } : q))
    )
  }

  const toc = (
    <div className="rounded-2xl border border-[#eceef2] bg-white">
      <div className="flex border-b border-[#f0f2f5]">
        {(["Notes", "Slides"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "font-inter flex-1 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-[#667085] hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Notes" ? (
        <div className="max-h-[520px] overflow-y-auto">
          {COURSE_MODULES.map((modTitle, mi) => (
            <div key={modTitle} className="border-b border-[#f0f2f5] last:border-0">
              <p className="font-inter-tight px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#667085]">
                {modTitle}
              </p>
              <ul>
                {COURSE_LECTURES.map((lec, li) =>
                  lec.mod === mi ? (
                    <li key={li}>
                      <button
                        type="button"
                        onClick={() => setNoteIndex(li)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-2.5 text-left text-[13px] transition-colors",
                          noteIndex === li
                            ? "bg-[#f3f4f6] font-medium text-[#101928]"
                            : "text-[#475367] hover:bg-[#f9fafb]"
                        )}
                      >
                        <span className="text-[#98a2b3]">{li + 1}.</span>
                        <span className="flex-1">{lec.title}</span>
                      </button>
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="max-h-[520px] space-y-2 overflow-y-auto p-3">
          {COURSE_SLIDES.map((s, idx) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setSlideIndex(idx)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                  idx === slideIndex
                    ? "bg-[#f3f4f6]"
                    : "hover:bg-[#f9fafb]"
                )}
              >
                <span
                  className={cn(
                    "relative aspect-video w-20 shrink-0 overflow-hidden rounded-md border-2",
                    idx === slideIndex ? "border-primary" : "border-[#eceef2]"
                  )}
                >
                  <Image src={s} alt="" fill sizes="80px" className="object-cover" />
                </span>
                <span
                  className={cn(
                    "text-[13px]",
                    idx === slideIndex
                      ? "font-medium text-[#101928]"
                      : "text-[#475367]"
                  )}
                >
                  Slide {idx + 1}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_360px]">
        {/* TOC — left on desktop */}
        <aside className="hidden lg:block">{toc}</aside>

        {/* Main content */}
        <section className="flex min-w-0 flex-col gap-6 pb-24 lg:pb-0">
          <div className="rounded-2xl border border-[#eceef2] bg-white p-6">
            {tab === "Notes" ? (
              <ReviewNotes
                index={noteIndex}
                courseTitle={title}
                onCitation={jumpToCitation}
                activeCitation={activeCitation}
              />
            ) : (
              <ReviewSlide index={slideIndex} />
            )}
          </div>

          <div className="rounded-2xl border border-[#eceef2] bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-inter-tight text-[18px] font-semibold text-[#101928]">
                Answers
              </h2>
              <span className="font-inter text-[13px] text-[#667085]">
                {quizDraft.length} questions — tap Edit on any card to change
                the question, options, correct answer or explanation.
              </span>
            </div>

            <ol className="mt-6 flex flex-col gap-4">
              {quizDraft.map((q, qi) => (
                <QuizCard
                  key={qi}
                  index={qi}
                  q={q}
                  editing={editingIndex === qi}
                  onEdit={() => setEditingIndex(qi)}
                  onDone={() => setEditingIndex(null)}
                  onUpdateQuestion={(v) => updateQuestion(qi, v)}
                  onUpdateOption={(oi, v) => updateOption(qi, oi, v)}
                  onSetCorrect={(oi) => setCorrect(qi, oi)}
                  onUpdateExplanation={(v) => updateExplanation(qi, v)}
                />
              ))}
            </ol>
          </div>
        </section>

        {/* Sources — right column on xl+ */}
        <aside className="hidden xl:block">
          <SourcesPanel
            activeCitation={activeCitation}
            onClear={() => setActiveCitation(null)}
          />
        </aside>
      </div>

      {/* Below xl: Sources opens as a slide-over drawer.
          Below lg: TOC also opens as a slide-over drawer. */}
      <Drawer
        open={sourcesDrawerOpen}
        onClose={() => setSourcesDrawerOpen(false)}
        from="right"
        title="Sources"
      >
        <SourcesPanel
          activeCitation={activeCitation}
          onClear={() => setActiveCitation(null)}
          embedded
        />
      </Drawer>
      <Drawer
        open={tocDrawerOpen}
        onClose={() => setTocDrawerOpen(false)}
        from="left"
        title="Contents"
      >
        {toc}
      </Drawer>

      {/* Floating "Sources" button visible from lg down to fold the panel in/out */}
      <button
        type="button"
        onClick={() => setSourcesDrawerOpen(true)}
        className="fixed right-5 top-[120px] z-20 hidden h-10 items-center gap-2 rounded-full border border-[#e4e7ec] bg-white px-4 text-[13px] font-semibold text-primary shadow-[0_4px_16px_rgba(16,24,40,0.08)] transition-colors hover:bg-[#f4f3ff] lg:flex xl:hidden"
        aria-label="Open Sources panel"
      >
        <FileText className="size-4" /> Sources
      </button>

      {/* Mobile bottom-bar — Notes / Slides + Sources tab, matches the learn page treatment */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[#f0f2f5] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <button
          type="button"
          onClick={() => setTocDrawerOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 px-3 py-2 text-[12px] font-semibold text-[#667085] transition-colors"
        >
          <Menu className="size-4" />
          Contents
        </button>
        {(["Notes", "Slides"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 px-3 py-2 text-[12px] font-semibold transition-colors",
              tab === t ? "text-primary" : "text-[#667085]"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                tab === t ? "bg-primary" : "bg-transparent"
              )}
            />
            {t}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSourcesDrawerOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 px-3 py-2 text-[12px] font-semibold text-[#667085] transition-colors"
        >
          <FileText className="size-4" />
          Sources
        </button>
      </nav>
    </>
  )
}

function ReviewNotes({
  index,
  courseTitle,
  onCitation,
  activeCitation,
}: {
  index: number
  courseTitle: string
  onCitation: (id: number) => void
  activeCitation: number | null
}) {
  const lec = COURSE_LECTURES[index]
  return (
    <article>
      <span className="font-inter-tight inline-flex rounded-full border border-[#e0e0ff] bg-[#f4f3ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
        {courseTitle.split(" ").slice(0, 2).join(" ") || "Course"}
      </span>
      <h3 className="font-inter-tight mt-3 text-[20px] font-semibold text-[#101928]">
        {lec.title}
      </h3>
      <p className="mt-1 text-[12px] text-[#667085]">
        Article {index + 1} of {COURSE_LECTURES.length}
      </p>

      <div className="mt-5 space-y-4 text-[14px] leading-7 text-[#475367]">
        <p>
          This article covers{" "}
          <strong className="text-[#101928]">{lec.title}</strong> as part of the{" "}
          {courseTitle}. It explains the principles your team applies in daily
          operations and why they matter.
        </p>
        <h4 className="font-inter-tight text-[15px] font-semibold text-[#101928]">
          Key takeaways
        </h4>
        <ol className="list-decimal space-y-2 pl-5 marker:text-[#98a2b3]">
          {NOTE_TAKEAWAYS.map((t, i) => {
            const cite = NOTE_CITATIONS[i]
            const isActive = activeCitation === cite
            return (
              <li key={t} className="flex items-start gap-1.5">
                <span className="flex-1">{t}</span>
                {cite != null && (
                  <button
                    type="button"
                    onClick={() => onCitation(cite)}
                    aria-label={`Open source ${cite}`}
                    className={cn(
                      "ml-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded px-1.5 text-[11px] font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "bg-[#f3f4ff] text-primary hover:bg-primary hover:text-white"
                    )}
                  >
                    {cite}
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </article>
  )
}

function ReviewSlide({ index }: { index: number }) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#eceef2] bg-[#101828]">
        <Image
          key={COURSE_SLIDES[index]}
          src={COURSE_SLIDES[index]}
          alt={`Slide ${index + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 700px"
          className="object-cover"
        />
      </div>
      <p className="font-inter text-right text-[12px] text-[#667085]">
        Slide {index + 1} of {COURSE_SLIDES.length}
      </p>
    </div>
  )
}

function SourcesPanel({
  activeCitation,
  onClear,
  embedded,
}: {
  activeCitation: number | null
  onClear: () => void
  embedded?: boolean
}) {
  return (
    <div
      className={cn(
        "flex h-full max-h-[calc(100svh-160px)] flex-col rounded-2xl border bg-white",
        embedded ? "border-transparent" : "border-[#eceef2]"
      )}
    >
      {!embedded && (
        <div className="flex items-center justify-between gap-2 border-b border-[#f0f2f5] px-4 py-3">
          <h3 className="font-inter-tight text-[15px] font-semibold text-[#101928]">
            Sources
          </h3>
          {activeCitation != null ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear active citation"
              className="grid size-7 place-items-center rounded-lg text-[#667085] transition-colors hover:bg-[#f9fafb]"
            >
              <Minimize2 className="size-3.5" />
            </button>
          ) : (
            <Maximize2 className="size-3.5 text-[#cbd5e1]" />
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {/* Source document pill */}
        <div className="inline-flex w-full items-center gap-2 rounded-full bg-[#f4f3ff] px-3 py-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-white">
            <FileText className="size-3.5" />
          </span>
          <span className="truncate font-inter-tight text-[13px] font-semibold text-[#101928]">
            {COURSE_SOURCE_DOC.name}
          </span>
        </div>

        {/* Document body — each paragraph optionally renders a highlightable clause */}
        <div className="mt-5 space-y-5 text-[13px] leading-relaxed text-[#475367] sm:text-[14px]">
          {COURSE_SOURCE_DOC.paragraphs.map((p, i) => {
            const hl = p.highlight
            const isActive = hl && hl.id === activeCitation
            return (
              <p key={i} className="font-inter">
                {p.text}{" "}
                {hl && (
                  <span
                    data-citation-anchor={hl.id}
                    className={cn(
                      "rounded px-1 py-0.5 transition-colors",
                      isActive
                        ? "bg-[#fde68a] text-[#101010] ring-1 ring-[#f59e0b]"
                        : "bg-[#fef3c7]/60 text-[#101010]/85"
                    )}
                  >
                    {hl.text}
                  </span>
                )}
              </p>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Drawer({
  open,
  onClose,
  from,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  from: "left" | "right"
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 xl:hidden",
        from === "right" ? "xl:hidden" : "lg:hidden",
        !open && "pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Sheet */}
      <aside
        className={cn(
          "absolute top-0 flex h-svh w-[min(420px,92vw)] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out",
          from === "right" ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : from === "right"
              ? "translate-x-full"
              : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#f0f2f5] px-4 py-3">
          <h3 className="font-inter-tight text-[15px] font-semibold text-[#101928]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-[#667085] transition-colors hover:bg-[#f9fafb]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  )
}

/* ---------- Confirm Course Review modal ---------- */

function ConfirmReviewModal({
  open,
  onClose,
  courseTitle,
  defaultReviewer,
  onConfirm,
  loading,
}: {
  open: boolean
  onClose: () => void
  courseTitle: string
  defaultReviewer: string
  onConfirm: () => void
  loading: boolean
}) {
  const [reviewer, setReviewer] = useState(defaultReviewer)
  const [confirmed, setConfirmed] = useState(false)

  // Re-prefill if the admin name resolves after the modal is mounted, but
  // only when the user hasn't typed their own value yet.
  useEffect(() => {
    if (open && defaultReviewer && !reviewer) {
      setReviewer(defaultReviewer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultReviewer])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-[0_4px_40px_rgba(0,0,0,0.08)] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-inter-tight text-[18px] font-semibold text-[#101928] sm:text-[20px]">
            Confirm Course Review
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-[#667085] transition-colors hover:bg-[#f9fafb]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#475367] sm:text-[15px]">
          <p>
            Please confirm that the course content for{" "}
            <span className="font-semibold text-[#101928]">
              “{courseTitle}”
            </span>{" "}
            has been reviewed and approved by a qualified individual. This
            includes verifying the accuracy of the material, its alignment with
            organizational policies, and its relevance to the assigned staff.
          </p>
          <p>
            This confirmation will be recorded as part of the course audit
            trail.
          </p>
        </div>

        <div className="mt-5">
          <label
            htmlFor="reviewer-name"
            className="font-inter text-[13px] font-medium text-[#475367] sm:text-[14px]"
          >
            Reviewed by
          </label>
          <input
            id="reviewer-name"
            type="text"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            placeholder="Enter reviewer name"
            className="mt-2 h-12 w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-[#979797] focus:border-primary focus:ring-3 focus:ring-primary/15 sm:text-[15px]"
          />
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 size-4 cursor-pointer accent-primary"
          />
          <span className="text-[13px] leading-relaxed text-[#475367] sm:text-[14px]">
            I confirm that this course has been{" "}
            <span className="font-semibold text-[#101928]">
              reviewed and approved
            </span>{" "}
            before publishing.
          </span>
        </label>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="font-inter h-11 rounded-xl border border-[#e4e7ec] bg-white px-6 text-[14px] font-semibold text-[#475367] transition-colors hover:bg-[#f9fafb] disabled:opacity-50 sm:text-[15px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || !reviewer.trim() || loading}
            className={cn(
              "font-inter h-11 rounded-xl px-6 text-[14px] font-semibold text-white transition-colors sm:text-[15px]",
              !confirmed || !reviewer.trim() || loading
                ? "cursor-not-allowed bg-[#cbd2dc]"
                : "bg-primary hover:bg-brand-hover"
            )}
          >
            {loading ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Step 8: Assigning & Publish ---------- */

function AssignPublishStep({
  assignInput,
  onAssignInputChange,
  assignees,
  onAddAssignees,
  onRemoveAssignee,
  deadlineEnabled,
  onToggleDeadline,
  dueDate,
  onDueDateChange,
  dueTime,
  onDueTimeChange,
  reminders,
  onAddReminder,
  onUpdateReminder,
  onRemoveReminder,
}: {
  assignInput: string
  onAssignInputChange: (v: string) => void
  assignees: string[]
  onAddAssignees: (raw: string) => void
  onRemoveAssignee: (value: string) => void
  deadlineEnabled: boolean
  onToggleDeadline: (v: boolean) => void
  dueDate: string
  onDueDateChange: (v: string) => void
  dueTime: string
  onDueTimeChange: (v: string) => void
  reminders: string[]
  onAddReminder: () => void
  onUpdateReminder: (i: number, v: string) => void
  onRemoveReminder: (i: number) => void
}) {
  return (
    <div className="flex flex-col gap-7">
      {/* Assign To */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <p className="pt-3 text-[14px] font-medium text-[#667085] sm:w-[180px] sm:shrink-0 sm:text-[15px]">
          Assign To
        </p>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="flex min-h-12 flex-1 flex-wrap items-center gap-2 rounded-[12px] border-[1.5px] border-primary bg-white px-3 py-2 focus-within:ring-3 focus-within:ring-primary/15">
            {assignees.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f4ff] py-1 pl-3 pr-1 text-[13px] font-medium text-primary"
              >
                {a}
                <button
                  type="button"
                  onClick={() => onRemoveAssignee(a)}
                  aria-label={`Remove ${a}`}
                  className="grid size-4 place-items-center rounded-full transition-colors hover:bg-primary/10"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={assignInput}
              onChange={(e) => onAssignInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault()
                  onAddAssignees(assignInput)
                } else if (
                  e.key === "Backspace" &&
                  !assignInput &&
                  assignees.length > 0
                ) {
                  onRemoveAssignee(assignees[assignees.length - 1])
                }
              }}
              placeholder={
                assignees.length ? "" : "Add people, emails or names"
              }
              className="min-w-[180px] flex-1 bg-transparent py-1 text-[14px] text-[#101928] outline-none placeholder:text-[#9aa0a6] sm:text-[15px]"
            />
          </div>
          <button
            type="button"
            onClick={() => assignInput.trim() && onAddAssignees(assignInput)}
            className="font-inter h-12 shrink-0 rounded-[12px] bg-primary px-6 text-[14px] font-semibold text-white transition-colors hover:bg-brand-hover sm:text-[15px]"
          >
            Invite
          </button>
        </div>
      </div>

      <div className="border-t border-[#e5e7ea]" />

      {/* Deadline */}
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-inter-tight text-[16px] font-bold text-[#101928] sm:text-[17px]">
              Set Completion Deadline
            </h3>
            <p className="font-inter mt-0.5 text-[13px] text-[#667085] sm:text-[14px]">
              Set a deadline for team member to complete this course
            </p>
          </div>
          <Toggle
            enabled={deadlineEnabled}
            onChange={onToggleDeadline}
            label="Enable deadline"
          />
        </div>

        {deadlineEnabled && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DatePicker value={dueDate} onChange={onDueDateChange} />
              <TimePicker value={dueTime} onChange={onDueTimeChange} />
            </div>

            <div className="flex flex-col gap-3">
              {reminders.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-[#f0f2f5] pb-3"
                >
                  <Clock className="size-4 shrink-0 text-[#667085]" />
                  <input
                    type="text"
                    value={r}
                    onChange={(e) => onUpdateReminder(i, e.target.value)}
                    className="flex-1 bg-transparent text-[14px] text-[#101928] outline-none sm:text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveReminder(i)}
                    aria-label="Remove reminder"
                    className="grid size-7 place-items-center rounded-lg text-[#667085] transition-colors hover:bg-[#f9fafb] hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={onAddReminder}
                className="font-inter inline-flex w-fit items-center text-[14px] font-medium text-[#98a2b3] transition-colors hover:text-primary sm:text-[15px]"
              >
                Add reminder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-8 w-[56px] shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25",
        enabled ? "bg-primary" : "bg-[#cbd5e1]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-6 rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.12)] transition-transform duration-200",
          enabled ? "translate-x-6" : "translate-x-0"
        )}
      />
    </button>
  )
}

/* ---------- Step 6: Course is being generated ---------- */

const GEN_STAGES = [
  "Analyzing policy and procedure",
  "Extract course input data",
  "Create course content and quiz",
  "Finalize all modules",
]

function GeneratingStep({ onReview }: { onReview: () => void }) {
  // Real-time ticker drives the four-stage progress. Generation also continues
  // in the background via the pending-course store, so the dashboard banner
  // can light up if the user clicks "Goto Dashboard" mid-flight.
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const id = window.setInterval(() => {
      setElapsed(Date.now() - start)
    }, 200)
    return () => window.clearInterval(id)
  }, [])

  const progress = Math.min(1, elapsed / GENERATION_MS)
  const stageDone = Math.floor(progress * GEN_STAGES.length)
  const ready = progress >= 1

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-8">
      <div className="w-full rounded-[16px] border border-[#e5e7ea] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <ul className="flex flex-col gap-4">
          {GEN_STAGES.map((stage, i) => {
            const done = i < stageDone || ready
            const active = !ready && i === stageDone
            return (
              <li
                key={stage}
                className="flex items-center gap-3 text-[15px] sm:text-[16px]"
              >
                <span className="grid size-5 shrink-0 place-items-center">
                  {done ? (
                    <Check className="size-5 text-[#16a34a]" strokeWidth={2.5} />
                  ) : active ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <span className="size-2.5 rounded-full bg-[#d0d5dd]" />
                  )}
                </span>
                <span
                  className={cn(
                    "transition-colors",
                    done
                      ? "text-[#101010]"
                      : active
                        ? "text-[#101010]"
                        : "text-[#98a2b3]"
                  )}
                >
                  {stage}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center rounded-[12px] border-[1.3px] border-[#d2d5db] bg-white px-8 text-[15px] font-semibold text-[#454353] transition-colors hover:bg-[#f9fafb]"
        >
          Goto Dashboard
        </Link>
        <button
          type="button"
          onClick={onReview}
          disabled={!ready}
          className={cn(
            "inline-flex h-12 items-center justify-center rounded-[12px] px-8 text-[15px] font-semibold text-white transition-colors",
            ready
              ? "bg-primary hover:bg-brand-hover"
              : "cursor-not-allowed bg-[#cbd2dc]"
          )}
        >
          {ready ? "Review course" : "Generating…"}
        </button>
      </div>
    </div>
  )
}

/* ---------- Step 5: Course Quiz ---------- */

function CourseQuizStep({
  quiz,
  onUpdate,
  showErrors,
}: {
  quiz: QuizConfig
  onUpdate: <K extends keyof QuizConfig>(key: K, value: QuizConfig[K]) => void
  showErrors: boolean
}) {
  const titleError = showErrors && !quiz.title.trim()
  const passError =
    showErrors && (quiz.passMark < 1 || quiz.passMark > 100)
  return (
    <div className="divide-y divide-[#e5e7ea]">
      <QuizRow label="Quiz Title">
        <input
          type="text"
          value={quiz.title}
          onChange={(e) => onUpdate("title", e.target.value)}
          placeholder="Enter quiz title"
          className={cn(
            "h-12 w-full rounded-[12px] border-[1.5px] bg-white px-4 text-[15px] outline-none transition-colors placeholder:text-[#979797] focus:ring-3",
            titleError
              ? "border-destructive focus:border-destructive focus:ring-destructive/15"
              : "border-[#e5e7ea] focus:border-primary focus:ring-primary/15"
          )}
        />
      </QuizRow>

      <QuizRow label="Number of Questions:">
        <NumberStepper
          value={quiz.questionCount}
          min={1}
          onChange={(v) => onUpdate("questionCount", v)}
        />
      </QuizRow>

      <QuizRow label="Difficulty:">
        <Select
          value={quiz.difficulty || undefined}
          onValueChange={(v) => onUpdate("difficulty", v ?? "")}
        >
          <SelectTrigger className="!h-12 w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-4 text-[15px]">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map((d) => (
              <SelectItem key={d} value={d} className="text-[14px]">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </QuizRow>

      <QuizRow label="Question Type:">
        <Select
          value={quiz.questionType || undefined}
          onValueChange={(v) => onUpdate("questionType", v ?? "")}
        >
          <SelectTrigger className="!h-12 w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-4 text-[15px]">
            <SelectValue placeholder="Select question type" />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-[14px]">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </QuizRow>

      <QuizRow label="Estimated Duration">
        <Select
          value={quiz.duration || undefined}
          onValueChange={(v) => onUpdate("duration", v ?? "")}
        >
          <SelectTrigger className="!h-12 w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-4 text-[15px]">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {QUIZ_DURATIONS.map((d) => (
              <SelectItem key={d} value={d} className="text-[14px]">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </QuizRow>

      <QuizRow label="Pass Mark:">
        <div
          className={cn(
            "flex h-12 w-full items-center rounded-[12px] border-[1.5px] bg-white pl-4 pr-4 transition-colors focus-within:ring-3",
            passError
              ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/15"
              : "border-[#e5e7ea] focus-within:border-primary focus-within:ring-primary/15"
          )}
        >
          <input
            type="number"
            min={1}
            max={100}
            value={quiz.passMark}
            onChange={(e) => {
              const n = Math.min(100, Math.max(0, Number(e.target.value) || 0))
              onUpdate("passMark", n)
            }}
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#979797] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="ml-2 text-[14px] text-[#667085] sm:text-[15px]">%</span>
        </div>
      </QuizRow>

      <QuizRow label="Attempts">
        <NumberStepper
          value={quiz.attempts}
          min={1}
          onChange={(v) => onUpdate("attempts", v)}
        />
      </QuizRow>
    </div>
  )
}

function QuizRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 py-5 md:grid md:grid-cols-[180px_1fr] md:items-center md:gap-6">
      <p className="text-[14px] font-medium text-[#667085] sm:text-[15px]">
        {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function NumberStepper({
  value,
  min = 0,
  onChange,
}: {
  value: number
  min?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex h-12 w-full items-center rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white pl-4 pr-2 transition-colors focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#979797] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label="Increase"
          className="grid h-5 w-7 place-items-center rounded text-[#475367] transition-colors hover:bg-[#f9fafb]"
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label="Decrease"
          className="grid h-5 w-7 place-items-center rounded text-[#475367] transition-colors hover:bg-[#f9fafb]"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ---------- Step 3: Audience ---------- */

function AudienceStep({
  audience,
  onAudienceChange,
  roles,
  onToggleRole,
  onSelectAll,
  customRole,
  onCustomRoleChange,
}: {
  audience: "general" | "specific" | null
  onAudienceChange: (v: "general" | "specific") => void
  roles: string[]
  onToggleRole: (role: string) => void
  onSelectAll: () => void
  customRole: string
  onCustomRoleChange: (v: string) => void
}) {
  const allBaseSelected = ROLES_SELECT_ALL.every((r) => roles.includes(r))
  return (
    <div className="flex flex-col gap-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <AudienceCard
          title="General"
          description="Every staff member gets this course regardless of role."
          active={audience === "general"}
          onClick={() => onAudienceChange("general")}
        />
        <AudienceCard
          title="Specific Roles"
          description="Only staffs with selected roles will be assigned this course."
          active={audience === "specific"}
          onClick={() => onAudienceChange("specific")}
        />
      </div>

      {audience === "specific" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#101010] sm:text-[15px]">
              Select roles
            </span>
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[13px] font-semibold text-primary hover:underline sm:text-[14px]"
            >
              {allBaseSelected ? "Clear all" : "Select all"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((role) => (
              <RoleCheckbox
                key={role}
                label={role}
                checked={roles.includes(role)}
                onToggle={() => onToggleRole(role)}
              />
            ))}
          </div>

          {roles.includes(ROLE_CUSTOM) && (
            <input
              autoFocus
              type="text"
              value={customRole}
              onChange={(e) => onCustomRoleChange(e.target.value)}
              placeholder="Enter your custom role"
              className="h-12 w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-5 text-[15px] outline-none transition-colors placeholder:text-[#979797] focus:border-primary focus:ring-3 focus:ring-primary/15"
            />
          )}
        </div>
      )}
    </div>
  )
}

function AudienceCard({
  title,
  description,
  active,
  onClick,
}: {
  title: string
  description: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-start justify-between gap-3 rounded-[14px] px-5 py-5 text-left transition-colors sm:px-6 sm:py-6",
        active
          ? "border-[1.5px] border-primary bg-[#f3f4ff]"
          : "border-[1.5px] border-[#e5e7ea] bg-white hover:bg-[#fafbff]"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-[18px] font-bold text-[#101010] sm:text-[19px]">
          {title}
        </p>
        <p className="text-[13px] text-[#667085] sm:text-[14px]">
          {description}
        </p>
      </div>
      <span
        className={cn(
          "mt-1 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]",
          active ? "border-primary" : "border-[#d4d4d4]"
        )}
      >
        {active && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
    </button>
  )
}

function RoleCheckbox({
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
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[12px] border-[1.5px] px-3.5 py-3 text-left transition-colors",
        checked
          ? "border-primary bg-[#f3f4ff]"
          : "border-[#e5e7ea] bg-white hover:bg-[#fafbff]"
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-[5px] transition-colors",
          checked
            ? "bg-primary text-white"
            : "border-[1.5px] border-[#d4d4d4] bg-white"
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="text-[14px] font-medium text-[#262626] sm:text-[15px]">
        {label}
      </span>
    </button>
  )
}
