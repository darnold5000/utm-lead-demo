import { CONTENT_POSTS } from "@/lib/content-posts"
import { CAMPAIGNS, DEMO_ANCHOR_DAY, DEMO_DAY_COUNT, getCampaign } from "@/lib/campaigns"
import { addDays } from "@/lib/format"
import { utmFor } from "@/lib/utm"
import { makePeople } from "@/lib/people"
import type { Campaign, DemoData, Lead, LeadStatus, VisitBucket } from "@/lib/types"

function demoDays() {
  return Array.from({ length: DEMO_DAY_COUNT }, (_, index) =>
    addDays(DEMO_ANCHOR_DAY, index - (DEMO_DAY_COUNT - 1)),
  )
}

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function splitCount(total: number, days: string[], seed: number) {
  const random = mulberry32(seed)
  const weights = days.map((day, index) => {
    const dow = new Date(`${day}T12:00:00Z`).getUTCDay()
    const weekend = dow === 0 || dow === 6 ? 0.62 : 1
    const recency = 0.72 + (index / Math.max(days.length - 1, 1)) * 0.55
    return weekend * recency * (0.75 + random() * 0.5)
  })
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  const raw = weights.map((weight) => (weight / weightSum) * total)
  const counts = raw.map((value) => Math.floor(value))
  let remainder = total - counts.reduce((sum, value) => sum + value, 0)
  const order = raw
    .map((value, index) => ({ index, fraction: value - counts[index] }))
    .sort((a, b) => b.fraction - a.fraction)

  for (const item of order) {
    if (remainder <= 0) break
    counts[item.index] += 1
    remainder -= 1
  }

  return counts
}

function takeDay(capacity: number[], prefer: "recent" | "middle" | "early") {
  const indexes = capacity.map((_, index) => index)
  const last = capacity.length - 1
  const ordered =
    prefer === "recent"
      ? [...indexes].reverse()
      : prefer === "early"
        ? indexes
        : [...indexes].sort(
            (a, b) => Math.abs(a - (last - 4)) - Math.abs(b - (last - 4)) || b - a,
          )

  for (const index of ordered) {
    if (capacity[index] > 0) return index
  }
  throw new Error("Demo seed ran out of visits while placing leads")
}

function buildCampaignLeads(
  campaign: Campaign,
  days: string[],
  capacity: number[],
  people: { firstName: string; lastName: string; email: string; phone: string }[],
  personStart: number,
) {
  const planned: { status: LeadStatus; value: number; prefer: "recent" | "middle" | "early" }[] =
    []

  for (const value of campaign.customerValues) {
    planned.push({ status: "converted", value, prefer: "early" })
  }
  for (let index = 0; index < campaign.bookedCount; index += 1) {
    planned.push({ status: "booked", value: campaign.demoValue, prefer: "middle" })
  }
  for (let index = 0; index < campaign.newCount; index += 1) {
    planned.push({ status: "new", value: campaign.demoValue, prefer: "recent" })
  }

  return planned.map((item, index) => {
    const dayIndex = takeDay(capacity, item.prefer)
    capacity[dayIndex] -= 1
    const person = people[personStart + index]
    const lead: Lead = {
      id: `${campaign.id}-${String(index + 1).padStart(2, "0")}`,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone,
      campaignId: campaign.id,
      source: campaign.source,
      status: item.status,
      value: item.value,
      day: days[dayIndex],
      note: null,
      sessionId: null,
      utm: utmFor(campaign, campaign.source),
    }
    return lead
  })
}

export function createInitialState(): DemoData {
  const days = demoDays()
  const expectedLeads = CAMPAIGNS.reduce(
    (sum, campaign) =>
      sum + campaign.newCount + campaign.bookedCount + campaign.customerValues.length,
    0,
  )
  const people = makePeople(expectedLeads)
  const buckets: VisitBucket[] = []
  const leads: Lead[] = []
  let personCursor = 0

  CAMPAIGNS.forEach((campaign, campaignIndex) => {
    const counts = splitCount(campaign.visitors, days, 1000 + campaignIndex * 97)
    const visitSum = counts.reduce((sum, count) => sum + count, 0)
    if (visitSum !== campaign.visitors) {
      throw new Error(`${campaign.id} visits summed to ${visitSum}`)
    }

    counts.forEach((count, dayIndex) => {
      if (count > 0) {
        buckets.push({
          campaignId: campaign.id,
          source: campaign.source,
          day: days[dayIndex],
          count,
        })
      }
    })

    const capacity = [...counts]
    const campaignLeads = buildCampaignLeads(
      campaign,
      days,
      capacity,
      people,
      personCursor,
    )
    personCursor += campaignLeads.length

    const leadCount =
      campaign.newCount + campaign.bookedCount + campaign.customerValues.length
    if (campaignLeads.length !== leadCount) {
      throw new Error(`${campaign.id} lead count mismatch`)
    }

    const revenue = campaignLeads
      .filter((lead) => lead.status === "converted")
      .reduce((sum, lead) => sum + lead.value, 0)
    const expectedRevenue = campaign.customerValues.reduce((sum, value) => sum + value, 0)
    if (revenue !== expectedRevenue) {
      throw new Error(`${campaign.id} revenue mismatch`)
    }

    const leadsByDay = new Map<string, number>()
    for (const lead of campaignLeads) {
      leadsByDay.set(lead.day, (leadsByDay.get(lead.day) ?? 0) + 1)
    }
    days.forEach((day, index) => {
      if ((leadsByDay.get(day) ?? 0) > counts[index]) {
        throw new Error(`${campaign.id} has more leads than visits on ${day}`)
      }
    })

    leads.push(...campaignLeads)
  })

  const emails = new Set(leads.map((lead) => lead.email))
  if (emails.size !== leads.length) {
    throw new Error("Demo leads reused an email address")
  }

  return {
    buckets,
    leads,
    campaignId: "shred",
    source: getCampaign("shred").source,
    view: "all",
    journeyStage: "ad",
    highlightLeadId: null,
    openLeadId: null,
    notice: null,
    noticeSeq: 0,
    simIndex: 0,
    arrivals: [],
    activeSessionId: null,
    links: CONTENT_POSTS,
  }
}
