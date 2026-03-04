'use client'

import * as React from 'react'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  UserIcon,
  BanknoteIcon,
  XIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { CalendarEvent } from './booking-calendar'

interface EventDetailsPanelProps {
  event: CalendarEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  locale?: string
}

const STATUS_LABELS: Record<CalendarEvent['status'], string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  auto_released: 'Auto-Released',
}

const STATUS_VARIANTS: Record<CalendarEvent['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  auto_released: 'outline',
}

export function EventDetailsPanel({
  event,
  open,
  onOpenChange,
  locale = 'en',
}: EventDetailsPanelProps) {
  const isMobile = useIsMobile()

  if (!event) return null

  const startTime = parseISO(event.start_time)
  const endTime = parseISO(event.end_time)
  const durationMinutes = differenceInMinutes(endTime, startTime)
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  const durationText = hours > 0 
    ? minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    : `${minutes}m`

  const content = (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANTS[event.status]}>
          {STATUS_LABELS[event.status]}
        </Badge>
      </div>

      <Separator />

      {/* Date and Time */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">
              {format(startTime, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <ClockIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </div>
            <div className="text-sm text-muted-foreground">
              {durationText}
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      {(event.room_name || event.building_name) && (
        <>
          <Separator />
          <div className="flex items-start gap-3">
            <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              {event.room_name && (
                <div className="font-medium">{event.room_name}</div>
              )}
              {event.building_name && (
                <div className="text-sm text-muted-foreground">
                  {event.building_name}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Attendees */}
      {event.attendee_count && event.attendee_count > 0 && (
        <>
          <Separator />
          <div className="flex items-start gap-3">
            <UsersIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">
                {event.attendee_count} {event.attendee_count === 1 ? 'attendee' : 'attendees'}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Organizer */}
      {event.user_name && (
        <>
          <Separator />
          <div className="flex items-start gap-3">
            <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <div className="text-sm text-muted-foreground">Organizer</div>
              <div className="font-medium">{event.user_name}</div>
            </div>
          </div>
        </>
      )}

      {/* Cost */}
      {event.estimated_cost !== undefined && Number(event.estimated_cost) > 0 && (
        <>
          <Separator />
          <div className="flex items-start gap-3">
            <BanknoteIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <div className="text-sm text-muted-foreground">Estimated Cost</div>
              <div className="font-medium">
                CHF {Number(event.estimated_cost).toFixed(2)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{event.title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

export default EventDetailsPanel
