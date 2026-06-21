import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showWordmark?: boolean
  /** Use light text — for placing on the dark brand panel. */
  inverted?: boolean
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-5"
        aria-hidden="true"
      >
        {/* heartbeat pulse inside a rounded shield-ish glyph */}
        <path
          d="M3 12h3l2-5 3 10 2.5-7 1.5 2H21"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function Logo({ className, showWordmark = true, inverted }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark && (
        <span
          className={cn(
            "text-lg font-semibold tracking-tight",
            inverted ? "text-white" : "text-foreground"
          )}
        >
          Therapt<span className="text-primary">ly</span>
        </span>
      )}
    </div>
  )
}
