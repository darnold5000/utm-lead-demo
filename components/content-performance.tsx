"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import { showSimulationControls } from "@/lib/demo-mode"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney, formatNumber, formatPercent } from "@/lib/format"
import { SOURCE_META } from "@/lib/labels"
import { postPerformance, type PostPerformance } from "@/lib/metrics"
import { buildTrackedUrl, visitPath } from "@/lib/traffic"
import type { Lead, TrackedLink, VisitBucket } from "@/lib/types"
import { cn } from "cn"

const SORTS = [
  { id: "customers", label: "Customers" },
  { id: "visitors", label: "Visits" },
  { id: "leads", label: "Leads" },
  { id: "revenue", label: "Revenue" },
] as const

type SortId = (typeof SORTS)[number]["id"]

type Row = PostPerformance & { link: TrackedLink }

export function ContentPerformance({
  links,
  buckets,
  leads,
}: {
  links: TrackedLink[]
  buckets: VisitBucket[]
  leads: Lead[]
}) {
  const router = useRouter()
  const posts = links.filter((link) => link.headline.trim())
  const campaigns = useMemo(() => {
    const groups = new Map<string, string>()
    for (const link of posts) {
      if (!groups.has(link.utmCampaign)) groups.set(link.utmCampaign, link.name)
    }
    return [...groups.entries()]
  }, [posts])
  const [campaign, setCampaign] = useState(campaigns.some(([id]) => id === "softball_training") ? "softball_training" : campaigns[0]?.[0] ?? "")
  const [sort, setSort] = useState<SortId>("customers")
  const [selectedId, setSelectedId] = useState<string | null>("post-tryouts-speed")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const scoped = posts.filter((link) => link.utmCampaign === campaign)
    const next: Row[] = scoped.map((link) => ({ link, ...postPerformance(link, buckets, leads) }))
    next.sort((a, b) => b[sort] - a[sort] || b.customers - a.customers || a.link.headline.localeCompare(b.link.headline))
    return next
  }, [posts, campaign, buckets, leads, sort])

  const bestId = rows.reduce<string | null>((best, row) => {
    if (!best) return row.id
    const current = rows.find((item) => item.id === best)
    if (!current || row.customers > current.customers) return row.id
    return best
  }, null)
  const selected = rows.find((row) => row.id === selectedId) ?? rows.find((row) => row.id === bestId) ?? null
  const tryouts = rows.find((row) => row.link.id === "post-tryouts-speed")
  const harder = rows.find((row) => row.link.id === "post-throw-harder")

  async function copy(link: TrackedLink) {
    const url = trackedUrl(link)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(link.id)
    } catch {
      setCopiedId(null)
    }
  }

  if (posts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content performance</CardTitle>
        <CardDescription>
          Athletes Performance Center, Plainfield. Simulated data. These figures are website arrivals, not Facebook impressions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {campaigns.length > 1 ? (
          <div className="flex flex-wrap gap-1">
            {campaigns.map(([id, name]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCampaign(id)}
                className={cn(
                  "rounded-md px-2 py-1 text-sm font-medium",
                  campaign === id ? "bg-[#0057ff] text-white" : "bg-white text-[#3d4d66] ring-1 ring-foreground/10",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium">{campaigns[0]?.[1]}</p>
        )}

        {tryouts && harder ? (
          <p className="rounded-xl border border-[#b9d0ff] bg-[#f3f7ff] px-4 py-3 text-sm">
            Get Faster Before Tryouts generated {comparisonPhrase(tryouts.customers, harder.customers)}, showing how
            different messaging can produce different results in this sample.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Sort posts">
            {SORTS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSort(option.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-sm font-medium",
                  sort === option.id ? "bg-[#0c0d10] text-white" : "bg-white text-[#3d4d66] ring-1 ring-foreground/10",
                )}
              >
                Sort by {option.label}
              </button>
            ))}
          </div>
          <Link href="/links#new-post" className={buttonVariants({ variant: "outline" })}>
            New post variation
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {rows.map((row) => {
            const best = row.id === bestId
            const active = selected?.id === row.id
            return (
              <div
                key={row.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border bg-white p-4",
                  best && "border-[#0057ff] ring-2 ring-[#0057ff]",
                  active && !best && "border-[#0057ff]",
                )}
              >
                <button type="button" className="text-left" onClick={() => setSelectedId(row.id)}>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {SOURCE_META[row.link.source].label}
                    {best ? " · Most customers" : ""}
                  </p>
                  <p className="mt-1 font-medium">{row.link.headline}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <Stat label="Visits" value={formatNumber(row.visitors)} />
                    <Stat label="Leads" value={formatNumber(row.leads)} />
                    <Stat label="Customers" value={formatNumber(row.customers)} />
                    <Stat label="Revenue" value={formatMoney(row.revenue)} />
                  </dl>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Visitor-to-lead {formatPercent(row.leadRate)}
                  </p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => copy(row.link)}>
                    {copiedId === row.id ? "Copied" : "Copy link"}
                  </Button>
                  {showSimulationControls ? (
                    <Button type="button" size="sm" onClick={() => router.push(visitPath(row.link, crypto.randomUUID()))}>
                      Simulate visit
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {selected ? (
          <div className="rounded-xl bg-muted/70 p-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Original post</p>
            <h3 className="mt-1 text-lg font-semibold">{selected.link.headline}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap">{selected.link.body}</p>
            <p className="mt-3 font-mono text-xs break-all">{trackedUrl(selected.link)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatNumber(selected.visitors)} visits · {formatNumber(selected.leads)} leads ·{" "}
              {formatNumber(selected.customers)} customers · {formatMoney(selected.revenue)} ·{" "}
              {formatPercent(selected.leadRate)} of visits became leads. Sample history is included.
            </p>
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Post</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Visits</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Customers</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Conv. rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn("cursor-pointer", row.id === bestId && "bg-[#f3f7ff]")}
                onClick={() => setSelectedId(row.id)}
              >
                <TableCell>
                  <p className="font-medium">{row.link.headline}</p>
                  <p className="text-xs text-muted-foreground">{row.link.content}</p>
                </TableCell>
                <TableCell>{SOURCE_META[row.link.source].label}</TableCell>
                <TableCell>{row.link.name}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(row.visitors)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(row.leads)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(row.customers)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(row.revenue)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPercent(row.leadRate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <ul className="grid gap-1 text-xs text-muted-foreground">
          <li>Post wording is saved when the link is created. A click does not send the Facebook text back to this demo.</li>
          <li>Each variation needs its own tracking URL. The sample posts share one campaign and use different utm_content values.</li>
          <li>These counts are website visits, leads, and customers. They are not Facebook impressions or a platform click-through rate.</li>
          <li>The sample is fictional and is not a controlled test. The wording is not proof of what caused the difference.</li>
        </ul>
      </CardContent>
    </Card>
  )
}

function comparisonPhrase(leader: number, other: number) {
  const counts = `(${formatNumber(leader)} vs ${formatNumber(other)})`
  if (other <= 0) return `the customers in this sample ${counts}`
  const ratio = leader / other
  if (ratio >= 2) return `more than twice as many customers as Help Your Daughter Throw Harder ${counts}`
  if (ratio >= 1.5) return `nearly twice as many customers as Help Your Daughter Throw Harder ${counts}`
  if (ratio > 1) return `more customers than Help Your Daughter Throw Harder ${counts}`
  return `the customer results shown beside Help Your Daughter Throw Harder ${counts}`
}

function trackedUrl(link: TrackedLink) {
  return buildTrackedUrl({
    destination: link.destination,
    source: link.source,
    medium: link.medium,
    campaign: link.utmCampaign,
    content: link.content,
  })
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
