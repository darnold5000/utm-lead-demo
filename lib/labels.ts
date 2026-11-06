import type { LeadStatus, Source } from "@/lib/types"

export const SOURCE_META: Record<
  Source,
  { label: string; medium: string; color: string }
> = {
  facebook: { label: "Facebook", medium: "paid_social", color: "#1877F2" },
  instagram: { label: "Instagram", medium: "paid_social", color: "#C13584" },
  google: { label: "Google", medium: "cpc", color: "#1a8f5a" },
}

export const SOURCES: Source[] = ["facebook", "instagram", "google"]

export const STATUS_META: Record<
  LeadStatus,
  { label: string; short: string; className: string }
> = {
  new: {
    label: "New lead",
    short: "New lead",
    className: "bg-[#e8f0ff] text-[#0046cc]",
  },
  booked: {
    label: "Booked appointment",
    short: "Booked",
    className: "bg-[#fff4e5] text-[#9a5b00]",
  },
  converted: {
    label: "Paying customer",
    short: "Customer",
    className: "bg-[#e7f6ee] text-[#0f7a45]",
  },
}

export const JOURNEY_RANK = {
  ad: 0,
  visit: 1,
  form: 2,
  lead: 3,
  booked: 4,
  customer: 5,
} as const

export function mediumFor(source: Source) {
  return SOURCE_META[source].medium
}

export function isSource(value: string | null | undefined): value is Source {
  return value === "facebook" || value === "instagram" || value === "google"
}
