"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ComponentType, SVGProps } from "react"
import {
  Bell,
  ChevronDown,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from "lucide-react"
import {
  AcademicCapIcon as LearnOutline,
  BookOpenIcon as CoursesOutline,
  Cog6ToothIcon as SettingsOutline,
  CreditCardIcon as BillingOutline,
  DocumentTextIcon as DocOutline,
  LifebuoyIcon as HelpOutline,
  Squares2X2Icon as DashOutline,
  TrophyIcon as CertOutline,
  UsersIcon as StaffOutline,
} from "@heroicons/react/24/outline"
import {
  AcademicCapIcon as LearnSolid,
  BookOpenIcon as CoursesSolid,
  Cog6ToothIcon as SettingsSolid,
  CreditCardIcon as BillingSolid,
  DocumentTextIcon as DocSolid,
  LifebuoyIcon as HelpSolid,
  Squares2X2Icon as DashSolid,
  TrophyIcon as CertSolid,
  UsersIcon as StaffSolid,
} from "@heroicons/react/24/solid"

import { useAuth } from "@/lib/auth/auth-context"
import { useAppView } from "@/lib/auth/view-context"
import {
  PERMISSIONS,
  SYSTEM_ROLE_LABELS,
  WORKER_ROLE_LABELS,
  type NavKey,
  type SystemRole,
  type WorkerRole,
} from "@/lib/auth/roles"
import { cn } from "@/lib/utils"
import { Logo, LogoMark } from "@/components/brand/logo"
import { FacilitySwitcher } from "@/components/app/facility-switcher"
import { CourseReadyBanner } from "@/components/dashboard/course-ready-banner"
import { Splash } from "@/components/brand/splash"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export type Crumb = { label: string; href?: string }

type IconType = ComponentType<SVGProps<SVGSVGElement>>
type NavItem = {
  /** Permission key — undefined items are always shown (learner view). */
  key?: NavKey
  label: string
  href: string
  outline: IconType
  solid: IconType
}
type NavSection = { heading: string; items: NavItem[] }

/** Management view — gated per system role via PERMISSIONS[role].nav. */
const MANAGEMENT_NAV: NavSection[] = [
  {
    heading: "Main Menu",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/dashboard", outline: DashOutline, solid: DashSolid },
      { key: "documents", label: "Documents", href: "/documents", outline: DocOutline, solid: DocSolid },
      { key: "courses", label: "Courses", href: "/courses", outline: CoursesOutline, solid: CoursesSolid },
    ],
  },
  {
    heading: "Performance",
    items: [
      { key: "staff", label: "Staff Management", href: "/staff", outline: StaffOutline, solid: StaffSolid },
    ],
  },
  {
    heading: "Settings",
    items: [
      { key: "settings", label: "Settings", href: "/settings", outline: SettingsOutline, solid: SettingsSolid },
      { key: "billing", label: "Billing", href: "/billing", outline: BillingOutline, solid: BillingSolid },
      { key: "help", label: "Help Center", href: "/help", outline: HelpOutline, solid: HelpSolid },
    ],
  },
]

/** Learner view — identical for every account, elevated or not. */
const LEARNER_NAV: NavSection[] = [
  {
    heading: "Learning",
    items: [
      { label: "My Learning", href: "/dashboard", outline: LearnOutline, solid: LearnSolid },
      { label: "My Certificates", href: "/certificates", outline: CertOutline, solid: CertSolid },
    ],
  },
  {
    heading: "Settings",
    items: [
      { label: "Help Center", href: "/help", outline: HelpOutline, solid: HelpSolid },
    ],
  },
]

/** Resolve the nav sections for the active (role, view), dropping empties. */
function navFor(systemRole: SystemRole, view: "management" | "learner"): NavSection[] {
  if (view === "learner") return LEARNER_NAV
  const allowed = PERMISSIONS[systemRole].nav
  return MANAGEMENT_NAV.map((section) => ({
    ...section,
    items: section.items.filter((i) => !i.key || allowed.includes(i.key)),
  })).filter((section) => section.items.length > 0)
}

