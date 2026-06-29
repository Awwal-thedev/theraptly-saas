"use client"

import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Generic empty-state card built around the existing dashboard illustration
 * at /public/dashboard/empty-state.png. Reused on courses, staff, and
 * documents list pages so they all read as part of the same family.
 */
export function EmptyStateCard({
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  secondaryCta,
  className,
}: {
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  onCtaClick?: () => void
  secondaryCta?: ReactNode
  className?: string
}) {
  const ctaClass =
    "font-inter inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-brand-hover sm:text-[15px]"
  const cta =
    ctaLabel && (ctaHref || onCtaClick) ? (
      ctaHref ? (
        <Link href={ctaHref} className={ctaClass}>
          {ctaLabel}
        </Link>
      ) : (
        <button type="button" onClick={onCtaClick} className={ctaClass}>
          {ctaLabel}
        </button>
      )
    ) : null

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 rounded-2xl border border-line bg-surface p-8 text-center sm:p-12",
        className
      )}
    >
      <Image
        src="/empty-state.svg"
        alt=""
        width={187}
        height={187}
        priority
        className="size-[180px] sm:size-[200px]"
      />
      <div className="flex flex-col gap-2">
        <h3 className="font-inter-tight text-[18px] font-bold text-ink sm:text-[20px]">
          {title}
        </h3>
        <p className="font-inter mx-auto max-w-[480px] text-[14px] text-ink-body sm:text-[15px]">
          {description}
        </p>
      </div>
      {(cta || secondaryCta) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {cta}
          {secondaryCta}
        </div>
      )}
    </div>
  )
}
