"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useDemo } from "@/components/demo-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateContact } from "@/lib/form"
import { formatMoney, formatTimestamp, shortId } from "@/lib/format"
import { SOURCE_META, STATUS_META } from "@/lib/labels"
import { campaignTitle, classifyVisit } from "@/lib/traffic"
import type { LeadStatus } from "@/lib/types"
import { parameterRows } from "@/lib/utm"

const STATUSES: LeadStatus[] = ["new", "booked", "converted"]

export function VisitView() {
  const searchParams = useSearchParams()
  const demo = useDemo()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [revenue, setRevenue] = useState("")
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})
  const [createdId, setCreatedId] = useState<string | null>(null)
  const explicitArrival = searchParams.get("sw_arrival")

  const preview = classifyVisit({
    links: demo.state.links,
    search: searchParams,
    referrer: "",
    origin: "",
  })

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const explicit = params.get("sw_arrival")
    params.delete("sw_arrival")
    const key = `utm-visit:${params.toString()}`
    const stored = window.sessionStorage.getItem(key)
    const id = explicit || stored || crypto.randomUUID()
    if (!explicit) window.sessionStorage.setItem(key, id)
    const classified = classifyVisit({
      links: demo.state.links,
      search: searchParams,
      referrer: document.referrer,
      origin: window.location.origin,
    })
    demo.recordArrival({ id, ...classified })
  }, [demo, searchParams])

  const recorded =
    demo.state.arrivals.find((arrival) => arrival.id === explicitArrival) ??
    demo.state.arrivals.find(
      (arrival) =>
        arrival.landingPath === preview.landingPath &&
        arrival.utm.campaign === preview.utm.campaign &&
        arrival.utm.source === preview.utm.source,
    ) ??
    null
  const created = demo.state.leads.find((lead) => lead.id === createdId) ?? null
  const campaignId = recorded?.campaignId ?? preview.campaignId
  const source = recorded?.source ?? preview.source
  const utm = recorded?.utm ?? preview.utm
  const savedLink = demo.state.links.find((link) => link.id === campaignId) ?? null

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateContact({ name, email, phone })
    setErrors(result.errors)
    if (!result.valid) return
    const amount = Number(revenue)
    const id = `live-${crypto.randomUUID()}`
    demo.addFormLead({
      id,
      sessionId: recorded?.id ?? explicitArrival,
      firstName: result.firstName,
      lastName: result.lastName,
      email: email.trim(),
      phone: phone.trim(),
      campaignId,
      source,
      value: revenue.trim() && Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0,
      note: null,
      countVisit: !recorded,
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmCampaign: utm.campaign,
      utmContent: utm.content,
      utmTerm: utm.term,
    })
    setCreatedId(id)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <p className="text-xs font-semibold tracking-wide text-[#0046cc] uppercase">Simulated website visit</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">UTM captured automatically</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page stands in for {preview.landingPath}. The visit is stored before anyone fills out a form.
          Demo data only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{campaignTitle(demo.state.links, campaignId)}</CardTitle>
          <CardDescription>
            {SOURCE_META[source].label}
            {recorded ? ` · session ${shortId(recorded.id)} · ${formatTimestamp(recorded.at)}` : " · saving this visit"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2">
            {parameterRows(utm).map((row) => (
              <div key={row.name} className="flex items-baseline justify-between gap-3 text-sm">
                <dt className="font-mono text-xs text-muted-foreground">{row.name}</dt>
                <dd className="text-right font-medium break-all">{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-muted-foreground">
            {utm.campaign
              ? "These parameters name the campaign. Refreshing this page does not count the visit again."
              : "No campaign tag was on this visit, so it is not assigned to a post or ad."}
          </p>
        </CardContent>
      </Card>

      {created ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {created.firstName} {created.lastName}
            </CardTitle>
            <CardDescription>{STATUS_META[created.status].label}. Change the status and the dashboard updates now.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="saved-revenue">Sample revenue</Label>
              <Input
                id="saved-revenue"
                inputMode="numeric"
                defaultValue={created.value || ""}
                key={created.value}
                placeholder="250"
                onBlur={(event) => {
                  const amount = Number(event.target.value)
                  if (event.target.value.trim() && Number.isFinite(amount)) demo.setLeadValue(created.id, amount)
                }}
              />
              <p className="text-xs text-muted-foreground">
                {formatMoney(created.value)} counts as attributed revenue only while the status is Paying customer.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={created.status === status ? "default" : "outline"}
                  onClick={() => demo.setLeadStatus(created.id, status)}
                >
                  {STATUS_META[status].short}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/" className="font-medium text-[#0057ff] hover:underline">
                View the dashboard
              </Link>
              {savedLink ? (
                <Link href={`/links/${savedLink.id}`} className="font-medium text-[#0057ff] hover:underline">
                  View this link
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Optional contact form</CardTitle>
            <CardDescription>Skip this and the visit still counts. Submit it to create a lead.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={submit} noValidate>
              <div className="grid gap-1.5">
                <Label htmlFor="visitor-name">Name</Label>
                <Input id="visitor-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
                {errors.name ? <p className="text-sm text-[#9a5b00]">{errors.name}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="visitor-email">Email</Label>
                <Input id="visitor-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                {errors.email ? <p className="text-sm text-[#9a5b00]">{errors.email}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="visitor-phone">Phone</Label>
                <Input id="visitor-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
                {errors.phone ? <p className="text-sm text-[#9a5b00]">{errors.phone}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="visitor-revenue">Sample revenue, optional</Label>
                <Input
                  id="visitor-revenue"
                  inputMode="numeric"
                  value={revenue}
                  onChange={(event) => setRevenue(event.target.value)}
                  placeholder="250"
                />
              </div>
              <Button type="submit">Create lead</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
