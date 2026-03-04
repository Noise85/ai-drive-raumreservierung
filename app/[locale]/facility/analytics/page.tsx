import { getDictionary } from "@/lib/i18n/get-dictionary"
import { adminService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UtilizationChart } from "@/components/dashboard/utilization-chart"

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  const roomUtilization = await adminService.getRoomUtilization(30)
  const buildingStats = await adminService.getBuildingStats(30)

  // Calculate utilization rate assuming 10 working hours per day, 22 days
  const maxHoursPerMonth = 10 * 22

  const chartData = roomUtilization.map((r) => ({
    name: r.room_name,
    building: r.building_name,
    bookings: Number(r.booking_count),
    hours: parseFloat(parseFloat(String(r.total_hours)).toFixed(1)),
    utilization: Math.min(100, Math.round((parseFloat(String(r.total_hours)) / maxHoursPerMonth) * 100)),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {dict.facility.analyticsTitle}
      </h1>

      {/* Building Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {buildingStats.map((b) => {
          const util = Math.min(100, Math.round((parseFloat(String(b.total_hours)) / (Number(b.room_count) * maxHoursPerMonth)) * 100))
          return (
            <Card key={b.building_name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{b.building_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{util}%</p>
                    <p className="text-xs text-muted-foreground">{dict.facility.utilizationRate}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{parseFloat(String(b.avg_duration)).toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">{dict.facility.avgDuration}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{b.booking_count}</p>
                    <p className="text-xs text-muted-foreground">Bookings (30d)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Utilization Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Room Utilization (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UtilizationChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  )
}
