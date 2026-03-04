import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/types"
import { adminService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SlidersHorizontal, Building2 } from "lucide-react"

export default async function AdminScoringPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const weights = await adminService.getScoringWeights()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.admin.scoringTitle}</h1>
        <p className="text-sm text-muted-foreground">
          Configure how the AI assistant ranks rooms when making suggestions
        </p>
      </div>

      <div className="grid gap-6">
        {weights.map((w) => {
          const factors = [
            { label: "Equipment Match", value: Number(w.equipment_weight), color: "bg-blue-500" },
            { label: "Proximity / Building", value: Number(w.proximity_weight), color: "bg-green-500" },
            { label: "Capacity Fit", value: Number(w.capacity_weight), color: "bg-amber-500" },
            { label: "Utilization History", value: Number(w.utilization_weight), color: "bg-purple-500" },
          ]

          return (
            <Card key={w.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {w.building_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {factors.map((f) => (
                    <div key={f.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>{f.label}</span>
                        <span className="font-mono text-muted-foreground">{(f.value * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={f.value * 100} className={`[&>div]:${f.color}`} />
                    </div>
                  ))}
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Total: {factors.reduce((s, f) => s + f.value, 0).toFixed(2)} (should equal 1.00)
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {weights.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No scoring weights configured. Default weights will be used.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
