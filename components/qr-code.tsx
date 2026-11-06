"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { cn } from "cn"

export function QrCode({ value, className }: { value: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      QRCode.toDataURL(value, { margin: 1, width: 280, errorCorrectionLevel: "M" })
        .then((url) => {
          if (!cancelled) setSrc(url)
        })
        .catch(() => {
          if (!cancelled) setSrc(null)
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [value])

  if (!src) {
    return <div className={cn("size-40 rounded-lg bg-muted", className)} aria-hidden />
  }

  return (
    // The image is generated in the browser from the campaign URL. It is not loaded from a remote QR service.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="QR code for this campaign link" className={cn("size-40 rounded-lg bg-white", className)} />
  )
}
