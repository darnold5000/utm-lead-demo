import type { Metadata } from "next"

/** Demos stay out of search results until someone explicitly opts this repo in. */
export const allowIndexing = false

export const robots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
}
