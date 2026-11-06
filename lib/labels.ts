import type { LeadStatus, Source } from "@/lib/types"

export const SOURCE_META: Record<
  Source,
  { label: string; medium: string; color: string }
> = {
  facebook: { label: "Facebook", medium: "paid_social", color: "#1877F2" },
  instagram: { label: "Instagram", medium: "paid_social", color: "#C13584" },
  google: { label: "Google", medium: "cpc", color: "#1a8f5a" },
  email: { label: "Email", medium: "email", color: "#7c5cbf" },
  sms: { label: "SMS", medium: "sms", color: "#0c0d10" },
  qr: { label: "QR code", medium: "qr", color: "#e85d3a" },
  referral: { label: "Referral", medium: "referral", color: "#5c6370" },
  other: { label: "Other", medium: "referral", color: "#9a5b00" },
  direct: { label: "Direct", medium: "none", color: "#8a9099" },
  unknown: { label: "Unknown", medium: "none", color: "#c5cad3" },
}

export const SOURCES: Source[] = ["facebook", "instagram", "google"]

export const LINK_SOURCES: Source[] = [
  "facebook",
  "instagram",
  "google",
  "email",
  "sms",
  "qr",
  "other",
]

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
  return value != null && value in SOURCE_META
}

export function isPresenterSource(value: string | null | undefined): value is "facebook" | "instagram" | "google" {
  return value === "facebook" || value === "instagram" || value === "google"
}
