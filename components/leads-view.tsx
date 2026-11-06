"use client"

import { useEffect, useMemo, useState } from "react"
import { useDemo } from "@/components/demo-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCampaign } from "@/lib/campaigns"
import { formatDay, formatMoney, leadName } from "@/lib/format"
import { SOURCE_META, STATUS_META } from "@/lib/labels"
import { visibleLeads } from "@/lib/metrics"
import type { LeadStatus } from "@/lib/types"
import { cn } from "cn"

const FILTERS: { id: "all" | LeadStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "booked", label: "Booked" },
  { id: "converted", label: "Customers" },
]

export function LeadsView() {
  const { state, openLead } = useDemo()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>("all")
  const leads = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return visibleLeads(state.leads, state.view).filter((lead) => {
      if (status !== "all" && lead.status !== status) return false
      if (!needle) return true
      const campaign = getCampaign(lead.campaignId)
      const haystack = [
        leadName(lead),
        lead.email,
        lead.phone,
        campaign.name,
        campaign.businessName,
        SOURCE_META[lead.source].label,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [query, state.leads, state.view, status])

  useEffect(() => {
    if (!state.highlightLeadId) return
    document.getElementById(`lead-${state.highlightLeadId}`)?.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }, [state.highlightLeadId])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Leads</h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Each row is a person, not a click. Open one to see the campaign parameters and move them
          from new lead to booked appointment to paying customer. Demo contacts use example.com.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((filter) => (
            <Button
              key={filter.id}
              type="button"
              size="sm"
              variant={status === filter.id ? "default" : "outline"}
              onClick={() => setStatus(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <label className="grid gap-1 text-sm sm:w-72">
          <span className="sr-only">Search leads</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, campaign"
            aria-label="Search leads"
          />
        </label>
      </div>

      <p className="text-sm text-muted-foreground">
        {leads.length} {leads.length === 1 ? "lead" : "leads"} in this view. Customer value is the
        sample sale. It counts toward revenue only after the status is Paying customer.
      </p>

      {leads.length === 0 ? (
        <div className="rounded-xl border bg-white px-4 py-10 text-center">
          <p className="font-medium">No leads match.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clear the search or simulate a new lead for the campaign selected above.
          </p>
          {query || status !== "all" ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQuery("")
                setStatus("all")
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl bg-white ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Customer value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const campaign = getCampaign(lead.campaignId)
                const highlighted = lead.id === state.highlightLeadId
                return (
                  <TableRow
                    key={lead.id}
                    id={`lead-${lead.id}`}
                    tabIndex={0}
                    className={cn("cursor-pointer", highlighted && "bg-[#e8f0ff]")}
                    onClick={() => openLead(lead.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openLead(lead.id)
                      }
                    }}
                  >
                    <TableCell className="font-medium">{leadName(lead)}</TableCell>
                    <TableCell>
                      <p>{lead.email}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </TableCell>
                    <TableCell>{SOURCE_META[lead.source].label}</TableCell>
                    <TableCell>
                      <p>{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.businessName}</p>
                    </TableCell>
                    <TableCell>{formatDay(lead.day)}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[lead.status].className}`}>
                        {STATUS_META[lead.status].label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(lead.value)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
