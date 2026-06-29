"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Ban,
  Check,
  MoreVertical,
  Pencil,
  RotateCcw,
  ShieldX,
  UserPlus,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAppView } from "@/lib/auth/view-context"
import type { OrgType } from "@/lib/auth/types"
import {
  ORG_TYPE_LABELS,
  updateFacility,
  useFacilities,
} from "@/lib/facilities"
import {
  ASSIGNABLE_ROLE_ORDER,
  CAPABILITY_LABELS,
  CAPABILITY_ORDER,
  can,
  NAV_LABELS,
  NAV_ORDER,
  PERMISSIONS,
  SYSTEM_ROLE_LABELS,
  type SystemRole,
} from "@/lib/auth/roles"
import {
  updateUser,
  useFacilityUsers,
  type FacilityUser,
  type UserStatus,
} from "@/lib/users"
import { avatarTone, initialsOf } from "@/lib/staff"
import { AppShell } from "@/components/app/app-shell"
import { InviteUserModal } from "@/components/app/invite-user-modal"
import { SearchInput } from "@/components/ui/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TabKey = "users" | "roles" | "facility"

const TABS: { key: TabKey; label: string }[] = [
  { key: "users", label: "Users & Permissions" },
  { key: "roles", label: "Roles" },
  { key: "facility", label: "Facility" },
]

/* ---------------- badges ---------------- */

const SYSTEM_ROLE_BADGE: Record<SystemRole, string> = {
  super_admin: "bg-[#fef3f2] text-[#b42318]",
  owner: "bg-[#f4f3ff] text-[#5c47ff]",
  hr: "bg-[#eff4ff] text-[#3538cd]",
  clinical_director: "bg-[#ecfdf3] text-[#027a48]",
  finance: "bg-[#fffaeb] text-[#b54708]",
  student: "bg-[#f2f4f7] text-[#475467]",
}

function SystemRoleBadge({ role }: { role: SystemRole }) {
  return (
    <span
      className={cn(
        "font-inter inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-semibold",
        SYSTEM_ROLE_BADGE[role]
      )}
    >
      {SYSTEM_ROLE_LABELS[role]}
    </span>
  )
}

const STATUS_STYLE: Record<UserStatus, { dot: string; text: string; label: string }> = {
  active: { dot: "bg-[#12b76a]", text: "text-[#027a48]", label: "Active" },
  invited: { dot: "bg-[#f79009]", text: "text-[#b54708]", label: "Invited" },
  suspended: { dot: "bg-[#98a2b3]", text: "text-[#667085]", label: "Suspended" },
}

function StatusBadge({ status }: { status: UserStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", s.dot)} />
      <span className={cn("font-inter text-[14px] font-medium", s.text)}>
        {s.label}
      </span>
    </span>
  )
}

function UserAvatar({ name }: { name: string }) {
  const { bg, fg } = avatarTone(name)
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {initialsOf(name)}
    </span>
  )
}

/* ---------------- row actions ---------------- */

