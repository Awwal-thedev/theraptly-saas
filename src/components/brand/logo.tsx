import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showWordmark?: boolean
  /** Use light text — for placing on a dark panel. */
  inverted?: boolean
  /** When set, wraps the logo in a Link to this href (e.g. "/dashboard"). */
  href?: string
}

export function LogoMark({
  className,
  href,
}: {
  className?: string
  href?: string
}) {
  const img = (
    <Image
      src="/auth/logo.svg"
      alt="Theraptly"
      width={29}
      height={29}
      className={cn("size-[29px]", className)}
      priority
    />
  )
  if (!href) return img
  return (
    <Link href={href} aria-label="Go to dashboard" className="inline-flex">
      {img}
    </Link>
  )
}

export function Logo({
  className,
  showWordmark = true,
  inverted,
  href,
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-[9px]", className)}>
      <LogoMark />
      {showWordmark && (
        <span
          className={cn(
            "text-[22px] font-bold tracking-[-0.04em] leading-none",
            inverted ? "text-white" : "text-primary"
          )}
        >
          Theraptly
        </span>
      )}
    </div>
  )
  if (!href) return content
  return (
    <Link href={href} aria-label="Go to dashboard" className="inline-flex">
      {content}
    </Link>
  )
}
