import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getCurrentUser } from "@/lib/auth"
import { roomService, financeService } from "@/lib/services"
import { BookingForm } from "@/components/bookings/booking-form"

export default async function NewBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { locale } = await params
  const sp = await searchParams
  const dict = await getDictionary(locale)
  const user = await getCurrentUser()

  const [rooms, costCenters] = await Promise.all([
    roomService.findAllWithLocation({ activeOnly: true }),
    financeService.getCostCenters(),
  ])

  // Transform rooms to include building_name for the form
  const roomsForForm = rooms.map(r => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity,
    base_hourly_rate: r.base_hourly_rate,
    building_name: r.building_name,
  }))

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/bookings`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {dict.common.back}
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{dict.bookings.newBooking}</h1>

      {sp.error === "conflict" && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {dict.bookings.conflictError}
        </div>
      )}

      <BookingForm
        locale={locale}
        dict={dict}
        userId={user.id}
        rooms={JSON.parse(JSON.stringify(roomsForForm))}
        costCenters={JSON.parse(JSON.stringify(costCenters))}
        defaultRoomId={sp.roomId || ""}
        defaultCostCenterId={user.cost_center_id}
      />
    </div>
  )
}
