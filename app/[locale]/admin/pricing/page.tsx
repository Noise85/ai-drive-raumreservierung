import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/types"
import { adminService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default async function AdminPricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const schedules = await adminService.getPricingSchedules()
  const rooms = await adminService.getActiveRoomsForPricing()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.admin.pricingTitle}</h1>
        <p className="text-sm text-muted-foreground">Configure time-of-day pricing multipliers for rooms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{room.name}</CardTitle>
                <Badge variant="secondary">{room.tier}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">CHF {parseFloat(String(room.base_hourly_rate)).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Base rate per hour</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing Schedules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead>Effective Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.room_name}</TableCell>
                  <TableCell>{dayNames[s.day_of_week]}</TableCell>
                  <TableCell>{`${String(s.start_hour).padStart(2, "0")}:00 - ${String(s.end_hour).padStart(2, "0")}:00`}</TableCell>
                  <TableCell>
                    <Badge variant={parseFloat(String(s.multiplier)) > 1 ? "default" : "secondary"}>
                      {parseFloat(String(s.multiplier)) > 1 ? "Peak" : "Off-Peak"} {parseFloat(String(s.multiplier))}x
                    </Badge>
                  </TableCell>
                  <TableCell>CHF {(parseFloat(String(s.base_hourly_rate)) * parseFloat(String(s.multiplier))).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pricing schedules configured. Default rates apply.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
