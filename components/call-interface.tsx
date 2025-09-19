import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone, Video, X, Mic, MicOff, VideoIcon, VideoOff } from "lucide-react"
import { useWebRTCCall } from "@/hooks/use-webrtc-call"

interface CallInterfaceProps {
  onCallEnd?: () => void
}

export function CallInterface({ onCallEnd }: Readonly<CallInterfaceProps>) {
  const {
    callState,
    mediaState,
    localVideoRef,
    remoteVideoRef,
    endCall,
    toggleMute,
    toggleVideo
  } = useWebRTCCall()

  const [callDuration, setCallDuration] = useState('00:00')

  // Atualizar duração da chamada
  useEffect(() => {
    if (!callState.isInCall || !callState.callStartTime) return

    const interval = setInterval(() => {
      const now = new Date()
      const diff = now.getTime() - callState.callStartTime!.getTime()
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [callState.isInCall, callState.callStartTime])

  const handleEndCall = () => {
    endCall()
    onCallEnd?.()
  }

  if (!callState.isInCall) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header da chamada */}
      <div className="bg-black/80 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={callState.remoteUserAvatar ?? "/placeholder.svg"} />
            <AvatarFallback className="text-lg">
              {callState.remoteUserName
                ?.split(" ")
                .map((n) => n[0])
                .join("") ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{callState.remoteUserName}</h3>
            <p className="text-sm text-gray-300">
              {callState.callType === 'voice' ? 'Chamada de voz' : 'Chamada de vídeo'} • {callDuration}
            </p>
            <p className="text-xs text-gray-400">
              {callState.connectionState === 'connecting' && 'Conectando...'}
              {callState.connectionState === 'connected' && 'Conectado'}
              {callState.connectionState === 'failed' && 'Falha na conexão'}
              {callState.connectionState === 'disconnected' && 'Desconectado'}
            </p>
          </div>
        </div>
      </div>

      {/* Área de vídeo */}
      <div className="flex-1 relative">
        {callState.callType === 'video' ? (
          <>
            {/* Vídeo remoto (principal) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              <track kind="captions" />
            </video>
            
            {/* Vídeo local (picture-in-picture) */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {mediaState.isVideoOff && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>Você</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>

            {/* Placeholder se não há stream remoto */}
            {!mediaState.remoteStream && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarImage src={callState.remoteUserAvatar ?? "/placeholder.svg"} />
                    <AvatarFallback className="text-4xl">
                      {callState.remoteUserName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-lg">
                    {callState.connectionState === 'connecting' ? 'Conectando...' : 'Aguardando vídeo...'}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Chamada de voz */
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-900 to-purple-900">
            <div className="text-center text-white">
              <Avatar className="h-48 w-48 mx-auto mb-6">
                <AvatarImage src={callState.remoteUserAvatar ?? "/placeholder.svg"} />
                <AvatarFallback className="text-6xl">
                  {callState.remoteUserName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") ?? "?"}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-3xl font-bold mb-2">{callState.remoteUserName}</h2>
              <p className="text-xl text-blue-200 mb-4">Chamada de voz</p>
              <p className="text-2xl font-mono">{callDuration}</p>
              <p className="text-sm text-blue-300 mt-2">
                {callState.connectionState === 'connecting' && 'Conectando...'}
                {callState.connectionState === 'connected' && 'Conectado'}
                {callState.connectionState === 'failed' && 'Falha na conexão'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controles da chamada */}
      <div className="bg-black/80 p-6 flex justify-center space-x-6">
        {callState.callType === 'video' && (
          <Button
            variant={mediaState.isVideoOff ? "destructive" : "secondary"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-16 h-16"
            title={mediaState.isVideoOff ? "Ligar vídeo" : "Desligar vídeo"}
          >
            {mediaState.isVideoOff ? (
              <VideoOff className="h-6 w-6" />
            ) : (
              <VideoIcon className="h-6 w-6" />
            )}
          </Button>
        )}
        
        <Button
          variant={mediaState.isMuted ? "destructive" : "secondary"}
          size="lg"
          onClick={toggleMute}
          className="rounded-full w-16 h-16"
          title={mediaState.isMuted ? "Desmutar microfone" : "Mutar microfone"}
        >
          {mediaState.isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        
        <Button 
          variant="destructive" 
          size="lg"
          onClick={handleEndCall}
          className="rounded-full w-16 h-16"
          title="Encerrar chamada"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

interface IncomingCallDialogProps {
  isOpen: boolean
  onAccept: () => void
  onReject: () => void
  callerName: string
  callerAvatar?: string
  callType: 'voice' | 'video'
}

export function IncomingCallDialog({
  isOpen,
  onAccept,
  onReject,
  callerName,
  callerAvatar,
  callType
}: Readonly<IncomingCallDialogProps>) {
  return (
    <Dialog open={isOpen} onOpenChange={onReject}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Chamada Recebida</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={callerAvatar ?? "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">
                {callerName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold mb-2">{callerName}</h3>
              <p className="text-muted-foreground">
                {callType === 'voice' ? 'Chamada de voz' : 'Chamada de vídeo'}
              </p>
            </div>
          </div>
          
          {callType === 'video' && (
            <div className="bg-muted rounded-lg h-32 flex items-center justify-center">
              <Video className="h-8 w-8 text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Chamada de vídeo</span>
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="destructive" 
              size="lg"
              onClick={onReject}
              className="rounded-full w-16 h-16"
            >
              <X className="h-6 w-6" />
            </Button>
            <Button 
              variant="default" 
              size="lg"
              onClick={onAccept}
              className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
            >
              {callType === 'voice' ? (
                <Phone className="h-6 w-6" />
              ) : (
                <Video className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
