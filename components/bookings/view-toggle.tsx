'use client'

import * as React from 'react'
import { CalendarIcon, ListIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'calendar'

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  className?: string
  listLabel?: string
  calendarLabel?: string
}

export function ViewToggle({
  value,
  onChange,
  className,
  listLabel = 'List',
  calendarLabel = 'Calendar',
}: ViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border bg-muted p-1',
        className,
      )}
      role="tablist"
      aria-label="View mode"
    >
      <button
        role="tab"
        aria-selected={value === 'list'}
        aria-controls="view-list"
        onClick={() => onChange('list')}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          value === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <ListIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{listLabel}</span>
      </button>
      <button
        role="tab"
        aria-selected={value === 'calendar'}
        aria-controls="view-calendar"
        onClick={() => onChange('calendar')}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          value === 'calendar'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <CalendarIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{calendarLabel}</span>
      </button>
    </div>
  )
}

export default ViewToggle
