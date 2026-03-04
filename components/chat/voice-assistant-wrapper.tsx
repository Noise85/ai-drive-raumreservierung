"use client"

import { Suspense } from "react"
import { VoiceAssistant } from "./voice-assistant"
import type { Dictionary } from "@/lib/i18n/types"

interface VoiceAssistantWrapperProps {
  userId: string
  locale: string
  dict: Dictionary
}

// Wrapper to handle Suspense for useSearchParams in VoiceAssistant
export function VoiceAssistantWrapper(props: VoiceAssistantWrapperProps) {
  return (
    <Suspense fallback={null}>
      <VoiceAssistant {...props} />
    </Suspense>
  )
}
