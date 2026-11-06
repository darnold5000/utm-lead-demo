const whole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const cents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const number = new Intl.NumberFormat("en-US")

export function formatMoney(value: number) {
  return whole.format(value)
}

export function formatMoneyCents(value: number) {
  return cents.format(value)
}

export function formatNumber(value: number) {
  return number.format(value)
}

export function formatPercent(ratio: number | null) {
  if (ratio == null || !Number.isFinite(ratio)) return "—"
  return `${(ratio * 100).toFixed(1)}%`
}

export function formatRoas(ratio: number | null) {
  if (ratio == null || !Number.isFinite(ratio)) return "—"
  return `${ratio.toFixed(2)}x`
}

export function formatDay(day: string) {
  const [year, month, date] = day.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function formatShortDay(day: string) {
  const [year, month, date] = day.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function localDay(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function addDays(day: string, delta: number) {
  const [year, month, date] = day.split("-").map(Number)
  const next = new Date(Date.UTC(year, month - 1, date))
  next.setUTCDate(next.getUTCDate() + delta)
  return next.toISOString().slice(0, 10)
}

export function leadName(lead: { firstName: string; lastName: string }) {
  return `${lead.firstName} ${lead.lastName}`
}

export function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function shortId(id: string) {
  return id.replace(/^visit-/, "").slice(0, 8)
}
