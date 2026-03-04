"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { createBooking } from "@/lib/actions"
import { RoomAvailabilityCalendar } from "./room-availability-calendar"
import type { Dictionary } from "@/lib/i18n/types"

interface Room {
  id: string
  name: string
  capacity: number
  base_hourly_rate: string
  building_name: string
}

interface CostCenter {
  id: string
  name: string
  code: string
}

interface BookingFormProps {
  locale: string
  dict: Dictionary
  userId: string
  rooms: Room[]
  costCenters: CostCenter[]
  defaultRoomId: string
  defaultCostCenterId: string
}

export function BookingForm({
  locale,
  dict,
  userId,
  rooms,
  costCenters,
  defaultRoomId,
  defaultCostCenterId,
}: BookingFormProps) {
  const [roomId, setRoomId] = useState(defaultRoomId)
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [hasConflict, setHasConflict] = useState(false)

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId])
  const selectedDate = useMemo(() => (date ? new Date(date) : null), [date])

  const estimatedCost = useMemo(() => {
    if (!selectedRoom || !startTime || !endTime) return 0
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    const hours = (eh + em / 60) - (sh + sm / 60)
    return hours > 0 ? hours * parseFloat(selectedRoom.base_hourly_rate) : 0
  }, [selectedRoom, startTime, endTime])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <div>
        <form action={createBooking} className="space-y-5">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="locale" value={locale} />

          <div className="space-y-2">
            <Label htmlFor="title">{dict.bookings.bookingTitle}</Label>
            <Input id="title" name="title" required placeholder="e.g. Sprint Planning" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomId">{dict.bookings.room}</Label>
            <input type="hidden" name="roomId" value={roomId} />
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} ({room.building_name}) - {room.capacity} seats - CHF {parseFloat(room.base_hourly_rate).toFixed(0)}/h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">{dict.bookings.date}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">{dict.rooms.startTime}</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">{dict.rooms.endTime}</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <input
            type="hidden"
            name="startTime"
            value={date && startTime ? `${date}T${startTime}:00` : ""}
          />
          <input
            type="hidden"
            name="endTime"
            value={date && endTime ? `${date}T${endTime}:00` : ""}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="attendeeCount">{dict.bookings.attendees}</Label>
              <Input id="attendeeCount" name="attendeeCount" type="number" min="1" max="100" defaultValue="2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenterId">{dict.bookings.costCenter}</Label>
              <Select name="costCenterId" defaultValue={defaultCostCenterId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.name} ({cc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conflict Warning */}
          {hasConflict && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {dict.bookings.conflictError}
              </AlertDescription>
            </Alert>
          )}

          {/* Cost Preview */}
          {selectedRoom && estimatedCost > 0 && (
            <Card>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <span className="text-sm text-muted-foreground">{dict.bookings.estimatedCost}</span>
                <span className="text-lg font-semibold">CHF {estimatedCost.toFixed(2)}</span>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" disabled={hasConflict}>
            {dict.common.confirm} {dict.bookings.newBooking}
          </Button>
        </form>
      </div>

      {/* Calendar Section */}
      <div className="lg:sticky lg:top-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {dict.calendar?.existingBookings || "Room Availability"}
        </h3>
        <RoomAvailabilityCalendar
          roomId={roomId}
          selectedDate={selectedDate}
          selectedStartTime={startTime}
          selectedEndTime={endTime}
          onConflictDetected={setHasConflict}
          locale={locale}
        />
      </div>
    </div>
  )
}
