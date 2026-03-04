"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { QrCode, CheckCircle2, XCircle, MapPin, Building2, User2, Loader2 } from "lucide-react"
import type { Dictionary } from "@/lib/i18n/types"

interface VisitorCheckinFormProps {
  locale: string
  dict: Dictionary
}

interface CheckinResult {
  success: boolean
  visitor?: {
    name: string
    room_name: string
    floor_name: string
    building_name: string
    host_name: string
    booking_title: string
  }
  message?: string
}

export function VisitorCheckinForm({ locale, dict }: VisitorCheckinFormProps) {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckinResult | null>(null)

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/visitors/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, message: dict.visitors.invalidToken })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <QrCode className="h-7 w-7 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">{dict.visitors.title}</CardTitle>
        <CardDescription>{dict.visitors.enterToken}</CardDescription>
      </CardHeader>
      <CardContent>
        {!result?.success ? (
          <form onSubmit={handleCheckin} className="space-y-4">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter check-in code..."
              className="text-center font-mono tracking-widest"
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading || !token.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {dict.visitors.checkIn}
            </Button>
            {result && !result.success && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                {result.message}
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{dict.visitors.welcome}, {result.visitor?.name}!</h3>
              <p className="text-sm text-muted-foreground">{dict.visitors.checkedIn}</p>
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{dict.visitors.yourRoom}:</span>
                <span className="font-medium">{result.visitor?.room_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{dict.visitors.building}:</span>
                <span className="font-medium">{result.visitor?.building_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{dict.visitors.floor}:</span>
                <span className="font-medium">{result.visitor?.floor_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{dict.visitors.host}:</span>
                <span className="font-medium">{result.visitor?.host_name}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
