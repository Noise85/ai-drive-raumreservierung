import { getDictionary } from "@/lib/i18n/get-dictionary"
import { roomService, sensorService, bookingService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OccupancyGrid } from "@/components/dashboard/occupancy-grid"

export default async function FacilityDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  const [stats, occupancyStats, rooms, ghosts, offlineSensors] = await Promise.all([
    roomService.getStats(),
    roomService.getOccupancyStats(),
    roomService.findAllWithLocation({ activeOnly: true }),
    bookingService.getGhostBookingsCount(),
    sensorService.getOfflineCount(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {dict.facility.dashboardTitle}
      </h1>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {dict.facility.occupiedRooms}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{occupancyStats.occupied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {dict.facility.emptyRooms}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.available_rooms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {dict.facility.offlineSensors}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineSensors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {dict.facility.ghostBookings}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{ghosts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Grid */}
      <OccupancyGrid
        rooms={JSON.parse(JSON.stringify(rooms))}
        locale={locale}
        dict={dict}
      />
    </div>
  )
}
