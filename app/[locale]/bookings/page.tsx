import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getCurrentUser } from "@/lib/auth"
import { bookingService } from "@/lib/services/booking-service"
import { MyBookingsSection } from "@/components/bookings/my-bookings-section"

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const user = await getCurrentUser()

  const { upcoming, past, cancelled } = await bookingService.getUserBookings(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{dict.bookings.title}</h1>
        <Button asChild size="sm">
          <Link href={`/${locale}/bookings/new`}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {dict.bookings.newBooking}
          </Link>
        </Button>
      </div>

      <MyBookingsSection
        upcoming={JSON.parse(JSON.stringify(upcoming))}
        past={JSON.parse(JSON.stringify(past))}
        cancelled={JSON.parse(JSON.stringify(cancelled))}
        locale={locale}
        dict={dict}
        userId={user.id}
      />
    </div>
  )
}
