"use client"

/**
 * Real auth layer for Theraptly, backed by Supabase.
 *
 * Flow:
 *  - signUp        → creates the auth user, Supabase emails a 6-digit code
 *  - verifyEmail   → confirms the code, establishing a session
 *  - signIn        → email + password
 *  - completeOnboarding → persists the org (via a Server Action) + marks profile onboarded
 *
 * `user` is derived from the Supabase session joined with the `profiles` row
 * (which carries `onboarded` and the linked organization).
 */

import * as React from "react"
import type { Session } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import {
  completeOnboardingAction,
  completeWorkerOnboardingAction,
} from "@/app/onboarding/actions"
import type {
  Organization,
  SignInInput,
  SignUpInput,
  User,
  UserRole,
} from "@/lib/auth/types"

const PENDING_EMAIL_KEY = "theraptly:pending-email"

interface AuthContextValue {
  user: User | null
  loading: boolean
  /** Email awaiting verification (set after signUp, before a session exists). */
  pendingEmail: string | null
  signUp: (input: SignUpInput) => Promise<{ needsVerification: boolean }>
  signIn: (input: SignInInput) => Promise<User>
  verifyEmail: (code: string) => Promise<void>
  resendCode: () => Promise<void>
  completeOnboarding: (
    organization: Organization,
    invites?: string[]
  ) => Promise<User>
  completeWorkerOnboarding: () => Promise<User>
  signOut: () => Promise<void>
  refresh: () => Promise<User | null>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

type ProfileRow = {
  full_name: string | null
  role: string | null
  onboarded: boolean | null
  organizations:
    | {
        name: string
        type: string
        team_size: string
        frameworks: string[]
      }
    | {
        name: string
        type: string
        team_size: string
        frameworks: string[]
      }[]
    | null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = React.useMemo(() => createClient(), [])
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null)

  const buildUser = React.useCallback(
    async (session: Session | null): Promise<User | null> => {
      if (!session?.user) return null
      const authUser = session.user

      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, role, onboarded, organizations(name, type, team_size, frameworks)"
        )
        .eq("id", authUser.id)
        .maybeSingle()

      const profile = data as ProfileRow | null
      const orgs = profile?.organizations
      const orgRow = Array.isArray(orgs) ? orgs[0] : orgs
      const organization: Organization | undefined = orgRow
        ? {
            name: orgRow.name,
            type: orgRow.type as Organization["type"],
            teamSize: orgRow.team_size,
            frameworks: orgRow.frameworks ?? [],
          }
        : undefined

      return {
        id: authUser.id,
        email: authUser.email ?? "",
        fullName:
          profile?.full_name ??
          (authUser.user_metadata?.full_name as string) ??
          "",
        role: (profile?.role as UserRole) ?? "admin",
        onboarded: profile?.onboarded ?? false,
        organization,
        createdAt: authUser.created_at,
      }
    },
    [supabase]
  )

  const refresh = React.useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const next = await buildUser(session)
    setUser(next)
    return next
  }, [supabase, buildUser])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setPendingEmail(window.sessionStorage.getItem(PENDING_EMAIL_KEY))
    }

    let active = true
    refresh().finally(() => {
      if (active) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const next = await buildUser(session)
      if (active) setUser(next)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase, refresh, buildUser])

  const setPending = React.useCallback((email: string | null) => {
    setPendingEmail(email)
    if (typeof window === "undefined") return
    if (email) window.sessionStorage.setItem(PENDING_EMAIL_KEY, email)
    else window.sessionStorage.removeItem(PENDING_EMAIL_KEY)
  }, [])

  const signUp = React.useCallback(
    async (input: SignUpInput) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { full_name: input.fullName, role: input.role },
        },
      })
      if (error) throw error
      // If email confirmation is disabled, Supabase returns a session immediately.
      if (data.session) {
        setPending(null)
        await refresh()
        return { needsVerification: false }
      }
      setPending(input.email)
      return { needsVerification: true }
    },
    [supabase, setPending, refresh]
  )

  const verifyEmail = React.useCallback(
    async (code: string) => {
      if (!pendingEmail) throw new Error("No email pending verification")
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: code,
        type: "signup",
      })
      if (error) throw error
      setPending(null)
      await refresh()
    },
    [supabase, pendingEmail, setPending, refresh]
  )

  const resendCode = React.useCallback(async () => {
    if (!pendingEmail) throw new Error("No email pending verification")
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
    })
    if (error) throw error
  }, [supabase, pendingEmail])

  const signIn = React.useCallback(
    async (input: SignInInput) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      })
      if (error) throw error
      const next = await refresh()
      if (!next) throw new Error("Could not load your account")
      return next
    },
    [supabase, refresh]
  )

  const completeOnboarding = React.useCallback(
    async (organization: Organization, invites: string[] = []) => {
      await completeOnboardingAction({ organization, invites })
      const next = await refresh()
      if (!next) throw new Error("Could not load your account")
      return next
    },
    [refresh]
  )

  const completeWorkerOnboarding = React.useCallback(async () => {
    await completeWorkerOnboardingAction()
    const next = await refresh()
    if (!next) throw new Error("Could not load your account")
    return next
  }, [refresh])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setPending(null)
    setUser(null)
  }, [supabase, setPending])

  const value = React.useMemo(
    () => ({
      user,
      loading,
      pendingEmail,
      signUp,
      signIn,
      verifyEmail,
      resendCode,
      completeOnboarding,
      completeWorkerOnboarding,
      signOut,
      refresh,
    }),
    [
      user,
      loading,
      pendingEmail,
      signUp,
      signIn,
      verifyEmail,
      resendCode,
      completeOnboarding,
      completeWorkerOnboarding,
      signOut,
      refresh,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
