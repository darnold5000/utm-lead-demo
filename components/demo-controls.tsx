"use client"

import { BadgeDollarSign, MousePointerClick, RotateCcw, UserPlus } from "lucide-react"
import { useDemo } from "@/components/demo-provider"
import { Button } from "@/components/ui/button"
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
import { SOURCE_META, SOURCES } from "@/lib/labels"
import type { Source, ViewId } from "@/lib/types"

const viewItems: Record<string, string> = { all: "All campaigns" }
for (const campaign of CAMPAIGNS) viewItems[campaign.id] = campaign.shortName

const sourceItems = Object.fromEntries(SOURCES.map((source) => [source, SOURCE_META[source].label]))

export function DemoControls() {
  const demo = useDemo()
  const { state } = demo
  const campaign = getCampaign(state.campaignId)
  const convertible = state.leads.some(
    (lead) =>
      lead.status !== "converted" &&
      (lead.id === state.highlightLeadId || lead.campaignId === state.campaignId),
  )

  return (
    <div className="border-b border-[#d5e48a] bg-[#f6ffe3]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold tracking-wide text-[#3f4f00] uppercase">
                Presenter · show
              </span>
              <Select
                value={state.view}
                items={viewItems}
                onValueChange={(value) => {
                  if (value === "all" || isCampaignId(value)) demo.setView(value as ViewId)
                }}
              >
                <SelectTrigger className="w-full min-w-48 bg-white sm:w-56" aria-label="Show campaign">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All campaigns</SelectItem>
                  {BUSINESSES.map((business) => (
                    <SelectGroup key={business.id}>
                      <SelectLabel>{business.label}</SelectLabel>
                      {CAMPAIGNS.filter((item) => item.business === business.id).map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.shortName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold tracking-wide text-[#3f4f00] uppercase">
                Ad source
              </span>
              <Select
                value={state.source}
                items={sourceItems}
                onValueChange={(value) => {
                  if (value === "facebook" || value === "instagram" || value === "google") {
                    demo.setSource(value as Source)
                  }
                }}
              >
                <SelectTrigger className="w-full min-w-40 bg-white sm:w-44" aria-label="Advertising source">
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
            </div>
          </div>
          <p className="text-sm text-[#243000]">
            Next simulation uses <span className="font-semibold">{campaign.shortName}</span> on{" "}
            <span className="font-semibold">{SOURCE_META[state.source].label}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="bg-white" onClick={demo.simulateVisit}>
            <MousePointerClick />
            Simulate Website Visit
          </Button>
          <Button type="button" variant="outline" className="bg-white" onClick={demo.simulateLead}>
            <UserPlus />
            Simulate New Lead
          </Button>
          <Button type="button" onClick={demo.convertNextLead} disabled={!convertible}>
            <BadgeDollarSign />
            Convert Lead to Customer
          </Button>
          <Button type="button" variant="ghost" onClick={demo.reset}>
            <RotateCcw />
            Reset Demo
          </Button>
        </div>
        {state.notice ? (
          <p role="status" className="text-sm font-medium text-[#1a2400]">
            {state.notice.text}
          </p>
        ) : null}
      </div>
    </div>
  )
}
