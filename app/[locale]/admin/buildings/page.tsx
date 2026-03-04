import { getDictionary } from "@/lib/i18n/get-dictionary"
import { buildingService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Layers } from "lucide-react"

export default async function AdminBuildingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  const buildings = await buildingService.findAllWithCounts()
  const floors = await buildingService.findAllFloorsWithCounts()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.admin.buildingsTitle}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {buildings.map((building) => (
          <Card key={building.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">{building.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {building.address}, {building.city}
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="text-xs">
                  <Layers className="mr-1 h-3 w-3" />
                  {building.floor_count} floors
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {building.room_count} rooms
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {building.timezone}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Carbon intensity: {building.carbon_intensity_factor} kg CO2e/kWh
              </div>

              {/* Floors */}
              <div className="pt-2 border-t space-y-1.5">
                {floors.filter(f => f.building_id === building.id).length === 0 && (
                  <p className="text-xs text-muted-foreground">No floors configured</p>
                )}
                {floors
                  .filter(floor => floor.building_id === building.id)
                  .map((floor) => (
                    <div key={floor.id} className="flex items-center justify-between text-sm">
                      <span>{floor.name} (Floor {floor.floor_number})</span>
                      <span className="text-xs text-muted-foreground">{floor.room_count} rooms</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
