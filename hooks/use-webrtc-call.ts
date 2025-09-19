import { useState, useRef, useCallback, useEffect } from 'react'
import { useWebSocket } from './use-websocket'
import { useSession } from 'next-auth/react'

export interface CallState {
  isInCall: boolean
  callType: 'voice' | 'video' | null
  isInitiator: boolean
  remoteUserId: string | null
  remoteUserName: string | null
  remoteUserAvatar: string | null
  callStartTime: Date | null
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed'
}

export interface MediaState {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isMuted: boolean
  isVideoOff: boolean
}

export function useWebRTCCall() {
  const { data: session } = useSession()
  const { isConnected, send } = useWebSocket()
  
  // Estados da chamada
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    callType: null,
    isInitiator: false,
    remoteUserId: null,
    remoteUserName: null,
    remoteUserAvatar: null,
    callStartTime: null,
    connectionState: 'disconnected'
  })

  // Estados de mídia
  const [mediaState, setMediaState] = useState<MediaState>({
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isMuted: false,
    isVideoOff: false
  })

  // Refs para WebRTC
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  // Configuração STUN/TURN
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]

  // Inicializar conexão WebRTC
  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers
    })

    pc.onicecandidate = (event) => {
      if (event.candidate && send) {
        send({
          type: 'custom_event',
          data: {
            type: 'ice-candidate',
            candidate: event.candidate,
            to: callState.remoteUserId
          }
        })
      }
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      setMediaState(prev => ({ ...prev, remoteStream }))
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    }

    pc.onconnectionstatechange = () => {
      setCallState(prev => ({ 
        ...prev, 
        connectionState: pc.connectionState as any 
      }))
      
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall()
      }
    }

    peerConnection.current = pc
    return pc
  }, [send, callState.remoteUserId])

  // Obter mídia local
  const getLocalMedia = useCallback(async (callType: 'voice' | 'video') => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      setMediaState(prev => ({ 
        ...prev, 
        localStream: stream,
        isVideoEnabled: callType === 'video',
        isAudioEnabled: true
      }))

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream
      }

      return stream
    } catch (error) {
      console.error('Erro ao obter mídia local:', error)
      throw error
    }
  }, [])

  // Iniciar chamada
  const startCall = useCallback(async (
    remoteUserId: string,
    remoteUserName: string,
    remoteUserAvatar: string,
    callType: 'voice' | 'video'
  ) => {
    if (!send || !session?.user?.id) return

    try {
      setCallState({
        isInCall: true,
        callType,
        isInitiator: true,
        remoteUserId,
        remoteUserName,
        remoteUserAvatar,
        callStartTime: new Date(),
        connectionState: 'connecting'
      })

      const localStream = await getLocalMedia(callType)
      const pc = initializePeerConnection()

      // Adicionar tracks locais
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream)
      })

      // Criar oferta
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Enviar oferta via WebSocket
      send({
        type: 'custom_event',
        data: {
          type: 'call-offer',
          offer,
          to: remoteUserId,
          callType,
          from: {
            id: session.user.id,
            name: session.user.name,
            avatar: session.user.profilePicture
          }
        }
      })

    } catch (error) {
      console.error('Erro ao iniciar chamada:', error)
      endCall()
    }
  }, [send, session, getLocalMedia, initializePeerConnection])

  // Aceitar chamada
  const acceptCall = useCallback(async (
    offer: RTCSessionDescriptionInit,
    remoteUserId: string,
    remoteUserName: string,
    remoteUserAvatar: string,
    callType: 'voice' | 'video'
  ) => {
    if (!send || !session?.user?.id) return

    try {
      setCallState({
        isInCall: true,
        callType,
        isInitiator: false,
        remoteUserId,
        remoteUserName,
        remoteUserAvatar,
        callStartTime: new Date(),
        connectionState: 'connecting'
      })

      const localStream = await getLocalMedia(callType)
      const pc = initializePeerConnection()

      // Adicionar tracks locais
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream)
      })

      // Configurar oferta remota
      await pc.setRemoteDescription(offer)

      // Criar resposta
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Enviar resposta via WebSocket
      send({
        type: 'custom_event',
        data: {
          type: 'call-answer',
          answer,
          to: remoteUserId
        }
      })

    } catch (error) {
      console.error('Erro ao aceitar chamada:', error)
      endCall()
    }
  }, [send, session, getLocalMedia, initializePeerConnection])

  // Rejeitar chamada
  const rejectCall = useCallback((remoteUserId: string) => {
    if (!send) return

    send({
      type: 'custom_event',
      data: {
        type: 'call-reject',
        to: remoteUserId
      }
    })

    endCall()
  }, [send])

  // Encerrar chamada
  const endCall = useCallback(() => {
    // Parar mídia local
    if (mediaState.localStream) {
      mediaState.localStream.getTracks().forEach(track => track.stop())
    }

    // Fechar conexão peer
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }

    // Notificar via WebSocket
    if (send && callState.remoteUserId) {
      send({
        type: 'custom_event',
        data: {
          type: 'call-end',
          to: callState.remoteUserId
        }
      })
    }

    // Resetar estados
    setCallState({
      isInCall: false,
      callType: null,
      isInitiator: false,
      remoteUserId: null,
      remoteUserName: null,
      remoteUserAvatar: null,
      callStartTime: null,
      connectionState: 'disconnected'
    })

    setMediaState({
      localStream: null,
      remoteStream: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      isMuted: false,
      isVideoOff: false
    })

    // Limpar refs de vídeo
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
  }, [send, callState.remoteUserId, mediaState.localStream])

  // Toggle áudio
  const toggleMute = useCallback(() => {
    if (mediaState.localStream) {
      const audioTrack = mediaState.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setMediaState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
      }
    }
  }, [mediaState.localStream])

  // Toggle vídeo
  const toggleVideo = useCallback(() => {
    if (mediaState.localStream) {
      const videoTrack = mediaState.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setMediaState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }))
      }
    }
  }, [mediaState.localStream])

  // Listeners WebSocket - TODO: Implementar quando necessário
  useEffect(() => {
    // Por enquanto, os eventos WebRTC serão gerenciados pelo componente pai
    // através do hook use-websocket que já tem onCall e outros listeners
  }, [isConnected, endCall])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [])

  return {
    // Estados
    callState,
    mediaState,
    
    // Refs
    localVideoRef,
    remoteVideoRef,
    
    // Ações
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    
    // Helpers
    isConnected
  }
}
