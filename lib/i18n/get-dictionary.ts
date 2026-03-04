import type { Dictionary } from "./types"

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  de: () => import("./dictionaries/de.json").then((m) => m.default),
  fr: () => import("./dictionaries/fr.json").then((m) => m.default),
}

export const locales = ["en", "de", "fr"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export async function getDictionary(locale: string): Promise<Dictionary> {
  const lang = locales.includes(locale as Locale) ? locale : defaultLocale
  return dictionaries[lang]()
}
