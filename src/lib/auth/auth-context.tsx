"use client"

/**
 * Mock auth layer for Theraptly.
 *
 * This deliberately mimics the shape of a real auth provider (session,
 * sign-in/up/out, async calls) but persists to localStorage so the frontend
 * is fully functional with no backend. Swap the function bodies for calls to
 * Clerk / NextAuth / Supabase later without touching any screen.
 */

import * as React from "react"

import type {
  Organization,
  SignInInput,
  SignUpInput,
  User,
} from "@/lib/auth/types"

const STORAGE_KEY = "theraptly:session"

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (input: SignInInput) => Promise<User>
  signUp: (input: SignUpInput) => Promise<User>
  signOut: () => void
  completeOnboarding: (organization: Organization) => Promise<User>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function loadUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function persist(user: User | null) {
  if (typeof window === "undefined") return
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

// Simulate network latency so loading states are real.
const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms))

function makeId() {
  return `usr_${Math.random().toString(36).slice(2, 10)}`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setUser(loadUser())
    setLoading(false)
  }, [])

  const signUp = React.useCallback(async (input: SignUpInput) => {
    await delay()
    const newUser: User = {
      id: makeId(),
      fullName: input.fullName,
      email: input.email,
      role: input.role,
      onboarded: false,
      createdAt: new Date().toISOString(),
    }
    persist(newUser)
    setUser(newUser)
    return newUser
  }, [])

  const signIn = React.useCallback(async (input: SignInInput) => {
    await delay()
    // Mock: reuse any stored user, else fabricate a returning admin.
    const existing = loadUser()
    const signedIn: User =
      existing && existing.email === input.email
        ? existing
        : {
            id: makeId(),
            fullName: input.email.split("@")[0].replace(/[._-]/g, " "),
            email: input.email,
            role: "admin",
            onboarded: true,
            organization: {
              name: "Demo Health System",
              type: "hospital",
              teamSize: "201-1000",
              frameworks: ["HIPAA", "OSHA"],
            },
            createdAt: new Date().toISOString(),
          }
    persist(signedIn)
    setUser(signedIn)
    return signedIn
  }, [])

  const completeOnboarding = React.useCallback(
    async (organization: Organization) => {
      await delay(500)
      const current = loadUser()
      if (!current) throw new Error("No active session")
      const updated: User = { ...current, organization, onboarded: true }
      persist(updated)
      setUser(updated)
      return updated
    },
    []
  )

  const signOut = React.useCallback(() => {
    persist(null)
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, loading, signIn, signUp, signOut, completeOnboarding }),
    [user, loading, signIn, signUp, signOut, completeOnboarding]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
