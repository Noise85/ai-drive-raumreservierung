import { visitorService } from "@/lib/services/visitor-service"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token || typeof token !== "string") {
      return Response.json({ success: false, message: "Invalid check-in code." }, { status: 400 })
    }

    const result = await visitorService.checkIn(token)

    if (!result.success) {
      const statusCode =
        result.errorCode === "NOT_FOUND" ? 404 :
        result.errorCode === "ALREADY_CHECKED_IN" || result.errorCode === "CANCELLED" || result.errorCode === "EXPIRED" ? 400 :
        500

      return Response.json({ success: false, message: result.error }, { status: statusCode })
    }

    const visitor = result.visitor!
    return Response.json({
      success: true,
      visitor: {
        name: visitor.name,
        room_name: visitor.room_name,
        building_name: visitor.building_name,
        host_name: visitor.host_name,
        booking_title: visitor.booking_title,
      },
    })
  } catch (error) {
    return Response.json({ success: false, message: "An error occurred during check-in." }, { status: 500 })
  }
}
