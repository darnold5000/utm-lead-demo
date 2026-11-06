"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DemoControls } from "@/components/demo-controls"
import { LeadSheet } from "@/components/lead-sheet"
import { cn } from "cn"

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/simulator", label: "Simulator" },
  { href: "/leads", label: "Leads" },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40">
        <header className="bg-[#0c0d10] text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8ff00]">
              <span className="grid size-8 place-items-center rounded-lg bg-[#0057ff] text-xs font-semibold">
                SW
              </span>
              <span>
                <span className="block text-sm font-semibold leading-tight">Signal Works Digital</span>
                <span className="block text-xs text-white/60">UTM lead tracking</span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1" aria-label="Demo">
              {NAV.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8ff00]",
                      active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <span className="ml-1 rounded-full bg-[#c8ff00] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#1a2400] uppercase">
                Demo data
              </span>
            </nav>
          </div>
        </header>
        <DemoControls />
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">{children}</main>
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6">
          <p>Fictional campaigns, leads, and revenue for a live sales walkthrough.</p>
          <p>
            Powered by the{" "}
            <a
              href="https://hiresignalworks.com"
              target="_blank"
              rel="noreferrer"
              title="Professional websites, software & AI solutions."
              className="font-medium text-foreground underline-offset-4 hover:text-[#0057ff] hover:underline"
            >
              Signal Works Platform
            </a>
          </p>
        </div>
      </footer>
      <LeadSheet />
    </div>
  )
}
