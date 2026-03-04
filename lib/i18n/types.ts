export type Locale = "en" | "de" | "fr"

export interface Dictionary {
  common: {
    appName: string
    search: string
    save: string
    cancel: string
    delete: string
    edit: string
    create: string
    confirm: string
    back: string
    loading: string
    noResults: string
    export: string
    viewAll: string
    status: string
    actions: string
    settings: string
    switchRole: string
    language: string
  }
  nav: {
    dashboard: string
    rooms: string
    bookings: string
    newBooking: string
    chat: string
    admin: string
    adminRooms: string
    adminBuildings: string
    adminSensors: string
    adminPricing: string
    adminScoring: string
    adminEnergy: string
    facility: string
    facilityDashboard: string
    facilityAnalytics: string
    finance: string
    financeChargeback: string
    financeLeaderboard: string
    visitors: string
    sustainability: string
    sustainabilityDashboard: string
  }
  dashboard: {
    welcome: string
    todayBookings: string
    upcomingBookings: string
    roomsAvailable: string
    occupancyRate: string
    quickActions: string
    bookRoom: string
    askAI: string
    viewOccupancy: string
  }
  rooms: Record<string, string>
  bookings: Record<string, string>
  chat: {
    title: string
    placeholder: string
    examples: string[]
    thinking: string
    enableTts: string
    disableTts: string
    stopSpeaking: string
    ttsActive: string
    startListening: string
    stopListening: string
    listening: string
    enableVoiceMode: string
    disableVoiceMode: string
    voiceModeActive: string
  }
  facility: Record<string, string>
  finance: Record<string, string>
  visitors: Record<string, string>
  sustainability: Record<string, string>
  admin: Record<string, string>
  roles: Record<string, string>
  calendar: {
    viewList: string
    viewCalendar: string
    viewDay: string
    viewWeek: string
    viewMonth: string
    today: string
    previous: string
    next: string
    noBookings: string
    loading: string
    error: string
    retry: string
    moreEvents: string
    eventDetails: string
    organizer: string
    duration: string
    attendees: string
    estimatedCost: string
    location: string
    existingBookings: string
    yourBooking: string
    conflict: string
  }
}
