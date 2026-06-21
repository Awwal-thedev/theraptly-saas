"use client"

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

/* ---------- Performance of Learners (grouped bars) ---------- */

const performanceData = [
  { label: "HIPAA", score: 62, pass: 48 },
  { label: "OSHA", score: 78, pass: 40 },
  { label: "Bloodborne", score: 55, pass: 72 },
  { label: "Infection", score: 84, pass: 60 },
  { label: "CMS", score: 47, pass: 80 },
  { label: "Fire Safety", score: 70, pass: 52 },
  { label: "Privacy", score: 90, pass: 44 },
  { label: "Ethics", score: 58, pass: 76 },
  { label: "Conduct", score: 66, pass: 50 },
  { label: "Safety", score: 81, pass: 64 },
  { label: "Records", score: 49, pass: 73 },
  { label: "Consent", score: 75, pass: 56 },
]

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

export function PerformanceChart() {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={performanceData}
          margin={{ top: 8, right: 4, left: -22, bottom: 0 }}
          barGap={3}
          barCategoryGap="22%"
        >
          <CartesianGrid vertical={false} stroke="#f0f2f5" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            angle={-40}
            textAnchor="end"
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
          <Bar dataKey="score" name="Avg. score" fill="#FDB022" radius={[5, 5, 0, 0]} maxBarSize={11} />
          <Bar dataKey="pass" name="Pass rate" fill="#F04438" radius={[5, 5, 0, 0]} maxBarSize={11} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------- Training Coverage (donut) ---------- */

const coverage = [
  { key: "completed", label: "Staff who have completed required courses", value: 30, color: "#15B79E" },
  { key: "progress", label: "Staff currently enrolled (in progress)", value: 34, color: "#3B82F6" },
  { key: "yet", label: "Staff yet to begin any course", value: 36, color: "#99E0D6" },
]

const TOTAL_STAFF = 72

export function TrainingCoverage() {
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
            Total Staff
          </span>
          <span className="text-[28px] font-bold leading-none text-[#101928]">
            {TOTAL_STAFF}
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
            <span className="font-medium text-[#101928]">{c.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
