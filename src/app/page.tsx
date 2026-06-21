"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/lib/auth/auth-context"
import { Splash } from "@/components/brand/splash"

export default function RootPage() {
  const { user, loading, pendingEmail } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) router.replace(pendingEmail ? "/verify-email" : "/login")
    else if (!user.onboarded) router.replace("/onboarding")
    else router.replace("/dashboard")
  }, [user, loading, pendingEmail, router])

  return <Splash label="Getting things ready…" />
}
