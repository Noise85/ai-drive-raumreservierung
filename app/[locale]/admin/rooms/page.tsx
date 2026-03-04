import { getDictionary } from "@/lib/i18n/get-dictionary"
import { roomService } from "@/lib/services"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function AdminRoomsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  const rooms = await roomService.findAllWithLocation()

  const statusColors: Record<string, string> = {
    empty: "bg-emerald-100 text-emerald-800",
    occupied: "bg-red-100 text-red-800",
    offline: "bg-gray-100 text-gray-800",
    unknown: "bg-yellow-100 text-yellow-800",
  }

  const tierStyles: Record<string, string> = {
    standard: "bg-secondary text-secondary-foreground",
    premium: "bg-amber-100 text-amber-800",
    executive: "bg-primary/10 text-primary",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{dict.admin.roomsTitle}</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {rooms.length} rooms configured
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict.admin.roomName}</TableHead>
                <TableHead>{dict.rooms.building}</TableHead>
                <TableHead>{dict.rooms.floor}</TableHead>
                <TableHead className="text-center">{dict.rooms.capacity}</TableHead>
                <TableHead>{dict.rooms.tier}</TableHead>
                <TableHead className="text-right">{dict.admin.hourlyRate}</TableHead>
                <TableHead className="text-right">{dict.admin.energyKwh}</TableHead>
                <TableHead className="text-center">{dict.common.status}</TableHead>
                <TableHead className="text-center">{dict.admin.isActive}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{room.building_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{room.floor_name}</TableCell>
                  <TableCell className="text-center">{room.capacity}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${tierStyles[room.tier] || ""}`}>
                      {dict.rooms[room.tier] || room.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">CHF {parseFloat(String(room.base_hourly_rate)).toFixed(0)}</TableCell>
                  <TableCell className="text-right">{room.energy_kwh_per_hour}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${statusColors[room.occupancy_status] || ""}`}>
                      {dict.rooms[room.occupancy_status] || room.occupancy_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={room.is_active ? "default" : "outline"} className="text-xs">
                      {room.is_active ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
