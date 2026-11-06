"use client"

import { useDemo } from "@/components/demo-provider"
import { useOrigin } from "@/components/use-origin"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDay, formatMoney, leadName } from "@/lib/format"
import { SOURCE_META, STATUS_META } from "@/lib/labels"
import { campaignDetail } from "@/lib/traffic"
import type { LeadStatus } from "@/lib/types"
import { leadPath, parameterRows } from "@/lib/utm"

const STATUSES: LeadStatus[] = ["new", "booked", "converted"]

export function LeadSheet() {
  const demo = useDemo()
  const lead = demo.state.leads.find((item) => item.id === demo.state.openLeadId) ?? null
  const origin = useOrigin()

  const campaign = lead ? campaignDetail(demo.state.links, lead.campaignId) : null

  return (
    <Sheet
      open={Boolean(lead)}
      onOpenChange={(open) => {
        if (!open) demo.openLead(null)
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {lead && campaign ? (
          <>
            <SheetHeader>
              <SheetTitle>{leadName(lead)}</SheetTitle>
              <SheetDescription>
                {campaign.businessName} · {campaign.name}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-6">
              <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[lead.status].className}`}>
                {STATUS_META[lead.status].label}
              </span>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>
                    <a className="font-medium text-[#0057ff] hover:underline" href={`mailto:${lead.email}`}>
                      {lead.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>
                    <a className="font-medium text-[#0057ff] hover:underline" href={`tel:${lead.phone.replace(/\D/g, "")}`}>
                      {lead.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="font-medium">{formatDay(lead.day)}</dd>
                </div>
                <div>
                  <Label htmlFor="lead-value">Customer value</Label>
                  <Input
                    id="lead-value"
                    key={`${lead.id}-${lead.value}`}
                    className="mt-1"
                    inputMode="numeric"
                    defaultValue={lead.value}
                    onBlur={(event) => {
                      const amount = Number(event.target.value)
                      if (event.target.value.trim() && Number.isFinite(amount)) demo.setLeadValue(lead.id, amount)
                    }}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMoney(lead.value)} is included only while this person is a paying customer.
                  </p>
                </div>
                <div>
                  <dt className="text-muted-foreground">Traffic source</dt>
                  <dd className="font-medium">{SOURCE_META[lead.source].label}</dd>
                </div>
                {lead.note ? (
                  <div>
                    <dt className="text-muted-foreground">Note</dt>
                    <dd className="font-medium">{lead.note}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="rounded-xl bg-muted/70 p-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Captured link
                </p>
                <p className="mt-1 font-mono text-xs break-all">{origin}{leadPath(lead)}</p>
                <dl className="mt-3 grid gap-2">
                  {parameterRows(lead.utm).map((row) => (
                    <div key={row.name} className="flex items-baseline justify-between gap-3 text-sm">
                      <dt className="font-mono text-xs text-muted-foreground">{row.name}</dt>
                      <dd className="text-right font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="text-sm text-muted-foreground">
                Attributed revenue includes this {formatMoney(lead.value)} only while the status is Paying customer.
                Booked appointments stay in the funnel without adding revenue.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {STATUSES.map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={lead.status === status ? "default" : "outline"}
                    onClick={() => demo.setLeadStatus(lead.id, status)}
                  >
                    {STATUS_META[status].short}
                  </Button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
