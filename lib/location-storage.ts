import type { SavedLocation } from "./types"

const SAVED_LOCATIONS_KEY = "saved_locations"
const LOCATION_HISTORY_KEY = "location_history"
const MAX_HISTORY = 10

export function getSavedLocations(): SavedLocation[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(SAVED_LOCATIONS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveLocation(location: { lat: number; lon: number; name: string }): void {
  const locations = getSavedLocations()

  // Check if location already exists
  const exists = locations.some(
    (loc) => Math.abs(loc.lat - location.lat) < 0.01 && Math.abs(loc.lon - location.lon) < 0.01,
  )

  if (exists) return

  const newLocation: SavedLocation = {
    id: crypto.randomUUID(),
    ...location,
  }

  locations.push(newLocation)
  localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations))
}

export function removeSavedLocation(id: string): void {
  const locations = getSavedLocations()
  const filtered = locations.filter((loc) => loc.id !== id)
  localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(filtered))
}

export function getLocationHistory(): SavedLocation[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(LOCATION_HISTORY_KEY)
  return data ? JSON.parse(data) : []
}

export function addToLocationHistory(location: { lat: number; lon: number; name: string }): void {
  let history = getLocationHistory()

  // Remove duplicates
  history = history.filter(
    (loc) => !(Math.abs(loc.lat - location.lat) < 0.01 && Math.abs(loc.lon - location.lon) < 0.01),
  )

  const newLocation: SavedLocation = {
    id: crypto.randomUUID(),
    ...location,
  }

  // Add to beginning of history
  history.unshift(newLocation)

  // Keep only MAX_HISTORY items
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY)
  }

  localStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(history))
}

export function clearLocationHistory(): void {
  localStorage.removeItem(LOCATION_HISTORY_KEY)
}
