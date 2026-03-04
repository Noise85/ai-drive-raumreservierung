import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { VoiceAssistantWrapper } from "@/components/chat/voice-assistant-wrapper"
import { getDictionary, locales } from "@/lib/i18n/get-dictionary"
import { getCurrentUser, getAllUsers } from "@/lib/auth"
import { Toaster } from "sonner"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const currentUser = await getCurrentUser()
  const allUsers = await getAllUsers()

  return (
    <SidebarProvider>
      <AppSidebar locale={locale} dict={dict} userRole={currentUser.role} />
      <SidebarInset>
        <AppHeader
          locale={locale}
          dict={dict}
          currentUser={currentUser}
          allUsers={allUsers}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
      <VoiceAssistantWrapper
        userId={currentUser.id}
        locale={locale}
        dict={dict}
      />
      <Toaster position="top-right" />
    </SidebarProvider>
  )
}