function SidebarBody({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { systemRole, view, elevated } = useAppView()
  const sections = navFor(systemRole, view)
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
      {elevated && (
        <div className={cn("pb-1", collapsed ? "px-2" : "px-3")}>
          <ViewSwitcher collapsed={collapsed} />
        </div>
      )}
      <nav className="flex-1 space-y-6 px-3 py-2">
        {sections.map((section) => (
          <div key={section.heading} className="space-y-1">
            {collapsed ? (
              <div className="mx-3 mb-2 h-px bg-line-soft" />
            ) : (
              <p className="font-inter-tight px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
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
                      ? "bg-surface-muted text-ink dark:text-white"
                      : "text-ink-muted hover:bg-surface-subtle hover:text-foreground dark:text-[#c5c5c5]"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-ink-faint group-hover:text-foreground"
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
      <DevRoleSimulator collapsed={collapsed} />
      <div className="border-t border-line-soft py-3">
        <FacilitySwitcher collapsed={collapsed} />
      </div>
    </>
  )
}

function ViewSwitcher({ collapsed }: { collapsed: boolean }) {
  const { view, setView } = useAppView()

  if (collapsed) {
    const next = view === "management" ? "learner" : "management"
    const Icon = view === "management" ? GraduationCap : LayoutGrid
    return (
      <button
        type="button"
        onClick={() => setView(next)}
        title={`Switch to ${next === "management" ? "Management" : "Learner"} view`}
        aria-label={`Switch to ${next === "management" ? "Management" : "Learner"} view`}
        className="grid size-10 w-full place-items-center rounded-xl bg-surface-muted text-ink-body transition-colors hover:bg-line"
      >
        <Icon className="size-5" />
      </button>
    )
  }

  const tabs: { key: "management" | "learner"; label: string; icon: typeof LayoutGrid }[] = [
    { key: "management", label: "Manage", icon: LayoutGrid },
    { key: "learner", label: "Learn", icon: GraduationCap },
  ]
  return (
    <div className="flex rounded-xl bg-surface-muted p-1">
      {tabs.map(({ key, label, icon: Icon }) => {
        const active = view === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={cn(
              "font-inter flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold transition-colors",
              active
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                : "text-ink-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * DEV-ONLY: preview the app as any system / worker role without a separate
 * login. Returns null entirely in production builds.
 */
function DevRoleSimulator({ collapsed }: { collapsed: boolean }) {
  const {
    isDev,
    systemRole,
    simulatedSystemRole,
    setSimulatedSystemRole,
    simulatedWorkerRole,
    setSimulatedWorkerRole,
  } = useAppView()

  if (!isDev || collapsed) return null

  const SYSTEM_ROLES: SystemRole[] = [
    "owner",
    "hr",
    "clinical_director",
    "finance",
    "student",
    "super_admin",
  ]
  const WORKER_ROLES: WorkerRole[] = [
    "front_desk",
    "nurse",
    "doctor",
    "therapist",
    "finance",
    "others",
  ]
  const selectCls =
    "font-inter w-full rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-[12px] text-ink-body outline-none focus:border-primary"

  return (
    <div className="m-3 mt-0 space-y-2 rounded-xl border border-dashed border-hairline bg-surface-subtle p-3">
      <p className="font-inter text-[10px] font-bold uppercase tracking-[0.08em] text-ink-faint">
        Dev · preview as
      </p>
      <select
        aria-label="Simulate system role"
        className={selectCls}
        value={simulatedSystemRole ?? ""}
        onChange={(e) =>
          setSimulatedSystemRole((e.target.value || null) as SystemRole | null)
        }
      >
        <option value="">Real role ({SYSTEM_ROLE_LABELS[systemRole]})</option>
        {SYSTEM_ROLES.map((r) => (
          <option key={r} value={r}>
            {SYSTEM_ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <select
        aria-label="Simulate worker role"
        className={selectCls}
        value={simulatedWorkerRole ?? ""}
        onChange={(e) =>
          setSimulatedWorkerRole((e.target.value || null) as WorkerRole | null)
        }
      >
        <option value="">Worker: Others</option>
        {WORKER_ROLES.map((r) => (
          <option key={r} value={r}>
            Worker: {WORKER_ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </div>
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
          "fixed left-0 top-0 z-50 flex h-svh w-[280px] flex-col border-r border-line-soft bg-sidebar transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-5 grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-subtle"
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
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-subtle"
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
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-line-soft bg-surface p-1 shadow-lg">
            <div className="border-b border-line-soft px-3 py-2.5">
              <p className="truncate text-sm font-medium text-foreground">
                {name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle"
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
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-line-soft bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* mobile menu */}
        <button
          onClick={onOpenMobile}
          aria-label="Open menu"
          className="grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-subtle hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        {/* desktop collapse toggle */}
        <button
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-subtle hover:text-foreground lg:grid"
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
                {i > 0 && <span className="text-line-faint">/</span>}
                {crumb.href && !last ? (
                  <Link
                    href={crumb.href}
                    className="text-ink-faint transition-colors hover:text-foreground hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      last ? "font-medium text-ink-body" : "text-ink-faint"
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
          className="relative grid size-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-subtle"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-surface" />
        </button>
        <div className="h-6 w-px bg-line-soft" />
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
    <div className="flex h-svh overflow-hidden bg-surface-subtle">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-svh shrink-0 flex-col border-r border-line-soft bg-sidebar transition-[width] duration-200 ease-out lg:flex",
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
