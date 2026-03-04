"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Gauge,
  BarChart3,
  MessageSquare,
  DoorOpen,
  Settings,
  Cpu,
  DollarSign,
  Trophy,
  UserCheck,
  Leaf,
  Layers,
  SlidersHorizontal,
  Zap,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Dictionary } from "@/lib/i18n/types"

interface AppSidebarProps {
  locale: string
  dict: Dictionary
  userRole: string
}

export function AppSidebar({ locale, dict, userRole }: AppSidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

  const mainNav = [
    { href: `/${locale}`, label: dict.nav.dashboard, icon: Gauge, exact: true },
    { href: `/${locale}/rooms`, label: dict.nav.rooms, icon: DoorOpen },
    { href: `/${locale}/bookings`, label: dict.nav.bookings, icon: CalendarDays },
    { href: `/${locale}/chat`, label: dict.nav.chat, icon: MessageSquare },
  ]

  const adminNav = [
    { href: `/${locale}/admin/rooms`, label: dict.nav.adminRooms, icon: DoorOpen },
    { href: `/${locale}/admin/buildings`, label: dict.nav.adminBuildings, icon: Building2 },
    { href: `/${locale}/admin/sensors`, label: dict.nav.adminSensors, icon: Cpu },
    { href: `/${locale}/admin/pricing`, label: dict.nav.adminPricing, icon: DollarSign },
    { href: `/${locale}/admin/scoring`, label: dict.nav.adminScoring, icon: SlidersHorizontal },
    { href: `/${locale}/admin/energy`, label: dict.nav.adminEnergy, icon: Zap },
  ]

  const facilityNav = [
    { href: `/${locale}/facility/dashboard`, label: dict.nav.facilityDashboard, icon: Layers },
    { href: `/${locale}/facility/analytics`, label: dict.nav.facilityAnalytics, icon: BarChart3 },
  ]

  const financeNav = [
    { href: `/${locale}/finance/chargeback`, label: dict.nav.financeChargeback, icon: DollarSign },
    { href: `/${locale}/finance/leaderboard`, label: dict.nav.financeLeaderboard, icon: Trophy },
  ]

  const showAdmin = userRole === "admin" || userRole === "facility_manager"
  const showFacility = userRole === "admin" || userRole === "facility_manager"
  const showFinance = userRole === "admin" || userRole === "finance"

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-foreground" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {dict.common.appName}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.exact ? pathname === item.href : isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showFacility && (
          <SidebarGroup>
            <Collapsible defaultOpen={pathname.includes("/facility")}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer">
                  {dict.nav.facility}
                  <ChevronDown className="ml-auto h-3 w-3" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    {facilityNav.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton asChild isActive={isActive(item.href)}>
                          <Link href={item.href}>
                            <item.icon className="h-3.5 w-3.5" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {showFinance && (
          <SidebarGroup>
            <Collapsible defaultOpen={pathname.includes("/finance")}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer">
                  {dict.nav.finance}
                  <ChevronDown className="ml-auto h-3 w-3" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    {financeNav.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton asChild isActive={isActive(item.href)}>
                          <Link href={item.href}>
                            <item.icon className="h-3.5 w-3.5" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <Collapsible defaultOpen={pathname.includes("/sustainability")}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer">
                {dict.nav.sustainability}
                <ChevronDown className="ml-auto h-3 w-3" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive(`/${locale}/sustainability/dashboard`)}
                    >
                      <Link href={`/${locale}/sustainability/dashboard`}>
                        <Leaf className="h-3.5 w-3.5" />
                        <span>{dict.nav.sustainabilityDashboard}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(`/${locale}/visitors/checkin`)}
                >
                  <Link href={`/${locale}/visitors/checkin`}>
                    <UserCheck className="h-4 w-4" />
                    <span>{dict.nav.visitors}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showAdmin && (
          <SidebarGroup>
            <Collapsible defaultOpen={pathname.includes("/admin")}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer">
                  <Settings className="mr-1 h-3 w-3" />
                  {dict.nav.admin}
                  <ChevronDown className="ml-auto h-3 w-3" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    {adminNav.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton asChild isActive={isActive(item.href)}>
                          <Link href={item.href}>
                            <item.icon className="h-3.5 w-3.5" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <p className="px-2 text-xs text-muted-foreground">
          {"Raumreservierung v1.0"}
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
