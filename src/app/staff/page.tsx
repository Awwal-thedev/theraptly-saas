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

import { cn } from "@/lib/utils"
import { useStoredStaff } from "@/lib/client-store"
import { avatarTone, initialsOf, staff as staffSeed, type StaffMember } from "@/lib/staff"
import { AppShell } from "@/components/app/app-shell"
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
      <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-[#16A34A]" />
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-3 py-1 text-[13px] font-semibold text-[#15803d]">
      {role}
    </span>
  )
}

function RowMenu({ onView }: { onView: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More actions"
        onClick={(e) => e.stopPropagation()}
        className="grid size-8 place-items-center rounded-lg border border-[#e4e7ec] text-[#667085] outline-none transition-colors hover:bg-[#f9fafb] data-[popup-open]:bg-[#f3f4f6]"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onView} className="gap-2 py-2 text-[14px]">
          <UserCog className="size-4" /> View profile
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="gap-2 py-2 text-[14px]"
        >
          <Trash2 className="size-4" /> Remove staff
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function StaffPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const storedStaff = useStoredStaff()
  const staff: StaffMember[] = useMemo(
    () => [...storedStaff, ...staffSeed],
    [storedStaff]
  )

  const q = query.trim().toLowerCase()
  const filtered: StaffMember[] = useMemo(
    () =>
      staff.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q)
      ),
    [staff, q]
  )

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize
  const paginated = filtered.slice(start, start + pageSize)

  function open(id: string) {
    router.push(`/staff/${id}`)
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
            <h1 className="font-inter text-[26px] font-semibold tracking-tight text-[#101928]">
              Staff Details
            </h1>
            <p className="font-inter text-[15px] text-[#667085]">
              Here is an overview of your staff details
            </p>
          </div>
          <Button
            nativeButton={false}
            className="font-inter h-12 rounded-xl px-5 text-[15px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-brand-hover"
            render={<Link href="#" />}
          >
            <UserPlus className="size-4" /> Add Workers
          </Button>
        </div>

        {staff.length === 0 ? (
          <EmptyStateCard
            title="No staff yet"
            description="Invite the people who will be taking your training. Once they accept, they'll show up here so you can assign courses and track progress."
            ctaLabel="Invite workers"
            ctaHref="#"
          />
        ) : (
        /* Card */
        <div className="rounded-2xl border border-[#eceef2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <div className="p-4 sm:p-5">
            <SearchInput
              wrapperClassName="w-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for staff..."
            />
          </div>

          {/* Table — md and up */}
          <div className="hidden md:block">
            <table className="font-inter-tight w-full text-left">
              <thead>
                <tr className="border-y border-[#f0f2f5] bg-[#f9fafb] text-[15px] font-medium text-[#667085]">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="hidden px-6 py-3 font-medium lg:table-cell">
                    Date Invited
                  </th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => open(s.id)}
                    className="cursor-pointer border-b border-dashed border-[#eceef2] text-[16px] font-medium text-[#475367] transition-colors last:border-0 hover:bg-[#f9fafb]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <StaffAvatar name={s.name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#101928]">
                            {s.name}
                          </p>
                          <p className="truncate text-[13px] font-normal text-[#667085]">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={s.role.replace(" (DSP)", "")} />
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      {s.invitedDaysAgo}{" "}
                      {s.invitedDaysAgo === 1 ? "day" : "days"} ago
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/staff/${s.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-inter text-[15px] font-semibold text-primary hover:underline"
                        >
                          View
                        </Link>
                        <RowMenu onView={() => open(s.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No staff match “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stacked cards — below md */}
          <div className="font-inter-tight space-y-3 border-t border-[#f0f2f5] p-4 md:hidden">
            {paginated.map((s) => (
              <div
                key={s.id}
                onClick={() => open(s.id)}
                className="cursor-pointer rounded-xl border border-[#f0f2f5] p-4 transition-colors hover:bg-[#f9fafb]"
              >
                <div className="flex items-start gap-3">
                  <StaffAvatar name={s.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#101928]">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.email}</p>
                  </div>
                  <RowMenu onView={() => open(s.id)} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-[15px]">
                  <RoleBadge role={s.role.replace(" (DSP)", "")} />
                  <Link
                    href={`/staff/${s.id}`}
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
                No staff match “{query}”.
              </p>
            )}
          </div>

          {/* Footer / pagination */}
          <div className="flex flex-col gap-4 border-t border-[#f0f2f5] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="font-inter text-[14px] text-[#667085]">
              Showing {total === 0 ? 0 : start + 1} to{" "}
              {Math.min(start + pageSize, total)} of {total} entries
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  className="grid size-9 place-items-center rounded-lg border border-[#e4e7ec] text-[#475367] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {pageList(safePage, totalPages).map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`e${idx}`}
                      className="font-inter grid size-9 place-items-center text-[14px] text-[#98a2b3]"
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
                          ? "bg-primary text-white"
                          : "text-[#475367] hover:bg-[#f9fafb]"
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
                  className="grid size-9 place-items-center rounded-lg border border-[#e4e7ec] text-[#475367] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-inter text-[14px] text-[#667085]">
                  Show
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="font-inter !h-9 rounded-lg border-[#e4e7ec] text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((n) => (
                      <SelectItem key={n} value={String(n)} className="text-[14px]">
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-inter text-[14px] text-[#667085]">
                  entries
                </span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </AppShell>
  )
}