function RowMenu({ user, onEdit }: { user: FacilityUser; onEdit: () => void }) {
  const isOwner = user.systemRole === "owner"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="User actions"
        className="grid size-8 place-items-center rounded-lg border border-[#e4e7ec] text-[#667085] outline-none transition-colors hover:bg-[#f9fafb] data-[popup-open]:bg-[#f3f4f6]"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={onEdit}
          className="gap-2 py-2 text-[14px]"
        >
          <Pencil className="size-4" /> Change role
        </DropdownMenuItem>
        {isOwner ? (
          <DropdownMenuItem
            disabled
            className="gap-2 py-2 text-[14px] opacity-50"
          >
            <ShieldX className="size-4" /> Owner can't be suspended
          </DropdownMenuItem>
        ) : user.status === "suspended" ? (
          <DropdownMenuItem
            onClick={() => updateUser(user.id, { status: "active" })}
            className="gap-2 py-2 text-[14px]"
          >
            <RotateCcw className="size-4" /> Reactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => updateUser(user.id, { status: "suspended" })}
            className="gap-2 py-2 text-[14px]"
          >
            <Ban className="size-4" /> Suspend access
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---------------- Users & Permissions tab ---------------- */

function UsersTab() {
  const users = useFacilityUsers()
  const [query, setQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<FacilityUser | null>(null)

  function openInvite() {
    setEditUser(null)
    setModalOpen(true)
  }
  function openEdit(user: FacilityUser) {
    setEditUser(user)
    setModalOpen(true)
  }

  const q = query.trim().toLowerCase()
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      SYSTEM_ROLE_LABELS[u.systemRole].toLowerCase().includes(q)
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-inter text-[18px] font-semibold text-[#101928]">
            Team members
          </h2>
          <p className="font-inter text-[14px] text-[#667085]">
            Invite people and set their access by assigning a role. Permissions
            follow the role.
          </p>
        </div>
        <button
          type="button"
          onClick={openInvite}
          className="font-inter inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <UserPlus className="size-4" /> Invite user
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#eceef2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
        <div className="p-4 sm:p-5">
          <SearchInput
            wrapperClassName="w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name, email, or role..."
          />
        </div>

        {/* Table — md and up */}
        <div className="hidden md:block">
          <table className="font-inter-tight w-full text-left">
            <thead>
              <tr className="border-b border-[#f0f2f5] bg-[#f9fafb] text-[14px] font-medium text-[#667085]">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">System role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="hidden px-6 py-3 font-medium lg:table-cell">
                  Last active
                </th>
                <th className="px-6 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-dashed border-[#eceef2] text-[15px] text-[#475367] last:border-0"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={u.name} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#101928]">
                          {u.name}
                        </p>
                        <p className="truncate text-[13px] font-normal text-[#667085]">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SystemRoleBadge role={u.systemRole} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="hidden px-6 py-4 text-[14px] text-[#667085] lg:table-cell">
                    {u.lastActive ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <RowMenu user={u} onEdit={() => openEdit(u)} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-[#667085]"
                  >
                    No users match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stacked cards — below md */}
        <div className="space-y-3 p-4 pt-0 md:hidden">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-[#f0f2f5] p-4"
            >
              <div className="flex items-start gap-3">
                <UserAvatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#101928]">{u.name}</p>
                  <p className="truncate text-sm text-[#667085]">{u.email}</p>
                </div>
                <RowMenu user={u} onEdit={() => openEdit(u)} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <SystemRoleBadge role={u.systemRole} />
                <span className="ml-auto">
                  <StatusBadge status={u.status} />
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-[#667085]">
              No users match “{query}”.
            </p>
          )}
        </div>
      </div>

      <InviteUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editUser={editUser}
      />
    </div>
  )
}

/* ---------------- Roles reference tab ---------------- */

function MatrixCell({ on }: { on: boolean }) {
  return (
    <td className="px-4 py-3">
      <div className="flex justify-center">
        {on ? (
          <span className="grid size-5 place-items-center rounded-full bg-[#ecfdf3] text-[#027a48]">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : (
          <span className="text-[#cbd2dc]">—</span>
        )}
      </div>
    </td>
  )
}

function GroupRow({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={1 + ASSIGNABLE_ROLE_ORDER.length}
        className="font-inter sticky left-0 bg-[#f9fafb] px-6 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-[#98a2b3]"
      >
        {label}
      </td>
    </tr>
  )
}

function RolesTab() {
  return (
    <div className="space-y-10">
      {/* System roles matrix */}
      <div className="space-y-4">
        <div>
          <h2 className="font-inter text-[18px] font-semibold text-[#101928]">
            System roles — platform access
          </h2>
          <p className="font-inter text-[14px] text-[#667085]">
            Access is set by the role you assign. A check means that role can see
            the section or perform the action.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#eceef2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <table className="font-inter w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[#f0f2f5]">
                <th className="sticky left-0 bg-white px-6 py-4 text-[13px] font-semibold text-[#667085]">
                  Access
                </th>
                {ASSIGNABLE_ROLE_ORDER.map((r) => (
                  <th key={r} className="px-4 py-4 text-center">
                    <span className="font-inter text-[13px] font-semibold text-[#101928]">
                      {SYSTEM_ROLE_LABELS[r]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#475367]">
              <GroupRow label="Navigation" />
              {NAV_ORDER.map((navKey) => (
                <tr key={navKey} className="border-b border-[#f5f6f8] last:border-0">
                  <td className="sticky left-0 bg-white px-6 py-3 font-medium text-[#344054]">
                    {NAV_LABELS[navKey]}
                  </td>
                  {ASSIGNABLE_ROLE_ORDER.map((r) => (
                    <MatrixCell key={r} on={PERMISSIONS[r].nav.includes(navKey)} />
                  ))}
                </tr>
              ))}

              <GroupRow label="Actions & data" />
              {CAPABILITY_ORDER.map((capKey) => (
                <tr key={capKey} className="border-b border-[#f5f6f8] last:border-0">
                  <td className="sticky left-0 bg-white px-6 py-3 font-medium text-[#344054]">
                    {CAPABILITY_LABELS[capKey]}
                  </td>
                  {ASSIGNABLE_ROLE_ORDER.map((r) => (
                    <MatrixCell key={r} on={can(r, capKey)} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-inter text-[13px] text-[#98a2b3]">
          Super Admin is a Theraptly-internal role with cross-tenant access and
          isn't assignable here.
        </p>
      </div>
    </div>
  )
}

/* ---------------- Facility profile tab ---------------- */

const FACILITY_TYPE_OPTIONS = (Object.keys(ORG_TYPE_LABELS) as OrgType[]).map(
  (value) => ({ value, label: ORG_TYPE_LABELS[value] })
)

function FacilityTab() {
  const { active } = useFacilities()
  const [name, setName] = useState("")
  const [type, setType] = useState<OrgType | "">("")

  useEffect(() => {
    if (active) {
      setName(active.name)
      setType(active.type)
    }
  }, [active])

  if (!active) return null

  const dirty = name.trim() !== active.name || type !== active.type
  const valid = name.trim().length > 0 && !!type
  const tone = avatarTone(name || active.name)

  function save() {
    if (!valid || !active) return
    updateFacility(active.id, { name: name.trim(), type: type as OrgType })
    toast.success("Facility updated")
  }

  const inputCls =
    "h-12 w-full rounded-[12px] border-[1.5px] border-field bg-surface text-foreground dark:bg-surface-subtle px-4 text-[14px] outline-none transition-colors placeholder:text-[#979797] focus:border-primary focus:ring-3 focus:ring-primary/15 sm:text-[15px]"
  const labelCls = "font-inter text-[13px] font-medium text-[#475367] sm:text-[14px]"

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-inter text-[18px] font-semibold text-[#101928]">
          Facility profile
        </h2>
        <p className="font-inter text-[14px] text-[#667085]">
          Update the active facility's name and type. These appear across the
          workspace and in the facility switcher.
        </p>
      </div>

      <div className="rounded-2xl border border-[#eceef2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-6">
        <div className="flex items-center gap-4 border-b border-[#f0f2f5] pb-5">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-2xl text-[18px] font-bold"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
          >
            {initialsOf(name || active.name)}
          </span>
          <div>
            <p className="font-inter text-[11px] font-bold uppercase tracking-[0.06em] text-[#98a2b3]">
              Active facility
            </p>
            <p className="font-inter text-[16px] font-semibold text-[#101928]">
              {name || active.name}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="facility-name" className={labelCls}>
              Facility name
            </label>
            <input
              id="facility-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunrise Behavioral Health"
              className={cn(inputCls, "mt-2")}
            />
          </div>
          <div>
            <label className={labelCls}>Facility type</label>
            <Select
              items={FACILITY_TYPE_OPTIONS}
              value={type}
              onValueChange={(v) => setType((v ?? "") as OrgType)}
            >
              <SelectTrigger className="mt-2 !h-12 rounded-[12px] border-[#e5e7ea] px-4 text-[15px]">
                <SelectValue placeholder="Select facility type" />
              </SelectTrigger>
              <SelectContent>
                {FACILITY_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-[15px]">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Plan — read-only, lives in Billing (per-facility) */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f9fafb] px-4 py-3.5">
          <div>
            <p className="font-inter text-[13px] font-medium text-[#475367]">
              Subscription plan
            </p>
            <p className="font-inter text-[15px] font-semibold text-[#101928]">
              {active.plan ?? "No plan"}
            </p>
          </div>
          <Link
            href="/billing"
            className="font-inter text-[14px] font-semibold text-primary transition-colors hover:text-brand-hover"
          >
            Manage in Billing
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setName(active.name)
              setType(active.type)
            }}
            disabled={!dirty}
            className="font-inter h-11 rounded-xl border border-[#e4e7ec] px-5 text-[14px] font-semibold text-[#475367] transition-colors hover:bg-[#f9fafb] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || !valid}
            className="font-inter h-11 rounded-xl bg-primary px-5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-[#e4e7ec] disabled:text-[#98a2b3]"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}


export default function SettingsPage() {
  const { systemRole } = useAppView()
  const [tab, setTab] = useState<TabKey>("users")
  const allowed = PERMISSIONS[systemRole].nav.includes("settings")

  return (
    <AppShell
      breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "Settings" }]}
    >
      {!allowed ? (
        <div className="mx-auto mt-10 max-w-[440px] rounded-2xl border border-[#eceef2] bg-white p-10 text-center shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <ShieldX className="mx-auto mb-3 size-9 text-[#d0d5dd]" />
          <h2 className="font-inter text-[18px] font-semibold text-[#101928]">
            No access
          </h2>
          <p className="font-inter mt-1 text-[14px] text-[#667085]">
            Settings are managed by your facility Owner.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="font-inter text-[28px] font-semibold tracking-tight text-[#101928]">
              Settings
            </h1>
            <p className="font-inter text-[14px] text-[#667085]">
              Manage your facility, team access, and account preferences
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

          <div className="pt-8">
            {tab === "users" && <UsersTab />}
            {tab === "roles" && <RolesTab />}
            {tab === "facility" && <FacilityTab />}
          </div>
        </div>
      )}
    </AppShell>
  )
}
