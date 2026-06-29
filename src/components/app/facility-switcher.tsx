"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { avatarTone, initialsOf } from "@/lib/staff"
import { ORG_TYPE_LABELS, useFacilities, type Facility } from "@/lib/facilities"
import { AddFacilityModal } from "@/components/app/add-facility-modal"

function FacilityLogo({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const { bg, fg } = avatarTone(name)
  return (
    <span
      style={{ backgroundColor: bg, color: fg }}
      className={cn(
        "grid shrink-0 place-items-center rounded-[10px] text-[14px] font-bold",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  )
}

export function FacilitySwitcher({ collapsed }: { collapsed: boolean }) {
  const { facilities, activeId, active, setActive } = useFacilities()
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!active) return null

  function choose(f: Facility) {
    setActive(f.id)
    setOpen(false)
  }

  function openAddFacility() {
    setOpen(false)
    setAddOpen(true)
  }

  return (
    <div ref={ref} className={cn("relative", collapsed ? "px-2" : "px-3")}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={collapsed ? active.name : undefined}
        className={cn(
          "flex w-full items-center rounded-xl border border-line bg-surface transition-colors hover:bg-surface-subtle",
          collapsed ? "justify-center p-1.5" : "gap-2.5 p-2.5",
          open && "border-line-faint bg-surface-subtle"
        )}
      >
        <FacilityLogo name={active.name} className="size-9" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="font-inter block truncate text-[14px] font-semibold text-ink">
                {active.name}
              </span>
              <span className="font-inter block truncate text-[12px] text-ink-muted">
                {ORG_TYPE_LABELS[active.type]}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-ink-faint" />
          </>
        )}
      </button>

      {/* Popover — opens upward */}
      {open && (
        <div
          className={cn(
            "absolute bottom-full z-50 mb-2 w-[280px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_12px_40px_rgba(16,24,40,0.16)]",
            collapsed ? "left-2" : "left-3 right-3 w-auto"
          )}
        >
          <p className="font-inter px-4 pb-1.5 pt-3.5 text-[13px] text-ink-muted">
            Choose a facility
          </p>
          <div className="max-h-[320px] overflow-y-auto px-2 pb-1">
            {facilities.map((f) => {
              const isActive = f.id === activeId
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => choose(f)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                    isActive ? "bg-surface-subtle" : "hover:bg-surface-subtle"
                  )}
                >
                  <FacilityLogo name={f.name} className="size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="font-inter block truncate text-[15px] font-semibold text-ink">
                      {f.name}
                    </span>
                    <span className="font-inter block truncate text-[13px] text-ink-muted">
                      {ORG_TYPE_LABELS[f.type]}
                      {f.plan ? ` · ${f.plan}` : ""}
                    </span>
                  </span>
                  {isActive && (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="border-t border-line p-2">
            <button
              type="button"
              onClick={openAddFacility}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-surface-subtle"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-surface-muted text-ink-body">
                <Plus className="size-5" />
              </span>
              <span className="font-inter text-[15px] font-semibold text-ink">
                Add a new facility
              </span>
            </button>
          </div>
        </div>
      )}

      <AddFacilityModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
