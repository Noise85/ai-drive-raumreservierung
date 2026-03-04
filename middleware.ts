import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const locales = ["en", "de", "fr"]
const defaultLocale = "en"

function getLocaleFromRequest(request: NextRequest): string {
  const cookieLocale = request.cookies.get("app_locale")?.value
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale

  const acceptLanguage = request.headers.get("accept-language") || ""
  for (const lang of acceptLanguage.split(",")) {
    const code = lang.split(";")[0].trim().substring(0, 2).toLowerCase()
    if (locales.includes(code)) return code
  }
  return defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes, static files, and _next
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return NextResponse.next()

  // Redirect to locale-prefixed path
  const locale = getLocaleFromRequest(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next|api|icon|apple|.*\\..*).*)"],
}
