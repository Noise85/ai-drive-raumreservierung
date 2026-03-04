import Link from "next/link"
import { CalendarDays, DoorOpen, MessageSquare, Gauge, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getCurrentUser } from "@/lib/auth"
import { bookingService, roomService } from "@/lib/services"
import { format } from "date-fns"
import { DashboardBookingsSection } from "@/components/bookings/dashboard-bookings-section"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const user = await getCurrentUser()

  const [allUserBookings, roomStats, occupancyStats] = await Promise.all([
    bookingService.getUserBookings(user.id),
    roomService.getStats(),
    roomService.getOccupancyStats(),
  ])

  const todayBookings = allUserBookings.upcoming.filter((b) => {
    const today = new Date()
    const bookingDate = new Date(b.start_time)
    return bookingDate.toDateString() === today.toDateString()
  })
  const upcomingBookings = allUserBookings.upcoming.slice(0, 5)

  const availableRooms = roomStats?.available_rooms || 0
  const totalRooms = roomStats?.total_rooms || 0
  const occupiedCount = occupancyStats?.occupied || 0
  const totalActive = occupancyStats?.total || 1
  const occupancyRate = Math.round((Number(occupiedCount) / Number(totalActive)) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {dict.dashboard.welcome}, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {dict.roles[user.role]} &middot; {user.department}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {dict.dashboard.todayBookings}
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {dict.dashboard.upcomingBookings}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {dict.dashboard.roomsAvailable}
            </CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableRooms}
              <span className="text-sm font-normal text-muted-foreground">
                {" / "}{totalRooms}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {dict.dashboard.occupancyRate}
            </CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          {dict.dashboard.quickActions}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/${locale}/rooms`}>
              <DoorOpen className="mr-1.5 h-3.5 w-3.5" />
              {dict.dashboard.bookRoom}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/chat`}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              {dict.dashboard.askAI}
            </Link>
          </Button>
          {(user.role === "facility_manager" || user.role === "admin") && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/facility/dashboard`}>
                <Gauge className="mr-1.5 h-3.5 w-3.5" />
                {dict.dashboard.viewOccupancy}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Bookings Section with Calendar Toggle */}
      <DashboardBookingsSection
        todayBookings={JSON.parse(JSON.stringify(todayBookings))}
        upcomingBookings={JSON.parse(JSON.stringify(upcomingBookings))}
        pastBookings={JSON.parse(JSON.stringify(allUserBookings.past))}
        locale={locale}
        dict={dict}
        userId={user.id}
      />
    </div>
  )
}
