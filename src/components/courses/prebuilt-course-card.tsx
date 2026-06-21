import Image from "next/image"
import { ArrowRight, BadgeCheck, BookOpen, Clock, Play } from "lucide-react"

import type { PrebuiltCourse } from "@/lib/prebuilt-courses"

export function PrebuiltCourseCard({ course }: { course: PrebuiltCourse }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#eceef2] bg-white p-4 transition-colors hover:border-[#d0d5dd] sm:flex-row sm:items-stretch sm:gap-5">
      <div className="relative h-44 w-full shrink-0 self-stretch overflow-hidden rounded-xl sm:h-auto sm:w-52">
        <Image
          src={course.img}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 208px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/5" />
        <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#101928] shadow-sm">
          <Play className="size-4 translate-x-0.5 fill-current" />
        </span>
      </div>
      <div className="font-inter min-w-0 flex-1 space-y-1.5">
        <span className="inline-block rounded-md bg-[#FEECEB] px-2 py-0.5 text-[12px] font-semibold text-[#D42620]">
          {course.tag}
        </span>
        <h3 className="text-[18px] font-semibold text-[#101928]">
          {course.title}
        </h3>
        <p className="line-clamp-2 text-[14px] text-[#667085]">{course.desc}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" /> {course.format}
          </span>
          <span className="flex items-center gap-1">
            <BadgeCheck className="size-3.5" /> Quiz &amp; Certificate
          </span>
        </div>
      </div>
      <button className="font-inter group flex shrink-0 items-center gap-1.5 self-start text-[14px] font-semibold text-primary hover:underline sm:self-center">
        Enroll now
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}
