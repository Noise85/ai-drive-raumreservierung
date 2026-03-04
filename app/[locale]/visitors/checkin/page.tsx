import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/types"
import { VisitorCheckinForm } from "@/components/visitors/checkin-form"

export default async function VisitorCheckinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <VisitorCheckinForm locale={locale} dict={dict} />
    </div>
  )
}
