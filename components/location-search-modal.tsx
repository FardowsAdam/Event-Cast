"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Search, MapPin, Star, History, Trash2 } from "lucide-react"
import {
  saveLocation,
  getSavedLocations,
  removeSavedLocation,
  getLocationHistory,
  addToLocationHistory,
} from "@/lib/location-storage"
import type { SavedLocation } from "@/lib/types"

interface LocationSearchModalProps {
  isRTL: boolean
  onClose: () => void
  onSelectLocation: (location: { lat: number; lon: number; name: string }) => void
}

interface SearchResult {
  lat: number
  lon: number
  name: string
  displayName: string
  country: string
}

export function LocationSearchModal({ isRTL, onClose, onSelectLocation }: LocationSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(getSavedLocations())
  const [locationHistory, setLocationHistory] = useState<SavedLocation[]>(getLocationHistory())
  const [activeTab, setActiveTab] = useState<"search" | "saved" | "history">("search")

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Using OpenStreetMap Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=${isRTL ? "ar" : "en"}&limit=10`,
      )
      const data = await response.json()

      const results: SearchResult[] = data.map((item: any) => ({
        lat: Number.parseFloat(item.lat),
        lon: Number.parseFloat(item.lon),
        name: item.name,
        displayName: item.display_name,
        country: item.address?.country || "",
      }))

      setSearchResults(results)
    } catch (error) {
      console.log("[v0] Location search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectLocation = (location: { lat: number; lon: number; name: string }) => {
    addToLocationHistory(location)
    onSelectLocation(location)
    onClose()
  }

  const handleSaveLocation = (location: { lat: number; lon: number; name: string }) => {
    saveLocation(location)
    setSavedLocations(getSavedLocations())
  }

  const handleRemoveLocation = (id: string) => {
    removeSavedLocation(id)
    setSavedLocations(getSavedLocations())
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{isRTL ? "إدارة المواقع" : "Location Management"}</h2>
          <p className="text-muted-foreground">
            {isRTL ? "ابحث عن المواقع واحفظ المفضلة لديك" : "Search for locations and save your favorites"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <Button
            variant="ghost"
            className={`flex-1 rounded-b-none ${activeTab === "search" ? "border-b-2 border-primary" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            <Search className="h-4 w-4 mr-2" />
            {isRTL ? "بحث" : "Search"}
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 rounded-b-none ${activeTab === "saved" ? "border-b-2 border-primary" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            <Star className="h-4 w-4 mr-2" />
            {isRTL ? "المحفوظة" : "Saved"}
            {savedLocations.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                {savedLocations.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 rounded-b-none ${activeTab === "history" ? "border-b-2 border-primary" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <History className="h-4 w-4 mr-2" />
            {isRTL ? "السجل" : "History"}
          </Button>
        </div>

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={isRTL ? "ابحث عن مدينة أو موقع..." : "Search for a city or location..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <p className="text-sm text-muted-foreground">{result.country}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveLocation({ lat: result.lat, lon: result.lon, name: result.name })}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSelectLocation({ lat: result.lat, lon: result.lon, name: result.displayName })
                        }
                      >
                        {isRTL ? "اختيار" : "Select"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !isSearching && (
              <div className="text-center py-8 text-muted-foreground">
                {isRTL ? "لم يتم العثور على نتائج" : "No results found"}
              </div>
            )}
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === "saved" && (
          <div className="space-y-2">
            {savedLocations.length > 0 ? (
              savedLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveLocation(location.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button size="sm" onClick={() => handleSelectLocation(location)}>
                      {isRTL ? "اختيار" : "Select"}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isRTL ? "لا توجد مواقع محفوظة" : "No saved locations"}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-2">
            {locationHistory.length > 0 ? (
              locationHistory.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleSelectLocation(location)}>
                    {isRTL ? "اختيار" : "Select"}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isRTL ? "لا يوجد سجل للمواقع" : "No location history"}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
