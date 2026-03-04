import { getDictionary } from "@/lib/i18n/get-dictionary"
import { sensorService } from "@/lib/services"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"

export default async function AdminSensorsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  const sensors = await sensorService.findAllWithLocation()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.admin.sensorsTitle}</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {sensors.length} sensors configured
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sensor ID</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>{dict.common.status}</TableHead>
                <TableHead>Last Signal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensors.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-medium">{s.room_name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.building_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs uppercase">{s.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${s.status === "online" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.last_signal_at ? format(new Date(s.last_signal_at), "MMM d, HH:mm") : "Never"}
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
