"use client"

import { useEffect, useMemo, useState } from "react"
import { useDemo } from "@/components/demo-provider"
import { ConversionChart, SourceChart, TrafficChart } from "@/components/charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCampaign } from "@/lib/campaigns"
import {
  formatMoney,
  formatMoneyCents,
  formatNumber,
  formatPercent,
  formatRoas,
  leadName,
} from "@/lib/format"
import { SOURCE_META, STATUS_META } from "@/lib/labels"
import { campaignStats, seriesFor, summarize, visibleLeads } from "@/lib/metrics"
import { cn } from "cn"

export function DashboardView() {
  const { state, openLead } = useDemo()
  const stats = useMemo(
    () => campaignStats(state.buckets, state.leads),
    [state.buckets, state.leads],
  )
  const totals = useMemo(() => summarize(stats, state.view), [stats, state.view])
  const series = useMemo(
    () => seriesFor(state.buckets, state.leads, state.view),
    [state.buckets, state.leads, state.view],
  )
  const recent = visibleLeads(state.leads, state.view).slice(0, 5)
  const highlighted = state.leads.find((lead) => lead.id === state.highlightLeadId) ?? null
  const viewName = state.view === "all" ? "All campaigns" : getCampaign(state.view).name
  const funnel = [
    { label: "Website visitors", value: totals.visitors, hint: "Everyone who hit the site" },
    { label: "Leads", value: totals.leads, hint: "Submitted a contact form" },
    { label: "Appointments", value: totals.appointments, hint: "Booked, including customers" },
    { label: "Customers", value: totals.customers, hint: "Marked as paying" },
  ]
  const top = Math.max(totals.visitors, 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Campaign dashboard</h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {viewName}. These figures are fictional and internally consistent. A visit is not a
          customer until the lead status says so. Revenue is the sum of paying customers only.
        </p>
      </div>

      {highlighted ? (
        <button
          type="button"
          onClick={() => openLead(highlighted.id)}
          className="rounded-xl border border-[#b9d0ff] bg-[#f3f7ff] px-4 py-3 text-left transition hover:border-[#0057ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0057ff]"
        >
          <p className="text-xs font-semibold tracking-wide text-[#0046cc] uppercase">Latest attributed lead</p>
          <p className="mt-1 text-sm font-medium">
            {leadName(highlighted)} · {SOURCE_META[highlighted.source].label} ·{" "}
            {getCampaign(highlighted.campaignId).shortName} · {STATUS_META[highlighted.status].label} ·{" "}
            {formatMoney(highlighted.value)}
          </p>
        </button>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Website visitors" value={formatNumber(totals.visitors)} hint="Ad clicks that landed" />
        <Kpi label="Leads generated" value={formatNumber(totals.leads)} hint="Forms tied to a campaign" />
        <Kpi label="Conversion rate" value={formatPercent(totals.leadRate)} hint="Visits that became leads" />
        <Kpi label="Appointments booked" value={formatNumber(totals.appointments)} hint="Booked plus paying" />
        <Kpi label="Customers acquired" value={formatNumber(totals.customers)} hint="Status is paying customer" />
        <Kpi label="Attributed revenue" value={formatMoney(totals.revenue)} hint="Paying customers only" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Conversion funnel</CardTitle>
          <CardDescription>
            Bar length is the share of visitors. Appointments include leads marked booked and leads who already paid.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {funnel.map((step) => {
            const width = Math.max((step.value / top) * 100, step.value > 0 ? 1.5 : 0)
            return (
              <div key={step.label} className="grid items-center gap-2 sm:grid-cols-[11rem_1fr_auto] sm:gap-3">
                <div>
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.hint}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#0057ff] transition-[width] duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <p className="text-sm font-semibold tabular-nums sm:text-right">
                  {formatNumber(step.value)}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {formatPercent(step.value / top)}
                  </span>
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Campaign traffic</CardTitle>
            <CardDescription>Visitors and leads across the sample window. Demo data.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficChart data={series.byDay} />
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#0057ff]" /> Visitors</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#1a8f5a]" /> Leads</span>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Traffic by source</CardTitle>
            <CardDescription>Where the visits in this view came from.</CardDescription>
          </CardHeader>
          <CardContent>
            <SourceChart data={series.bySource} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads and customers</CardTitle>
          <CardDescription>
            {state.view === "all"
              ? "Every sample campaign. Customers are the leads marked paying."
              : `${viewName} only. Switch the presenter control to compare the rest.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConversionChart data={series.byCampaign} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign comparison</CardTitle>
          <CardDescription>
            Every sample campaign stays in this table so you can compare them. Ad spend is a fixed sample budget. Cost per lead is spend divided by leads. Return on ad spend is revenue divided by spend.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Traffic source</TableHead>
                <TableHead className="text-right">Visitors</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Customers</TableHead>
                <TableHead className="text-right">Ad spend</TableHead>
                <TableHead className="text-right">Cost per lead</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((row) => {
                const campaign = getCampaign(row.id)
                const active = state.view === row.id
                return (
                  <TableRow key={row.id} className={cn(active && "bg-[#f3f7ff]")}>
                    <TableCell>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.businessName}</p>
                    </TableCell>
                    <TableCell>{row.sources.map((source) => SOURCE_META[source].label).join(" + ")}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.visitors)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.leads)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.customers)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(row.spend)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.cpl == null ? "—" : formatMoneyCents(row.cpl)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(row.revenue)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatRoas(row.roas)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>All sample campaigns</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(summarize(stats, "all").visitors)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(summarize(stats, "all").leads)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(summarize(stats, "all").customers)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(summarize(stats, "all").spend)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {summarize(stats, "all").cpl == null ? "—" : formatMoneyCents(summarize(stats, "all").cpl!)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(summarize(stats, "all").revenue)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRoas(summarize(stats, "all").roas)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          <p className="px-4 pt-3 text-xs text-muted-foreground">
            Demo data. Nothing here is connected to Meta, Google, or a live ad account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent leads</CardTitle>
          <CardDescription>Open a row for the UTM parameters captured with that person.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {recent.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">No leads in this view yet. Simulate one from the presenter bar.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((lead) => (
                  <TableRow
                    key={lead.id}
                    tabIndex={0}
                    className={cn("cursor-pointer", lead.id === state.highlightLeadId && "bg-[#e8f0ff]")}
                    onClick={() => openLead(lead.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openLead(lead.id)
                      }
                    }}
                  >
                    <TableCell className="font-medium">{leadName(lead)}</TableCell>
                    <TableCell>{getCampaign(lead.campaignId).shortName}</TableCell>
                    <TableCell>{STATUS_META[lead.status].short}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(lead.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  const pulse = usePulse(value)
  return (
    <Card className={cn("transition-shadow", pulse && "ring-2 ring-[#0057ff]")}>
      <CardContent className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function usePulse(value: string) {
  const [seen, setSeen] = useState(value)
  const [pulse, setPulse] = useState(false)

  if (seen !== value) {
    setSeen(value)
    setPulse(true)
  }

  useEffect(() => {
    if (!pulse) return
    const timeout = window.setTimeout(() => setPulse(false), 700)
    return () => window.clearTimeout(timeout)
  }, [pulse])

  return pulse
}
