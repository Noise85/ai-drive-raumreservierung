"use client"

import { format } from "date-fns"
import { CalendarDays, MapPin, Users, DollarSign, Clock, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cancelBooking } from "@/lib/actions"
import type { Dictionary } from "@/lib/i18n/types"

interface Booking {
  id: string
  title: string
  room_name: string
  building_name: string
  start_time: string
  end_time: string
  status: string
  attendee_count: number
  cost_center_name: string | null
  cost_center_code: string | null
  estimated_cost: string | null
}

interface BookingListProps {
  bookings: Booking[]
  locale: string
  dict: Dictionary
  userId: string
  showActions?: boolean
}

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  auto_released: "bg-amber-100 text-amber-800",
}

export function BookingList({ bookings, locale, dict, userId, showActions }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        {dict.bookings.noBookings}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)
        const durationHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

        return (
          <Card key={booking.id} className="py-3">
            <CardContent className="px-4 py-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{booking.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {booking.room_name} &middot; {booking.building_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(start, "EEE, MMM d")} &middot; {format(start, "HH:mm")} - {format(end, "HH:mm")} ({durationHrs.toFixed(1)}h)
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {booking.attendee_count}
                      </span>
                      {booking.estimated_cost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          CHF {parseFloat(booking.estimated_cost).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {booking.cost_center_code && (
                    <Badge variant="outline" className="text-xs hidden sm:flex">
                      {booking.cost_center_code}
                    </Badge>
                  )}
                  <Badge className={`text-xs ${statusColors[booking.status] || ""}`}>
                    {dict.bookings[booking.status] || booking.status}
                  </Badge>
                  {showActions && booking.status === "confirmed" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">{dict.bookings.cancelBooking}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{dict.bookings.cancelBooking}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {dict.bookings.cancelConfirm}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{dict.common.back}</AlertDialogCancel>
                          <form>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <input type="hidden" name="userId" value={userId} />
                            <input type="hidden" name="locale" value={locale} />
                            <AlertDialogAction
                              type="submit"
                              formAction={cancelBooking}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              {dict.common.confirm}
                            </AlertDialogAction>
                          </form>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
