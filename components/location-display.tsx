"use client"

import { MapPin } from "lucide-react"

interface LocationDisplayProps {
  location: { lat: number; lon: number; name: string } | null
  isRTL: boolean
}

export function LocationDisplay({ location, isRTL }: LocationDisplayProps) {
  if (!location) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{isRTL ? "لم يتم تحديد الموقع بعد" : "No location set yet"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-lg">
        <MapPin className="h-5 w-5 text-primary" />
        <span className="font-medium">{location.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-secondary rounded-lg">
          <div className="text-muted-foreground mb-1">{isRTL ? "خط العرض" : "Latitude"}</div>
          <div className="font-mono">{location.lat.toFixed(4)}</div>
        </div>
        <div className="p-3 bg-secondary rounded-lg">
          <div className="text-muted-foreground mb-1">{isRTL ? "خط الطول" : "Longitude"}</div>
          <div className="font-mono">{location.lon.toFixed(4)}</div>
        </div>
      </div>
    </div>
  )
}
