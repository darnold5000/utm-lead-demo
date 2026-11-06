"use client"

import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
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
import { formatNumber, formatShortDay } from "@/lib/format"
import type { DayPoint, SourcePoint } from "@/lib/metrics"

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e3e6ec",
  borderRadius: 12,
  fontSize: 12,
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  return reduced
}

export function TrafficChart({ data }: { data: DayPoint[] }) {
  const reduced = useReducedMotion()
  const chartData = data.map((point) => ({
    ...point,
    label: formatShortDay(point.day),
  }))

  return (
    <div className="h-72 w-full min-w-0" role="img" aria-label="Visitors and leads by day">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eef1f6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5c6370" }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "#5c6370" }}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [formatNumber(Number(value ?? 0)), name]}
          />
          <Area
            type="monotone"
            dataKey="visitors"
            name="Visitors"
            stroke="#0057ff"
            fill="#0057ff"
            fillOpacity={0.16}
            strokeWidth={2}
            isAnimationActive={!reduced}
          />
          <Area
            type="monotone"
            dataKey="leads"
            name="Leads"
            stroke="#1a8f5a"
            fill="#1a8f5a"
            fillOpacity={0.18}
            strokeWidth={2}
            isAnimationActive={!reduced}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ConversionChart({
  data,
}: {
  data: { name: string; leads: number; customers: number }[]
}) {
  const reduced = useReducedMotion()

  return (
    <div className="h-72 w-full min-w-0 overflow-x-auto" role="img" aria-label="Leads and customers by campaign">
      <div className="h-full min-w-[520px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eef1f6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5c6370" }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: "#5c6370" }}
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="leads" name="Leads" fill="#0057ff" radius={[6, 6, 0, 0]} isAnimationActive={!reduced} />
            <Bar
              dataKey="customers"
              name="Customers"
              fill="#1a8f5a"
              radius={[6, 6, 0, 0]}
              isAnimationActive={!reduced}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function SourceChart({ data }: { data: SourcePoint[] }) {
  const reduced = useReducedMotion()
  const slices = data.filter((item) => item.visitors > 0)

  if (slices.length === 0) {
    return <p className="text-sm text-muted-foreground">No visits in this view yet.</p>
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row" role="img" aria-label="Visitors by advertising source">
      <div className="h-48 w-full max-w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="visitors"
              nameKey="label"
              innerRadius={52}
              outerRadius={74}
              paddingAngle={2}
              stroke="#ffffff"
              isAnimationActive={!reduced}
            >
              {slices.map((slice) => (
                <Cell key={slice.source} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [formatNumber(Number(value ?? 0)), name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid gap-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.source} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: slice.color }} />
            <span className="font-medium">{slice.label}</span>
            <span className="tabular-nums text-muted-foreground">{formatNumber(slice.visitors)} visits</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
