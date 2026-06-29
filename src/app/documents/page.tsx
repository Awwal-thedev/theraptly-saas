"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  MoreVertical,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  appendDocument,
  removeDocument,
  updateDocument,
  useStoredDocuments,
} from "@/lib/client-store"
import { documents as docsSeed, type DocItem, type DocStatus } from "@/lib/documents"
import { AppShell } from "@/components/app/app-shell"
import { EmptyStateCard } from "@/components/empty-state-card"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAGE_SIZES = [10, 25, 50]
const MONTHS = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",")
// Completed uploads map to one of the seeded courses for the demo.
const DEMO_COURSE_IDS = [
  "hipaa-privacy-training",
  "infection-control-basics",
  "osha-bloodborne-pathogens",
  "patient-rights-consent",
]

function DocIcon({ type }: { type: "pdf" | "docx" }) {
  const pdf = type === "pdf"
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg",
        pdf
          ? "bg-[#fee4e2] text-[#d92d20] dark:bg-critical-surface dark:text-critical"
          : "bg-[#eff4ff] text-[#2563eb] dark:bg-[#1d2a44] dark:text-[#7ab0ff]"
      )}
    >
      <FileText className="size-4" />
    </span>
  )
}

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === "Completed") {
    return (
      <span className="font-inter inline-flex items-center gap-1.5 rounded-full bg-[#e7f6ec] px-2.5 py-1 text-[13px] font-medium text-[#099250] dark:bg-positive-surface dark:text-positive">
        <CheckCircle2 className="size-3.5" /> Completed
      </span>
    )
  }
  if (status === "In progress") {
    return (
      <span className="font-inter inline-flex items-center gap-1.5 rounded-full bg-[#fef6e7] px-2.5 py-1 text-[13px] font-medium text-[#b54708] dark:bg-caution-surface dark:text-caution">
        <span className="size-1.5 rounded-full bg-current" /> In progress
      </span>
    )
  }
  return (
    <span className="font-inter inline-flex items-center gap-1.5 rounded-full bg-[#fee4e2] px-2.5 py-1 text-[13px] font-medium text-[#d92d20] dark:bg-critical-surface dark:text-critical">
      <span className="size-1.5 rounded-full bg-current" /> Failed
    </span>
  )
}

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | "…")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push("…")
  for (let i = start; i <= end; i++) out.push(i)
  if (end < total - 1) out.push("…")
  out.push(total)
  return out
}

