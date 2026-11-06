"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { AttributionFlow } from "@/components/attribution-flow"
import { ContentPerformance } from "@/components/content-performance"
import { useDemo } from "@/components/demo-provider"
import { ConversionChart, SourceChart, TrafficChart } from "@/components/charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CAMPAIGNS, isCampaignId } from "@/lib/campaigns"
import {
  addDays,
  formatMoney,
  formatMoneyCents,
  formatNumber,
  formatPercent,
  formatRoas,
  formatTimestamp,
  leadName,
  localDay,
  shortId,
} from "@/lib/format"
import { SOURCE_META, STATUS_META } from "@/lib/labels"
import { campaignStats, channelSplit, landingPages, seriesFor, summarize, visibleArrivals, visibleLeads } from "@/lib/metrics"
import { campaignTitle } from "@/lib/traffic"
import type { Source } from "@/lib/types"
import { cn } from "cn"

const RANGE_OPTIONS = [
  { id: "all", label: "All dates" },
  { id: "7", label: "Last 7 days" },
  { id: "14", label: "Last 14 days" },
  { id: "today", label: "Today" },
] as const

export function DashboardView() {
  const { state, openLead } = useDemo()
  const [sourceFilter, setSourceFilter] = useState<"all" | Source>("all")
  const [campaignFilter, setCampaignFilter] = useState("all")
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["id"]>("all")
  const from =
    range === "all" ? null : range === "today" ? localDay() : addDays(localDay(), range === "7" ? -6 : -13)
  const buckets = state.buckets.filter(
    (bucket) => (sourceFilter === "all" || bucket.source === sourceFilter) && (from == null || bucket.day >= from),
  )
  const leads = state.leads.filter(
    (lead) => (sourceFilter === "all" || lead.source === sourceFilter) && (from == null || lead.day >= from),
  )
  const arrivals = state.arrivals.filter(
    (arrival) =>
      (sourceFilter === "all" || arrival.source === sourceFilter) && (from == null || arrival.day >= from),
  )
  const focus = campaignFilter !== "all" ? campaignFilter : state.view
  const stats = useMemo(
    () => campaignStats(buckets, leads, state.links),
    [buckets, leads, state.links],
  )
  const totals = useMemo(() => summarize(stats, focus), [stats, focus])
  const series = useMemo(
    () => seriesFor(buckets, leads, state.links, focus),
    [buckets, leads, state.links, focus],
  )
  const split = channelSplit(buckets, state.links, focus)
  const recent = visibleLeads(leads, focus).slice(0, 5)
  const liveArrivals = visibleArrivals(arrivals, focus)
  const pages = landingPages(buckets, arrivals, state.links, focus)
  const filtering = sourceFilter !== "all" || range !== "all" || campaignFilter !== "all"
  const contentIds = new Set(state.links.filter((link) => link.headline?.trim()).map((link) => link.id))
  const tableRows = stats.filter((row) => {
    if (contentIds.has(row.id)) return false
    if (campaignFilter !== "all" && row.id !== campaignFilter) return false
    const saved = state.links.some((link) => link.id === row.id)
    if (!filtering) return isCampaignId(row.id) || saved || row.visitors > 0 || row.leads > 0
    return row.visitors > 0 || row.leads > 0 || row.id === focus
  })
  const tableTotals = useMemo(() => summarize(tableRows, "all"), [tableRows])
  const highlighted = state.leads.find((lead) => lead.id === state.highlightLeadId) ?? null
  const viewName = focus === "all" ? "All campaigns" : campaignTitle(state.links, focus)
  const sourceItems: Record<string, string> = { all: "All sources" }
  for (const source of Object.keys(SOURCE_META)) sourceItems[source] = SOURCE_META[source as Source].label
  const campaignItems: Record<string, string> = { all: "All campaigns" }
  for (const campaign of CAMPAIGNS) campaignItems[campaign.id] = campaign.shortName
  for (const link of state.links) {
    if (!link.headline?.trim()) campaignItems[link.id] = link.name
  }
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
          {viewName}. Simulated data. A visit is attributed as soon as the page reads UTM parameters,
          or from the referrer when those parameters are missing. A name and revenue still require a lead.
        </p>
      </div>

      <ContentPerformance links={state.links} buckets={state.buckets} leads={state.leads} />

      <div className="grid gap-3 md:grid-cols-3">
        <Filter label="Source">
          <Select
            value={sourceFilter}
            items={sourceItems}
            onValueChange={(value) => {
              if (value === "all" || (value != null && value in SOURCE_META)) setSourceFilter(value as "all" | Source)
            }}
          >
            <SelectTrigger className="w-full bg-white" aria-label="Filter by source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {(Object.keys(SOURCE_META) as Source[]).map((source) => (
                <SelectItem key={source} value={source}>
                  {SOURCE_META[source].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Filter>
        <Filter label="Campaign">
          <Select
            value={campaignFilter}
            items={campaignItems}
            onValueChange={(value) => {
              if (value) setCampaignFilter(value)
            }}
          >
            <SelectTrigger className="w-full bg-white" aria-label="Filter by campaign">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {CAMPAIGNS.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.shortName}
                </SelectItem>
              ))}
              {state.links.filter((link) => !link.headline?.trim()).map((link) => (
                <SelectItem key={link.id} value={link.id}>
                  {link.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Filter>
        <Filter label="Date">
          <div className="flex flex-wrap gap-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRange(option.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-sm font-medium",
                  range === option.id ? "bg-[#0057ff] text-white" : "bg-white text-[#3d4d66] ring-1 ring-foreground/10",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Filter>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How attribution works</CardTitle>
          <CardDescription>All of these figures are simulated.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttributionFlow />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live arrivals</CardTitle>
          <CardDescription>
            {formatNumber(totals.visitors)} visitors in this view, counted as {formatNumber(totals.visitors)} sessions. The sample history counts each visit as one session. Refreshing a simulated visit does not add another.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {liveArrivals.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">
              No live arrivals yet. Visits show up here when a tracked link is opened.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Landing page</TableHead>
                  <TableHead>Arrived</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveArrivals.slice(0, 8).map((arrival) => (
                  <TableRow
                    key={arrival.id}
                    className={cn(arrival.id === state.activeSessionId && "bg-[#e8f0ff]")}
                  >
                    <TableCell className="font-mono text-xs">{shortId(arrival.id)}</TableCell>
                    <TableCell>{SOURCE_META[arrival.source].label}</TableCell>
                    <TableCell>{campaignTitle(state.links, arrival.campaignId)}</TableCell>
                    <TableCell className="font-mono text-xs">{arrival.landingPath}</TableCell>
                    <TableCell>{formatTimestamp(arrival.at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {highlighted ? (
        <button
          type="button"
          onClick={() => openLead(highlighted.id)}
          className="rounded-xl border border-[#b9d0ff] bg-[#f3f7ff] px-4 py-3 text-left transition hover:border-[#0057ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0057ff]"
        >
          <p className="text-xs font-semibold tracking-wide text-[#0046cc] uppercase">Latest attributed lead</p>
          <p className="mt-1 text-sm font-medium">
            {leadName(highlighted)} · {SOURCE_META[highlighted.source].label} ·{" "}
            {campaignTitle(state.links, highlighted.campaignId)} · {STATUS_META[highlighted.status].label} ·{" "}
            {formatMoney(highlighted.value)}
          </p>
        </button>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Website visitors" value={formatNumber(totals.visitors)} hint="Demo data" />
        <Kpi label="Sessions" value={formatNumber(totals.visitors)} hint="One session per counted visit" />
        <Kpi label="Leads generated" value={formatNumber(totals.leads)} hint="Forms tied to a campaign" />
        <Kpi label="Conversion rate" value={formatPercent(totals.leadRate)} hint="Visits that became leads" />
        <Kpi label="Appointments booked" value={formatNumber(totals.appointments)} hint="Booked plus paying" />
        <Kpi label="Customers acquired" value={formatNumber(totals.customers)} hint="Status is paying customer" />
        <Kpi label="Attributed revenue" value={formatMoney(totals.revenue)} hint="Paying customers only" />
        <Kpi label="Paid ROAS" value={formatRoas(totals.roas)} hint="Campaigns with recorded ad spend" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Paid traffic</p>
            <p className="text-2xl font-semibold tabular-nums">{formatNumber(split.paid)}</p>
            <p className="text-xs text-muted-foreground">Sample ads and links marked as paid ads.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Unpaid traffic</p>
            <p className="text-2xl font-semibold tabular-nums">{formatNumber(split.unpaid)}</p>
            <p className="text-xs text-muted-foreground">
              Organic posts, email, texts, QR codes, referrals, and direct visits. No advertising ROI.
            </p>
          </CardContent>
        </Card>
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
            {focus === "all"
              ? "Campaigns with visitors or leads. Customers are the leads marked paying."
              : `${viewName} only.`}
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
            Paid rows can show return on ad spend. Unpaid rows keep visitors, leads, and revenue, and leave ROAS blank.
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
                <TableHead className="text-right">Conversion rate</TableHead>
                <TableHead className="text-right">Ad spend</TableHead>
                <TableHead className="text-right">Cost per lead</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((row) => {
                const saved = state.links.some((link) => link.id === row.id)
                const active = focus === row.id
                return (
                  <TableRow key={row.id} className={cn(active && "bg-[#f3f7ff]")}>
                    <TableCell>
                      {saved ? (
                        <Link href={`/links/${row.id}`} className="font-medium text-[#0057ff] hover:underline">
                          {row.name}
                        </Link>
                      ) : (
                        <p className="font-medium">{row.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {row.businessName} · {row.paid ? "Paid" : "Unpaid"}
                      </p>
                    </TableCell>
                    <TableCell>{row.sources.map((source) => SOURCE_META[source].label).join(" + ")}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.visitors)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.leads)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.customers)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(row.leadRate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.spend == null ? "—" : formatMoney(row.spend)}
                    </TableCell>
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
                <TableCell colSpan={2}>{filtering ? "Filtered total" : "All campaigns"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(tableTotals.visitors)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(tableTotals.leads)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(tableTotals.customers)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPercent(tableTotals.leadRate)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(tableTotals.spend)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {tableTotals.cpl == null ? "—" : formatMoneyCents(tableTotals.cpl)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(tableTotals.revenue)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRoas(tableTotals.roas)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          <p className="px-4 pt-3 text-xs text-muted-foreground">
            Simulated data. Sample ad spend is not reported by Facebook, Instagram, or Google. ROAS uses paid revenue divided by recorded spend. Unpaid campaigns are left out of that ratio. UTM parameters do not identify every person who clicked.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Landing pages</CardTitle>
          <CardDescription>Where the simulated visits arrived. Each campaign uses one sample page.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Landing page</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Visits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.path}>
                  <TableCell className="font-mono text-xs">{page.path}</TableCell>
                  <TableCell>
                    <p>{page.name}</p>
                    <p className="text-xs text-muted-foreground">{page.businessName}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(page.visitors)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent leads</CardTitle>
          <CardDescription>Open a row for the UTM parameters captured with that person.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {recent.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">No leads in this view yet.</p>
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
                    <TableCell>{campaignTitle(state.links, lead.campaignId)}</TableCell>
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

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      {children}
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
