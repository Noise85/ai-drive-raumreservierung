'use client'

import * as React from 'react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { CalendarDays, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ViewToggle, type ViewMode } from './view-toggle'
import { BookingCalendar, type CalendarView, type CalendarEvent } from './booking-calendar'
import { EventDetailsPanel } from './event-details-panel'
import type { Dictionary } from '@/lib/i18n/types'

interface Booking {
  id: string
  title: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'auto_released'
  room_name?: string
  building_name?: string
  attendee_count?: number
  estimated_cost?: number
  user_name?: string
}

interface DashboardBookingsSectionProps {
  todayBookings: Booking[]
  upcomingBookings: Booking[]
  pastBookings: Booking[]
  locale: string
  dict: Dictionary
  userId: string
}

export function DashboardBookingsSection({
  todayBookings,
  upcomingBookings,
  pastBookings,
  locale,
  dict,
  userId,
}: DashboardBookingsSectionProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('list')
  const [calendarView, setCalendarView] = React.useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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
      return { start: startOfMonth(date), end: endOfMonth(date) }
    } else if (view === 'week') {
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) }
    } else {
      return { start: date, end: date }
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setDetailsOpen(true)
  }

  // List view content
  const renderListView = () => (
    <>
      {/* Today's Bookings */}
      {todayBookings.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {dict.dashboard.todayBookings}
          </h2>
          <div className="space-y-2">
            {todayBookings.map((booking) => (
              <Card key={booking.id} className="py-3">
                <CardContent className="flex items-center justify-between px-4 py-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{booking.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.room_name} &middot;{' '}
                        {format(new Date(booking.start_time), 'HH:mm')} -{' '}
                        {format(new Date(booking.end_time), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      {booking.attendee_count}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bookings Preview */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {dict.dashboard.upcomingBookings}
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href={`/${locale}/bookings`}>{dict.common.viewAll}</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id} className="py-2.5">
                <CardContent className="flex items-center justify-between px-4 py-0">
                  <div>
                    <p className="text-sm font-medium">{booking.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.room_name} &middot;{' '}
                      {format(new Date(booking.start_time), "EEE, MMM d 'at' HH:mm")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings Preview */}
      {pastBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {dict.bookings.past}
            </h2>
          </div>
          <div className="space-y-2">
            {pastBookings.slice(0, 5).map((booking) => (
              <Card key={booking.id} className="py-2.5 opacity-60">
                <CardContent className="flex items-center justify-between px-4 py-0">
                  <div>
                    <p className="text-sm font-medium">{booking.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.room_name} &middot;{' '}
                      {format(new Date(booking.start_time), "EEE, MMM d 'at' HH:mm")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dict.bookings.completed}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No bookings */}
      {todayBookings.length === 0 && upcomingBookings.length === 0 && pastBookings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarDays className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No bookings</p>
        </div>
      )}
    </>
  )

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          My Bookings
        </h2>
        <ViewToggle
          value={viewMode}
          onChange={setViewMode}
          listLabel={dict.calendar.viewList}
          calendarLabel={dict.calendar.viewCalendar}
        />
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        renderListView()
      ) : (
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

export default DashboardBookingsSection