export default function DocumentsPage() {
  const router = useRouter()
  const storedDocs = useStoredDocuments()
  // Local seed + anything uploaded by the user.
  const merged = useMemo<DocItem[]>(
    () => [...storedDocs, ...docsSeed],
    [storedDocs]
  )
  const [list, setList] = useState<DocItem[]>(merged)
  useEffect(() => setList(merged), [merged])
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [uploadOpen, setUploadOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => list.filter((d) => d.name.toLowerCase().includes(q)),
    [list, q]
  )

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = total === 0 ? 0 : (safePage - 1) * pageSize
  const paginated = filtered.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    setPage(1)
  }, [q, pageSize])

  function setStatus(id: string, status: DocStatus, courseId?: string) {
    setList((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, courseId } : d))
    )
    // Persist for stored items so the status update survives a refresh.
    updateDocument(id, { status, courseId })
  }

  // Simulate AI generating a course from the document.
  function processDocument(id: string) {
    setStatus(id, "In progress")
    window.setTimeout(() => {
      const courseId =
        DEMO_COURSE_IDS[Math.floor(id.length % DEMO_COURSE_IDS.length)]
      setStatus(id, "Completed", courseId)
    }, 2600)
  }

  function onFilesChosen(files: FileList | null) {
    if (!files || files.length === 0) return
    const now = new Date()
    const date = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
    const added: DocItem[] = Array.from(files).map((f, i) => {
      const type = f.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf"
      const id = `up-${now.getTime()}-${i}`
      return {
        id,
        name: f.name,
        type,
        size: `${Math.max(0.1, f.size / 1_000_000).toFixed(1)} MB`,
        date,
        status: "In progress",
      }
    })
    setList((prev) => [...added, ...prev])
    // Persist so it shows in /documents, /dashboard etc. across reloads.
    added.forEach((d) => appendDocument(d))
    setUploadOpen(false)
    setPage(1)
    added.forEach((d) => processDocument(d.id))
  }

  function removeDoc(id: string) {
    setList((prev) => prev.filter((d) => d.id !== id))
    removeDocument(id)
  }

  // A document is only linkable once its course has been generated.
  const courseHref = (d: DocItem) =>
    d.status === "Completed"
      ? `/courses/${d.courseId ?? "hipaa-privacy-training"}`
      : null

  return (
    <AppShell breadcrumb={[]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-inter text-[26px] font-semibold tracking-tight text-ink">
              Documents
            </h1>
            <p className="font-inter text-[16px] text-ink-muted">
              Documents and attachments that have been uploaded are displayed
              here
            </p>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="font-inter h-12 rounded-xl px-5 text-[15px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-brand-hover"
          >
            <Plus className="size-4" /> Upload New
          </Button>
        </div>

        {list.length === 0 ? (
          <EmptyStateCard
            title="No documents yet"
            description="Upload your policies, handbooks, or compliance documents. Theraptly will analyze them and turn them into structured training automatically."
            ctaLabel="Upload your first document"
            onCtaClick={() => setUploadOpen(true)}
          />
        ) : (
        /* Card */
        <div className="rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <div className="p-4 sm:p-5">
            <SearchInput
              wrapperClassName="w-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for document..."
            />
          </div>

          {/* Table — md and up */}
          <div className="hidden md:block">
            <table className="font-inter-tight w-full text-left">
              <thead>
                <tr className="border-y border-line-soft bg-surface-subtle text-[15px] font-medium text-ink-muted">
                  <th className="px-6 py-3 font-medium">Document Name</th>
                  <th className="px-6 py-3 font-medium">Date Uploaded</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((d) => {
                  const href = courseHref(d)
                  return (
                  <tr
                    key={d.id}
                    onClick={() => href && router.push(href)}
                    className={cn(
                      "border-b border-dashed border-line text-[16px] font-medium text-ink-body transition-colors last:border-0 hover:bg-surface-subtle",
                      href && "cursor-pointer"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <DocIcon type={d.type} />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">
                            {d.name}
                          </p>
                          <p className="font-inter text-[13px] text-muted-foreground">
                            {d.size}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{d.date}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DocAction doc={d} onRetry={() => processDocument(d.id)} />
                        <RowMenu onDelete={() => removeDoc(d.id)} />
                      </div>
                    </td>
                  </tr>
                  )
                })}
                {total === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No documents match “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stacked cards — below md */}
          <div className="font-inter-tight space-y-3 border-t border-line-soft p-4 md:hidden">
            {paginated.map((d) => {
              const href = courseHref(d)
              return (
              <div
                key={d.id}
                onClick={() => href && router.push(href)}
                className={cn(
                  "rounded-xl border border-line-soft p-4 transition-colors",
                  href && "cursor-pointer hover:bg-surface-subtle"
                )}
              >
                <div className="flex items-start gap-3">
                  <DocIcon type={d.type} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{d.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.size} · {d.date}
                    </p>
                  </div>
                  <RowMenu onDelete={() => removeDoc(d.id)} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <StatusBadge status={d.status} />
                  <DocAction doc={d} onRetry={() => processDocument(d.id)} />
                </div>
              </div>
              )
            })}
            {total === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No documents match “{query}”.
              </p>
            )}
          </div>

          {/* Footer / pagination */}
          <div className="flex flex-col gap-4 border-t border-line-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="font-inter text-[14px] text-ink-muted">
              Showing {total === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + pageSize, total)} of {total} entries
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  className="grid size-9 place-items-center rounded-lg border border-hairline text-ink-body transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {pageList(safePage, totalPages).map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`e${idx}`}
                      className="font-inter grid size-9 place-items-center text-[14px] text-ink-faint"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "font-inter grid size-9 place-items-center rounded-lg text-[14px] font-medium transition-colors",
                        p === safePage
                          ? "bg-primary text-primary-foreground"
                          : "text-ink-body hover:bg-surface-subtle"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                  className="grid size-9 place-items-center rounded-lg border border-hairline text-ink-body transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-inter text-[14px] text-ink-muted">Show</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                >
                  <SelectTrigger className="font-inter !h-9 rounded-lg border-hairline text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((n) => (
                      <SelectItem key={n} value={String(n)} className="text-[14px]">
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-inter text-[14px] text-ink-muted">
                  entries
                </span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Upload modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-[460px] rounded-2xl bg-surface p-6 shadow-[0_4px_40px_rgba(0,0,0,0.08)]">
            <h2 className="font-inter-tight text-[18px] font-semibold text-ink">
              Upload a document
            </h2>
            <p className="font-inter mt-1 text-[14px] text-ink-muted">
              Upload a policy document and Theraptly will generate a course from
              it.
            </p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => onFilesChosen(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line-faint bg-surface-subtle px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary-tint"
            >
              <span className="grid size-12 place-items-center rounded-full bg-surface text-primary shadow-sm">
                <UploadCloud className="size-6" />
              </span>
              <span className="font-inter text-[15px] font-medium text-ink">
                Click to upload
              </span>
              <span className="font-inter text-[13px] text-ink-muted">
                PDF or DOCX (max 10MB)
              </span>
            </button>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setUploadOpen(false)}
                className="font-inter h-11 rounded-xl border border-hairline px-5 text-[15px] font-semibold text-ink-body transition-colors hover:bg-surface-subtle"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function DocAction({ doc, onRetry }: { doc: DocItem; onRetry: () => void }) {
  if (doc.status === "Completed") {
    return (
      <Link
        href={`/courses/${doc.courseId ?? "hipaa-privacy-training"}`}
        onClick={(e) => e.stopPropagation()}
        className="font-inter text-[15px] font-semibold text-primary hover:underline"
      >
        View Course
      </Link>
    )
  }
  if (doc.status === "Failed") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRetry()
        }}
        className="font-inter text-[15px] font-semibold text-primary hover:underline"
      >
        Retry
      </button>
    )
  }
  return (
    <span className="font-inter cursor-default text-[15px] font-semibold text-line-faint">
      View Course
    </span>
  )
}

function RowMenu({ onDelete }: { onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More actions"
        onClick={(e) => e.stopPropagation()}
        className="grid size-8 place-items-center rounded-lg border border-hairline text-ink-muted outline-none transition-colors hover:bg-surface-subtle"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="gap-2 py-2 text-[14px]">
          <Download className="size-4" /> Download
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={onDelete}
          className="gap-2 py-2 text-[14px]"
        >
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
