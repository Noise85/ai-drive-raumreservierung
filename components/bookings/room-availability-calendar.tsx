'use client'

import * as React from 'react'
import {
  format,
  parseISO,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  addDays,
  isToday,
  isBefore,
  isAfter,
  areIntervalsOverlapping,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Booking {
  id: string
  title: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'auto_released'
  user_name?: string
}

interface RoomAvailabilityCalendarProps {
  roomId: string | null
  selectedDate: Date | null
  selectedStartTime: string | null
  selectedEndTime: string | null
  onConflictDetected?: (hasConflict: boolean) => void
  locale?: string
  className?: string
}

export function RoomAvailabilityCalendar({
  roomId,
  selectedDate,
  selectedStartTime,
  selectedEndTime,
  onConflictDetected,
  locale = 'en',
  className,
}: RoomAvailabilityCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = React.useState(() =>
    startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 })
  )
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM
  const days = eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6),
  })

  // Fetch room bookings when roomId or week changes
  React.useEffect(() => {
    if (!roomId) {
      setBookings([])
      return
    }

    const fetchBookings = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
        const response = await fetch(
          `/api/bookings/calendar?roomId=${roomId}&startDate=${currentWeekStart.toISOString()}&endDate=${weekEnd.toISOString()}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch room availability')
        }

        const data = await response.json()
        setBookings(data.bookings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [roomId, currentWeekStart])

  // Check for conflicts with selected time
  const hasConflict = React.useMemo(() => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime || !roomId) {
      return false
    }

    const proposedStart = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedStartTime}:00`)
    const proposedEnd = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedEndTime}:00`)

    if (proposedEnd <= proposedStart) {
      return false
    }

    return bookings.some((booking) => {
      if (booking.status !== 'confirmed') return false
      const bookingStart = parseISO(booking.start_time)
      const bookingEnd = parseISO(booking.end_time)
      
      return areIntervalsOverlapping(
        { start: proposedStart, end: proposedEnd },
        { start: bookingStart, end: bookingEnd }
      )
    })
  }, [bookings, selectedDate, selectedStartTime, selectedEndTime, roomId])

  // Notify parent of conflict status
  React.useEffect(() => {
    onConflictDetected?.(hasConflict)
  }, [hasConflict, onConflictDetected])

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  // Navigate to selected date's week
  React.useEffect(() => {
    if (selectedDate) {
      const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
      if (selectedWeekStart.getTime() !== currentWeekStart.getTime()) {
        setCurrentWeekStart(selectedWeekStart)
      }
    }
  }, [selectedDate])

  const getBookingsForSlot = (day: Date, hour: number) => {
    return bookings.filter((booking) => {
      if (booking.status !== 'confirmed') return false
      const bookingStart = parseISO(booking.start_time)
      const bookingEnd = parseISO(booking.end_time)
      
      if (!isSameDay(bookingStart, day) && !isSameDay(bookingEnd, day)) {
        // Check if booking spans this day
        if (!(isBefore(bookingStart, day) && isAfter(bookingEnd, addDays(day, 1)))) {
          return false
        }
      }
      
      const slotStart = new Date(day)
      slotStart.setHours(hour, 0, 0, 0)
      const slotEnd = new Date(day)
      slotEnd.setHours(hour + 1, 0, 0, 0)
      
      return areIntervalsOverlapping(
        { start: slotStart, end: slotEnd },
        { start: bookingStart, end: bookingEnd }
      )
    })
  }

  const isProposedSlot = (day: Date, hour: number) => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return false
    if (!isSameDay(day, selectedDate)) return false

    const [startHour, startMin] = selectedStartTime.split(':').map(Number)
    const [endHour, endMin] = selectedEndTime.split(':').map(Number)

    return hour >= startHour && hour < endHour
  }

  const isConflictSlot = (day: Date, hour: number) => {
    if (!isProposedSlot(day, hour)) return false
    const slotBookings = getBookingsForSlot(day, hour)
    return slotBookings.length > 0
  }

  if (!roomId) {
    return (
      <div className={cn('rounded-lg border bg-card p-6 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          Select a room to view availability
        </p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
        <div className="text-sm font-medium">
          {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
        </div>
      </div>

      {/* Conflict Warning */}
      {hasConflict && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-b text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Conflict detected - room is already booked at this time
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-destructive">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Calendar Grid */}
      {!isLoading && !error && (
        <div className="overflow-auto max-h-[400px]">
          <div className="min-w-[600px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b sticky top-0 bg-card z-10">
              <div className="p-2 text-xs font-medium text-muted-foreground border-r" />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'p-2 text-center border-r last:border-r-0',
                    isToday(day) && 'bg-primary/5',
                    selectedDate && isSameDay(day, selectedDate) && 'bg-primary/10',
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isToday(day) && 'text-primary',
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                <div className="p-2 text-xs text-muted-foreground text-right border-r bg-muted/30">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
                {days.map((day) => {
                  const slotBookings = getBookingsForSlot(day, hour)
                  const isProposed = isProposedSlot(day, hour)
                  const isConflict = isConflictSlot(day, hour)
                  const isBooked = slotBookings.length > 0

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        'min-h-[40px] border-r last:border-r-0 relative p-0.5',
                        isProposed && !isConflict && 'bg-green-100 dark:bg-green-950/30',
                        isConflict && 'bg-red-100 dark:bg-red-950/30',
                        isBooked && !isProposed && 'bg-blue-50 dark:bg-blue-950/20',
                      )}
                    >
                      {slotBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="text-[10px] px-1 py-0.5 rounded bg-blue-500 text-white truncate"
                          title={`${booking.title} - ${format(parseISO(booking.start_time), 'h:mm a')} to ${format(parseISO(booking.end_time), 'h:mm a')}`}
                        >
                          {booking.title}
                        </div>
                      ))}
                      {isProposed && !isBooked && (
                        <div className="text-[10px] px-1 py-0.5 rounded bg-green-500 text-white truncate">
                          Your booking
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 border-t text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-muted-foreground">Existing bookings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Your selection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-muted-foreground">Conflict</span>
        </div>
      </div>
    </div>
  )
}

export default RoomAvailabilityCalendar
