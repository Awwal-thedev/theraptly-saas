"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/lib/auth/auth-context"
import { Splash } from "@/components/brand/splash"

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
    else if (!user.onboarded) router.replace("/onboarding")
    else router.replace("/dashboard")
  }, [user, loading, router])

  return <Splash label="Getting things ready…" />
}
