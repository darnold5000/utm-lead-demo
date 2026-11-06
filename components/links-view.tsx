"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QrCode } from "@/components/qr-code"
import { useDemo } from "@/components/demo-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney, formatNumber, formatPercent, formatRoas } from "@/lib/format"
import { LINK_SOURCES, SOURCE_META } from "@/lib/labels"
import { APC_DESTINATION } from "@/lib/content-posts"
import { showSimulationControls } from "@/lib/demo-mode"
import { campaignStats, postPerformance } from "@/lib/metrics"
import {
  LINK_TYPES,
  buildTrackedUrl,
  linkTypeLabel,
  mediumForLink,
  nextVariation,
  normalizeDestination,
  slugify,
  visitPath,
} from "@/lib/traffic"
import type { LinkType, Source, TrackedLink } from "@/lib/types"

function existingBaseline(links: TrackedLink[], id: string) {
  return links.find((link) => link.id === id)?.baseline ?? null
}

const sourceItems = Object.fromEntries(LINK_SOURCES.map((source) => [source, SOURCE_META[source].label]))
const typeItems = Object.fromEntries(LINK_TYPES.map((type) => [type.id, type.label]))

const EXAMPLE = {
  destination: APC_DESTINATION,
  source: "facebook" as Source,
  linkType: "organic" as LinkType,
  name: "Softball Training",
  headline: "",
  body: "",
  content: "",
  spend: "",
}

