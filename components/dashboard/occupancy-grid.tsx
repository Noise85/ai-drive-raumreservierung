"use client"

import { useRouter } from "next/navigation"
import { Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { simulateSensorEvent, triggerAutoRelease } from "@/lib/actions"
import type { Dictionary } from "@/lib/i18n/types"

interface Room {
  id: string
  name: string
  capacity: number
  occupancy_status: string
  tier: string
  floor_name: string
  floor_number: number
  building_name: string
  building_id: string
}

interface OccupancyGridProps {
  rooms: Room[]
  locale: string
  dict: Dictionary
}

const statusBg: Record<string, string> = {
  empty: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  occupied: "bg-red-50 border-red-200 hover:bg-red-100",
  offline: "bg-gray-50 border-gray-200",
  unknown: "bg-yellow-50 border-yellow-200",
}

const statusDot: Record<string, string> = {
  empty: "bg-emerald-500",
  occupied: "bg-red-500",
  offline: "bg-gray-400",
  unknown: "bg-yellow-500",
}

export function OccupancyGrid({ rooms, locale, dict }: OccupancyGridProps) {
  const router = useRouter()

  // Group by building then floor
  const grouped: Record<string, Record<string, Room[]>> = {}
  for (const room of rooms) {
    if (!grouped[room.building_name]) grouped[room.building_name] = {}
    const floorKey = `${room.floor_name}`
    if (!grouped[room.building_name][floorKey]) grouped[room.building_name][floorKey] = []
    grouped[room.building_name][floorKey].push(room)
  }

  async function handleToggle(formData: FormData) {
    await simulateSensorEvent(formData)
    router.refresh()
  }

  async function handleAutoRelease(formData: FormData) {
    await triggerAutoRelease(formData)
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-2">
        <form action={handleAutoRelease}>
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="outline" size="sm">
            {dict.facility.autoRelease}
          </Button>
        </form>
      </div>

      {Object.entries(grouped).map(([buildingName, floors]) => (
        <Card key={buildingName}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{buildingName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(floors).map(([floorName, floorRooms]) => (
              <div key={floorName}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{floorName}</p>
                <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {floorRooms.map((room) => (
                    <form
                      key={room.id}
                      action={handleToggle}
                      className={`relative rounded-lg border p-3 transition-colors cursor-pointer ${statusBg[room.occupancy_status] || statusBg.unknown}`}
                    >
                      <input type="hidden" name="roomId" value={room.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={room.occupancy_status === "occupied" ? "empty" : "occupied"}
                      />
                      <button type="submit" className="w-full text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{room.name}</span>
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot[room.occupancy_status] || statusDot.unknown}`} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {room.capacity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dict.rooms[room.occupancy_status] || room.occupancy_status}
                          </span>
                        </div>
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-muted-foreground">
        Click any room to simulate a sensor event toggling its occupancy status.
      </p>
    </div>
  )
}
