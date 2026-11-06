"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { QrCode } from "@/components/qr-code"
import { showSimulationControls } from "@/lib/demo-mode"
import { useDemo } from "@/components/demo-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney, formatNumber, formatPercent, leadName } from "@/lib/format"
import { SOURCE_META, STATUS_META } from "@/lib/labels"
import { postPerformance } from "@/lib/metrics"
import { buildTrackedUrl, linkTypeLabel, visitPath } from "@/lib/traffic"

export function LinkDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { state, openLead } = useDemo()
  const link = state.links.find((item) => item.id === params.id) ?? null
  const row = useMemo(
    () => (link ? postPerformance(link, state.buckets, state.leads) : null),
    [link, state.buckets, state.leads],
  )
  const arrivals = link ? state.arrivals.filter((arrival) => arrival.campaignId === link.id) : []
  const leads = link
    ? state.leads.filter((lead) => lead.campaignId === link.id).sort((a, b) => b.day.localeCompare(a.day))
    : []

  if (!link || !row) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">That link is not in this demo.</h1>
        <Link href="/links" className="text-[#0057ff] hover:underline">
          Back to campaign links
        </Link>
      </div>
    )
  }

  const url = buildTrackedUrl({
    destination: link.destination,
    source: link.source,
    medium: link.medium,
    campaign: link.utmCampaign,
    content: link.content,
  })
  const uniqueVisitors = arrivals.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Saved link · demo data</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{link.headline.trim() || link.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {link.name} · {SOURCE_META[link.source].label} · {linkTypeLabel(link.linkType)}
            {link.content ? ` · ${link.content}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/links" className={buttonVariants({ variant: "outline" })}>
            All links
          </Link>
          {showSimulationControls ? (
            <Button type="button" onClick={() => router.push(visitPath(link, crypto.randomUUID()))}>
              Simulate visit
            </Button>
          ) : null}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric label="Website visits" value={formatNumber(row.visitors)} />
        <Metric label="Visits added here" value={formatNumber(uniqueVisitors)} />
        <Metric label="Leads" value={formatNumber(row.leads)} />
        <Metric label="Customers" value={formatNumber(row.customers)} />
        <Metric label="Revenue" value={formatMoney(row.revenue)} />
        <Metric label="Conversion rate" value={formatPercent(row.leadRate)} />
      </section>

      {link.body.trim() ? (
        <Card>
          <CardHeader>
            <CardTitle>Original wording</CardTitle>
            <CardDescription>Saved with the link. Simulated sample copy, not text read from Facebook.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{link.body}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{link.linkType === "paid" ? "Paid link" : "Unpaid link"}</CardTitle>
          <CardDescription>
            {link.linkType === "paid"
              ? `Sample ad spend ${link.spend == null ? "was not entered" : formatMoney(link.spend)}. Return on ad spend uses recorded spend only.`
              : "Revenue and conversions are shown. Return on ad spend is omitted because this marketing had no recorded spend."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <QrCode value={url} />
          <p className="font-mono text-xs break-all">{url}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leads from this link</CardTitle>
          <CardDescription>Open a person to mark them a customer and set sample revenue.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {leads.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">No leads yet. A visit can stay anonymous.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer" onClick={() => openLead(lead.id)}>
                    <TableCell className="font-medium">{leadName(lead)}</TableCell>
                    <TableCell>{STATUS_META[lead.status].label}</TableCell>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}
