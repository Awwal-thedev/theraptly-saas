"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  UserCog,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { avatarTone, initialsOf } from "@/lib/staff"
import {
  removeUser,
  roleLabel,
  useFacilityUsers,
  userKind,
  type FacilityUser,
} from "@/lib/users"
import { AppShell } from "@/components/app/app-shell"
import { AddStaffModal } from "@/components/staff/add-staff-modal"
import { EmptyStateCard } from "@/components/empty-state-card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchInput } from "@/components/ui/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAGE_SIZES = [10, 25, 50]
type Tab = "all" | "manager" | "worker"

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | "…")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push("…")
  for (let i = start; i <= end; i++) out.push(i)
  if (end < total - 1) out.push("…")
  out.push(total)
  return out
}

function StaffAvatar({ name }: { name: string }) {
  const { bg, fg } = avatarTone(name)
  return (
    <span
      className="relative grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {initialsOf(name)}
      <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface bg-[#16A34A]" />
    </span>
  )
}

/** Role badge — managers (system roles) read indigo, workers (disciplines) green. */
function RoleBadge({ user }: { user: FacilityUser }) {
  const manager = userKind(user) === "manager"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-semibold",
        manager
          ? "bg-[#f4f3ff] text-primary"
          : "bg-[#dcfce7] text-[#15803d] dark:bg-positive-surface dark:text-positive"
      )}
    >
      {roleLabel(user)}
    </span>
  )
}

function RowMenu({
  onView,
  onRemove,
  canRemove,
}: {
  onView: () => void
  onRemove: () => void
  canRemove: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More actions"
        onClick={(e) => e.stopPropagation()}
        className="grid size-8 place-items-center rounded-lg border border-hairline text-ink-muted outline-none transition-colors hover:bg-surface-subtle data-[popup-open]:bg-surface-muted"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onView} className="gap-2 py-2 text-[14px]">
          <UserCog className="size-4" /> View profile
        </DropdownMenuItem>
        {canRemove && (
          <DropdownMenuItem
            variant="destructive"
            onClick={onRemove}
            className="gap-2 py-2 text-[14px]"
          >
            <Trash2 className="size-4" /> Remove
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "font-inter inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[14px] font-semibold transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-ink-muted hover:bg-surface-subtle"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
          active ? "bg-primary/15 text-primary" : "bg-surface-muted text-ink-muted"
        )}
      >
        {count}
      </span>
    </button>
  )
}

