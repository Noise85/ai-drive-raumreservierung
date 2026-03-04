import { getDictionary } from "@/lib/i18n/get-dictionary"
import { roomService, buildingService } from "@/lib/services"
import { RoomSearch } from "@/components/rooms/room-search"

export default async function RoomsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { locale } = await params
  const sp = await searchParams
  const dict = await getDictionary(locale)

  const minCapacity = sp.capacity ? parseInt(sp.capacity) : 0
  const buildingId = sp.building || ""
  const equipment = sp.equipment || ""
  const tier = sp.tier || ""
  const searchQuery = sp.q || ""

  // Use service to get rooms
  let rooms = buildingId 
    ? await roomService.findByBuilding(buildingId)
    : await roomService.findAllWithLocation({ activeOnly: true })

  // Filter by capacity
  if (minCapacity > 0) {
    rooms = rooms.filter(r => r.capacity >= minCapacity)
  }

  // Client-side filtering for equipment and tier and text search
  let filtered = rooms
  if (equipment) {
    const eqList = equipment.split(",")
    filtered = filtered.filter((r) => {
      const roomEq = typeof r.equipment === "string" ? JSON.parse(r.equipment) : (r.equipment as string[])
      return eqList.every((e) => roomEq.includes(e))
    })
  }
  if (tier) {
    filtered = filtered.filter((r) => r.tier === tier)
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        r.building_name.toLowerCase().includes(q)
    )
  }

  const buildings = await buildingService.findAll()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.rooms.title}</h1>
      </div>
      <RoomSearch
        locale={locale}
        dict={dict}
        rooms={JSON.parse(JSON.stringify(filtered))}
        buildings={JSON.parse(JSON.stringify(buildings))}
        currentFilters={{
          capacity: sp.capacity || "",
          building: buildingId,
          equipment: equipment,
          tier: tier,
          q: searchQuery,
        }}
      />
    </div>
  )
}
