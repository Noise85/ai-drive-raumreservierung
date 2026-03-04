"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { MiniBar } from "./mini-bar"
import { detectVoiceCommand, extractMessageFromTranscript, isCommandOnly } from "./voice-keywords"
import { usePageContext, getContextualSystemPrompt } from "@/hooks/use-page-context"
import { audioFeedback } from "@/lib/audio-feedback"
import { Mic, MicOff, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/lib/i18n/types"

interface VoiceAssistantProps {
  userId: string
  locale: string
  dict: Dictionary
}

// Speech recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

const LOCALE_TO_SPEECH_LANG: Record<string, string> = {
  en: "en-US",
  de: "de-DE", 
  fr: "fr-FR",
}

// Inactivity timeout for stopping listening (60 seconds)
const INACTIVITY_TIMEOUT = 60000

export function VoiceAssistant({ userId, locale, dict }: VoiceAssistantProps) {
  const router = useRouter()
  const pathname = usePathname()
  const pageContext = usePageContext(locale)
  
  // Core states
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [drivingMode, setDrivingMode] = useState(false)
  
  // Content states
  const [lastUtterance, setLastUtterance] = useState("")
  const [lastResponse, setLastResponse] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [quickActions, setQuickActions] = useState<Array<{ label: string; onClick: () => void }>>([])
  
  // Refs
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpokenRef = useRef<string | null>(null)
  // Refs to track state inside callbacks without causing re-renders
  const isActiveRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const drivingModeRef = useRef(false)
  
  // Keep refs in sync with state
  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { isSpeakingRef.current = isSpeaking }, [isSpeaking])
  useEffect(() => { drivingModeRef.current = drivingMode }, [drivingMode])
  
  // Don't render on the chat page (it has its own interface)
  const isOnChatPage = pathname.includes("/chat")
  
  // Chat integration
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { 
          messages, 
          id, 
          userId,
          pageContext: {
            page: pageContext.page,
            section: pageContext.section,
            params: pageContext.params,
            hint: pageContext.hint,
          }
        },
      }),
    }),
  })
  
  const isProcessing = status === "streaming" || status === "submitted"

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthRef.current = window.speechSynthesis
    }
  }, [])

  // Speak text with TTS
  const speak = useCallback((text: string) => {
    if (!speechSynthRef.current || !voiceEnabled) return

    speechSynthRef.current.cancel()
    
    // Stop recognition while speaking to prevent echo pickup
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore
      }
    }

    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/^[\-\*]\s+/gm, "")
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = LOCALE_TO_SPEECH_LANG[locale] || "en-US"
    utterance.rate = drivingModeRef.current ? 0.9 : 1.0 // Slightly slower in driving mode
    utterance.pitch = 1.0

    utterance.onstart = () => {
      isSpeakingRef.current = true
      setIsSpeaking(true)
    }
    utterance.onend = () => {
      isSpeakingRef.current = false
      setIsSpeaking(false)
      // Restart recognition after speaking finishes (if active or in driving mode)
      if ((isActiveRef.current || drivingModeRef.current) && recognitionRef.current) {
        // Play a small sound to indicate we're listening again
        audioFeedback.listening()
        setTimeout(() => {
          try {
            recognitionRef.current?.start()
          } catch (e) {
            // Might already be running, try stopping and restarting
            try {
              recognitionRef.current?.stop()
              setTimeout(() => {
                try {
                  recognitionRef.current?.start()
                } catch {
                  // Give up
                }
              }, 100)
            } catch {
              // Ignore
            }
          }
        }, 300)
      }
    }
    utterance.onerror = () => {
      isSpeakingRef.current = false
      setIsSpeaking(false)
    }

    speechSynthRef.current.speak(utterance)
  }, [voiceEnabled, locale])

  const stopSpeaking = useCallback(() => {
    speechSynthRef.current?.cancel()
    isSpeakingRef.current = false
    setIsSpeaking(false)
  }, [])

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }
    inactivityTimeoutRef.current = setTimeout(() => {
      // Use ref to check current state
      if (isActiveRef.current) {
        speak("I'll stop listening now due to inactivity.")
        audioFeedback.deactivate()
        setIsActive(false)
        setIsListening(false)
      }
    }, INACTIVITY_TIMEOUT)
  }, [speak])

  // Clear inactivity timer (call when deactivating)
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }
  }, [])

  // Handle voice commands
  const handleVoiceCommand = useCallback((transcript: string): boolean => {
    const command = detectVoiceCommand(transcript, locale)
    
    if (command) {
      switch (command.type) {
        case "wake":
          if (!isActiveRef.current) {
            audioFeedback.activate()
            setIsActive(true)
            speak("I'm listening.")
            resetInactivityTimer()
            return true
          }
          return false // Already active, don't process as command
          
        case "stop":
          clearInactivityTimer()
          audioFeedback.deactivate()
          setIsActive(false)
          setIsListening(false)
          speak("Goodbye!")
          return true
          
        case "cancel":
          setLastUtterance("")
          setInterimTranscript("")
          speak("Cancelled.")
          return true
          
        case "navigate":
          if (command.action) {
            audioFeedback.send()
            switch (command.action) {
              case "bookings":
                router.push(`/${locale}/bookings`)
                speak("Opening your bookings.")
                break
              case "rooms":
                router.push(`/${locale}/rooms`)
                speak("Opening room search.")
                break
              case "back":
                router.back()
                speak("Going back.")
                break
              case "home":
                router.push(`/${locale}`)
                speak("Going to dashboard.")
                break
              case "new-booking":
                router.push(`/${locale}/bookings/new`)
                speak("Opening new booking form.")
                break
            }
            return true
          }
          break
          
        case "confirm":
          // Send as a confirmation message to the AI
          audioFeedback.send()
          sendMessage({ text: "Yes, confirm." })
          setLastUtterance("Yes, confirm.")
          return true
          
        case "send":
          // Extract message and send
          const message = extractMessageFromTranscript(transcript, locale)
          if (message) {
            audioFeedback.send()
            sendMessage({ text: message })
            setLastUtterance(message)
            return true
          }
          break
      }
    }
    
    return false
  }, [locale, speak, router, sendMessage, resetInactivityTimer, clearInactivityTimer])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = LOCALE_TO_SPEECH_LANG[locale] || "en-US"

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      setInterimTranscript(interim)

      if (final) {
        resetInactivityTimer()
        
        // Check for command keywords
        const wasCommand = handleVoiceCommand(final)
        
        if (!wasCommand && isActiveRef.current) {
          // Not a command - check if it's a standalone command
          if (isCommandOnly(final, locale)) {
            // Already handled or ignore
          } else {
            // Regular message - send to AI
            audioFeedback.send()
            sendMessage({ text: final })
            setLastUtterance(final)
          }
        }
        // Wake word handling is done inside handleVoiceCommand
        
        setInterimTranscript("")
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      // Restart if still active (or in driving mode for wake word) and not speaking
      if ((isActiveRef.current || drivingModeRef.current) && !isSpeakingRef.current) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch {
            // Ignore - might already be running
          }
        }, 300)
      }
    }

    recognition.onerror = (event) => {
      const ignoredErrors = ["no-speech", "aborted"]
      if (!ignoredErrors.includes(event.error)) {
        console.warn("Speech recognition error:", event.error)
      }
      setIsListening(false)
    }

    recognition.onstart = () => {
      setIsListening(true)
      audioFeedback.listening()
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
    }
  }, [locale, handleVoiceCommand, sendMessage, resetInactivityTimer])

  // Handle new messages - speak responses
  useEffect(() => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || !lastMessage.parts) return
    
    if (
      lastMessage.role === "assistant" &&
      lastMessage.id !== lastSpokenRef.current &&
      status !== "streaming" &&
      status !== "submitted"
    ) {
      const textContent = lastMessage.parts
        .filter((p): p is { type: "text"; text: string } => p != null && p.type === "text")
        .map((p) => p.text)
        .join(" ")

      if (textContent) {
        lastSpokenRef.current = lastMessage.id
        setLastResponse(textContent)
        
        // Reset inactivity timer - AI just responded
        if (isActive) {
          resetInactivityTimer()
        }
        
        if (voiceEnabled && isActive) {
          speak(textContent)
          audioFeedback.success()
        }
        
        // Generate quick actions based on response
        generateQuickActions(lastMessage)
      }
    }
  }, [messages, status, speak, voiceEnabled, isActive, resetInactivityTimer])

  // Generate quick actions based on AI response
  const generateQuickActions = (message: typeof messages[0]) => {
    const actions: Array<{ label: string; onClick: () => void }> = []
    
    if (!message || !message.parts) {
      setQuickActions(actions)
      return
    }
    
    // Check for room search results
    for (const part of message.parts) {
      if (!part || !part.type) continue
      const toolName = part.type.startsWith("tool-") ? part.type.replace("tool-", "") : null
      
      if (toolName === "searchRooms" && "output" in part && part.output) {
        const output = part.output as { rooms?: Array<{ id: string; name: string }> }
        if (output.rooms && output.rooms.length > 0) {
          const firstRoom = output.rooms[0]
          actions.push({
            label: `Book ${firstRoom.name}`,
            onClick: () => sendMessage({ text: `Book ${firstRoom.name}` })
          })
          actions.push({
            label: "Show more options",
            onClick: () => router.push(`/${locale}/rooms`)
          })
        }
      }
      
      if (toolName === "createBooking" && "output" in part && part.output) {
        const output = part.output as { success?: boolean }
        if (output.success) {
          actions.push({
            label: "View bookings",
            onClick: () => router.push(`/${locale}/bookings`)
          })
        }
      }
    }
    
    // Default actions if no specific ones
    if (actions.length === 0) {
      actions.push({
        label: "Find a room",
        onClick: () => sendMessage({ text: "Find me a room" })
      })
      actions.push({
        label: "My bookings",
        onClick: () => router.push(`/${locale}/bookings`)
      })
    }
    
    setQuickActions(actions)
  }

  // Toggle functions
  const toggleActive = useCallback(() => {
    if (isActive) {
      clearInactivityTimer()
      audioFeedback.deactivate()
      setIsActive(false)
      setIsListening(false)
      recognitionRef.current?.abort()
    } else {
      audioFeedback.activate()
      setIsActive(true)
      resetInactivityTimer()
      try {
        recognitionRef.current?.start()
      } catch {
        // Ignore
      }
    }
  }, [isActive, resetInactivityTimer, clearInactivityTimer])

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      stopSpeaking()
      try {
        recognitionRef.current?.start()
      } catch {
        // Ignore
      }
    }
  }, [isListening, stopSpeaking])

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(!voiceEnabled)
    if (voiceEnabled) {
      stopSpeaking()
    }
  }, [voiceEnabled, stopSpeaking])

  const toggleDrivingMode = useCallback(() => {
    const newMode = !drivingMode
    setDrivingMode(newMode)
    
    if (newMode) {
      audioFeedback.activate()
      speak("Driving mode enabled. Say 'Hey Assistant' anytime.")
      setVoiceEnabled(true)
      
      // Add driving-mode class to body for global styling
      document.body.classList.add("driving-mode")
    } else {
      audioFeedback.deactivate()
      document.body.classList.remove("driving-mode")
    }
  }, [drivingMode, speak])

  const handleExpand = useCallback(() => {
    router.push(`/${locale}/chat`)
  }, [router, locale])

  const handleClose = useCallback(() => {
    clearInactivityTimer()
    setIsActive(false)
    setIsListening(false)
    setDrivingMode(false)
    stopSpeaking()
    recognitionRef.current?.abort()
    document.body.classList.remove("driving-mode")
  }, [stopSpeaking, clearInactivityTimer])

  // Start listening when driving mode is enabled (for wake word detection)
  useEffect(() => {
    if (drivingMode && !isActive && recognitionRef.current) {
      // Start listening for wake word when driving mode is enabled
      setTimeout(() => {
        try {
          recognitionRef.current?.start()
        } catch {
          // Ignore - may already be running
        }
      }, 500)
    }
  }, [drivingMode, isActive])

  // Safety net: ensure listening restarts when active but not listening/speaking/processing
  useEffect(() => {
    // Only run when assistant is active, not processing, not speaking, and not already listening
    if (isActive && !isListening && !isSpeaking && status !== "streaming" && status !== "submitted") {
      const timer = setTimeout(() => {
        // Double-check conditions using refs
        if (isActiveRef.current && !isSpeakingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start()
          } catch {
            // Ignore - might already be running
          }
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isActive, isListening, isSpeaking, status])

  // Don't render on chat page
  if (isOnChatPage) return null

  return (
    <>
      {/* Floating button - shown when assistant is not active */}
      {!isActive && (
        <Button
          onClick={toggleActive}
          className={cn(
            "fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all",
            drivingMode 
              ? "h-20 w-20 bg-primary hover:bg-primary/90" 
              : "h-14 w-14",
            isListening && "animate-pulse ring-4 ring-green-500/50"
          )}
          size="icon"
        >
          {isListening ? (
            <Mic className={drivingMode ? "h-10 w-10" : "h-6 w-6"} />
          ) : (
            <MessageSquare className={drivingMode ? "h-10 w-10" : "h-6 w-6"} />
          )}
        </Button>
      )}
      
      {/* Mini bar - shown when active */}
      <MiniBar
        isActive={isActive}
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
        lastUtterance={lastUtterance}
        lastResponse={lastResponse}
        drivingMode={drivingMode}
        voiceEnabled={voiceEnabled}
        onToggleVoice={toggleVoice}
        onToggleListening={toggleListening}
        onToggleDrivingMode={toggleDrivingMode}
        onExpand={handleExpand}
        onClose={handleClose}
        quickActions={quickActions}
      />
      
      {/* Interim transcript display */}
      {isListening && interimTranscript && (
        <div className={cn(
          "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
          "bg-black/80 text-white px-4 py-2 rounded-full",
          "text-sm animate-pulse",
          drivingMode && "text-lg px-6 py-3"
        )}>
          {interimTranscript}...
        </div>
      )}
    </>
  )
}
