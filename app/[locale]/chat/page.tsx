import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/types"
import { getCurrentUser } from "@/lib/auth"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">{dict.chat.title}</h1>
        <p className="text-sm text-muted-foreground">
          {user ? `Logged in as ${user.name}` : "Ask me to find and book rooms"}
        </p>
      </div>
      <ChatInterface
        userId={user?.id || "00a00000-0000-0000-0000-000000000001"}
        locale={locale}
        dict={dict}
      />
    </div>
  )
}
