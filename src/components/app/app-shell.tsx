"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ComponentType, SVGProps } from "react"
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from "lucide-react"
import {
  BookOpenIcon as CoursesOutline,
  CreditCardIcon as BillingOutline,
  DocumentTextIcon as DocOutline,
  LifebuoyIcon as HelpOutline,
  Squares2X2Icon as DashOutline,
  UsersIcon as StaffOutline,
} from "@heroicons/react/24/outline"
import {
  BookOpenIcon as CoursesSolid,
  CreditCardIcon as BillingSolid,
  DocumentTextIcon as DocSolid,
  LifebuoyIcon as HelpSolid,
  Squares2X2Icon as DashSolid,
  UsersIcon as StaffSolid,
} from "@heroicons/react/24/solid"

import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"
import { Logo, LogoMark } from "@/components/brand/logo"
import { CourseReadyBanner } from "@/components/dashboard/course-ready-banner"
import { Splash } from "@/components/brand/splash"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export type Crumb = { label: string; href?: string }

type IconType = ComponentType<SVGProps<SVGSVGElement>>
type NavItem = {
  label: string
  href: string
  outline: IconType
  solid: IconType
}
type NavSection = { heading: string; items: NavItem[] }

const NAV: NavSection[] = [
  {
    heading: "Main Menu",
    items: [
      { label: "Dashboard", href: "/dashboard", outline: DashOutline, solid: DashSolid },
      { label: "Documents", href: "/documents", outline: DocOutline, solid: DocSolid },
      { label: "Courses", href: "/courses", outline: CoursesOutline, solid: CoursesSolid },
    ],
  },
  {
    heading: "Performance",
    items: [
      { label: "Staff Management", href: "/staff", outline: StaffOutline, solid: StaffSolid },
    ],
  },
  {
    heading: "Settings",
    items: [
      { label: "Billing", href: "/billing", outline: BillingOutline, solid: BillingSolid },
      { label: "Help Center", href: "/help", outline: HelpOutline, solid: HelpSolid },
    ],
  },
]

function SidebarBody({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  return (
    <>
      <div
        className={cn(
          "flex h-[68px] items-center",
          collapsed ? "justify-center px-0" : "px-6"
        )}
      >
        {collapsed ? <LogoMark href="/dashboard" /> : <Logo href="/dashboard" />}
      </div>
      <nav className="flex-1 space-y-6 px-3 py-2">
        {NAV.map((section) => (
          <div key={section.heading} className="space-y-1">
            {collapsed ? (
              <div className="mx-3 mb-2 h-px bg-[#f0f2f5]" />
            ) : (
              <p className="font-inter-tight px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9ea2ae]">
                {section.heading}
              </p>
            )}
            {section.items.map(({ label, href, outline, solid }) => {
              const active = pathname === href || pathname.startsWith(href + "/")
              const Icon = active ? solid : outline
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl py-2.5 text-[15px] font-medium transition-colors",
                    collapsed ? "justify-center px-0" : "px-3",
                    active
                      ? "bg-[#f3f4f6] text-[#101928]"
                      : "text-[#667085] hover:bg-[#f9fafb] hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-[#9ea2ae] group-hover:text-foreground"
                    )}
                  />
                  {!collapsed && (
                    <span className="whitespace-nowrap">{label}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </>
  )
}

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <div className={cn("lg:hidden", !open && "pointer-events-none")}>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-svh w-[280px] flex-col border-r border-[#f0f2f5] bg-white transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-5 grid size-8 place-items-center rounded-lg text-[#667085] hover:bg-[#f9fafb]"
        >
          <X className="size-5" />
        </button>
        <SidebarBody collapsed={false} onNavigate={onClose} />
      </aside>
    </div>
  )
}

function UserMenu({ name, email }: { name: string; email: string }) {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[#f9fafb]"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>
        <span className="font-inter hidden text-[14px] font-semibold text-foreground sm:inline">
          {name}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[#f0f2f5] bg-white p-1 shadow-lg">
            <div className="border-b border-[#f0f2f5] px-3 py-2.5">
              <p className="truncate text-sm font-medium text-foreground">
                {name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[#f9fafb]"
            >
              <LogOut className="size-4 text-muted-foreground" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function OnboardingReminder() {
  return (
    <div className="border-b border-[#ffe3a8] bg-[#fff8e6] px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-[#f59e0b] text-white">
            <Sparkles className="size-4" />
          </span>
          <p className="font-inter text-[14px] font-medium text-[#7a4b00] sm:text-[15px]">
            Finish setting up your organization to unlock all of Theraptly.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="font-inter rounded-lg bg-[#f59e0b] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#d97706] sm:text-[14px]"
        >
          Complete onboarding
        </Link>
      </div>
    </div>
  )
}

function Topbar({
  name,
  email,
  breadcrumb,
  collapsed,
  onToggleSidebar,
  onOpenMobile,
}: {
  name: string
  email: string
  breadcrumb: Crumb[]
  collapsed: boolean
  onToggleSidebar: () => void
  onOpenMobile: () => void
}) {
  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-[#f0f2f5] bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* mobile menu */}
        <button
          onClick={onOpenMobile}
          aria-label="Open menu"
          className="grid size-9 place-items-center rounded-lg text-[#667085] transition-colors hover:bg-[#f9fafb] hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        {/* desktop collapse toggle */}
        <button
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden size-9 place-items-center rounded-lg text-[#667085] transition-colors hover:bg-[#f9fafb] hover:text-foreground lg:grid"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </button>
        <div className="font-inter flex items-center gap-1.5 text-[14px]">
          {breadcrumb.map((crumb, i) => {
            const last = i === breadcrumb.length - 1
            return (
              <span key={crumb.label} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[#cbd2dc]">/</span>}
                {crumb.href && !last ? (
                  <Link
                    href={crumb.href}
                    className="text-[#98a2b3] transition-colors hover:text-foreground hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      last ? "font-medium text-[#2d3748]" : "text-[#98a2b3]"
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="relative grid size-9 place-items-center rounded-full text-[#667085] transition-colors hover:bg-[#f9fafb]"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-white" />
        </button>
        <div className="h-6 w-px bg-[#f0f2f5]" />
        <UserMenu name={name} email={email} />
      </div>
    </header>
  )
}

export function AppShell({
  children,
  breadcrumb = [{ label: "Home", href: "/dashboard" }],
}: {
  children: React.ReactNode
  breadcrumb?: Crumb[]
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Restore + persist the collapsed preference (Notion-style).
  useEffect(() => {
    const saved = window.localStorage.getItem("theraptly:sidebar-collapsed")
    if (saved !== null) setCollapsed(saved === "1")
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      "theraptly:sidebar-collapsed",
      collapsed ? "1" : "0"
    )
  }, [collapsed])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "." && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        setCollapsed((c) => !c)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
  }, [user, loading, router])

  if (loading || !user) {
    return <Splash label="Loading your dashboard…" />
  }

  return (
    <div className="flex h-svh overflow-hidden bg-[#f9fafb]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-svh shrink-0 flex-col border-r border-[#f0f2f5] bg-white transition-[width] duration-200 ease-out lg:flex",
          collapsed ? "w-[76px]" : "w-[264px]"
        )}
      >
        <SidebarBody collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={user.fullName || "User"}
          email={user.email}
          breadcrumb={breadcrumb}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        {!user.onboarded && <OnboardingReminder />}
        <div className="px-5 pt-4 sm:px-8 empty:hidden">
          <CourseReadyBanner />
        </div>
        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
