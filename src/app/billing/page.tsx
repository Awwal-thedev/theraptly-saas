"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CalendarDays,
  CreditCard,
  FileText,
  Receipt,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { AppShell } from "@/components/app/app-shell"

type TabKey = "overview" | "history" | "subscription" | "payment"

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "history", label: "Billing History" },
  { key: "subscription", label: "Subscription" },
  { key: "payment", label: "Payment Method" },
]

/**
 * Account-level billing data. Static for now — when the backend lands this
 * becomes a query against the org's subscription record.
 */
const PLAN = {
  name: "Growth Plan",
  staffRange: "11-50 staff members",
  cycle: "Quarterly billing cycle",
  nextInvoiceAmount: "$690",
  nextInvoiceDate: "July 12, 2026",
}

const USAGE = {
  used: 23,
  limit: 50,
}

const PAYMENT = {
  brand: "Visa",
  last4: "4242",
  expiry: "08/27",
  address: "North Carolina, United States",
}

type Invoice = {
  id: string
  date: string
  amount: string
  status: "Paid" | "Due" | "Failed"
}

const INVOICES: Invoice[] = [
  { id: "TH-8842", date: "Oct 24, 2026", amount: "$249.00", status: "Paid" },
  { id: "TH-7291", date: "Sep 24, 2026", amount: "$249.00", status: "Paid" },
]

const CARD =
  "rounded-2xl border border-[#eceef2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
const EYEBROW =
  "font-inter text-[12px] font-bold uppercase tracking-[0.06em] text-primary"
const SECTION_EYEBROW =
  "font-inter text-[12px] font-bold uppercase tracking-[0.06em] text-[#64748b]"
const LINK_BTN =
  "font-inter text-[14px] font-bold text-primary transition-colors hover:text-brand-hover"

