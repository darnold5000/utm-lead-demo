"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useDemo } from "@/components/demo-provider"
import { Button } from "@/components/ui/button"
import { getCampaignBySlug } from "@/lib/campaigns"
import { validateContact } from "@/lib/form"
import { formatMoney, formatTimestamp, leadName, shortId } from "@/lib/format"
import { isSource, SOURCE_META, STATUS_META, mediumFor } from "@/lib/labels"
import type { LeadStatus } from "@/lib/types"
import { parameterRows } from "@/lib/utm"
import { cn } from "cn"

const THEME = {
  fitness: {
    page: "bg-[#12141a] text-white",
    panel: "bg-[#1c1f27]",
    card: "bg-white text-[#12141a]",
    accent: "bg-[#c8ff00] text-[#142000] hover:bg-[#d6ff4d]",
    muted: "text-white/70",
  },
  lawn: {
    page: "bg-[#e7f2ea] text-[#142018]",
    panel: "bg-[#f7fbf8]",
    card: "bg-white text-[#142018]",
    accent: "bg-[#1f7a4d] text-white hover:bg-[#18643f]",
    muted: "text-[#3e5648]",
  },
  service: {
    page: "bg-[#eef2f8] text-[#0c0d10]",
    panel: "bg-[#f8fafc]",
    card: "bg-white text-[#0c0d10]",
    accent: "bg-[#0057ff] text-white hover:bg-[#0046cc]",
    muted: "text-[#5c6370]",
  },
} as const

