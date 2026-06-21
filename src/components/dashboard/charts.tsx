"use client"

import { BarChart3, PieChart as PieIcon } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useStoredCourses } from "@/lib/client-store"
import { courses as coursesSeed } from "@/lib/courses"

/** Pull a numeric completion percent out of a "75%" or "8/10" string. */
function completionPct(completion: string): number {
  const pct = completion.match(/(\d+)\s*%/)
  if (pct) return Number(pct[1])
  const frac = completion.match(/(\d+)\s*\/\s*(\d+)/)
  if (frac) {
    const a = Number(frac[1])
    const b = Number(frac[2])
    if (b) return Math.round((a / b) * 100)
  }
  return 0
}

/** Trim a long course name so it fits as an axis label. */
function shortLabel(name: string): string {
  const trimmed = name.replace(/Training|Course|Compliance|Privacy/gi, "").trim()
  return trimmed.split(/\s+/).slice(0, 2).join(" ") || name.slice(0, 14)
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="font-inter rounded-xl border border-[#eceef2] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(16,24,40,0.12)]">
      <p className="mb-1 text-xs font-medium text-[#101928]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-medium text-[#101928]">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

function ChartEmpty({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof BarChart3
  title: string
  body: string
}) {
  return (
    <div className="flex h-[260px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#e4e7ec] bg-[#fafbff] px-6 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-white text-[#98a2b3]">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-inter-tight text-[15px] font-semibold text-[#101928]">
          {title}
        </p>
        <p className="font-inter mt-1 text-[13px] text-[#667085]">{body}</p>
      </div>
    </div>
  )
}

/* ---------- Performance of Learners ---------- */

export function PerformanceChart() {
  const storedCourses = useStoredCourses()
  const courses = [...storedCourses, ...coursesSeed]

  if (courses.length === 0) {
    return (
      <ChartEmpty
        icon={BarChart3}
        title="No performance to chart yet"
        body="Once you publish your first course and learners start completing it, their scores and pass rates will show up here."
      />
    )
  }

  // Use completion% as the "score" series; once real quiz attempts land,
  // PASS rate becomes a separate aggregate from quiz scores.
  const data = courses.map((c) => ({
    label: shortLabel(c.name),
    score: completionPct(c.completion),
    pass: 0,
  }))

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -22, bottom: 0 }}
          barGap={3}
          barCategoryGap="22%"
        >
          <CartesianGrid vertical={false} stroke="#f0f2f5" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            angle={data.length > 4 ? -40 : 0}
            textAnchor={data.length > 4 ? "end" : "middle"}
            height={56}
            interval={0}
            tick={{ fontSize: 10, fill: "#9ea2ae", fontFamily: "var(--font-inter)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#9ea2ae", fontFamily: "var(--font-inter)" }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip cursor={{ fill: "#f9fafb" }} content={<ChartTooltip />} />
          <Bar
            dataKey="score"
            name="Completion %"
            fill="#FDB022"
            radius={[5, 5, 0, 0]}
            maxBarSize={26}
          />
          <Bar
            dataKey="pass"
            name="Pass rate"
            fill="#F04438"
            radius={[5, 5, 0, 0]}
            maxBarSize={26}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------- Training Coverage ---------- */

export function TrainingCoverage() {
  const storedCourses = useStoredCourses()
  const courses = [...storedCourses, ...coursesSeed]

  if (courses.length === 0) {
    return (
      <ChartEmpty
        icon={PieIcon}
        title="No coverage to show yet"
        body="Coverage updates as you assign courses to staff and they begin or complete training."
      />
    )
  }

  // Aggregate "assigned vs completed vs yet-to-begin" across all courses.
  const totalAssigned = courses.reduce(
    (sum, c) => sum + (Number(c.assigned) || 0),
    0
  )
  const totalCompleted = courses.reduce(
    (sum, c) =>
      sum +
      Math.round(((Number(c.assigned) || 0) * completionPct(c.completion)) / 100),
    0
  )
  const totalInProgress = Math.max(0, totalAssigned - totalCompleted)

  // No assignments → empty state too.
  if (totalAssigned === 0) {
    return (
      <ChartEmpty
        icon={PieIcon}
        title="No assignments yet"
        body="Assign a course to your staff to start tracking how training coverage breaks down."
      />
    )
  }

  const coverage = [
    {
      key: "completed",
      label: "Staff who have completed required courses",
      value: totalCompleted,
      color: "#15B79E",
    },
    {
      key: "progress",
      label: "Staff currently enrolled (in progress)",
      value: totalInProgress,
      color: "#3B82F6",
    },
  ]
  const pct = (n: number) =>
    totalAssigned ? Math.round((n / totalAssigned) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="relative h-[184px] w-[184px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={coverage}
              dataKey="value"
              innerRadius={64}
              outerRadius={88}
              paddingAngle={3}
              cornerRadius={6}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {coverage.map((c) => (
                <Cell key={c.key} fill={c.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="font-roboto pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[13px] font-medium text-muted-foreground">
            Total Assigned
          </span>
          <span className="text-[28px] font-bold leading-none text-[#101928]">
            {totalAssigned}
          </span>
        </div>
      </div>

      <ul className="font-roboto w-full space-y-3.5">
        {coverage.map((c) => (
          <li key={c.key} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span className="flex-1 leading-snug text-muted-foreground">
              {c.label}
            </span>
            <span className="font-medium text-[#101928]">{pct(c.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
