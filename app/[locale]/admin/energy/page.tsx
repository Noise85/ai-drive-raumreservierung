import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/types"
import { adminService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Zap, Building2 } from "lucide-react"

export default async function AdminEnergyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const rooms = await adminService.getRoomEnergyProfiles()
  const buildings = await adminService.getBuildingEnergy()
  const carbonHistory = await adminService.getCarbonIntensityHistory()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.admin.energyTitle}</h1>
        <p className="text-sm text-muted-foreground">Energy consumption profiles and carbon intensity factors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buildings.map((b) => (
          <Card key={b.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {b.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{parseFloat(String(b.carbon_intensity_factor)).toFixed(3)}</span>
                <span className="text-sm text-muted-foreground">kg CO2e / kWh</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{b.room_count} rooms</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Room Energy Profiles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">kWh / hour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.building_name}</TableCell>
                  <TableCell>{r.floor_name}</TableCell>
                  <TableCell><Badge variant="secondary">{r.tier}</Badge></TableCell>
                  <TableCell>{r.capacity}</TableCell>
                  <TableCell className="text-right font-mono">{parseFloat(String(r.energy_kwh_per_hour)).toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carbon Intensity History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead className="text-right">Factor (kg CO2e / kWh)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carbonHistory.map((ch, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{ch.building_name}</TableCell>
                  <TableCell>{new Date(ch.effective_from).toLocaleDateString(locale)}</TableCell>
                  <TableCell className="text-right font-mono">{parseFloat(String(ch.factor)).toFixed(3)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
