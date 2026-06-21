"use client"

import { useEffect, useRef, useState } from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"

const pad = (n: number) => String(n).padStart(2, "0")

function parse(value: string): { h: number; m: number } | null {
  if (!value) return null
  const [hh, mm] = value.split(":").map(Number)
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null
  return { h: hh, m: mm }
}

function formatDisplay(value: string): string {
  const p = parse(value)
  if (!p) return ""
  const ampm = p.h >= 12 ? "PM" : "AM"
  const h12 = p.h % 12 || 12
  return `${pad(h12)}:${pad(p.m)} ${ampm}`
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1) // 1–12
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export function TimePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const parsed = parse(value)
  const initial = parsed ?? { h: 9, m: 0 }
  const [hour12, setHour12] = useState(initial.h % 12 || 12)
  const [minute, setMinute] = useState(initial.m)
  const [ampm, setAmpm] = useState<"AM" | "PM">(
    (parsed?.h ?? 9) >= 12 ? "PM" : "AM"
  )

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

  function commit(nextHour12: number, nextMinute: number, nextAmpm: "AM" | "PM") {
    const h24 =
      nextAmpm === "AM"
        ? nextHour12 === 12
          ? 0
          : nextHour12
        : nextHour12 === 12
          ? 12
          : nextHour12 + 12
    onChange(`${pad(h24)}:${pad(nextMinute)}`)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "font-inter flex h-14 w-full items-center gap-3 rounded-xl border bg-white px-4 text-[15px] outline-none transition-colors",
          open ? "border-primary ring-3 ring-primary/15" : "border-[#e5e7ea]"
        )}
      >
        <Clock className="size-5 shrink-0 text-[#667085]" />
        <span className={value ? "text-[#131927]" : "text-[#98a2b3]"}>
          {value ? formatDisplay(value) : "Select a time"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[260px] rounded-2xl border border-[#eceef2] bg-white p-3 shadow-[0_12px_32px_rgba(16,24,40,0.12)]">
          <div className="grid grid-cols-3 gap-2">
            <ColumnPicker
              label="Hr"
              items={HOURS}
              value={hour12}
              format={(n) => pad(n)}
              onSelect={(n) => {
                setHour12(n)
                commit(n, minute, ampm)
              }}
            />
            <ColumnPicker
              label="Min"
              items={MINUTES}
              value={minute}
              format={(n) => pad(n)}
              onSelect={(n) => {
                setMinute(n)
                commit(hour12, n, ampm)
              }}
            />
            <div className="flex flex-col gap-1">
              <p className="font-inter px-1 text-[11px] font-medium uppercase text-[#98a2b3]">
                AM/PM
              </p>
              {(["AM", "PM"] as const).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setAmpm(label)
                    commit(hour12, minute, label)
                  }}
                  className={cn(
                    "font-inter rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
                    ampm === label
                      ? "bg-primary text-white"
                      : "text-[#344054] hover:bg-[#f3f4f6]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-inter rounded-lg px-3 py-1.5 text-[13px] font-semibold text-primary hover:bg-[#f4f3ff]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ColumnPicker<T>({
  label,
  items,
  value,
  format,
  onSelect,
}: {
  label: string
  items: T[]
  value: T
  format: (item: T) => string
  onSelect: (item: T) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-inter px-1 text-[11px] font-medium uppercase text-[#98a2b3]">
        {label}
      </p>
      <div className="flex max-h-[180px] flex-col gap-1 overflow-y-auto pr-1">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "font-inter rounded-lg px-3 py-2 text-center text-[14px] font-medium transition-colors",
              value === item
                ? "bg-primary text-white"
                : "text-[#344054] hover:bg-[#f3f4f6]"
            )}
          >
            {format(item)}
          </button>
        ))}
      </div>
    </div>
  )
}
