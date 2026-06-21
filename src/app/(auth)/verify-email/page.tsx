"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthHeader } from "@/components/auth/auth-ui"
import { Splash } from "@/components/brand/splash"

const OTP_LENGTH = 6

function OtpInput({
  disabled,
  onComplete,
}: {
  disabled?: boolean
  onComplete: (code: string) => void
}) {
  const [values, setValues] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const completed = useRef(false)

  const focusAt = (i: number) => refs.current[i]?.focus()

  function setAt(i: number, v: string) {
    setValues((prev) => {
      const next = [...prev]
      next[i] = v
      return next
    })
  }

  function handleChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1)
    setAt(i, digit)
    if (digit && i < OTP_LENGTH - 1) focusAt(i + 1)
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (values[i]) {
        setAt(i, "")
      } else if (i > 0) {
        focusAt(i - 1)
        setAt(i - 1, "")
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusAt(i - 1)
    } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      focusAt(i + 1)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("")
    if (!digits.length) return
    const next = Array(OTP_LENGTH).fill("")
    digits.forEach((d, idx) => (next[idx] = d))
    setValues(next)
    focusAt(Math.min(digits.length, OTP_LENGTH - 1))
  }

  useEffect(() => {
    const code = values.join("")
    if (code.length === OTP_LENGTH && !values.includes("") && !completed.current) {
      completed.current = true
      onComplete(code)
    }
    if (values.includes("")) completed.current = false
  }, [values, onComplete])

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3"
      onPaste={handlePaste}
    >
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            "size-11 rounded-[10px] border bg-card text-center text-lg font-medium text-foreground outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/20 disabled:opacity-50 sm:size-12",
            v ? "border-primary" : "border-input"
          )}
        />
      ))}
    </div>
  )
}

export default function VerifyEmailPage() {
  const { user, loading, pendingEmail, verifyEmail, resendCode } = useAuth()
  const router = useRouter()
  const [verifying, setVerifying] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (loading) return
    if (user) {
      router.replace(user.onboarded ? "/dashboard" : "/onboarding/role")
    } else if (!pendingEmail) {
      router.replace("/signup")
    }
  }, [user, loading, pendingEmail, router])

  if (loading || (!pendingEmail && !user)) {
    return <Splash label="Loading…" />
  }

  async function handleComplete(code: string) {
    setVerifying(true)
    try {
      await verifyEmail(code)
      toast.success("Email verified — welcome to Theraptly!")
      router.replace("/onboarding/role")
    } catch {
      toast.error("That code isn't valid or has expired. Try again.")
      setVerifying(false)
      setAttempt((a) => a + 1) // remount the OTP inputs to clear them
    }
  }

  async function resend() {
    try {
      await resendCode()
      toast.success("We sent a new code to your email")
    } catch {
      toast.error("Couldn't resend the code. Please try again.")
    }
  }

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col gap-10"
      >
        <AuthHeader title="We emailed you a code" />

        {/* Content */}
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-[17px] leading-7 text-muted-foreground">
              Enter the verification code sent to:
            </p>
            <div className="flex items-center gap-2.5">
              <span className="rounded-sm bg-[#fdfaed] px-2 py-0.5 text-[17px] font-semibold text-muted-foreground">
                {pendingEmail}
              </span>
              <Link
                href="/signup"
                aria-label="Edit email address"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Pencil className="size-5" />
              </Link>
            </div>
          </div>

          <OtpInput key={attempt} disabled={verifying} onComplete={handleComplete} />

          <div className="h-5">
            {verifying && (
              <p className="flex items-center gap-2 text-[15px] text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Verifying…
              </p>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-[15px] font-medium text-foreground">
            Didn&apos;t get your code?
          </span>
          <button
            type="button"
            onClick={resend}
            disabled={verifying}
            className="px-0.5 py-1.5 text-[15px] font-semibold text-primary hover:underline disabled:opacity-50"
          >
            Send a new code
          </button>
        </div>
      </motion.div>
    </AuthShell>
  )
}
