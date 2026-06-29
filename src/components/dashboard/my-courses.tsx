"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import { useStoredCourses } from "@/lib/client-store"
import { courses as coursesSeed } from "@/lib/courses"
import { SearchInput } from "@/components/ui/search-input"

function CourseIcon({ blue }: { blue: boolean }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg",
        blue ? "bg-primary text-primary-foreground" : "bg-ink text-surface"
      )}
    >
      <BookOpen className="size-4" />
    </span>
  )
}

function ViewCourse({ id }: { id: string }) {
  return (
    <Link
      href={`/courses/${id}`}
      onClick={(e) => e.stopPropagation()}
      className="font-sans text-[16px] font-semibold text-primary hover:underline"
    >
      View Course
    </Link>
  )
}

export function MyCourses() {
  const router = useRouter()
  const storedCourses = useStoredCourses()
  const courses = [...storedCourses, ...coursesSeed]
  const [query, setQuery] = useState("")
  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <h2 className="font-inter-tight text-[20px] font-semibold text-ink">
          My Courses
        </h2>
        <SearchInput
          inputSize="sm"
          wrapperClassName="w-full sm:w-72"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for courses..."
        />
      </div>

      {/* Table — md and up */}
      <div className="hidden md:block">
        <table className="font-inter-tight w-full text-left">
          <thead>
            <tr className="border-y border-line-soft bg-surface-subtle text-[15px] font-medium text-ink-muted">
              <th className="px-6 py-3 font-medium">Course Name</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Assigned Staff</th>
              <th className="px-6 py-3 font-medium">Completion Rate</th>
              <th className="hidden px-6 py-3 font-medium lg:table-cell">
                Date Created
              </th>
              <th className="px-6 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr
                key={c.name}
                onClick={() => router.push(`/courses/${c.id}`)}
                className="cursor-pointer border-b border-line-soft text-[17px] font-medium text-ink-body transition-colors last:border-0 hover:bg-surface-subtle"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <CourseIcon blue={i % 2 === 1} />
                    <span className="font-semibold text-ink">
                      {c.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <FileText className="size-5 text-ink-muted" />
                </td>
                <td className="px-6 py-4">{c.assigned}</td>
                <td className="px-6 py-4">{c.completion}</td>
                <td className="hidden px-6 py-4 lg:table-cell">{c.date}</td>
                <td className="px-6 py-4">
                  <ViewCourse id={c.id} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No courses match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stacked cards — below md */}
      <div className="font-inter-tight space-y-3 border-t border-line-soft p-4 md:hidden">
        {filtered.map((c, i) => (
          <div
            key={c.name}
            onClick={() => router.push(`/courses/${c.id}`)}
            className="cursor-pointer rounded-xl border border-line-soft p-4 transition-colors hover:bg-surface-subtle"
          >
            <div className="flex items-start gap-3">
              <CourseIcon blue={i % 2 === 1} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.date}</p>
              </div>
              <FileText className="size-5 text-ink-muted" />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-[15px]">
              <div>
                <span className="text-muted-foreground">
                  {c.assigned} assigned ·{" "}
                </span>
                <span className="font-semibold text-ink">
                  {c.completion}
                </span>
              </div>
              <ViewCourse id={c.id} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No courses match “{query}”.
          </p>
        )}
      </div>
    </div>
  )
}
