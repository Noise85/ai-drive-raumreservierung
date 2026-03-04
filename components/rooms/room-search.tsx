"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Search, Users, Monitor, Mic, Presentation, PenTool, Video, CircleDot } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Dictionary } from "@/lib/i18n/types"

interface Room {
  id: string
  name: string
  description: string
  capacity: number
  equipment: string
  tier: string
  base_hourly_rate: string
  occupancy_status: string
  floor_name: string
  floor_number: number
  building_name: string
  building_id: string
}

interface Building {
  id: string
  name: string
}

interface RoomSearchProps {
  locale: string
  dict: Dictionary
  rooms: Room[]
  buildings: Building[]
  currentFilters: {
    capacity: string
    building: string
    equipment: string
    tier: string
    q: string
  }
}

const equipmentIcons: Record<string, React.ElementType> = {
  projector: Presentation,
  whiteboard: PenTool,
  video_conferencing: Video,
  microphone: Mic,
  recording: CircleDot,
  standing_desk: Monitor,
}

const statusColors: Record<string, string> = {
  empty: "bg-emerald-500",
  occupied: "bg-red-500",
  offline: "bg-gray-400",
  unknown: "bg-yellow-500",
}

const tierStyles: Record<string, string> = {
  standard: "bg-secondary text-secondary-foreground",
  premium: "bg-amber-100 text-amber-800",
  executive: "bg-primary/10 text-primary",
}

export function RoomSearch({ locale, dict, rooms, buildings, currentFilters }: RoomSearchProps) {
  const router = useRouter()
  const [q, setQ] = useState(currentFilters.q)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams()
    const filters = { ...currentFilters, [key]: value }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`/${locale}/rooms?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilter("q", q)
  }

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={dict.rooms.searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit" size="sm">{dict.common.search}</Button>
        </form>

        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{dict.rooms.building}</Label>
            <Select value={currentFilters.building || "all"} onValueChange={(v) => updateFilter("building", v === "all" ? "" : v)}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buildings</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{dict.rooms.minCapacity}</Label>
            <Select value={currentFilters.capacity || "0"} onValueChange={(v) => updateFilter("capacity", v === "0" ? "" : v)}>
              <SelectTrigger className="w-28 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="8">8+</SelectItem>
                <SelectItem value="12">12+</SelectItem>
                <SelectItem value="16">16+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{dict.rooms.tier}</Label>
            <Select value={currentFilters.tier || "all"} onValueChange={(v) => updateFilter("tier", v === "all" ? "" : v)}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="standard">{dict.rooms.standard}</SelectItem>
                <SelectItem value="premium">{dict.rooms.premium}</SelectItem>
                <SelectItem value="executive">{dict.rooms.executive}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      {rooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {dict.rooms.noRoomsFound}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const eqList: string[] = typeof room.equipment === "string" ? JSON.parse(room.equipment) : (room.equipment as unknown as string[])
            return (
              <Card key={room.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{room.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {room.building_name} &middot; {room.floor_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${statusColors[room.occupancy_status] || statusColors.unknown}`} />
                      <span className="text-xs text-muted-foreground">
                        {dict.rooms[room.occupancy_status] || room.occupancy_status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{room.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{room.capacity} {dict.rooms.seats}</span>
                    </div>
                    <Badge variant="secondary" className={`text-xs ${tierStyles[room.tier] || ""}`}>
                      {dict.rooms[room.tier] || room.tier}
                    </Badge>
                  </div>

                  {eqList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {eqList.map((eq) => {
                        const Icon = equipmentIcons[eq]
                        return (
                          <Badge key={eq} variant="outline" className="text-xs gap-1 px-1.5 py-0.5">
                            {Icon && <Icon className="h-3 w-3" />}
                            {dict.rooms[eq] || eq}
                          </Badge>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-semibold">
                      CHF {parseFloat(room.base_hourly_rate).toFixed(0)}
                      <span className="text-xs font-normal text-muted-foreground">{dict.rooms.perHour}</span>
                    </span>
                    <div className="flex gap-1.5">
                      <Button asChild variant="outline" size="sm" className="text-xs">
                        <Link href={`/${locale}/rooms/${room.id}`}>{dict.rooms.viewDetails}</Link>
                      </Button>
                      <Button asChild size="sm" className="text-xs">
                        <Link href={`/${locale}/bookings/new?roomId=${room.id}`}>{dict.rooms.bookNow}</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
