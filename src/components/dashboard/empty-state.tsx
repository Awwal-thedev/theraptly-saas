"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { X } from "lucide-react"

const STEPS = [
  {
    title: "Select Type of Training",
    body: "Choose whether the training is based on compliance, safety, HR, or any internal policy area.",
  },
  {
    title: "Upload Policies",
    body: "Upload your organization's documents. Theraptly will analyze and prepare a draft training automatically.",
  },
  {
    title: "Configure Course & Assessment",
    body: "Define course structure, quiz settings, difficulty level, and deadlines.",
  },
  {
    title: "Review & Publish Course",
    body: "Review AI-generated lessons and quizzes, make adjustments, and approve for publishing. Instantly make your training available for your team to access and complete.",
  },
  {
    title: "Invite Workers to Course",
    body: "Assign courses to individuals or departments and track progress directly from your dashboard.",
  },
]

export function DashboardEmptyState({ dismissible = true }: { dismissible?: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="relative flex flex-col items-center justify-center py-6 sm:py-10">
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute right-0 top-0 grid size-10 place-items-center rounded-full bg-[#f4f4f4] text-[#475367] transition-colors hover:bg-[#e4e7ec]"
        >
          <X className="size-5" />
        </button>
      )}

      <div className="grid w-full max-w-[970px] items-center gap-10 lg:grid-cols-2 lg:gap-[51px]">
        {/* Illustration card */}
        <div className="flex flex-col gap-6 rounded-[18px] bg-[#d3f5ee] px-8 py-10 sm:px-12 sm:py-14">
          <div className="mx-auto w-full max-w-[345px]">
            <Image
              src="/dashboard/empty-state.png"
              alt=""
              width={690}
              height={514}
              priority
              className="h-auto w-full"
            />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-[24px] font-bold leading-tight text-[#007d45] sm:text-[28px]">
              Turn Your Healthcare Policies into Interactive Training in Minutes.
            </h2>
            <p className="font-inter text-[16px] font-medium text-black/70 sm:text-[17px]">
              Operationalize your policies and procedures by training your staff
            </p>
          </div>
          <Link
            href="/courses/new"
            className="font-inter mt-2 inline-flex w-fit items-center justify-center rounded-full bg-[#007d45] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#006a3a] sm:text-[16px]"
          >
            Create your first course
          </Link>
        </div>

        {/* How to get started */}
        <div className="flex flex-col gap-8">
          <h3 className="text-center font-inter text-[24px] font-bold tracking-tight text-black sm:text-[30px]">
            How to get started
          </h3>
          <ol className="flex flex-col gap-[22px]">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-1">
                <p className="font-inter text-[17px] font-bold text-black sm:text-[18px]">
                  {i + 1}. {s.title}
                </p>
                <p className="font-inter pl-[18px] text-[14px] font-medium leading-relaxed text-[#7c7c7c] sm:text-[15px]">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
