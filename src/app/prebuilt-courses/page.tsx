"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { useAuth } from "@/lib/auth/auth-context"
import { prebuiltCourses } from "@/lib/prebuilt-courses"
import { Logo } from "@/components/brand/logo"
import { Splash } from "@/components/brand/splash"
import { PrebuiltCourseCard } from "@/components/courses/prebuilt-course-card"
import { SearchInput } from "@/components/ui/search-input"

export default function PrebuiltCoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
    else if (!user.onboarded) router.replace("/onboarding")
  }, [user, loading, router])

  if (loading || !user || !user.onboarded) {
    return <Splash label="Loading courses…" />
  }

  const q = query.trim().toLowerCase()
  const filtered = prebuiltCourses.filter(
    (p) =>
      p.title.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q)
  )

  return (
    <div className="min-h-svh bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#f0f2f5] bg-white px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo href="/dashboard" />
          <div className="hidden h-6 w-px bg-[#f0f2f5] sm:block" />
          <Link
            href="/dashboard"
            className="font-inter hidden items-center gap-1 text-[14px] font-medium text-primary hover:underline sm:flex"
          >
            <ChevronLeft className="size-4" /> Back to dashboard
          </Link>
        </div>
        <Link
          href="/dashboard"
          className="font-inter text-[14px] font-semibold text-[#101928] hover:underline"
        >
          Exit
        </Link>
      </header>

      <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-2 text-center">
          <h1 className="font-inter-tight text-[28px] font-semibold text-[#101928] sm:text-[30px]">
            Choose a Prebuilt Course on Theraptly
          </h1>
          <p className="font-inter mx-auto max-w-xl text-[16px] font-medium text-[#667085]">
            Choose a pre-built Theraptly course to expand with new training
            modules and organization-specific content.
          </p>
        </div>

        <SearchInput
          wrapperClassName="mt-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses by title or category"
        />

        <div className="mt-6 space-y-4">
          {filtered.map((course, i) => (
            <PrebuiltCourseCard key={`${course.title}-${i}`} course={course} />
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#e4e7ec] py-16 text-center text-sm text-muted-foreground">
              No courses match “{query}”.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
