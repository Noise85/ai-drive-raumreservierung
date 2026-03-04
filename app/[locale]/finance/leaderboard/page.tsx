import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/types"
import { financeService } from "@/lib/services/finance-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, TrendingUp, CreditCard } from "lucide-react"

export default async function LeaderboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const leaderboard = await financeService.getCostCenterLeaderboard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.finance.leaderboardTitle}</h1>
        <p className="text-sm text-muted-foreground">Cost center spending overview and budget utilization</p>
      </div>

      <div className="grid gap-4">
        {leaderboard.map((cc, index) => {
          const totalCost = parseFloat(cc.total_cost as string)
          const budget = parseFloat(cc.budget_monthly as string)
          const budgetPct = parseFloat((cc.budget_pct as string) || "0")
          const bookingCount = parseInt(cc.booking_count as string)

          return (
            <Card key={cc.id as string}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      index === 0 ? "bg-amber-100 text-amber-700" : index === 1 ? "bg-zinc-100 text-zinc-600" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {index < 3 ? <Trophy className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{cc.name as string}</h3>
                      <p className="text-xs text-muted-foreground">{cc.code as string}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">CHF {totalCost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{bookingCount} bookings</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{dict.finance.budgetUsed}</span>
                    <span className={budgetPct > 80 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                      {budgetPct}% of CHF {budget.toFixed(0)}
                    </span>
                  </div>
                  <Progress value={Math.min(budgetPct, 100)} className={budgetPct > 80 ? "[&>div]:bg-red-500" : ""} />
                </div>
              </CardContent>
            </Card>
          )
        })}

        {leaderboard.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {dict.common.noResults}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
