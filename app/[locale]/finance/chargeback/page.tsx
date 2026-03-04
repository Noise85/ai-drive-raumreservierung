import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/types"
import { financeService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, FileSpreadsheet, Filter } from "lucide-react"

export default async function ChargebackPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string>> }) {
  const { locale } = await params
  const sp = await searchParams
  const dict = await getDictionary(locale as Locale)

  const startDate = sp.start || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
  const endDate = sp.end || new Date().toISOString()
  const costCenterId = sp.costCenter || undefined

  const report = await financeService.getChargebackReport(startDate, endDate, costCenterId)
  const costCenters = await financeService.getCostCenters()

  const totalCost = report.reduce((sum: number, r) => sum + Number(r.estimated_cost || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{dict.finance.chargebackTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {report.length} bookings | Total: CHF {Number(totalCost).toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form method="GET" className="flex items-center gap-2">
            <select
              name="costCenter"
              defaultValue={costCenterId || ""}
              className="rounded-md border px-3 py-1.5 text-sm bg-background"
            >
              <option value="">All Cost Centers</option>
              {costCenters.map((cc) => (
                <option key={cc.id as string} value={cc.id as string}>{cc.name as string} ({cc.code as string})</option>
              ))}
            </select>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
              <Filter className="h-3.5 w-3.5" />
              {dict.rooms.filters}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{dict.finance.totalCost}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CHF {totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              CHF {report.length > 0 ? (totalCost / report.length).toFixed(2) : "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>{dict.bookings.room}</TableHead>
                <TableHead>{dict.finance.costCenter}</TableHead>
                <TableHead>User</TableHead>
                <TableHead>{dict.rooms.tier}</TableHead>
                <TableHead className="text-right">{dict.bookings.estimatedCost}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.map((row) => (
                <TableRow key={row.id as string}>
                  <TableCell>
                    <div className="font-medium">{row.title as string}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(row.start_time as string).toLocaleDateString(locale)} {new Date(row.start_time as string).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </TableCell>
                  <TableCell>{row.room_name as string}</TableCell>
                  <TableCell>
                    <div className="text-sm">{row.cost_center_name as string || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">{row.cost_center_code as string || ""}</div>
                  </TableCell>
                  <TableCell>{row.user_name as string}</TableCell>
                  <TableCell>
                    <Badge variant={(row.tier as string) === "executive" ? "default" : "secondary"}>
                      {row.tier as string}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">CHF {parseFloat((row.estimated_cost as string) || "0").toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {report.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{dict.common.noResults}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
