import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Users, Building2, Layers, DollarSign, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { roomService, bookingService } from "@/lib/services"
import { format } from "date-fns"

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const dict = await getDictionary(locale)

  const room = await roomService.findByIdWithLocation(id)

  if (!room) return notFound()

  const equipment: string[] = typeof room.equipment === "string" ? JSON.parse(room.equipment) : (room.equipment as string[])

  const upcomingBookings = await bookingService.getUpcomingByRoom(id, 10)

  const statusColors: Record<string, string> = {
    empty: "bg-emerald-500",
    occupied: "bg-red-500",
    offline: "bg-gray-400",
    unknown: "bg-yellow-500",
  }

  const tierStyles: Record<string, string> = {
    standard: "bg-secondary text-secondary-foreground",
    premium: "bg-amber-100 text-amber-800",
    executive: "bg-primary/10 text-primary",
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/rooms`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {dict.common.back}
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{room.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${statusColors[room.occupancy_status] || statusColors.unknown}`} />
          <span className="text-sm text-muted-foreground">
            {dict.rooms[room.occupancy_status] || room.occupancy_status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Room Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{room.building_name}{room.city ? `, ${room.city}` : ""}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span>{room.floor_name} (Floor {room.floor_number})</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{room.capacity} {dict.rooms.seats}</span>
              </div>
              <Badge className={`text-xs ${tierStyles[room.tier] || ""}`}>
                {dict.rooms[room.tier] || room.tier}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>CHF {parseFloat(String(room.base_hourly_rate)).toFixed(2)} {dict.rooms.perHour}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>{room.energy_kwh_per_hour} kWh/h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{dict.rooms.equipment}</CardTitle>
          </CardHeader>
          <CardContent>
            {equipment.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {equipment.map((eq) => (
                  <Badge key={eq} variant="outline" className="text-sm px-3 py-1">
                    {dict.rooms[eq] || eq}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No equipment listed</p>
            )}

            <div className="mt-4">
              <Button asChild className="w-full">
                <Link href={`/${locale}/bookings/new?roomId=${id}`}>
                  {dict.rooms.bookNow}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings for this room */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Upcoming Bookings ({upcomingBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming bookings</p>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map((booking, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{booking.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(booking.start_time), "EEE, MMM d")} &middot;{" "}
                      {format(new Date(booking.start_time), "HH:mm")} - {format(new Date(booking.end_time), "HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{booking.booked_by}</p>
                    <p className="text-xs text-muted-foreground">
                      <Users className="inline h-3 w-3 mr-0.5" />{booking.attendee_count}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
