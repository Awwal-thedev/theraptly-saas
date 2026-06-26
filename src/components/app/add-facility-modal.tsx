"use client"

import { useEffect, useState } from "react"
import { Building2, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { OrgType } from "@/lib/auth/types"
import { addFacility, ORG_TYPE_LABELS } from "@/lib/facilities"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const FACILITY_TYPES = (Object.keys(ORG_TYPE_LABELS) as OrgType[]).map(
  (value) => ({ value, label: ORG_TYPE_LABELS[value] })
)

export function AddFacilityModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [type, setType] = useState<OrgType | "">("")

  useEffect(() => {
    if (open) {
      setName("")
      setType("")
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const valid = name.trim().length > 0 && !!type

  function create() {
    if (!valid) return
    const trimmed = name.trim()
    // Appends and switches the active facility to the new one.
    addFacility({ id: crypto.randomUUID(), name: trimmed, type: type as OrgType })
    toast.success(`${trimmed} created`)
    onClose()
  }

  const inputCls =
    "h-12 w-full rounded-[12px] border-[1.5px] border-[#e5e7ea] bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-[#979797] focus:border-primary focus:ring-3 focus:ring-primary/15 sm:text-[15px]"
  const labelCls = "font-inter text-[13px] font-medium text-[#475367] sm:text-[14px]"

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl bg-white p-6 shadow-[0_4px_40px_rgba(0,0,0,0.08)] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#f4f3ff] text-primary">
              <Building2 className="size-5" />
            </span>
            <div>
              <h2 className="font-inter-tight text-[18px] font-semibold text-[#101928] sm:text-[20px]">
                Add a new facility
              </h2>
              <p className="font-inter text-[13px] text-[#667085]">
                It starts as its own isolated workspace.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#667085] transition-colors hover:bg-[#f9fafb]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="new-facility-name" className={labelCls}>
              Facility name
            </label>
            <input
              id="new-facility-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lakeside Clinic"
              className={cn(inputCls, "mt-2")}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>Facility type</label>
            <Select
              items={FACILITY_TYPES}
              value={type}
              onValueChange={(v) => setType((v ?? "") as OrgType)}
            >
              <SelectTrigger className="mt-2 !h-12 w-full rounded-[12px] border-[#e5e7ea] px-4 text-[15px]">
                <SelectValue placeholder="Select facility type" />
              </SelectTrigger>
              <SelectContent>
                {FACILITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-[15px]">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="font-inter h-12 flex-1 rounded-xl border border-[#e4e7ec] text-[15px] font-semibold text-[#475367] transition-colors hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={create}
            disabled={!valid}
            className="font-inter h-12 flex-1 rounded-xl bg-primary text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-[#e4e7ec] disabled:text-[#98a2b3]"
          >
            Create facility
          </button>
        </div>
      </div>
    </div>
  )
}
