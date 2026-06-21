"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/lib/auth/auth-context"
import { Splash } from "@/components/brand/splash"

/**
 * Silent routing gateway reached after email verification.
 * Forks based on the role the user chose during sign-up:
 *   admin → /onboarding (org wizard)
 *   staff → complete worker onboarding → /dashboard
 */
export default function RoleGatewayPage() {
  const { user, loading, completeWorkerOnboarding } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.onboarded) {
      router.replace("/dashboard")
      return
    }

    if (user.role === "staff") {
      completeWorkerOnboarding()
        .then(() => router.replace("/dashboard"))
        .catch(() => router.replace("/onboarding"))
    } else {
      router.replace("/onboarding")
    }
  }, [user, loading, router, completeWorkerOnboarding])

  return <Splash label="Setting up your account…" />
}
