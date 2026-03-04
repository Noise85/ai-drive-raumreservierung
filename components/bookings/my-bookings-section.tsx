'use client'

import * as React from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingList } from '@/components/bookings/booking-list'
import { ViewToggle, type ViewMode } from './view-toggle'
import { BookingCalendar, type CalendarView, type CalendarEvent } from './booking-calendar'
import { EventDetailsPanel } from './event-details-panel'
import type { Dictionary } from '@/lib/i18n/types'

interface Booking {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  room_name: string
  building_name: string
  attendee_count: number
  estimated_cost: string | null
  cost_center_name: string | null
  cost_center_code: string | null
}

interface MyBookingsSectionProps {
  upcoming: Booking[]
  past: Booking[]
  cancelled: Booking[]
  locale: string
  dict: Dictionary
  userId: string
}

export function MyBookingsSection({
  upcoming,
  past,
  cancelled,
  locale,
  dict,
  userId,
}: MyBookingsSectionProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('list')
  const [calendarView, setCalendarView] = React.useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const bookingsDict = dict.bookings
  const calendarDict = dict.calendar

  // Fetch calendar data when view mode changes to calendar or date changes
  React.useEffect(() => {
    if (viewMode !== 'calendar') return

    const fetchCalendarData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { start, end } = getDateRange(currentDate, calendarView)
        const response = await fetch(
          `/api/bookings/calendar?userId=${userId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch calendar data')
        }

        const data = await response.json()
        setCalendarEvents(data.bookings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalendarData()
  }, [viewMode, currentDate, calendarView, userId])

  const getDateRange = (date: Date, view: CalendarView) => {
    if (view === 'month') {
      // Extend to full weeks for month view
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      return { 
        start: startOfWeek(monthStart, { weekStartsOn: 1 }), 
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }) 
      }
    } else if (view === 'week') {
      return { 
        start: startOfWeek(date, { weekStartsOn: 1 }), 
        end: endOfWeek(date, { weekStartsOn: 1 }) 
      }
    } else {
      return { start: date, end: addDays(date, 1) }
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setDetailsOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-end">
        <ViewToggle
          value={viewMode}
          onChange={setViewMode}
          listLabel={calendarDict.viewList}
          calendarLabel={calendarDict.viewCalendar}
        />
      </div>

      {/* List View with Tabs */}
      {viewMode === 'list' && (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              {bookingsDict.upcoming} ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              {bookingsDict.past} ({past.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              {bookingsDict.cancelled} ({cancelled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            <BookingList
              bookings={upcoming}
              locale={locale}
              dict={dict}
              userId={userId}
              showActions
            />
          </TabsContent>
          <TabsContent value="past" className="mt-4">
            <BookingList
              bookings={past}
              locale={locale}
              dict={dict}
              userId={userId}
            />
          </TabsContent>
          <TabsContent value="cancelled" className="mt-4">
            <BookingList
              bookings={cancelled}
              locale={locale}
              dict={dict}
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <BookingCalendar
          events={calendarEvents}
          view={calendarView}
          onViewChange={setCalendarView}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onEventClick={handleEventClick}
          isLoading={isLoading}
          error={error}
          locale={locale}
        />
      )}

      {/* Event Details Panel */}
      <EventDetailsPanel
        event={selectedEvent}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        locale={locale}
      />
    </div>
  )
}

export default MyBookingsSection
