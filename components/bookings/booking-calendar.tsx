'use client'

import * as React from 'react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
  parseISO,
  differenceInMinutes,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type CalendarView = 'day' | 'week' | 'month'

export interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'auto_released'
  room_name?: string
  building_name?: string
  user_name?: string
  attendee_count?: number
  estimated_cost?: number
}

interface BookingCalendarProps {
  events: CalendarEvent[]
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  currentDate: Date
  onDateChange: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  isLoading?: boolean
  error?: string | null
  highlightedSlot?: { start: Date; end: Date } | null
  conflictSlots?: Array<{ start: Date; end: Date }>
  className?: string
  locale?: string
}

const STATUS_COLORS: Record<CalendarEvent['status'], string> = {
  confirmed: 'bg-blue-500 hover:bg-blue-600',
  completed: 'bg-gray-400 hover:bg-gray-500',
  cancelled: 'bg-red-400 hover:bg-red-500',
  auto_released: 'bg-orange-400 hover:bg-orange-500',
}

const STATUS_BORDER_COLORS: Record<CalendarEvent['status'], string> = {
  confirmed: 'border-l-blue-500',
  completed: 'border-l-gray-400',
  cancelled: 'border-l-red-400',
  auto_released: 'border-l-orange-400',
}

export function BookingCalendar({
  events,
  view,
  onViewChange,
  currentDate,
  onDateChange,
  onEventClick,
  isLoading = false,
  error = null,
  highlightedSlot,
  conflictSlots = [],
  className,
  locale = 'en',
}: BookingCalendarProps) {
  const handlePrevious = () => {
    if (view === 'month') onDateChange(subMonths(currentDate, 1))
    else if (view === 'week') onDateChange(subWeeks(currentDate, 1))
    else onDateChange(subDays(currentDate, 1))
  }

  const handleNext = () => {
    if (view === 'month') onDateChange(addMonths(currentDate, 1))
    else if (view === 'week') onDateChange(addWeeks(currentDate, 1))
    else onDateChange(addDays(currentDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const getDateRange = () => {
    if (view === 'month') {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) }
    } else if (view === 'week') {
      return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) }
    } else {
      return { start: currentDate, end: currentDate }
    }
  }

  const getTitle = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy')
    } else if (view === 'week') {
      const { start, end } = getDateRange()
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy')
    }
  }

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          aria-label="Previous"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          aria-label="Next"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
        <h2 className="text-lg font-semibold ml-2">{getTitle()}</h2>
      </div>
      <Select value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Day</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="month">Month</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading calendar...</p>
    </div>
  )

  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
      <p className="text-sm">{error}</p>
      <Button variant="outline" size="sm" onClick={() => onDateChange(currentDate)}>
        Retry
      </Button>
    </div>
  )

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <p className="text-sm">No bookings in this period</p>
    </div>
  )

  if (error) {
    return (
      <div className={cn('rounded-lg border bg-card p-4', className)}>
        {renderHeader()}
        {renderError()}
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {renderHeader()}
      {isLoading ? renderLoading() : (
        <>
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventClick={onEventClick}
              onDateClick={(date) => {
                onDateChange(date)
                onViewChange('day')
              }}
              highlightedSlot={highlightedSlot}
              conflictSlots={conflictSlots}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventClick={onEventClick}
              highlightedSlot={highlightedSlot}
              conflictSlots={conflictSlots}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={onEventClick}
              highlightedSlot={highlightedSlot}
              conflictSlots={conflictSlots}
            />
          )}
          {!isLoading && events.length === 0 && renderEmpty()}
        </>
      )}
    </div>
  )
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  highlightedSlot,
  conflictSlots,
}: {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  highlightedSlot?: { start: Date; end: Date } | null
  conflictSlots?: Array<{ start: Date; end: Date }>
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.start_time)
      return isSameDay(eventStart, day)
    })
  }

  return (
    <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
      {weekDays.map((day) => (
        <div
          key={day}
          className="bg-muted-foreground/10 p-2 text-center text-xs font-medium text-muted-foreground"
        >
          {day}
        </div>
      ))}
      {days.map((day) => {
        const dayEvents = getEventsForDay(day)
        const isCurrentMonth = isSameMonth(day, currentDate)
        const isTodayDate = isToday(day)

        return (
          <div
            key={day.toISOString()}
            className={cn(
              'bg-card min-h-[100px] p-1 cursor-pointer hover:bg-accent/50 transition-colors',
              !isCurrentMonth && 'opacity-40',
            )}
            onClick={() => onDateClick?.(day)}
            onKeyDown={(e) => e.key === 'Enter' && onDateClick?.(day)}
            tabIndex={0}
            role="button"
            aria-label={format(day, 'EEEE, MMMM d, yyyy')}
          >
            <div
              className={cn(
                'text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                isTodayDate && 'bg-primary text-primary-foreground',
              )}
            >
              {format(day, 'd')}
            </div>
            <div className="space-y-0.5">
              {dayEvents.slice(0, 3).map((event) => {
                const eventStart = parseISO(event.start_time)
                const eventEnd = parseISO(event.end_time)
                const durationMinutes = differenceInMinutes(eventEnd, eventStart)
                const hours = Math.floor(durationMinutes / 60)
                const mins = durationMinutes % 60
                const durationStr = hours > 0 
                  ? mins > 0 ? `${hours}h${mins}m` : `${hours}h`
                  : `${mins}m`
                
                return (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                    className={cn(
                      'w-full text-left text-xs px-1 py-0.5 rounded truncate text-white',
                      STATUS_COLORS[event.status],
                    )}
                    aria-label={`${event.title} - ${format(eventStart, 'h:mm a')} - ${durationStr}`}
                  >
                    {format(eventStart, 'HH:mm')} {durationStr} {event.title}
                  </button>
                )
              })}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground px-1">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Week View Component
function WeekView({
  currentDate,
  events,
  onEventClick,
  highlightedSlot,
  conflictSlots,
}: {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  highlightedSlot?: { start: Date; end: Date } | null
  conflictSlots?: Array<{ start: Date; end: Date }>
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM
  const HOUR_HEIGHT = 60 // pixels per hour
  const MIN_EVENT_HEIGHT = 15 // minimum 15 minutes visual height

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.start_time)
      return isSameDay(eventStart, day)
    })
  }

  // Calculate overlapping groups for events
  const getEventLayout = (dayEvents: CalendarEvent[]) => {
    if (dayEvents.length === 0) return []

    // Sort by start time
    const sorted = [...dayEvents].sort((a, b) => 
      parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
    )

    const layoutEvents: Array<{
      event: CalendarEvent
      top: number
      height: number
      left: number
      width: number
    }> = []

    // Group overlapping events
    const groups: CalendarEvent[][] = []
    let currentGroup: CalendarEvent[] = []
    let currentGroupEnd = 0

    for (const event of sorted) {
      const start = parseISO(event.start_time)
      const end = parseISO(event.end_time)
      const startMinutes = start.getHours() * 60 + start.getMinutes()

      if (currentGroup.length === 0 || startMinutes < currentGroupEnd) {
        currentGroup.push(event)
        currentGroupEnd = Math.max(currentGroupEnd, end.getHours() * 60 + end.getMinutes())
      } else {
        groups.push(currentGroup)
        currentGroup = [event]
        currentGroupEnd = end.getHours() * 60 + end.getMinutes()
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup)

    // Calculate layout for each group
    for (const group of groups) {
      const numColumns = group.length
      group.forEach((event, index) => {
        const start = parseISO(event.start_time)
        const end = parseISO(event.end_time)
        const startMinutes = (start.getHours() - 7) * 60 + start.getMinutes()
        const durationMinutes = differenceInMinutes(end, start)
        
        const top = Math.max(0, startMinutes * (HOUR_HEIGHT / 60))
        const height = Math.max(MIN_EVENT_HEIGHT, durationMinutes * (HOUR_HEIGHT / 60))
        const width = 100 / numColumns
        const left = width * index

        layoutEvents.push({ event, top, height, left, width })
      })
    }

    return layoutEvents
  }

  return (
    <div className="overflow-auto">
      <div className="grid grid-cols-8 min-w-[800px]">
        {/* Header */}
        <div className="bg-muted p-2" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'bg-muted p-2 text-center text-sm font-medium',
              isToday(day) && 'bg-primary/10',
            )}
          >
            <div className="text-muted-foreground">{format(day, 'EEE')}</div>
            <div
              className={cn(
                'text-lg',
                isToday(day) && 'text-primary font-bold',
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}

        {/* Time column + Day columns with events */}
        <div className="col-span-8 grid grid-cols-8">
          {/* Time labels */}
          <div className="bg-muted/50">
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-t text-xs text-muted-foreground text-right pr-2 h-[60px] flex items-start justify-end pt-1"
              >
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day)
            const layoutEvents = getEventLayout(dayEvents)

            return (
              <div
                key={day.toISOString()}
                className="relative border-l"
                style={{ height: hours.length * HOUR_HEIGHT }}
              >
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t"
                    style={{ top: (hour - 7) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Events */}
                {layoutEvents.map(({ event, top, height, left, width }) => {
                  const start = parseISO(event.start_time)
                  const end = parseISO(event.end_time)
                  const durationMinutes = differenceInMinutes(end, start)
                  const hours = Math.floor(durationMinutes / 60)
                  const mins = durationMinutes % 60
                  const durationStr = hours > 0 
                    ? mins > 0 ? `${hours}h${mins}m` : `${hours}h`
                    : `${mins}m`

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        'absolute text-left text-xs p-1 rounded border-l-2 bg-card shadow-sm overflow-hidden z-10',
                        STATUS_BORDER_COLORS[event.status],
                      )}
                      style={{
                        top: top + 1,
                        height: height - 2,
                        left: `${left}%`,
                        width: `calc(${width}% - 4px)`,
                        marginLeft: 2,
                      }}
                      aria-label={`${event.title} at ${format(start, 'h:mm a')} - ${durationStr}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-muted-foreground truncate">
                        {format(start, 'h:mm a')} ({durationStr})
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Day View Component
function DayView({
  currentDate,
  events,
  onEventClick,
  highlightedSlot,
  conflictSlots,
}: {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  highlightedSlot?: { start: Date; end: Date } | null
  conflictSlots?: Array<{ start: Date; end: Date }>
}) {
  const START_HOUR = 6 // 6 AM
  const hours = Array.from({ length: 14 }, (_, i) => i + START_HOUR) // 6 AM to 7 PM
  const HOUR_HEIGHT = 60 // pixels per hour
  const MIN_EVENT_HEIGHT = 15 // minimum 15 minutes visual height

  const dayEvents = events.filter((event) => {
    const eventStart = parseISO(event.start_time)
    return isSameDay(eventStart, currentDate)
  })

  // Calculate overlapping groups for events
  const getEventLayout = () => {
    if (dayEvents.length === 0) return []

    // Sort by start time
    const sorted = [...dayEvents].sort((a, b) => 
      parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
    )

    const layoutEvents: Array<{
      event: CalendarEvent
      top: number
      height: number
      left: number
      width: number
    }> = []

    // Group overlapping events
    const groups: CalendarEvent[][] = []
    let currentGroup: CalendarEvent[] = []
    let currentGroupEnd = 0

    for (const event of sorted) {
      const start = parseISO(event.start_time)
      const end = parseISO(event.end_time)
      const startMinutes = start.getHours() * 60 + start.getMinutes()

      if (currentGroup.length === 0 || startMinutes < currentGroupEnd) {
        currentGroup.push(event)
        currentGroupEnd = Math.max(currentGroupEnd, end.getHours() * 60 + end.getMinutes())
      } else {
        groups.push(currentGroup)
        currentGroup = [event]
        currentGroupEnd = end.getHours() * 60 + end.getMinutes()
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup)

    // Calculate layout for each group
    for (const group of groups) {
      const numColumns = group.length
      group.forEach((event, index) => {
        const start = parseISO(event.start_time)
        const end = parseISO(event.end_time)
        const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes()
        const durationMinutes = differenceInMinutes(end, start)
        
        const top = Math.max(0, startMinutes * (HOUR_HEIGHT / 60))
        const height = Math.max(MIN_EVENT_HEIGHT, durationMinutes * (HOUR_HEIGHT / 60))
        const width = 100 / numColumns
        const left = width * index

        layoutEvents.push({ event, top, height, left, width })
      })
    }

    return layoutEvents
  }

  const layoutEvents = getEventLayout()

  const isHighlighted = (hour: number) => {
    if (!highlightedSlot) return false
    const slotHour = highlightedSlot.start.getHours()
    const endHour = highlightedSlot.end.getHours()
    return hour >= slotHour && hour < endHour && isSameDay(highlightedSlot.start, currentDate)
  }

  const isConflict = (hour: number) => {
    return conflictSlots?.some((slot) => {
      const slotHour = slot.start.getHours()
      const endHour = slot.end.getHours()
      return hour >= slotHour && hour < endHour && isSameDay(slot.start, currentDate)
    })
  }

  return (
    <div className="flex">
      {/* Time labels */}
      <div className="w-20 shrink-0 bg-muted/30">
        {hours.map((hour) => (
          <div
            key={hour}
            className={cn(
              'border-t text-xs text-muted-foreground text-right pr-2 h-[60px] flex items-start justify-end pt-1',
              isHighlighted(hour) && 'bg-green-50 dark:bg-green-950/20',
              isConflict(hour) && 'bg-red-50 dark:bg-red-950/20',
            )}
          >
            {format(new Date().setHours(hour, 0), 'h:mm a')}
          </div>
        ))}
      </div>

      {/* Events column */}
      <div 
        className="flex-1 relative border-l"
        style={{ height: hours.length * HOUR_HEIGHT }}
      >
        {/* Hour grid lines */}
        {hours.map((hour) => (
          <div
            key={hour}
            className={cn(
              'absolute w-full border-t h-[60px]',
              isHighlighted(hour) && 'bg-green-50 dark:bg-green-950/20',
              isConflict(hour) && 'bg-red-50 dark:bg-red-950/20',
            )}
            style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
          />
        ))}

        {/* Events */}
        {layoutEvents.map(({ event, top, height, left, width }) => {
          const start = parseISO(event.start_time)
          const end = parseISO(event.end_time)
          const durationMinutes = differenceInMinutes(end, start)
          const hrs = Math.floor(durationMinutes / 60)
          const mins = durationMinutes % 60
          const durationStr = hrs > 0 
            ? mins > 0 ? `${hrs}h${mins}m` : `${hrs}h`
            : `${mins}m`

          return (
            <button
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className={cn(
                'absolute text-left p-2 rounded border-l-4 bg-card shadow-sm overflow-hidden z-10',
                STATUS_BORDER_COLORS[event.status],
              )}
              style={{
                top: top + 1,
                height: height - 2,
                left: `calc(${left}% + 2px)`,
                width: `calc(${width}% - 6px)`,
              }}
              aria-label={`${event.title} from ${format(start, 'h:mm a')} to ${format(end, 'h:mm a')}`}
            >
              <div className="font-medium truncate">{event.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {format(start, 'h:mm a')} - {format(end, 'h:mm a')} ({durationStr})
              </div>
              {event.room_name && (
                <div className="text-xs text-muted-foreground truncate">
                  {event.room_name}
                </div>
              )}
              {event.attendee_count && height > 60 && (
                <div className="text-xs text-muted-foreground">
                  {event.attendee_count} attendees
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BookingCalendar
