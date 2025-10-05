import type { UserProfile, SavedLocation, HealthCondition, WeatherSensitivity } from "./types"

const USER_KEY = "weather_planner_user"
const GUEST_USER_KEY = "weather_planner_guest"

// Create a new user profile
export function createUserProfile(email: string, name: string, isGuest = false): UserProfile {
  const profile: UserProfile = {
    id: crypto.randomUUID(),
    email,
    name,
    isGuest,
    createdAt: new Date().toISOString(),
    preferences: {
      language: "ar",
      defaultEventType: "",
      notificationsEnabled: true,
    },
    healthProfile: {
      conditions: [],
      sensitivities: [],
    },
    savedLocations: [],
  }

  saveUserProfile(profile)
  return profile
}

// Save user profile to localStorage
export function saveUserProfile(profile: UserProfile): void {
  const key = profile.isGuest ? GUEST_USER_KEY : USER_KEY
  localStorage.setItem(key, JSON.stringify(profile))
}

// Get current user profile
export function getUserProfile(): UserProfile | null {
  // Check for regular user first
  const userData = localStorage.getItem(USER_KEY)
  if (userData) {
    return JSON.parse(userData)
  }

  // Check for guest user
  const guestData = localStorage.getItem(GUEST_USER_KEY)
  if (guestData) {
    return JSON.parse(guestData)
  }

  return null
}

// Create guest user
export function createGuestUser(): UserProfile {
  return createUserProfile("guest@local", "Guest User", true)
}

// Logout user
export function logoutUser(): void {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(GUEST_USER_KEY)
}

// Update health profile
export function updateHealthProfile(conditions: HealthCondition[], sensitivities: WeatherSensitivity[]): void {
  const profile = getUserProfile()
  if (profile) {
    profile.healthProfile = { conditions, sensitivities }
    saveUserProfile(profile)
  }
}

// Add saved location
export function addSavedLocation(location: SavedLocation): void {
  const profile = getUserProfile()
  if (profile) {
    profile.savedLocations.push(location)
    saveUserProfile(profile)
  }
}

// Remove saved location
export function removeSavedLocation(locationId: string): void {
  const profile = getUserProfile()
  if (profile) {
    profile.savedLocations = profile.savedLocations.filter((loc) => loc.id !== locationId)
    saveUserProfile(profile)
  }
}

// Toggle favorite location
export function toggleFavoriteLocation(locationId: string): void {
  const profile = getUserProfile()
  if (profile) {
    const location = profile.savedLocations.find((loc) => loc.id === locationId)
    if (location) {
      location.isFavorite = !location.isFavorite
      saveUserProfile(profile)
    }
  }
}

// Update preferences
export function updatePreferences(
  language: "ar" | "en",
  defaultEventType: string,
  notificationsEnabled: boolean,
): void {
  const profile = getUserProfile()
  if (profile) {
    profile.preferences = { language, defaultEventType, notificationsEnabled }
    saveUserProfile(profile)
  }
}