function CurrentPlanCard() {
  return (
    <div className={cn(CARD, "flex flex-1 flex-col")}>
      <div className="flex items-start justify-between">
        <p className={EYEBROW}>Current Plan</p>
        <button type="button" className={LINK_BTN}>
          Change plan
        </button>
      </div>
      <h3 className="font-inter mt-3 text-[20px] font-bold text-[#0f172a]">
        {PLAN.name}
      </h3>
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2.5 text-[14px] text-[#475569]">
          <Users className="size-4 shrink-0 text-[#94a3b8]" />
          <span>{PLAN.staffRange}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[14px] text-[#475569]">
          <CalendarDays className="size-4 shrink-0 text-[#94a3b8]" />
          <span>{PLAN.cycle}</span>
        </div>
        <div className="mt-1 flex items-center gap-2.5 border-t border-[#f1f5f9] pt-3 text-[14px] text-[#475569]">
          <Receipt className="size-4 shrink-0 text-[#94a3b8]" />
          <span>
            Next invoice:{" "}
            <span className="font-bold text-[#0f172a]">
              {PLAN.nextInvoiceAmount}
            </span>{" "}
            on {PLAN.nextInvoiceDate}
          </span>
        </div>
      </div>
    </div>
  )
}

function StaffUsageCard() {
  const pct = Math.min(100, Math.round((USAGE.used / USAGE.limit) * 100))
  const nearLimit = pct >= 80
  return (
    <div className={cn(CARD, "flex flex-1 flex-col")}>
      <div className="flex items-start justify-between">
        <div>
          <p className={SECTION_EYEBROW}>Staff Usage</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="font-inter text-[24px] font-black leading-none text-[#0f172a]">
              {USAGE.used}
            </span>
            <span className="font-inter text-[14px] text-[#64748b]">
              / {USAGE.limit} active
            </span>
          </p>
        </div>
        <button type="button" className={LINK_BTN}>
          Upgrade plan
        </button>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>

      {nearLimit && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3">
          <AlertTriangle className="size-5 shrink-0 text-[#f59e0b]" />
          <p className="font-inter text-[12px] font-medium text-[#92400e]">
            Staff limit almost reached. Consider upgrading soon.
          </p>
        </div>
      )}
    </div>
  )
}

function PaymentMethodCard() {
  return (
    <div className={cn(CARD, "flex flex-1 flex-col")}>
      <div className="flex items-start justify-between gap-3 border-b border-[#f1f5f9] pb-6">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-12 shrink-0 place-items-center rounded border border-[#e2e8f0] bg-[#f1f5f9] text-[#1a1f71]">
            <CreditCard className="size-4" />
          </span>
          <div>
            <p className="font-inter text-[14px] font-bold text-[#0f172a]">
              {PAYMENT.brand} •••• {PAYMENT.last4}
            </p>
            <p className="font-inter text-[12px] text-[#64748b]">
              Expires {PAYMENT.expiry}
            </p>
          </div>
        </div>
        <button type="button" className={LINK_BTN}>
          Update payment
        </button>
      </div>
      <div className="pt-5">
        <p className={SECTION_EYEBROW}>Billing address</p>
        <p className="font-inter mt-1 text-[14px] text-[#334155]">
          {PAYMENT.address}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const styles: Record<Invoice["status"], string> = {
    Paid: "bg-[#d1fae5] text-[#047857]",
    Due: "bg-[#fef3c7] text-[#92400e]",
    Failed: "bg-[#fee2e2] text-[#b91c1c]",
  }
  return (
    <span
      className={cn(
        "font-inter inline-flex items-center rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
        styles[status]
      )}
    >
      {status}
    </span>
  )
}

function RecentInvoicesCard() {
  return (
    <div className={cn(CARD, "flex flex-col lg:w-[632px]")}>
      <div className="flex items-center justify-between pb-4">
        <p className={SECTION_EYEBROW}>Recent Invoices</p>
        <button type="button" className={cn(LINK_BTN, "text-[12px]")}>
          View all invoices
        </button>
      </div>
      <div className="space-y-3">
        {INVOICES.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-lg border border-[#f1f5f9] p-3"
          >
            <div className="flex items-center gap-3">
              <FileText className="size-5 shrink-0 text-[#94a3b8]" />
              <div>
                <p className="font-inter text-[14px] font-medium text-[#0f172a]">
                  Invoice #{inv.id}
                </p>
                <p className="font-inter text-[12px] text-[#64748b]">
                  {inv.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-inter text-[14px] font-bold text-[#0f172a]">
                {inv.amount}
              </p>
              <StatusBadge status={inv.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className={cn(CARD, "flex flex-col items-center gap-2 py-16 text-center")}>
      <h3 className="font-inter text-[16px] font-semibold text-[#101928]">
        {label}
      </h3>
      <p className="font-inter max-w-[420px] text-[14px] text-[#667085]">
        This section is on the way. For now, manage everything from the Overview
        tab.
      </p>
    </div>
  )
}

export default function BillingPage() {
  const [tab, setTab] = useState<TabKey>("overview")

  return (
    <AppShell
      breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "Billing" }]}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-inter text-[28px] font-semibold tracking-tight text-[#272b30]">
            Billing
          </h1>
          <p className="font-inter text-[14px] text-[#98a2b3]">
            Manage your billing and payment details
          </p>
        </div>

        {/* Tab nav */}
        <div className="-mb-px flex gap-8 overflow-x-auto border-b border-[#f0f2f5]">
          {TABS.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "font-inter whitespace-nowrap border-b-2 px-1 pb-3 text-[14px] transition-colors",
                  active
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent font-medium text-[#818898] hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-6 lg:flex-row">
              <CurrentPlanCard />
              <StaffUsageCard />
            </div>
            <div className="flex flex-col gap-6 lg:flex-row">
              <PaymentMethodCard />
              <RecentInvoicesCard />
            </div>
          </div>
        )}

        {tab === "history" && <ComingSoon label="Billing History" />}
        {tab === "subscription" && <ComingSoon label="Subscription" />}
        {tab === "payment" && <ComingSoon label="Payment Method" />}
      </div>
    </AppShell>
  )
}
