const AUTOMATIC = ["Tracked link", "Website visit", "UTM captured", "Dashboard updated"]
const OPTIONAL = ["Visitor", "Contact form", "Lead", "Customer"]

export function AttributionFlow({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold tracking-wide text-[#0046cc] uppercase">Automatic</p>
        <ol className="mt-2 grid gap-2 sm:grid-cols-4">
          {AUTOMATIC.map((step, index) => (
            <li key={step} className="rounded-xl border border-[#b9d0ff] bg-[#f3f7ff] px-3 py-2 text-sm font-medium">
              <span className="mr-2 text-[#0057ff]">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Optional, only if you want a name
        </p>
        <ol className="mt-2 grid gap-2 sm:grid-cols-4">
          {OPTIONAL.map((step) => (
            <li key={step} className="rounded-xl border bg-white px-3 py-2 text-sm">
              {step}
            </li>
          ))}
        </ol>
      </div>
      {compact ? null : (
        <ul className="grid gap-1 text-sm text-muted-foreground">
          <li>UTM tracking does not require a contact form.</li>
          <li>Anonymous visits can be attributed to a campaign.</li>
          <li>Naming a visitor, or confirming a customer, needs a form or another conversion.</li>
          <li>UTM parameters do not include real ad spend, and they do not identify every person who clicked.</li>
        </ul>
      )}
    </div>
  )
}