export function LandingView() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const demo = useDemo()
  const campaign = getCampaignBySlug(params.slug)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [when, setWhen] = useState("")
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [submits, setSubmits] = useState(0)
  const arrivalId = searchParams.get("sw_arrival")

  useEffect(() => {
    if (!campaign || !arrivalId) return
    const rawSource = searchParams.get("utm_source")
    const visitSource = isSource(rawSource) ? rawSource : campaign.source
    demo.recordArrival({
      id: arrivalId,
      campaignId: campaign.id,
      source: visitSource,
      landingPath: `/lp/${campaign.slug}`,
      utm: {
        source: rawSource || visitSource,
        medium: searchParams.get("utm_medium") || mediumFor(visitSource),
        campaign: searchParams.get("utm_campaign") || campaign.utmCampaign,
        content: searchParams.get("utm_content") || campaign.utmContent,
        term: searchParams.get("utm_term"),
      },
    })
  }, [arrivalId, campaign, demo, searchParams])

  if (!campaign) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col gap-3 px-6 py-16">
        <h1 className="text-2xl font-semibold">That sample page is not in this demo.</h1>
        <Link href="/simulator" className="text-[#0057ff] hover:underline">
          Back to the simulator
        </Link>
      </div>
    )
  }

  const theme = THEME[campaign.business]
  const rawSource = searchParams.get("utm_source")
  const source = isSource(rawSource) ? rawSource : campaign.source
  const utm = {
    source: rawSource || source,
    medium: searchParams.get("utm_medium") || mediumFor(source),
    campaign: searchParams.get("utm_campaign") || campaign.utmCampaign,
    content: searchParams.get("utm_content") || campaign.utmContent,
    term: searchParams.get("utm_term"),
  }
  const created = demo.state.leads.find((lead) => lead.id === createdId) ?? null
  const recorded = arrivalId
    ? demo.state.arrivals.find((arrival) => arrival.id === arrivalId) ?? null
    : null

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!campaign) return
    const result = validateContact({ name, email, phone })
    setErrors(result.errors)
    if (!result.valid) return

    const countVisit = !recorded && submits === 0
    const id = `live-${crypto.randomUUID()}`
    demo.addFormLead({
      id,
      sessionId: recorded?.id ?? null,
      firstName: result.firstName,
      lastName: result.lastName,
      email: email.trim(),
      phone: phone.trim(),
      campaignId: campaign.id,
      source,
      value: campaign.demoValue,
      note: when ? `Prefers ${when}` : null,
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmCampaign: utm.campaign,
      utmContent: utm.content,
      utmTerm: utm.term,
      countVisit,
    })
    setCreatedId(id)
    setSubmits((count) => count + 1)
  }

  return (
    <div className={cn("min-h-screen", theme.page)}>
      <div className="border-b border-black/10 bg-black/80 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-semibold">Demo landing page.</span>{" "}
            <span className="text-white/70">Not a live client site. The form only updates this walkthrough.</span>
          </p>
          <Link href="/simulator" className="font-medium text-[#c8ff00] hover:underline">
            Back to simulator
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2 md:py-14">
        <div className="flex flex-col gap-5">
          <p className={cn("text-sm font-semibold tracking-wide uppercase", theme.muted)}>
            {campaign.businessName}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{campaign.headline}</h1>
          <p className={cn("text-base md:text-lg", theme.muted)}>{campaign.subhead}</p>
          <ul className="grid gap-2 text-sm">
            {campaign.points.map((point) => (
              <li key={point} className={cn("rounded-lg px-3 py-2", theme.panel)}>
                {point}
              </li>
            ))}
          </ul>
          <div className={cn("rounded-xl p-4", theme.panel)}>
            <p className="text-xs font-semibold tracking-wide uppercase">Captured automatically</p>
            <p className={cn("mt-1 text-sm", theme.muted)}>
              {recorded
                ? `Anonymous session ${shortId(recorded.id)} was recorded at ${formatTimestamp(recorded.at)}. No form was required.`
                : "This sample page reads the campaign parameters on the link. An ad click records the visit once."}
            </p>
            {recorded ? (
              <p className={cn("mt-2 text-sm", theme.muted)}>
                Landing page {recorded.landingPath}. Refreshing this page does not count another visit.
              </p>
            ) : null}
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {parameterRows(utm).map((row) => (
                <div key={row.name}>
                  <dt className="font-mono text-[11px] opacity-70">{row.name}</dt>
                  <dd className="truncate text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              className={cn("mt-4 h-11 rounded-lg px-4 text-sm font-semibold", theme.accent)}
              onClick={() => router.push("/")}
            >
              View the visit on the dashboard
            </button>
          </div>
        </div>

        <div className={cn("rounded-2xl p-5 shadow-lg", theme.card)}>
          {created ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold tracking-wide text-[#1a8f5a] uppercase">Lead captured</p>
              <h2 className="text-2xl font-semibold">{leadName(created)} is in the dashboard.</h2>
              <p className="text-sm text-[#5c6370]">
                {SOURCE_META[created.source].label} · {campaign.name} · {formatMoney(created.value)} sample value ·{" "}
                {STATUS_META[created.status].label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["new", "booked", "converted"] as LeadStatus[]).map((status) => (
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
              <Button type="button" className={theme.accent} onClick={() => router.push("/")}>
                View on the dashboard
              </Button>
              <button
                type="button"
                className="text-sm font-medium text-[#0057ff] hover:underline"
                onClick={() => {
                  setCreatedId(null)
                  setName("")
                  setEmail("")
                  setPhone("")
                  setWhen("")
                }}
              >
                Submit another sample lead
              </button>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#5c6370] uppercase">Optional</p>
                <h2 className="text-xl font-semibold">{campaign.cta}</h2>
                <p className="mt-1 text-sm text-[#5c6370]">
                  The visit is already counted. This form only turns the anonymous session into a lead. Nothing is emailed.
                </p>
              </div>
              <Field label="Full name" error={errors.name}>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={fieldClass}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  required
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClass}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  required
                />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={fieldClass}
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  required
                />
              </Field>
              <Field label="Preferred time">
                <select
                  value={when}
                  onChange={(event) => setWhen(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">No preference</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </Field>
              <button type="submit" className={cn("h-11 rounded-lg text-sm font-semibold", theme.accent)}>
                {campaign.cta}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const fieldClass =
  "h-11 w-full rounded-lg border border-[#d5dbe6] bg-white px-3 text-base text-[#0c0d10] outline-none focus-visible:border-[#0057ff] focus-visible:ring-3 focus-visible:ring-[#0057ff]/25"

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  )
}
