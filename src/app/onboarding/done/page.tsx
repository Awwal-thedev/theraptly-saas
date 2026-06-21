"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

import { useAuth } from "@/lib/auth/auth-context"
import { LogoMark } from "@/components/brand/logo"
import { Splash } from "@/components/brand/splash"

export default function OnboardingDonePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Only a signed-in, onboarded user should land here. Anyone else gets sent home.
  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
  }, [user, loading, router])

  if (loading || !user) return <Splash label="Loading…" />

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <header className="flex items-center justify-center border-b border-[#f3f4f6] px-6 py-3">
        <LogoMark className="size-[30px]" href="/dashboard" />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-10 text-center">
          <SuccessIllustration />

          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[30px] font-bold leading-tight text-[#171a1f] sm:text-[38px]">
              You&apos;re all <span className="text-primary">Set!</span>
            </h1>
            <p className="font-inter text-[17px] leading-relaxed text-[#898989] sm:text-[22px]">
              Your account has been created successfully. You can now explore
              the dashboard!
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-primary px-16 py-4 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-brand-hover sm:text-[18px]"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}

function SuccessIllustration() {
  return (
    <div className="relative grid size-[220px] place-items-center sm:size-[240px]">
      {/* Halo behind the check badge */}
      <div className="absolute size-[148px] rounded-full bg-primary/10 sm:size-[160px]" />

      {/* Filled check badge */}
      <div className="relative grid size-[88px] place-items-center rounded-full bg-primary text-white shadow-[0_8px_22px_rgba(71,88,224,0.35)] sm:size-[96px]">
        <Check className="size-10 sm:size-12" strokeWidth={3} />
      </div>

      {/* Sparkles + outline circles */}
      <Sparkle className="absolute left-[14px] top-[18px] size-7 text-primary" />
      <Sparkle className="absolute right-[20px] top-[8px] size-5 text-primary" />
      <Sparkle className="absolute right-[2px] top-[78px] size-6 text-primary" />
      <Sparkle className="absolute bottom-[24px] left-[8px] size-5 text-primary" />
      <Sparkle className="absolute bottom-[16px] right-[28px] size-7 text-primary" />
      <Sparkle className="absolute left-[78px] top-[2px] size-4 text-primary" />

      <Ring className="absolute left-[2px] top-[80px] size-4 border-primary/60" />
      <Ring className="absolute right-[44px] top-[36px] size-3 border-primary/60" />
      <Ring className="absolute right-[8px] top-[60px] size-4 border-primary/40" />
      <Ring className="absolute bottom-[10px] left-[80px] size-3 border-primary/60" />
    </div>
  )
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 1.5l1.9 6.6 6.6 1.9-6.6 1.9-1.9 6.6-1.9-6.6-6.6-1.9 6.6-1.9z" />
    </svg>
  )
}

function Ring({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`rounded-full border-[1.5px] bg-transparent ${className ?? ""}`}
    />
  )
}
