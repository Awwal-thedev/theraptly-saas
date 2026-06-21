"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BookOpenCheck,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react"

import { useAuth } from "@/lib/auth/auth-context"
import { orgTypes } from "@/lib/onboarding-data"
import { Splash } from "@/components/brand/splash"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"

const completionData = [
  { month: "Jan", completion: 62 },
  { month: "Feb", completion: 68 },
  { month: "Mar", completion: 74 },
  { month: "Apr", completion: 79 },
  { month: "May", completion: 86 },
  { month: "Jun", completion: 91 },
]

const stats = [
  { label: "Active learners", value: "248", icon: Users, delta: "+12 this week" },
  { label: "Courses assigned", value: "36", icon: BookOpenCheck, delta: "4 due soon" },
  { label: "Completion rate", value: "91%", icon: TrendingUp, delta: "+5% vs last month" },
  { label: "Compliance status", value: "Audit-ready", icon: ShieldCheck, delta: "All current" },
]

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
    else if (!user.onboarded) router.replace("/onboarding")
  }, [user, loading, router])

  if (loading || !user || !user.onboarded) {
    return <Splash label="Loading your dashboard…" />
  }

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const orgTypeLabel = user.organization
    ? orgTypes.find((t) => t.value === user.organization!.type)?.label
    : null

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Logo />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Welcome */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome, {user.fullName.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.organization?.name}
              {orgTypeLabel && (
                <>
                  {" · "}
                  <span>{orgTypeLabel}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.organization?.frameworks.map((f) => (
              <Badge key={f} variant="secondary">
                {f}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, delta }) => (
            <div
              key={label}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{delta}</p>
            </div>
          ))}
        </div>

        {/* Chart + next steps */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 space-y-1">
              <h2 className="font-semibold">Training completion</h2>
              <p className="text-sm text-muted-foreground">
                Staff completing required courses over time
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={completionData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completion"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#fill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-semibold">Next steps</h2>
            <ul className="space-y-4">
              <NextStep
                icon={GraduationCap}
                title="Build your first program"
                desc="Assemble courses for your compliance areas."
              />
              <NextStep
                icon={Users}
                title="Invite your team"
                desc="Bring staff in and assign required training."
              />
              <NextStep
                icon={ShieldCheck}
                title="Set audit reminders"
                desc="Stay ahead of upcoming compliance deadlines."
              />
            </ul>
            <Button className="mt-6 w-full" variant="outline">
              Explore the platform
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

function NextStep({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </li>
  )
}
