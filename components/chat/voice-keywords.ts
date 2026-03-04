// Voice command keywords for hands-free operation
// Supports multilingual commands (EN, DE, FR)

export interface VoiceCommand {
  type: "wake" | "send" | "confirm" | "cancel" | "stop" | "navigate"
  action?: string
  confidence: number
}

// Wake words to activate the assistant
const WAKE_WORDS: Record<string, string[]> = {
  en: ["hey assistant", "ok assistant", "hello assistant", "hi assistant"],
  de: ["ok raum", "hey assistent", "hallo assistent"],
  fr: ["ok assistant", "hey assistant", "salut assistant"],
}

// Send/submit commands
const SEND_COMMANDS: Record<string, string[]> = {
  en: ["send", "send it", "submit", "go", "do it"],
  de: ["senden", "absenden", "los", "mach das"],
  fr: ["envoyer", "envoie", "vas-y"],
}

// Confirmation commands
const CONFIRM_COMMANDS: Record<string, string[]> = {
  en: ["yes", "yeah", "yep", "correct", "confirm", "book it", "reserve it", "do it", "that one"],
  de: ["ja", "jawohl", "genau", "bestätigen", "buchen", "reservieren", "mach das", "das eine"],
  fr: ["oui", "ouais", "confirmer", "réserver", "celui-là"],
}

// Cancel commands
const CANCEL_COMMANDS: Record<string, string[]> = {
  en: ["cancel", "nevermind", "never mind", "forget it", "stop", "no", "nope"],
  de: ["abbrechen", "vergiss es", "stopp", "nein", "egal"],
  fr: ["annuler", "oublie", "arrête", "non"],
}

// Stop listening commands
const STOP_LISTENING_COMMANDS: Record<string, string[]> = {
  en: ["stop listening", "go to sleep", "goodbye", "bye", "that's all", "done"],
  de: ["stopp", "schluss", "tschüss", "fertig", "das wars"],
  fr: ["arrête d'écouter", "au revoir", "c'est tout", "fini"],
}

// Navigation commands
const NAVIGATE_COMMANDS: Record<string, { patterns: string[], action: string }[]> = {
  en: [
    { patterns: ["show my bookings", "my bookings", "show bookings", "go to bookings"], action: "bookings" },
    { patterns: ["find a room", "search rooms", "show rooms", "go to rooms"], action: "rooms" },
    { patterns: ["go back", "back", "previous"], action: "back" },
    { patterns: ["go home", "home", "dashboard"], action: "home" },
    { patterns: ["new booking", "book a room", "create booking"], action: "new-booking" },
  ],
  de: [
    { patterns: ["zeig meine buchungen", "meine buchungen", "buchungen anzeigen"], action: "bookings" },
    { patterns: ["raum suchen", "räume anzeigen", "zeig räume"], action: "rooms" },
    { patterns: ["zurück", "vorherige"], action: "back" },
    { patterns: ["startseite", "home", "dashboard"], action: "home" },
    { patterns: ["neue buchung", "raum buchen"], action: "new-booking" },
  ],
  fr: [
    { patterns: ["mes réservations", "afficher réservations"], action: "bookings" },
    { patterns: ["chercher salle", "afficher salles", "trouver salle"], action: "rooms" },
    { patterns: ["retour", "précédent"], action: "back" },
    { patterns: ["accueil", "home", "tableau de bord"], action: "home" },
    { patterns: ["nouvelle réservation", "réserver salle"], action: "new-booking" },
  ],
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?]/g, "")
}

function matchesAny(text: string, patterns: string[]): boolean {
  const normalized = normalizeText(text)
  return patterns.some(pattern => {
    const normalizedPattern = normalizeText(pattern)
    
    // Exact match
    if (normalized === normalizedPattern) return true
    
    // Text contains the full pattern (e.g., "hey assistant how are you" contains "hey assistant")
    if (normalized.includes(normalizedPattern)) return true
    
    // For short commands (3 words or less), allow pattern to contain text ONLY if text is substantial
    // This prevents "stop" from matching "stop listening" but allows "goodbye" to match "goodbye"
    const words = normalized.split(/\s+/)
    const patternWords = normalizedPattern.split(/\s+/)
    
    // If text is a single short word, require exact match with a pattern word
    if (words.length === 1 && normalized.length <= 6) {
      // Check if any single-word pattern matches exactly
      return patternWords.length === 1 && normalizedPattern === normalized
    }
    
    return false
  })
}

