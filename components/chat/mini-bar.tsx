"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown,
  X,
  Loader2,
  CheckCircle2,
  Car
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MiniBarProps {
  isActive: boolean
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  lastUtterance: string
  lastResponse: string
  drivingMode: boolean
  voiceEnabled: boolean
  onToggleVoice: () => void
  onToggleListening: () => void
  onToggleDrivingMode: () => void
  onExpand: () => void
  onClose: () => void
  quickActions?: Array<{
    label: string
    onClick: () => void
  }>
}

export function MiniBar({
  isActive,
  isListening,
  isSpeaking,
  isProcessing,
  lastUtterance,
  lastResponse,
  drivingMode,
  voiceEnabled,
  onToggleVoice,
  onToggleListening,
  onToggleDrivingMode,
  onExpand,
  onClose,
  quickActions = [],
}: MiniBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Auto-expand when there's a response
  useEffect(() => {
    if (lastResponse && !isExpanded) {
      setIsExpanded(true)
    }
  }, [lastResponse, isExpanded])

  if (!isActive) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
        drivingMode && "driving-mode"
      )}
    >
      <Card className={cn(
        "mx-4 mb-4 shadow-lg border-2 transition-all duration-300",
        drivingMode && "border-primary bg-black text-white",
        isListening && "border-green-500 animate-pulse",
        isSpeaking && "border-blue-500"
      )}>
        {/* Expanded content */}
        {isExpanded && (
          <div className="p-4 border-b">
            {/* Last utterance */}
            {lastUtterance && (
              <div className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">You:</span> "{lastUtterance}"
              </div>
            )}
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}
            
            {/* Last response */}
            {lastResponse && !isProcessing && (
              <div className={cn(
                "text-sm",
                drivingMode ? "text-lg font-medium" : ""
              )}>
                {lastResponse}
              </div>
            )}
            
            {/* Quick actions */}
            {quickActions.length > 0 && !isProcessing && (
              <div className="flex flex-wrap gap-2 mt-3">
                {quickActions.map((action, i) => (
                  <Button
                    key={i}
                    variant={drivingMode ? "default" : "outline"}
                    size={drivingMode ? "lg" : "sm"}
                    onClick={action.onClick}
                    className={cn(
                      drivingMode && "min-h-14 text-lg px-6"
                    )}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Main bar */}
        <div className={cn(
          "flex items-center gap-3 p-3",
          drivingMode && "p-4"
        )}>
          {/* Status indicator */}
          <div className={cn(
            "flex items-center justify-center rounded-full transition-colors",
            drivingMode ? "h-14 w-14" : "h-10 w-10",
            isListening && "bg-green-500 text-white",
            isSpeaking && "bg-blue-500 text-white",
            isProcessing && "bg-yellow-500 text-white",
            !isListening && !isSpeaking && !isProcessing && "bg-muted"
          )}>
            {isListening && <Mic className={drivingMode ? "h-7 w-7" : "h-5 w-5"} />}
            {isSpeaking && <Volume2 className={drivingMode ? "h-7 w-7" : "h-5 w-5"} />}
            {isProcessing && <Loader2 className={cn(drivingMode ? "h-7 w-7" : "h-5 w-5", "animate-spin")} />}
            {!isListening && !isSpeaking && !isProcessing && (
              <MicOff className={drivingMode ? "h-7 w-7" : "h-5 w-5"} />
            )}
          </div>
          
          {/* Status text */}
          <div className="flex-1 min-w-0">
            <div className={cn(
              "truncate",
              drivingMode ? "text-lg font-medium" : "text-sm"
            )}>
              {isListening && "Listening..."}
              {isSpeaking && "Speaking..."}
              {isProcessing && "Processing..."}
              {!isListening && !isSpeaking && !isProcessing && (
                lastResponse ? "Tap mic or say 'Hey Assistant'" : "Ready"
              )}
            </div>
            {lastUtterance && !isExpanded && (
              <div className="text-xs text-muted-foreground truncate">
                "{lastUtterance}"
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Expand/collapse */}
            <Button
              variant="ghost"
              size={drivingMode ? "lg" : "icon"}
              onClick={() => setIsExpanded(!isExpanded)}
              className={drivingMode ? "h-12 w-12" : ""}
            >
              {isExpanded 
                ? <ChevronDown className={drivingMode ? "h-6 w-6" : "h-4 w-4"} /> 
                : <ChevronUp className={drivingMode ? "h-6 w-6" : "h-4 w-4"} />
              }
            </Button>
            
            {/* Mic toggle */}
            <Button
              variant={isListening ? "destructive" : "default"}
              size={drivingMode ? "lg" : "icon"}
              onClick={onToggleListening}
              className={cn(
                drivingMode && "h-14 w-14",
                isListening && "animate-pulse"
              )}
            >
              {isListening 
                ? <MicOff className={drivingMode ? "h-7 w-7" : "h-4 w-4"} />
                : <Mic className={drivingMode ? "h-7 w-7" : "h-4 w-4"} />
              }
            </Button>
            
            {/* Voice toggle */}
            <Button
              variant={voiceEnabled ? "secondary" : "ghost"}
              size={drivingMode ? "lg" : "icon"}
              onClick={onToggleVoice}
              className={drivingMode ? "h-14 w-14" : ""}
            >
              {voiceEnabled 
                ? <Volume2 className={drivingMode ? "h-7 w-7" : "h-4 w-4"} />
                : <VolumeX className={drivingMode ? "h-7 w-7" : "h-4 w-4"} />
              }
            </Button>
            
            {/* Driving mode toggle */}
            <Button
              variant={drivingMode ? "default" : "ghost"}
              size={drivingMode ? "lg" : "icon"}
              onClick={onToggleDrivingMode}
              className={cn(
                drivingMode && "h-14 w-14 bg-primary"
              )}
              title="Toggle driving mode"
            >
              <Car className={drivingMode ? "h-7 w-7" : "h-4 w-4"} />
            </Button>
            
            {/* Full chat */}
            <Button
              variant="outline"
              size={drivingMode ? "lg" : "sm"}
              onClick={onExpand}
              className={drivingMode ? "h-14 px-6 text-lg" : ""}
            >
              Full Chat
            </Button>
            
            {/* Close */}
            <Button
              variant="ghost"
              size={drivingMode ? "lg" : "icon"}
              onClick={onClose}
              className={drivingMode ? "h-12 w-12" : ""}
            >
              <X className={drivingMode ? "h-6 w-6" : "h-4 w-4"} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
