"use client"

import { useState } from "react"
import Link from "next/link"

import { prebuiltCourses } from "@/lib/prebuilt-courses"
import { PrebuiltCourseCard } from "@/components/courses/prebuilt-course-card"
import { SearchInput } from "@/components/ui/search-input"

export function PrebuiltCourses() {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const filtered = prebuiltCourses
    .slice(0, 3)
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q)
    )

  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-1 text-center">
        <h2 className="font-inter-tight text-[30px] font-semibold text-[#101928]">
          Choose a Prebuilt Course on Theraptly
        </h2>
        <p className="font-inter mx-auto max-w-xl text-[16px] font-medium text-[#667085]">
          Choose a pre-built Theraptly course to expand with new training
          modules and organization-specific content.
        </p>
      </div>

      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for courses..."
      />

      <div className="space-y-4">
        {filtered.map((course) => (
          <PrebuiltCourseCard key={course.title} course={course} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#e4e7ec] py-12 text-center text-sm text-muted-foreground">
            No prebuilt courses match “{query}”.
          </div>
        )}
      </div>

      <div className="pt-1 text-center">
        <Link
          href="/prebuilt-courses"
          className="font-inter text-[14px] font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      </div>
    </div>
  )
}
