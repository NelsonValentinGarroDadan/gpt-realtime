// app/hooks/useRealtime.ts
'use client';

import { useState, useRef, useCallback } from 'react';

// Tipos para los eventos y mensajes
type ToolCall = {
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export const useRealtime = () => {
  // --- ESTADO INTERNO DEL HOOK ---
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [llmResponse, setLlmResponse] = useState('');

  // Referencias para manejar la conexión y el audio
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  // --- LÓGICA DE LAS HERRAMIENTAS (TOOLS) ---
  const handleToolCall = useCallback((toolCall: ToolCall) => {
    if (toolCall.function.name === 'decir_chiste') {
      const args = JSON.parse(toolCall.function.arguments);
      const chistes: Record<string, string> = {
        programadores: '¿Por qué los programadores prefieren el tema oscuro? Porque la luz atrae a los bugs.',
        default: '¿Qué le dice un pez a otro? ¡Nada!',
      };
      const chiste = chistes[args.tema] || chistes.default;
      setLlmResponse(`Respuesta de la herramienta: ${chiste}`);
    }
  }, []);

  // --- MANEJO DE LA CONEXIÓN WEBRTC ---
  const stop = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (audioStream.current) {
      audioStream.current.getTracks().forEach(track => track.stop());
      audioStream.current = null;
    }
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }
    setIsConnected(false);
    setIsRecording(false);
    console.log('Conexión detenida.');
  }, []);

  const start = useCallback(async () => {
    if (peerConnection.current) return; // Evitar múltiples conexiones

    try {
      // 1. Obtener token de sesión desde nuestro backend
      const tokenResponse = await fetch('/api/realtime-token');
      const sessionData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(sessionData.error || 'Error al obtener el token');
      }

      // 2. Crear y configurar la conexión WebRTC
      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          stop();
        }
      };

      // 3. Configurar el canal de datos para eventos JSON
      const dc = pc.createDataChannel('oai-events');
      dataChannel.current = dc;

      dc.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'transcript':
            setTranscript(data.transcript);
            break;
          case 'llm_response':
            setLlmResponse(data.response);
            break;
          case 'tool_calls':
            data.tool_calls.forEach(handleToolCall);
            break;
        }
      };

      dc.onopen = () => setIsConnected(true);
      dc.onclose = () => setIsConnected(false);

      // 4. Configurar el track de audio para la voz del LLM
      audioElement.current = new Audio();
      pc.ontrack = (event) => {
        if (audioElement.current) {
          audioElement.current.srcObject = event.streams[0];
          audioElement.current.play();
          setIsSpeaking(true);
          audioElement.current.onended = () => setIsSpeaking(false);
        }
      };

      // 5. Obtener audio del micrófono y añadirlo a la conexión
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      setIsRecording(true);

      // 6. Realizar el handshake (negociación SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(sessionData.ws_url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionData.token}` },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) throw new Error('Fallo en la negociación SDP');

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (error) {
      console.error('Error al iniciar la conexión:', error);
      stop();
    }
  }, [stop, handleToolCall]);

  const sendText = useCallback((text: string) => {
    if (dataChannel.current?.readyState === 'open') {
      dataChannel.current.send(JSON.stringify({ type: 'text', text }));
    }
  }, []);

  return { isConnected, isRecording, isSpeaking, transcript, llmResponse, start, stop, sendText };
};
