"use client"

import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type ResultStatus = "success" | "error"

export function ResultModal({
  open,
  status,
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  open: boolean
  status: ResultStatus
  title: string
  description: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
}) {
  if (!open) return null

  const isSuccess = status === "success"
  const Icon = isSuccess ? Check : X

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-[440px] rounded-3xl bg-white p-8 text-center shadow-[0_4px_40px_rgba(0,0,0,0.08)] sm:p-10">
        {/* Icon */}
        <div
          className={cn(
            "mx-auto grid size-[86px] place-items-center rounded-full",
            isSuccess ? "bg-[#ebfff8]" : "bg-[#fef3f2]"
          )}
        >
          <span
            className={cn(
              "grid size-[66px] place-items-center rounded-full text-white",
              isSuccess ? "bg-[#22b056]" : "bg-[#f04438]"
            )}
          >
            <Icon className="size-8" strokeWidth={2.5} />
          </span>
        </div>

        <h2 className="font-inter-tight mt-4 text-[24px] font-semibold tracking-tight text-[#111]">
          {title}
        </h2>
        <p className="font-inter mx-auto mt-2 max-w-[320px] text-[15px] leading-[22px] text-[#8a8a8a]">
          {description}
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <Button
            onClick={onPrimary}
            className="font-inter h-12 w-full rounded-xl text-[15px] font-semibold hover:bg-brand-hover"
          >
            {primaryLabel}
          </Button>
          <button
            onClick={onSecondary}
            className="font-inter h-12 w-full rounded-xl border border-[#e0e0e0] text-[15px] font-semibold text-[#111] transition-colors hover:bg-[#f9fafb]"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
