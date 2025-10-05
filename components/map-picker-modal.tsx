"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, MapPin, Loader2 } from "lucide-react"

interface MapPickerModalProps {
  isRTL: boolean
  onClose: () => void
  onSelectLocation: (location: { lat: number; lon: number; name: string }) => void
  initialLocation?: { lat: number; lon: number }
}

export function MapPickerModal({ isRTL, onClose, onSelectLocation, initialLocation }: MapPickerModalProps) {
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(
    initialLocation || { lat: 24.7136, lon: 46.6753 },
  )
  const [locationName, setLocationName] = useState<string>("")
  const [isLoadingName, setIsLoadingName] = useState(false)
  const [map, setMap] = useState<any>(null)

  useEffect(() => {
    // Dynamically load Leaflet CSS and JS
    const loadLeaflet = async () => {
      // Load CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Load JS
      if (!(window as any).L) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.async = true
        document.head.appendChild(script)

        await new Promise((resolve) => {
          script.onload = resolve
        })
      }

      // Initialize map
      const L = (window as any).L
      const mapInstance = L.map("map-container").setView(
        [selectedCoords?.lat || 24.7136, selectedCoords?.lon || 46.6753],
        10,
      )

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance)

      const marker = L.marker([selectedCoords?.lat || 24.7136, selectedCoords?.lon || 46.6753], {
        draggable: true,
      }).addTo(mapInstance)

      marker.on("dragend", async (e: any) => {
        const position = e.target.getLatLng()
        setSelectedCoords({ lat: position.lat, lon: position.lng })
        await fetchLocationName(position.lat, position.lng)
      })

      mapInstance.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        setSelectedCoords({ lat, lon: lng })
        await fetchLocationName(lat, lng)
      })

      setMap(mapInstance)

      // Fetch initial location name
      if (selectedCoords) {
        await fetchLocationName(selectedCoords.lat, selectedCoords.lon)
      }
    }

    loadLeaflet()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [])

  const fetchLocationName = async (lat: number, lon: number) => {
    setIsLoadingName(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${isRTL ? "ar" : "en"}`,
      )
      const data = await response.json()

      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village
        const country = data.address.country
        const name = city && country ? `${city}, ${country}` : data.display_name
        setLocationName(name)
      } else {
        setLocationName(`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`)
      }
    } catch (error) {
      console.log("[v0] Reverse geocoding failed:", error)
      setLocationName(`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`)
    } finally {
      setIsLoadingName(false)
    }
  }

  const handleConfirm = () => {
    if (selectedCoords) {
      onSelectLocation({
        lat: selectedCoords.lat,
        lon: selectedCoords.lon,
        name: locationName || `${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lon.toFixed(4)}°`,
      })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl p-6 relative">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">{isRTL ? "اختر الموقع من الخريطة" : "Select Location on Map"}</h2>
          <p className="text-muted-foreground">
            {isRTL
              ? "انقر على الخريطة أو اسحب العلامة لتحديد الموقع"
              : "Click on the map or drag the marker to select a location"}
          </p>
        </div>

        {/* Map Container */}
        <div id="map-container" className="w-full h-[500px] rounded-lg border border-border mb-4" />

        {/* Selected Location Info */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{isRTL ? "الموقع المحدد" : "Selected Location"}</p>
              {isLoadingName ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {isRTL ? "جاري تحميل اسم الموقع..." : "Loading location name..."}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{locationName}</p>
              )}
            </div>
          </div>
          {selectedCoords && (
            <p className="text-sm text-muted-foreground">
              {selectedCoords.lat.toFixed(4)}°, {selectedCoords.lon.toFixed(4)}°
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handleConfirm} className="flex-1" disabled={!selectedCoords}>
            {isRTL ? "تأكيد الموقع" : "Confirm Location"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