function calculateConfidence(text: string, patterns: string[]): number {
  const normalized = normalizeText(text)
  let maxConfidence = 0
  
  for (const pattern of patterns) {
    const normalizedPattern = normalizeText(pattern)
    if (normalized === normalizedPattern) {
      return 1.0 // Exact match
    }
    if (normalized.includes(normalizedPattern)) {
      const confidence = normalizedPattern.length / normalized.length
      maxConfidence = Math.max(maxConfidence, confidence)
    }
    if (normalizedPattern.includes(normalized)) {
      const confidence = normalized.length / normalizedPattern.length
      maxConfidence = Math.max(maxConfidence, confidence)
    }
  }
  
  return maxConfidence
}

/**
 * Detect if the transcript contains a voice command keyword
 * Returns the command info if detected, null otherwise
 */
export function detectVoiceCommand(transcript: string, locale: string): VoiceCommand | null {
  const lang = locale.split("-")[0] || "en"
  const text = normalizeText(transcript)
  
  // Check wake words first (highest priority)
  const wakeWords = WAKE_WORDS[lang] || WAKE_WORDS.en
  if (matchesAny(text, wakeWords)) {
    return { type: "wake", confidence: calculateConfidence(text, wakeWords) }
  }
  
  // Check stop listening commands
  const stopCommands = STOP_LISTENING_COMMANDS[lang] || STOP_LISTENING_COMMANDS.en
  if (matchesAny(text, stopCommands)) {
    return { type: "stop", confidence: calculateConfidence(text, stopCommands) }
  }
  
  // Check navigation commands
  const navCommands = NAVIGATE_COMMANDS[lang] || NAVIGATE_COMMANDS.en
  for (const nav of navCommands) {
    if (matchesAny(text, nav.patterns)) {
      return {
        type: "navigate",
        action: nav.action,
        confidence: calculateConfidence(text, nav.patterns),
      }
    }
  }
  
  // Check cancel commands (before confirm to avoid false positives)
  const cancelCommands = CANCEL_COMMANDS[lang] || CANCEL_COMMANDS.en
  if (matchesAny(text, cancelCommands)) {
    return { type: "cancel", confidence: calculateConfidence(text, cancelCommands) }
  }
  
  // Check confirm commands
  const confirmCommands = CONFIRM_COMMANDS[lang] || CONFIRM_COMMANDS.en
  if (matchesAny(text, confirmCommands)) {
    return { type: "confirm", confidence: calculateConfidence(text, confirmCommands) }
  }
  
  // Check send commands (usually at end of utterance)
  const sendCommands = SEND_COMMANDS[lang] || SEND_COMMANDS.en
  // Check if transcript ends with a send command
  for (const cmd of sendCommands) {
    const normalizedCmd = normalizeText(cmd)
    if (text.endsWith(normalizedCmd) || text === normalizedCmd) {
      return { type: "send", confidence: 0.9 }
    }
  }
  
  return null
}

/**
 * Extract the message content from transcript, removing command keywords
 */
export function extractMessageFromTranscript(transcript: string, locale: string): string {
  const lang = locale.split("-")[0] || "en"
  let text = transcript.trim()
  
  // Remove wake words from the beginning
  const wakeWords = WAKE_WORDS[lang] || WAKE_WORDS.en
  for (const wake of wakeWords) {
    const pattern = new RegExp(`^${wake}[,.]?\\s*`, "i")
    text = text.replace(pattern, "")
  }
  
  // Remove send commands from the end
  const sendCommands = SEND_COMMANDS[lang] || SEND_COMMANDS.en
  for (const cmd of sendCommands) {
    const pattern = new RegExp(`[,.]?\\s*${cmd}[.,!]?$`, "i")
    text = text.replace(pattern, "")
  }
  
  return text.trim()
}

/**
 * Check if text is ONLY a command (no additional content to send)
 */
export function isCommandOnly(transcript: string, locale: string): boolean {
  const command = detectVoiceCommand(transcript, locale)
  if (!command) return false
  
  // These command types are always standalone
  if (["wake", "stop", "cancel"].includes(command.type)) return true
  
  // Navigation commands are standalone
  if (command.type === "navigate") return true
  
  // Confirm commands might be standalone or part of a larger message
  if (command.type === "confirm" && command.confidence > 0.8) return true
  
  // Send commands: check if there's content before "send"
  if (command.type === "send") {
    const message = extractMessageFromTranscript(transcript, locale)
    return message.length === 0
  }
  
  return false
}
