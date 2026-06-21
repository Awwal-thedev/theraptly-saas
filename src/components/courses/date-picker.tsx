"use client"

import { useEffect, useRef, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const pad = (n: number) => String(n).padStart(2, "0")
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number)
  return { y, m: m - 1, d }
}

function formatDisplay(s: string) {
  if (!s) return ""
  const { y, m, d } = parseISO(s)
  return `${pad(m + 1)}/${pad(d)}/${y}`
}

export function DatePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const today = new Date()
  const init = value ? parseISO(value) : null
  const [view, setView] = useState({
    y: init?.y ?? today.getFullYear(),
    m: init?.m ?? today.getMonth(),
  })

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

  // Re-sync the visible month when the selected value changes externally.
  useEffect(() => {
    if (value) {
      const p = parseISO(value)
      setView({ y: p.y, m: p.m })
    }
  }, [value])

  const firstDay = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const sel = value ? parseISO(value) : null
  const isToday = (d: number) =>
    d === today.getDate() &&
    view.m === today.getMonth() &&
    view.y === today.getFullYear()
  const isSelected = (d: number) =>
    sel != null && d === sel.d && view.m === sel.m && view.y === sel.y

  const prevMonth = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
  const nextMonth = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))
  const pick = (d: number) => {
    onChange(toISO(view.y, view.m, d))
    setOpen(false)
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
        <CalendarDays className="size-5 shrink-0 text-[#667085]" />
        <span className={value ? "text-[#131927]" : "text-[#98a2b3]"}>
          {value ? formatDisplay(value) : "Select a date"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-[300px] rounded-2xl border border-[#eceef2] bg-white p-4 shadow-[0_12px_32px_rgba(16,24,40,0.12)]">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="grid size-8 place-items-center rounded-lg text-[#475367] transition-colors hover:bg-[#f3f4f6]"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="font-inter-tight text-[15px] font-semibold text-[#101928]">
              {MONTHS[view.m]} {view.y}
            </p>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="grid size-8 place-items-center rounded-lg text-[#475367] transition-colors hover:bg-[#f3f4f6]"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="font-inter grid h-8 place-items-center text-[12px] font-medium text-[#98a2b3]"
              >
                {w}
              </div>
            ))}
            {cells.map((d, i) =>
              d === null ? (
                <div key={`b${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  onClick={() => pick(d)}
                  className={cn(
                    "font-inter grid h-9 place-items-center rounded-lg text-[14px] transition-colors",
                    isSelected(d)
                      ? "bg-primary font-semibold text-white"
                      : isToday(d)
                        ? "font-semibold text-primary hover:bg-[#f3f4f6]"
                        : "text-[#344054] hover:bg-[#f3f4f6]"
                  )}
                >
                  {d}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