export function LinksView() {
  const demo = useDemo()
  const router = useRouter()
  const [destination, setDestination] = useState(EXAMPLE.destination)
  const [source, setSource] = useState<Source>(EXAMPLE.source)
  const [linkType, setLinkType] = useState<LinkType>(EXAMPLE.linkType)
  const [name, setName] = useState(EXAMPLE.name)
  const [headline, setHeadline] = useState(EXAMPLE.headline)
  const [body, setBody] = useState(EXAMPLE.body)
  const [content, setContent] = useState(EXAMPLE.content)
  const [spend, setSpend] = useState(EXAMPLE.spend)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const medium = mediumForLink(source, linkType)
  const variation = editingId ? content : headline.trim() ? nextVariation(demo.state.links, headline) : ""
  const trackedUrl = buildTrackedUrl({
    destination,
    source,
    medium,
    campaign: name,
    content: variation || null,
  })
  const stats = useMemo(
    () => campaignStats(demo.state.buckets, demo.state.leads, demo.state.links),
    [demo.state.buckets, demo.state.leads, demo.state.links],
  )

  function draftLink(id: string, createdAt: string): TrackedLink | null {
    if (!headline.trim()) {
      setError("Add the post headline.")
      return null
    }
    if (!body.trim()) {
      setError("Paste the post wording.")
      return null
    }
    if (!name.trim()) {
      setError("Add a campaign name.")
      return null
    }
    if (!destination.trim()) {
      setError("Add the page this link should open.")
      return null
    }
    if (!variation) {
      setError("Add a headline so the variation id can be created.")
      return null
    }
    const parsedSpend = Number(spend)
    setError(null)
    return {
      id,
      destination: normalizeDestination(destination),
      source,
      linkType,
      medium,
      name: name.trim(),
      headline: headline.trim(),
      body: body.trim(),
      utmCampaign: slugify(name),
      content: variation,
      spend: linkType === "paid" && spend.trim() && Number.isFinite(parsedSpend) ? Math.max(0, Math.round(parsedSpend)) : null,
      baseline: existingBaseline(demo.state.links, id),
      createdAt,
    }
  }

  function save(id = editingId ?? `link-${crypto.randomUUID()}`) {
    const existing = demo.state.links.find((link) => link.id === id)
    const link = draftLink(id, existing?.createdAt ?? new Date().toISOString())
    if (!link) return null
    demo.saveLink(link)
    setEditingId(id)
    setActiveId(id)
    return link
  }

  function reuse(link: TrackedLink) {
    setDestination(link.destination)
    setSource(link.source)
    setLinkType(link.linkType)
    setName(link.name)
    setHeadline(link.headline)
    setBody(link.body)
    setContent(link.content ?? "")
    setSpend(link.spend == null ? "" : String(link.spend))
    setEditingId(link.id)
    setActiveId(link.id)
    setError(null)
    setCopied(false)
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
      setError("Copy did not work in this browser. Select the link and copy it manually.")
    }
  }

  function simulate(link: TrackedLink) {
    router.push(visitPath(link, crypto.randomUUID()))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Campaign links</h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Each post gets its own utm_content value under a campaign. The Softball Training posts are already saved.
          Add another headline to create a new variation. Saving does not publish anything. Every result is simulated.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card id="new-post">
          <CardHeader>
            <CardTitle>{editingId ? "Edit post" : "New post variation"}</CardTitle>
            <CardDescription>
              The headline and wording are stored with the link. The variation id is created automatically and becomes utm_content.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="destination">Destination URL</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="https://example.com/train"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Source</Label>
                <Select
                  value={source}
                  items={sourceItems}
                  onValueChange={(value) => {
                    if (value && LINK_SOURCES.includes(value as Source)) setSource(value as Source)
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_SOURCES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {SOURCE_META[item].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select
                  value={linkType}
                  items={typeItems}
                  onValueChange={(value) => {
                    const next = LINK_TYPES.find((item) => item.id === value)
                    if (next) setLinkType(next.id)
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Link type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="headline">Post headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="Get Faster Before Tryouts"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="post-body">Post wording</Label>
              <textarea
                id="post-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Paste the Facebook post, ad, email, or text message."
                className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="campaign-name">Campaign name</Label>
                <Input id="campaign-name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="content-id">Variation id</Label>
                <Input id="content-id" value={variation} readOnly aria-readonly="true" />
                <p className="text-xs text-muted-foreground">
                  {editingId
                    ? "This id stays put so a link you already shared still matches."
                    : "Generated from the headline. Posts in one campaign each get their own id."}
                </p>
              </div>
            </div>
            {linkType === "paid" ? (
              <div className="grid gap-1.5">
                <Label htmlFor="spend">Sample ad spend</Label>
                <Input
                  id="spend"
                  inputMode="numeric"
                  value={spend}
                  onChange={(event) => setSpend(event.target.value)}
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground">
                  Return on ad spend appears only when this amount is saved. Leave it blank to skip ROI.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This is unpaid marketing. Visits, leads, and revenue will be tracked. Return on ad spend stays blank.
              </p>
            )}
            {error ? <p className="text-sm text-[#9a5b00]">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => save()}>
                {editingId ? "Update link" : "Save link"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDestination(EXAMPLE.destination)
                  setSource(EXAMPLE.source)
                  setLinkType(EXAMPLE.linkType)
                  setName(EXAMPLE.name)
                  setHeadline(EXAMPLE.headline)
                  setBody(EXAMPLE.body)
                  setContent(EXAMPLE.content)
                  setSpend(EXAMPLE.spend)
                  setEditingId(null)
                  setActiveId(null)
                  setCopied(false)
                  setError(null)
                }}
              >
                Start over
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracking link</CardTitle>
            <CardDescription>Demo data. Nothing is sent to an ad platform.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="font-mono text-xs break-all">{trackedUrl}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => copy(trackedUrl)}>
                {copied ? "Copied" : "Copy link"}
              </Button>
              {showSimulationControls ? (
                <Button
                  type="button"
                  onClick={() => {
                    const link = save()
                    if (link) simulate(link)
                  }}
                >
                  Simulate visit
                </Button>
              ) : null}
            </div>
            <QrCode value={trackedUrl} />
            <p className="text-xs text-muted-foreground">
              The QR code uses this link for a poster or handout.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved links</CardTitle>
          <CardDescription>
            Reuse a link, or open its results. Sample ad campaigns stay on the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {demo.state.links.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">
              No saved links yet. Add a headline to create the first variation.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Conv. rate</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {demo.state.links.map((link) => {
                  const row = stats.find((item) => item.id === link.id)
                  const performance = postPerformance(link, demo.state.buckets, demo.state.leads)
                  return (
                    <TableRow key={link.id} className={link.id === activeId ? "bg-[#f3f7ff]" : undefined}>
                      <TableCell>
                        <Link href={`/links/${link.id}`} className="font-medium text-[#0057ff] hover:underline">
                          {link.headline.trim() || link.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {link.name}
                          {link.content ? ` · ${link.content}` : ""}
                        </p>
                      </TableCell>
                      <TableCell>{SOURCE_META[link.source].label}</TableCell>
                      <TableCell>{linkTypeLabel(link.linkType)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(performance.visitors)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(performance.leads)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(performance.customers)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(performance.revenue)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(performance.leadRate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatRoas(row?.roas ?? null)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => reuse(link)}>
                            Reuse
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copy(
                                buildTrackedUrl({
                                  destination: link.destination,
                                  source: link.source,
                                  medium: link.medium,
                                  campaign: link.utmCampaign,
                                  content: link.content,
                                }),
                              )
                            }
                          >
                            Copy
                          </Button>
                          {showSimulationControls ? (
                            <Button type="button" size="sm" onClick={() => simulate(link)}>
                              Visit
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <p className="px-4 pt-3 text-xs text-muted-foreground">
            Simulated data. Unpaid links show revenue without a return-on-ad-spend figure. ROAS appears only when sample ad spend was saved.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
