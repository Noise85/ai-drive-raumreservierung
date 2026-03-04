"use client"

import { usePathname } from "next/navigation"
import { Globe, UserCircle } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { switchUser, switchLocale } from "@/lib/actions"
import type { Dictionary } from "@/lib/i18n/types"
import type { AppUser } from "@/lib/auth"

interface AppHeaderProps {
  locale: string
  dict: Dictionary
  currentUser: AppUser
  allUsers: AppUser[]
}

const localeLabels: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Francais",
}

export function AppHeader({ locale, dict, currentUser, allUsers }: AppHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="flex h-12 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex-1" />

      {/* Locale Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5" />
            {localeLabels[locale]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{dict.common.language}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(localeLabels).map(([code, label]) => (
            <DropdownMenuItem key={code} asChild>
              <form action={switchLocale}>
                <input type="hidden" name="locale" value={code} />
                <input type="hidden" name="currentPath" value={pathname} />
                <button type="submit" className="w-full text-left text-sm">
                  {label} {code === locale && "(current)"}
                </button>
              </form>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User/Role Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <UserCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{currentUser.name}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              {dict.roles[currentUser.role] || currentUser.role}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{dict.common.switchRole}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allUsers.map((user) => (
            <DropdownMenuItem key={user.id} asChild>
              <form action={switchUser}>
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="flex w-full items-center justify-between text-left text-sm">
                  <span>{user.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {dict.roles[user.role] || user.role}
                  </span>
                </button>
              </form>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
