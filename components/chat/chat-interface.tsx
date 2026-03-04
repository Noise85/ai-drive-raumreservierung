"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, Bot, User, Loader2, MessageSquare, Volume2, VolumeX, Square, Mic, MicOff, ExternalLink, CheckCircle2 } from "lucide-react"
import type { Dictionary } from "@/lib/i18n/types"

interface ChatInterfaceProps {
  userId: string
  locale: string
  dict: Dictionary
}

// App action types for type safety
interface AppActionOutput {
  executeAction: boolean
  action: "navigate_rooms" | "navigate_bookings" | "navigate_new_booking" | "navigate_room_detail" | "show_search_results" | "confirm_action"
  params: {
    capacity?: number
    equipment?: string[]
    tier?: string
    building?: string
    query?: string
    roomId?: string
    roomName?: string
    confirmationType?: "booking_created" | "booking_cancelled" | "search_complete"
    message?: string
    rooms?: Array<{
      id: string
      name: string
      building: string
      capacity: number
      tier: string
      hourlyRate: number
      score?: number
    }>
  }
  timestamp: string
}

// Map locale codes to speech language codes
const LOCALE_TO_SPEECH_LANG: Record<string, string> = {
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
}

// Extend Window interface for SpeechRecognition
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

export function ChatInterface({ userId, locale, dict }: ChatInterfaceProps) {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [pendingAction, setPendingAction] = useState<AppActionOutput | null>(null)
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastSpokenMessageId = useRef<string | null>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Execute app actions from the AI
  const executeAppAction = useCallback((action: AppActionOutput) => {
    // Prevent duplicate execution using timestamp as unique ID
    if (executedActions.has(action.timestamp)) return
    setExecutedActions(prev => new Set(prev).add(action.timestamp))

    const { action: actionType, params } = action

    switch (actionType) {
      case "navigate_rooms": {
        const searchParams = new URLSearchParams()
        if (params.capacity) searchParams.set("capacity", params.capacity.toString())
        if (params.equipment?.length) searchParams.set("equipment", params.equipment.join(","))
        if (params.tier) searchParams.set("tier", params.tier)
        if (params.query) searchParams.set("q", params.query)
        const url = `/${locale}/rooms${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
        router.push(url)
        break
      }
      case "navigate_bookings":
        router.push(`/${locale}/bookings`)
        break
      case "navigate_new_booking": {
        const url = params.roomId 
          ? `/${locale}/bookings/new?room=${params.roomId}`
          : `/${locale}/bookings/new`
        router.push(url)
        break
      }
      case "navigate_room_detail":
        if (params.roomId) {
          router.push(`/${locale}/rooms/${params.roomId}`)
        }
        break
      case "show_search_results":
      case "confirm_action":
        // These are shown inline, not navigation
        setPendingAction(action)
        break
    }
  }, [locale, router, executedActions])

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthRef.current = window.speechSynthesis
    }
  }, [])

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

      if (final) {
        setInput((prev) => prev + final)
        setInterimTranscript("")
        
        // In voice mode, auto-send after a brief pause
        if (voiceModeEnabled) {
          if (autoSendTimeoutRef.current) {
            clearTimeout(autoSendTimeoutRef.current)
          }
          autoSendTimeoutRef.current = setTimeout(() => {
            // This will be handled by the auto-send effect
          }, 1500)
        }
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript("")
    }

    recognition.onerror = (event) => {
      // "no-speech" is normal - just means user didn't speak, not an error
      // "aborted" happens when we stop recognition intentionally
      const ignoredErrors = ["no-speech", "aborted"]
      if (!ignoredErrors.includes(event.error)) {
        console.warn("Speech recognition issue:", event.error)
      }
      setIsListening(false)
      setInterimTranscript("")
    }

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current)
      }
    }
  }, [locale, voiceModeEnabled])

  // Function to speak text
  const speak = useCallback((text: string) => {
    if (!speechSynthRef.current || !ttsEnabled) return

    // Cancel any ongoing speech
    speechSynthRef.current.cancel()

    // Clean up text for speech (remove markdown formatting)
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold markers
      .replace(/^[\-\*]\s+/gm, "") // Remove list markers
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = LOCALE_TO_SPEECH_LANG[locale] || "en-US"
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    speechSynthRef.current.speak(utterance)
  }, [ttsEnabled, locale])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // Toggle TTS
  const toggleTts = useCallback(() => {
    if (ttsEnabled) {
      stopSpeaking()
    }
    setTtsEnabled(!ttsEnabled)
  }, [ttsEnabled, stopSpeaking])

  // Start listening for voice input
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      // Stop any ongoing speech before listening
      stopSpeaking()
      try {
        recognitionRef.current.start()
      } catch (e) {
        // Recognition might already be running
        console.error("Could not start recognition:", e)
      }
    }
  }, [isListening, stopSpeaking])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Toggle voice mode (combined voice input + TTS output)
  const toggleVoiceMode = useCallback(() => {
    const newState = !voiceModeEnabled
    setVoiceModeEnabled(newState)
    setTtsEnabled(newState)
    if (!newState) {
      stopListening()
      stopSpeaking()
    }
  }, [voiceModeEnabled, stopListening, stopSpeaking])

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { messages, id, userId },
      }),
    }),
  })

  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-speak new assistant messages when TTS is enabled
  useEffect(() => {
    if (!ttsEnabled || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || !lastMessage.parts) return
    
    // Only speak assistant messages that haven't been spoken yet
    // and only when streaming is complete
    if (
      lastMessage.role === "assistant" &&
      lastMessage.id !== lastSpokenMessageId.current &&
      status !== "streaming" &&
      status !== "submitted"
    ) {
      // Extract text from message parts
      const textContent = lastMessage.parts
        .filter((p): p is { type: "text"; text: string } => p != null && p.type === "text")
        .map((p) => p.text)
        .join(" ")

      if (textContent) {
        lastSpokenMessageId.current = lastMessage.id
        speak(textContent)
      }
    }
  }, [messages, ttsEnabled, status, speak])

  // Watch for tool outputs and auto-execute corresponding actions
  useEffect(() => {
    if (status === "streaming" || status === "submitted") return
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || !lastMessage.parts) return
    if (lastMessage.role !== "assistant") return

    // Check for tool outputs and auto-execute navigation
    for (const part of lastMessage.parts) {
      if (!part || !part.type) continue
      // Get tool info - parts can be tool-{toolName} or have toolName property
      const toolName = part.type.startsWith("tool-") 
        ? part.type.replace("tool-", "") 
        : null
      
      // Auto-navigate after createBooking success
      if (
        toolName === "createBooking" &&
        "state" in part &&
        part.state === "output-available" &&
        "output" in part
      ) {
        const output = part.output as { success?: boolean }
        if (output?.success && !executedActions.has(`booking-${lastMessage.id}`)) {
          setExecutedActions(prev => new Set(prev).add(`booking-${lastMessage.id}`))
          // Navigate to bookings after a short delay for TTS
          setTimeout(() => router.push(`/${locale}/bookings`), 2000)
        }
      }
      
      // Check for appAction tool
      if (
        toolName === "appAction" &&
        "state" in part &&
        part.state === "output-available" &&
        "output" in part
      ) {
        const output = part.output as AppActionOutput | null
        if (output?.executeAction) {
          executeAppAction(output)
        }
      }
    }
  }, [messages, status, executeAppAction, executedActions, locale, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input })
    setInput("")
    setInterimTranscript("")
  }

  // Auto-send in voice mode after speech recognition completes
  useEffect(() => {
    if (voiceModeEnabled && input.trim() && !isListening && !isStreaming) {
      // Clear any existing timeout
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current)
      }
      // Auto-send after a brief delay to allow for additional speech
      autoSendTimeoutRef.current = setTimeout(() => {
        if (input.trim()) {
          sendMessage({ text: input })
          setInput("")
        }
      }, 1200)
    }

    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current)
      }
    }
  }, [input, isListening, voiceModeEnabled, isStreaming, sendMessage])

  // In voice mode, restart listening after assistant finishes speaking
  useEffect(() => {
    if (voiceModeEnabled && !isSpeaking && !isStreaming && !isListening && status === "ready") {
      // Small delay before restarting listening
      const timeout = setTimeout(() => {
        if (voiceModeEnabled && recognitionRef.current) {
          try {
            recognitionRef.current.start()
          } catch {
            // Ignore if already listening
          }
        }
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [voiceModeEnabled, isSpeaking, isStreaming, isListening, status])

  function handleSuggestion(text: string) {
    if (isStreaming) return
    sendMessage({ text })
  }

  function getTextFromParts(parts: Array<{ type: string; text?: string }>): string {
    return parts
      .filter((p): p is { type: "text"; text: string } => p != null && p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-medium">{dict.chat.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Ask me to find rooms, create bookings, or manage your schedule using natural language.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {dict.chat.examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(example)}
                  className="text-left rounded-lg border px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-xl px-4 py-3 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.parts?.map((part, idx) => {
                    // Skip undefined parts
                    if (!part || !part.type) return null
                    
                    // Debug: log all parts to see what's coming from the AI
                    if (process.env.NODE_ENV === "development" && part.type !== "text") {
                      console.log("Message part:", part.type, "state" in part ? part.state : "no-state", part)
                    }
                    
                    if (part.type === "text") {
                      return (
                        <div key={idx} className="text-sm leading-relaxed whitespace-pre-wrap">
                          {formatMessageText(part.text)}
                        </div>
                      )
                    }
                    
                    // Handle tool invocations - extract tool name from part type
                    const toolName = part.type.startsWith("tool-") 
                      ? part.type.replace("tool-", "") 
                      : null
                    const toolState = "state" in part ? part.state : null
                    const isOutputAvailable = toolState === "output-available"
                    const toolOutput = isOutputAvailable && "output" in part ? part.output : null
                    
                    // searchRooms - show room cards inline
                    if (toolName === "searchRooms") {
                      if (isOutputAvailable) {
                        const output = toolOutput as { rooms?: Array<{ id: string; name: string; building: string; capacity: number; tier: string; hourlyRate: number; score?: number }> } | null
                        const rooms = output?.rooms || []
                        if (rooms.length > 0) {
                          return (
                            <div key={idx} className="mt-3 space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">
                                Found {rooms.length} room(s) - say "book [room name]" to reserve:
                              </div>
                              {rooms.slice(0, 3).map((room) => (
                                <Card 
                                  key={room.id} 
                                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                                  onClick={() => router.push(`/${locale}/rooms/${room.id}`)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-sm">{room.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {room.building} • {room.capacity} people • {room.tier}
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium">CHF {room.hourlyRate}/h</div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )
                        }
                        return (
                          <div key={idx} className="text-xs text-muted-foreground italic mt-1">
                            No rooms found matching your criteria.
                          </div>
                        )
                      }
                      return (
                        <div key={idx} className="text-xs text-muted-foreground italic mt-1">
                          Searching rooms...
                        </div>
                      )
                    }
                    
                    // createBooking
                    if (toolName === "createBooking") {
                      if (isOutputAvailable) {
                        const output = toolOutput as { success?: boolean; message?: string } | null
                        return (
                          <div key={idx} className="text-sm mt-2 p-2 rounded-lg bg-background flex items-center gap-2">
                            {output?.success ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 font-medium">{output?.message || "Booking confirmed!"}</span>
                              </>
                            ) : (
                              <span className="text-red-500">{output?.message || "Booking failed"}</span>
                            )}
                          </div>
                        )
                      }
                      return (
                        <div key={idx} className="text-xs text-muted-foreground italic mt-1">
                          Creating booking...
                        </div>
                      )
                    }
                    
                    // cancelBooking
                    if (toolName === "cancelBooking") {
                      if (isOutputAvailable) {
                        const output = toolOutput as { success?: boolean; message?: string } | null
                        return (
                          <div key={idx} className="text-xs mt-1">
                            <span className={output?.success ? "text-green-600" : "text-red-500"}>
                              {output?.message}
                            </span>
                          </div>
                        )
                      }
                      return (
                        <div key={idx} className="text-xs text-muted-foreground italic mt-1">
                          Cancelling booking...
                        </div>
                      )
                    }
                    
                    // listMyBookings
                    if (toolName === "listMyBookings") {
                      if (isOutputAvailable) {
                        const output = toolOutput as { bookings?: unknown[] } | null
                        return (
                          <div key={idx} className="text-xs text-muted-foreground italic mt-1">
                            Found {output?.bookings?.length || 0} booking(s)
                          </div>
                        )
                      }
                      return (
                        <div key={idx} className="text-xs text-muted-foreground italic mt-1">
                          Fetching bookings...
                        </div>
                      )
                    }
                    
                    // appAction - navigation confirmations
                    if (toolName === "appAction") {
                      if (isOutputAvailable) {
                        const output = toolOutput as AppActionOutput | null
                        if (output?.action === "confirm_action") {
                          return (
                            <div key={idx} className="mt-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">
                                {output.params.confirmationType === "booking_created" && "Booking confirmed!"}
                                {output.params.confirmationType === "booking_cancelled" && "Booking cancelled"}
                                {output.params.confirmationType === "search_complete" && "Search complete"}
                              </span>
                            </div>
                          )
                        }
                        if (output?.action?.startsWith("navigate_")) {
                          return (
                            <div key={idx} className="text-xs text-primary mt-1 flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Opening page...
                            </div>
                          )
                        }
                      }
                      return null
                    }
                    
                    return null
                  })}
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-xl bg-muted px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-background px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? dict.chat.listening : dict.chat.placeholder}
              disabled={isStreaming}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50"
            />
            {interimTranscript && (
              <div className="absolute left-4 right-4 top-full mt-1 text-xs text-muted-foreground italic">
                {interimTranscript}...
              </div>
            )}
          </div>
          
          {/* Voice Mode Toggle */}
          <Button
            type="button"
            size="icon"
            variant={voiceModeEnabled ? "default" : "outline"}
            onClick={toggleVoiceMode}
            title={voiceModeEnabled ? dict.chat.disableVoiceMode : dict.chat.enableVoiceMode}
            className={voiceModeEnabled ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {voiceModeEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          {/* Microphone Button */}
          {isListening ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={stopListening}
              title={dict.chat.stopListening}
              className="animate-pulse"
            >
              <MicOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={startListening}
              disabled={isStreaming || isSpeaking}
              title={dict.chat.startListening}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}

          {/* Stop Speaking */}
          {isSpeaking && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={stopSpeaking}
              title={dict.chat.stopSpeaking}
            >
              <Square className="h-4 w-4" />
            </Button>
          )}

          {/* Send Button */}
          <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        
        {/* Status indicators */}
        <div className="text-xs text-muted-foreground text-center mt-2 space-y-1">
          {voiceModeEnabled && (
            <p className="text-green-600 font-medium">{dict.chat.voiceModeActive}</p>
          )}
          {isListening && (
            <p className="animate-pulse">{dict.chat.listening}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function formatMessageText(text: string): React.ReactNode {
  // Simple markdown-like formatting for bold and lists
  const lines = text.split("\n")
  return lines.map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <div key={i} className="ml-2">
          {"- "}{line.slice(2)}
        </div>
      )
    }
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <div key={i}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j}>{part.slice(2, -2)}</strong>
          }
          return <span key={j}>{part}</span>
        })}
      </div>
    )
  })
}
