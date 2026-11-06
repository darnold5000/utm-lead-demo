"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, MousePointerClick } from "lucide-react"
import { useDemo } from "@/components/demo-provider"
import { useOrigin } from "@/components/use-origin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BUSINESSES, CAMPAIGNS, getCampaign, isCampaignId } from "@/lib/campaigns"
import { SOURCE_META, SOURCES, JOURNEY_RANK } from "@/lib/labels"
import type { CampaignId, JourneyStage, Source } from "@/lib/types"
import { AttributionFlow } from "@/components/attribution-flow"
import { showSimulationControls } from "@/lib/demo-mode"
import { parameterRows, trackingPath, utmFor } from "@/lib/utm"
import { cn } from "cn"

const STAGES: { id: JourneyStage; title: string; detail: string }[] = [
  { id: "ad", title: "Ad", detail: "Choose the source and campaign" },
  { id: "visit", title: "Website visit", detail: "UTMs are captured with no form" },
  { id: "form", title: "Contact form", detail: "Optional. Turns a session into a lead" },
  { id: "lead", title: "New lead", detail: "The same campaign stays attached" },
  { id: "booked", title: "Booked", detail: "An appointment on the calendar" },
  { id: "customer", title: "Paying customer", detail: "Revenue joins that same click" },
]

const campaignItems = Object.fromEntries(CAMPAIGNS.map((campaign) => [campaign.id, campaign.shortName]))
const sourceItems = Object.fromEntries(SOURCES.map((source) => [source, SOURCE_META[source].label]))

export function SimulatorView() {
  const demo = useDemo()
  const router = useRouter()
  const campaign = getCampaign(demo.state.campaignId)
  const path = trackingPath(campaign, demo.state.source)
  const utm = utmFor(campaign, demo.state.source)
  const origin = useOrigin()
  const [copied, setCopied] = useState(false)
  const url = `${origin}${path}`
  const rank = JOURNEY_RANK[demo.state.journeyStage]

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function simulateClick() {
    const arrivalId = crypto.randomUUID()
    router.push(`${path}&sw_arrival=${arrivalId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Campaign simulator</h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Choose an ad, open the landing page, and the visit is attributed before anyone fills out
          a form. Every name and dollar amount is simulated demo data.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <AttributionFlow />
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        {STAGES.map((stage, index) => {
          const done = rank > JOURNEY_RANK[stage.id]
          const current = rank === JOURNEY_RANK[stage.id]
          return (
            <li
              key={stage.id}
              className={cn(
                "rounded-xl border bg-white p-3",
                current && "border-[#0057ff] ring-2 ring-[#0057ff]/20",
                done && "border-[#b7e4c7] bg-[#f3fbf6]",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs font-semibold",
                    done ? "bg-[#1a8f5a] text-white" : current ? "bg-[#0057ff] text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <p className="text-sm font-medium">{stage.title}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{stage.detail}</p>
            </li>
          )
        })}
      </ol>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>1. Choose the ad</CardTitle>
            <CardDescription>
              Fitness, lawn care, and home service campaigns are loaded. Changing the source rewrites the link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">
                Advertising source
                <Select
                  value={demo.state.source}
                  items={sourceItems}
                  onValueChange={(value) => {
                    if (value === "facebook" || value === "instagram" || value === "google") {
                      demo.setSource(value as Source)
                    }
                  }}
                >
                  <SelectTrigger className="w-full font-normal" aria-label="Advertising source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {SOURCE_META[source].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Sample campaign
                <Select
                  value={demo.state.campaignId}
                  items={campaignItems}
                  onValueChange={(value) => {
                    if (isCampaignId(value)) demo.setView(value as CampaignId)
                  }}
                >
                  <SelectTrigger className="w-full font-normal" aria-label="Sample campaign">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESSES.map((business) => (
                      <SelectGroup key={business.id}>
                        <SelectLabel>{business.label}</SelectLabel>
                        {CAMPAIGNS.filter((item) => item.business === business.id).map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.businessName} · {item.shortName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div>
              <p className="text-sm font-medium">2. This is the URL the ad would use</p>
              <p className="mt-2 rounded-lg bg-muted px-3 py-3 font-mono text-xs break-all">{url}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {parameterRows(utm).map((row) => (
                  <div key={row.name} className="rounded-lg border px-3 py-2">
                    <p className="font-mono text-[11px] text-muted-foreground">{row.name}</p>
                    <p className="truncate text-sm font-medium">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {showSimulationControls ? (
                <Button type="button" size="lg" onClick={simulateClick}>
                  <MousePointerClick />
                  Simulate Ad Click
                </Button>
              ) : null}
              <Button type="button" size="lg" variant="outline" onClick={copyUrl}>
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Two-minute path</CardTitle>
            <CardDescription>Say this while you click.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3 text-sm">
              <li><span className="font-medium">1.</span> Pick Facebook, Instagram, or Google, and a sample campaign.</li>
              <li><span className="font-medium">2.</span> Click Simulate Ad Click. The landing page opens with UTM parameters.</li>
              <li><span className="font-medium">3.</span> The visit is recorded immediately. Leave the form blank.</li>
              <li><span className="font-medium">4.</span> Return to the dashboard. The visit belongs to that campaign.</li>
              <li><span className="font-medium">5.</span> Optional: submit the form later to turn that anonymous session into a lead.</li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Each click adds a one-time arrival id. Refreshing that page, or moving to the dashboard, does not count the visit again. Sample ad spend for {campaign.businessName} stays fixed at {campaign.spend.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
