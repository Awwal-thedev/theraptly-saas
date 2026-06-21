"use client"

import * as React from "react"
import { Eye, EyeOff, Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"

/* ---------- shared field styling ---------- */

const inputClass =
  "min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
const labelClass = "text-[15px] font-medium text-foreground"
const errorClass = "text-sm text-destructive"

function FieldRow({
  children,
  error,
}: {
  children: React.ReactNode
  error?: boolean
}) {
  return (
    <div
      className={cn(
        "flex h-[60px] items-center gap-2.5 rounded-xl border bg-card px-4 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20",
        error ? "border-destructive" : "border-input"
      )}
    >
      {children}
    </div>
  )
}

/* ---------- AuthField ---------- */

type AuthFieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  id: string
  label: string
  error?: string
  /** Icon shown on the left of the field. */
  icon?: React.ReactNode
  /** Element shown on the right of the field (e.g. a toggle button). */
  rightSlot?: React.ReactNode
}

export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField({ id, label, error, icon, rightSlot, ...inputProps }, ref) {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <FieldRow error={!!error}>
          {icon}
          <input id={id} ref={ref} className={inputClass} {...inputProps} />
          {rightSlot}
        </FieldRow>
        {error && <p className={errorClass}>{error}</p>}
      </div>
    )
  }
)

/* ---------- PasswordField (AuthField + show/hide) ---------- */

type PasswordFieldProps = Omit<AuthFieldProps, "icon" | "rightSlot" | "type" | "label"> & {
  label?: string
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label = "Password", ...props }, ref) {
    const [show, setShow] = React.useState(false)
    return (
      <AuthField
        ref={ref}
        label={label}
        type={show ? "text" : "password"}
        icon={<Lock className="size-5 shrink-0 text-muted-foreground" />}
        rightSlot={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        {...props}
      />
    )
  }
)

/* ---------- Header ---------- */

export function AuthHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex flex-col gap-8">
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-[28px] font-semibold leading-9 text-[#202020] sm:text-[32px] sm:leading-[40px]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base leading-6 text-muted-foreground sm:text-[17px]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

/* ---------- Microsoft SSO button ---------- */

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  )
}

export function MicrosoftButton({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[60px] w-full items-center justify-center gap-2 rounded-full bg-secondary px-4 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted",
        className
      )}
      {...props}
    >
      <MicrosoftIcon className="size-6" />
      {children}
    </button>
  )
}

/* ---------- Divider ---------- */

export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-5">
      <span className="h-px flex-1 bg-border" />
      <span className="whitespace-nowrap text-[15px] text-muted-foreground">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
