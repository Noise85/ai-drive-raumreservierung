import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/types"
import { carbonService } from "@/lib/services/carbon-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Leaf, TrendingDown, TrendingUp, Building2, Users } from "lucide-react"
import { CarbonTrendChart } from "@/components/dashboard/carbon-trend-chart"

export default async function SustainabilityDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
  const endDate = new Date().toISOString()
  const carbon = await carbonService.calculateCarbon(startDate, endDate)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.sustainability.dashboardTitle}</h1>
        <p className="text-sm text-muted-foreground">Carbon footprint and ESG metrics overview</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              {dict.sustainability.totalCarbon}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carbon.totalKgCO2e.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">{dict.sustainability.kgCO2e}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {carbon.reductionPct >= 0 ? <TrendingDown className="h-4 w-4 text-green-600" /> : <TrendingUp className="h-4 w-4 text-red-500" />}
              {dict.sustainability.reduction}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${carbon.reductionPct >= 0 ? "text-green-600" : "text-red-500"}`}>
              {carbon.reductionPct >= 0 ? "-" : "+"}{Math.abs(carbon.reductionPct)}%
            </div>
            <p className="text-xs text-muted-foreground">vs. previous period ({carbon.previousPeriodTotal.toFixed(1)} {dict.sustainability.kgCO2e})</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {dict.sustainability.byBuilding}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carbon.byBuilding.length}</div>
            <p className="text-xs text-muted-foreground">Buildings tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              {dict.sustainability.byTeam}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carbon.byTeam.length}</div>
            <p className="text-xs text-muted-foreground">Departments contributing</p>
          </CardContent>
        </Card>
      </div>

      {/* Carbon trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.sustainability.trendTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <CarbonTrendChart data={carbon.trend} />
        </CardContent>
      </Card>

      {/* Building breakdown and team breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{dict.sustainability.byBuilding}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {carbon.byBuilding.map((b) => (
                <div key={b.name} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.bookings} bookings</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{b.kgCO2e.toFixed(1)} kg</div>
                    <div className="text-xs text-muted-foreground">CO2e</div>
                  </div>
                </div>
              ))}
              {carbon.byBuilding.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data available for this period</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{dict.sustainability.byTeam}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {carbon.byTeam.map((t) => (
                <div key={t.department} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{t.department}</div>
                    <div className="text-xs text-muted-foreground">{t.bookings} bookings</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{t.kgCO2e.toFixed(1)} kg</div>
                    <div className="text-xs text-muted-foreground">CO2e</div>
                  </div>
                </div>
              ))}
              {carbon.byTeam.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data available for this period</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
