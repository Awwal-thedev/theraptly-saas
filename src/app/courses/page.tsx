"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { allCourses, dateValue, type CourseRow } from "@/lib/all-courses"
import { useStoredCourses } from "@/lib/client-store"
import { getRecentMap, recordCourseActivity } from "@/lib/recent-courses"
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

function CourseIcon({ blue }: { blue: boolean }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg text-white",
        blue ? "bg-primary" : "bg-[#101928]"
      )}
    >
      <BookOpen className="size-4" />
    </span>
  )
}

function TypeIcon() {
  return (
    <span className="inline-grid size-8 place-items-center rounded-md border border-[#e4e7ec] text-[#667085]">
      <Play className="size-3.5 translate-x-px fill-current" />
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

export default function CoursesPage() {
  const router = useRouter()
  const storedCourses = useStoredCourses()
  // Seed + courses created via the wizard.
  const merged: CourseRow[] = useMemo(
    () => [
      ...storedCourses.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.type,
        assigned: c.assigned,
        role: "All staff",
        date: c.date,
        source: "created" as const,
      })),
      ...allCourses,
    ],
    [storedCourses]
  )
  const [list, setList] = useState<CourseRow[]>(merged)
  // Re-merge whenever the stored list changes.
  useEffect(() => setList(merged), [merged])
  const [recent, setRecent] = useState<Record<string, number>>({})
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [renaming, setRenaming] = useState<CourseRow | null>(null)
  const [renameValue, setRenameValue] = useState("")

  useEffect(() => {
    setRecent(getRecentMap())
  }, [])

  // Recently opened/modified first; then created courses, then prebuilt — each by date.
  const sorted = useMemo(() => {
    const opened = list.filter((c) => recent[c.id])
    const rest = list.filter((c) => !recent[c.id])
    opened.sort((a, b) => recent[b.id] - recent[a.id])
    rest.sort((a, b) => {
      if (a.source !== b.source) return a.source === "created" ? -1 : 1
      return dateValue(b.date) - dateValue(a.date)
    })
    return [...opened, ...rest]
  }, [list, recent])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => sorted.filter((c) => c.name.toLowerCase().includes(q)),
    [sorted, q]
  )

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize
  const paginated = filtered.slice(start, start + pageSize)

  // Keep the page in range when filters/size change.
  useEffect(() => {
    setPage(1)
  }, [q, pageSize])

  function openRename(c: CourseRow) {
    setRenaming(c)
    setRenameValue(c.name)
  }
  function saveRename() {
    if (!renaming) return
    const name = renameValue.trim()
    if (name) {
      setList((prev) =>
        prev.map((c) => (c.id === renaming.id ? { ...c, name } : c))
      )
      recordCourseActivity(renaming.id)
      setRecent(getRecentMap())
    }
    setRenaming(null)
  }
  function deleteCourse(id: string) {
    setList((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <AppShell
      breadcrumb={[{ label: "Trainings", href: "/dashboard" }, { label: "Courses" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-inter text-[26px] font-semibold tracking-tight text-[#101928]">
            Courses
          </h1>
          <Button
            nativeButton={false}
            className="font-inter h-12 rounded-xl px-5 text-[15px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-brand-hover"
            render={<Link href="/courses/new" />}
          >
            <Plus className="size-4" /> Create Course
          </Button>
        </div>

        {list.length === 0 ? (
          /* Empty state — no courses at all in the source data */
          <EmptyStateCard
            title="No courses yet"
            description="Create your first course by uploading a policy or compliance document — Theraptly turns it into structured training automatically."
            ctaLabel="Create your first course"
            ctaHref="/courses/new"
          />
        ) : (
          /* Card */
        <div className="rounded-2xl border border-[#eceef2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <div className="p-4 sm:p-5">
            <SearchInput
              wrapperClassName="w-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for courses..."
            />
          </div>

          {/* Table — md and up */}
          <div className="hidden md:block">
            <table className="font-inter-tight w-full text-left">
              <thead>
                <tr className="border-y border-[#f0f2f5] bg-[#f9fafb] text-[15px] font-medium text-[#667085]">
                  <th className="px-6 py-3 font-medium">Course Name</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Assigned Staff</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="hidden px-6 py-3 font-medium lg:table-cell">
                    Date Created
                  </th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/courses/${c.id}`)}
                    className="cursor-pointer border-b border-dashed border-[#eceef2] text-[16px] font-medium text-[#475367] transition-colors last:border-0 hover:bg-[#f9fafb]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <CourseIcon blue={(start + i) % 2 === 1} />
                        <span className="font-semibold text-[#101928]">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <TypeIcon />
                    </td>
                    <td className="px-6 py-4">{c.assigned}</td>
                    <td className="px-6 py-4">{c.role}</td>
                    <td className="hidden px-6 py-4 lg:table-cell">{c.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-inter text-[15px] font-semibold text-primary hover:underline"
                        >
                          View
                        </Link>
                        <RowMenu
                          onRename={() => openRename(c)}
                          onDelete={() => deleteCourse(c.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No courses match “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stacked cards — below md */}
          <div className="font-inter-tight space-y-3 border-t border-[#f0f2f5] p-4 md:hidden">
            {paginated.map((c, i) => (
              <div
                key={c.id}
                onClick={() => router.push(`/courses/${c.id}`)}
                className="cursor-pointer rounded-xl border border-[#f0f2f5] p-4 transition-colors hover:bg-[#f9fafb]"
              >
                <div className="flex items-start gap-3">
                  <CourseIcon blue={(start + i) % 2 === 1} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#101928]">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.date}</p>
                  </div>
                  <RowMenu
                    onRename={() => openRename(c)}
                    onDelete={() => deleteCourse(c.id)}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-[15px]">
                  <div className="text-muted-foreground">
                    {c.assigned} assigned · {c.role}
                  </div>
                  <Link
                    href={`/courses/${c.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-inter font-semibold text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
            {total === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No courses match “{query}”.
              </p>
            )}
          </div>

          {/* Footer / pagination */}
          <div className="flex flex-col gap-4 border-t border-[#f0f2f5] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="font-inter text-[14px] text-[#667085]">
              Showing {total === 0 ? 0 : start + 1} to{" "}
              {Math.min(start + pageSize, total)} of {total} entries
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  className="grid size-9 place-items-center rounded-lg border border-[#e4e7ec] text-[#475367] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {pageList(safePage, totalPages).map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`e${idx}`}
                      className="font-inter grid size-9 place-items-center text-[14px] text-[#98a2b3]"
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
                          ? "bg-primary text-white"
                          : "text-[#475367] hover:bg-[#f9fafb]"
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
                  className="grid size-9 place-items-center rounded-lg border border-[#e4e7ec] text-[#475367] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-inter text-[14px] text-[#667085]">Show</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                >
                  <SelectTrigger className="font-inter !h-9 rounded-lg border-[#e4e7ec] text-[14px]">
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
                <span className="font-inter text-[14px] text-[#667085]">
                  entries
                </span>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Rename modal */}
      {renaming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0_4px_40px_rgba(0,0,0,0.08)]">
            <h2 className="font-inter-tight text-[18px] font-semibold text-[#101928]">
              Rename course
            </h2>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename()
                if (e.key === "Escape") setRenaming(null)
              }}
              className="font-inter mt-4 h-12 w-full rounded-xl border border-[#e5e7ea] bg-white px-4 text-[15px] text-[#101928] outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setRenaming(null)}
                className="font-inter h-11 rounded-xl border border-[#e4e7ec] px-5 text-[15px] font-semibold text-[#475367] transition-colors hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
              <Button
                onClick={saveRename}
                className="font-inter h-11 rounded-xl px-5 text-[15px] font-semibold hover:bg-brand-hover"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function RowMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More actions"
        onClick={(e) => e.stopPropagation()}
        className="grid size-8 place-items-center rounded-lg border border-[#e4e7ec] text-[#667085] outline-none transition-colors hover:bg-[#f9fafb] data-[popup-open]:bg-[#f3f4f6]"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onRename} className="gap-2 py-2 text-[14px]">
          <Pencil className="size-4" /> Rename
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
