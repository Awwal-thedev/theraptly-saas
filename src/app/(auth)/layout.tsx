import Link from "next/link"
import { ShieldCheck, GraduationCap, ClipboardCheck } from "lucide-react"

import { Logo } from "@/components/brand/logo"

const highlights = [
  {
    icon: GraduationCap,
    title: "Healthcare-ready training",
    desc: "Deliver structured programs built around real compliance requirements.",
  },
  {
    icon: ClipboardCheck,
    title: "Track every completion",
    desc: "Know exactly who has finished required courses — at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "Always audit-ready",
    desc: "Generate evidence of staff readiness whenever auditors ask.",
  },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand / value panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--color-primary) 0, transparent 45%), radial-gradient(circle at 80% 70%, var(--color-chart-2) 0, transparent 40%)",
          }}
        />
        <div className="relative">
          <Link href="/">
            <Logo inverted />
          </Link>
        </div>

        <div className="relative space-y-8">
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Keep your healthcare staff trained, educated, and compliant.
          </h1>
          <ul className="space-y-5">
            {highlights.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-sidebar-foreground/70">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-sidebar-foreground/60">
          Trusted by care teams to stay survey-ready, every day.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