export default function StaffPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [tab, setTab] = useState<Tab>("all")
  const [addOpen, setAddOpen] = useState(false)

  const users = useFacilityUsers()

  const counts = useMemo(
    () => ({
      all: users.length,
      manager: users.filter((u) => userKind(u) === "manager").length,
      worker: users.filter((u) => userKind(u) === "worker").length,
    }),
    [users]
  )

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      users.filter((u) => {
        if (tab !== "all" && userKind(u) !== tab) return false
        if (!q) return true
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          roleLabel(u).toLowerCase().includes(q)
        )
      }),
    [users, tab, q]
  )

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize
  const paginated = filtered.slice(start, start + pageSize)

  function open(id: string) {
    router.push(`/staff/${id}`)
  }

  function remove(u: FacilityUser) {
    removeUser(u.id)
    toast.success(`${u.name} removed`)
  }

  return (
    <AppShell
      breadcrumb={[
        { label: "Home", href: "/dashboard" },
        { label: "Staff Management" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-inter text-[26px] font-semibold tracking-tight text-ink">
              Staff Details
            </h1>
            <p className="font-inter text-[15px] text-ink-muted">
              Managers run the facility; workers take assigned training.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="font-inter h-12 rounded-xl px-5 text-[15px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-brand-hover"
          >
            <UserPlus className="size-4" /> Add Staff
          </Button>
        </div>

        {users.length === 0 ? (
          <EmptyStateCard
            title="No staff yet"
            description="Add the managers who help you run this facility and the workers who'll take your training. They'll show up here so you can assign courses and track progress."
            ctaLabel="Add Staff"
            onCtaClick={() => setAddOpen(true)}
          />
        ) : (
          /* Card */
          <div className="rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-1">
                <TabButton
                  active={tab === "all"}
                  onClick={() => {
                    setTab("all")
                    setPage(1)
                  }}
                  label="All"
                  count={counts.all}
                />
                <TabButton
                  active={tab === "manager"}
                  onClick={() => {
                    setTab("manager")
                    setPage(1)
                  }}
                  label="Managers"
                  count={counts.manager}
                />
                <TabButton
                  active={tab === "worker"}
                  onClick={() => {
                    setTab("worker")
                    setPage(1)
                  }}
                  label="Workers"
                  count={counts.worker}
                />
              </div>
              <SearchInput
                wrapperClassName="w-full lg:w-72"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for staff..."
              />
            </div>

            {/* Table — md and up */}
            <div className="hidden md:block">
              <table className="font-inter-tight w-full text-left">
                <thead>
                  <tr className="border-y border-line-soft bg-surface-subtle text-[15px] font-medium text-ink-muted">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="hidden px-6 py-3 font-medium lg:table-cell">
                      Added
                    </th>
                    <th className="px-6 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => open(u.id)}
                      className="cursor-pointer border-b border-dashed border-line text-[16px] font-medium text-ink-body transition-colors last:border-0 hover:bg-surface-subtle"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <StaffAvatar name={u.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">
                              {u.name}
                            </p>
                            <p className="truncate text-[13px] font-normal text-ink-muted">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-inter text-[14px] font-medium text-ink-muted">
                          {userKind(u) === "manager" ? "Manager" : "Worker"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge user={u} />
                      </td>
                      <td className="hidden px-6 py-4 text-[15px] text-ink-muted lg:table-cell">
                        {u.lastActive ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/staff/${u.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-inter text-[15px] font-semibold text-primary hover:underline"
                          >
                            View
                          </Link>
                          <RowMenu
                            onView={() => open(u.id)}
                            onRemove={() => remove(u)}
                            canRemove={u.systemRole !== "owner"}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {total === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-muted-foreground"
                      >
                        No staff match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Stacked cards — below md */}
            <div className="font-inter-tight space-y-3 border-t border-line-soft p-4 md:hidden">
              {paginated.map((u) => (
                <div
                  key={u.id}
                  onClick={() => open(u.id)}
                  className="cursor-pointer rounded-xl border border-line-soft p-4 transition-colors hover:bg-surface-subtle"
                >
                  <div className="flex items-start gap-3">
                    <StaffAvatar name={u.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <RowMenu
                      onView={() => open(u.id)}
                      onRemove={() => remove(u)}
                      canRemove={u.systemRole !== "owner"}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-[15px]">
                    <RoleBadge user={u} />
                    <Link
                      href={`/staff/${u.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-inter font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
              {total === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No staff match your filters.
                </p>
              )}
            </div>

            {/* Footer / pagination */}
            <div className="flex flex-col gap-4 border-t border-line-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="font-inter text-[14px] text-ink-muted">
                Showing {total === 0 ? 0 : start + 1} to{" "}
                {Math.min(start + pageSize, total)} of {total} entries
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    className="grid size-9 place-items-center rounded-lg border border-hairline text-ink-body transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  {pageList(safePage, totalPages).map((p, idx) =>
                    p === "…" ? (
                      <span
                        key={`e${idx}`}
                        className="font-inter grid size-9 place-items-center text-[14px] text-ink-faint"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          "font-inter grid size-9 place-items-center rounded-lg text-[14px] font-medium transition-colors",
                          p === safePage
                            ? "bg-primary text-primary-foreground"
                            : "text-ink-body hover:bg-surface-subtle"
                        )}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                    className="grid size-9 place-items-center rounded-lg border border-hairline text-ink-body transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-inter text-[14px] text-ink-muted">
                    Show
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="font-inter !h-9 rounded-lg border-hairline text-[14px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((n) => (
                        <SelectItem
                          key={n}
                          value={String(n)}
                          className="text-[14px]"
                        >
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="font-inter text-[14px] text-ink-muted">
                    entries
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddStaffModal open={addOpen} onClose={() => setAddOpen(false)} />
    </AppShell>
  )
}
