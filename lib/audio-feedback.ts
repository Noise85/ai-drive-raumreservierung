"use client"

// Audio feedback using Web Audio API - no external files needed
// Generates tones for various assistant states

interface ToneConfig {
  frequencies: number[]
  durations: number[]
  type: OscillatorType
  gain: number
}

const TONES: Record<string, ToneConfig> = {
  // Activation chime - rising tone
  activate: {
    frequencies: [440, 554, 659], // A4, C#5, E5 (A major chord rising)
    durations: [100, 100, 150],
    type: "sine",
    gain: 0.15,
  },
  // Deactivation chime - falling tone  
  deactivate: {
    frequencies: [659, 554, 440],
    durations: [100, 100, 150],
    type: "sine",
    gain: 0.15,
  },
  // Message sent - short click
  send: {
    frequencies: [880],
    durations: [50],
    type: "sine",
    gain: 0.1,
  },
  // Success - happy double beep
  success: {
    frequencies: [523, 659], // C5, E5
    durations: [100, 150],
    type: "sine",
    gain: 0.15,
  },
  // Error - low buzz
  error: {
    frequencies: [220, 196], // A3, G3
    durations: [150, 200],
    type: "triangle",
    gain: 0.12,
  },
  // Listening started - subtle ping
  listening: {
    frequencies: [1047], // C6 - high ping
    durations: [80],
    type: "sine",
    gain: 0.08,
  },
  // Notification - attention-getting
  notification: {
    frequencies: [523, 659, 784], // C5, E5, G5
    durations: [80, 80, 120],
    type: "sine",
    gain: 0.12,
  },
}

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

async function playTone(config: ToneConfig): Promise<void> {
  try {
    const ctx = getAudioContext()
    
    // Resume context if suspended (required for auto-play policies)
    if (ctx.state === "suspended") {
      await ctx.resume()
    }
    
    let startTime = ctx.currentTime
    
    for (let i = 0; i < config.frequencies.length; i++) {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.type = config.type
      oscillator.frequency.value = config.frequencies[i]
      
      gainNode.gain.setValueAtTime(config.gain, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.durations[i] / 1000)
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + config.durations[i] / 1000)
      
      startTime += config.durations[i] / 1000
    }
  } catch (e) {
    console.warn("Audio feedback failed:", e)
  }
}

export const audioFeedback = {
  activate: () => playTone(TONES.activate),
  deactivate: () => playTone(TONES.deactivate),
  send: () => playTone(TONES.send),
  success: () => playTone(TONES.success),
  error: () => playTone(TONES.error),
  listening: () => playTone(TONES.listening),
  notification: () => playTone(TONES.notification),
}

export type AudioFeedbackType = keyof typeof audioFeedback
