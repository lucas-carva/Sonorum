import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Camera, CameraOff } from 'lucide-react';

const FASTAPI_URL = "http://127.0.0.61:8080/offer"

interface CameraFeedProps {
  onCameraStateChange?: (isActive: boolean) => void;
}

export function CameraFeed({ onCameraStateChange }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSignaling, setIsSignaling] = useState(false); 
  const [connectionStatus, setConnectionStatus] = useState("Desconectado");

    // FUNÇÃO CHAVE: Inicia o WebRTC e a troca de SDP com o backend
  const setupWebRTC = async (mediaStream: MediaStream) => {
    setConnectionStatus("A iniciar WebRTC...");
    // Configuração básica do PeerConnection
    const pc = new RTCPeerConnection({}); 
    
    // Monitoramento do estado da conexão
    pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        setConnectionStatus(`ICE: ${state}`);
        if (state === 'connected') {
            setConnectionStatus("Conectado! Streams a enviar.");
        } else if (state === 'failed' || state === 'closed') {
            setError('Conexão WebRTC falhou ou foi fechada.');
        }
    };
    
    // 1. Adiciona ÁUDIO e VÍDEO ao PeerConnection
    mediaStream.getTracks().forEach(track => {
      pc.addTrack(track, mediaStream);
    });

    //1.5 Listener para receber o DataChannel criado pelo Peer remoto (Python)
    pc.ondatachannel = (event) => {
    const channel = event.channel;
    
    // O Python nomeou este canal como "results_channel"
    if (channel.label === "results_channel") {
        console.log(`DataChannel recebido: ${channel.label}`);

        // Ouve mensagens JSON enviadas do Python (resultados YOLO/Acorde)
        channel.onmessage = (e) => {
            try {
                // Recebe a string JSON e converte para objeto JS
                const result = JSON.parse(e.data);
                
                // --- TRATAMENTO DO RESULTADO ---
                if (result.source === 'yolo') {
                    // Exemplo de como você usaria as coordenadas:
                    console.log(`YOLO RECEBIDO: Ponto (${result.coordinates.join(', ')})`);
                    // **TODO: Chamar setYoloCoords() aqui**
                } else if (result.source === 'acorde') {
                    console.log(`ACORDE RECEBIDO: ${result.acorde} (Sim: ${result.similarity})`);
                    // **TODO: Chamar setAcordeStatus() aqui**
                }
            } catch (error) {
                console.error("Erro ao analisar dados do DataChannel:", error);
            }
        };
    }
};
    // 2. Cria e define a descrição local (Offer)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // 3. Envia o Offer para o backend via HTTP POST
    try {
        const response = await fetch(FASTAPI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sdp: pc.localDescription!.sdp,
                type: pc.localDescription!.type,
            }),
        });

        if (response.ok) {
            // 4. Recebe e aplica o Answer
            const answerData = await response.json();
            const answer = new RTCSessionDescription(answerData);
            await pc.setRemoteDescription(answer);
        } else {
            const errorText = await response.text();
            throw new Error(`Falha na Sinalização: ${response.status}`);
        }
    } catch (e: any) {
        // Feche a conexão em caso de falha de sinalização
        pc.close();
        throw new Error('Não foi possível conectar ao Hub Python. Servidor indisponível.');
    } finally {
        setIsSignaling(false);
    }

    return pc;
  };

  const startCamera = async () => {
    try {
      setError('');
      setIsSignaling(true);
      setConnectionStatus("A solicitar permissões...");

      // 1. Obtém o MediaStream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 800, height: 480 },
        audio: true,
      });

      // 2. Inicia o WebRTC
      const pc = await setupWebRTC(mediaStream);

      // 3. Atualiza estados
      setStream(mediaStream);
      setPeerConnection(pc);
      setIsActive(true);
      onCameraStateChange?.(true);

    }catch (err: any) {
      const msg = err.message.includes('servidor')
        ? err.message
        : 'Erro ao acessar a câmera. Verifique as permissões.';
      
      setError(msg);
      console.error('Erro em startCamera:', err);
      setIsSignaling(false);
      setIsActive(false);
      setConnectionStatus("Falha");
      
      // Garante a parada das faixas se o getUserMedia passou mas a sinalização falhou
      if (stream) { stream.getTracks().forEach((track) => track.stop()); }
      setStream(null);
    }
  };

  const stopCamera = () => {
      // 1. Para as faixas
      if (stream) { stream.getTracks().forEach((track) => track.stop()); setStream(null); }
      // 2. Fecha a conexão WebRTC
      if (peerConnection) { peerConnection.close(); setPeerConnection(null); console.log("WebRTC: Conexão fechada."); }

      // 3. Reseta estados
      setIsActive(false);
      setIsSignaling(false);
      setConnectionStatus("Desconectado");
      onCameraStateChange?.(false);
      if (videoRef.current) { videoRef.current.srcObject = null; }
    };

  // Este useEffect conecta o stream ao elemento de vídeo quando o stream é ativado.
  useEffect(() => {
    if (isActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.error('Erro ao tentar play:', e));
    }
  }, [isActive, stream]);

  // Este useEffect garante que a câmera seja desligada quando o componente for desmontado.
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Câmera</h2>
        <Button
          onClick={isActive ? stopCamera : startCamera}
          variant={isActive ? 'destructive' : 'default'}
          size="sm"
        >
          {isSignaling ? (
              <>
              <Camera className="w-4 h-4 mr-2" />        
              A Conectar...
              </>
              
          ) : isActive ? (
              <>
                <CameraOff className="w-4 h-4 mr-2" />
                Parar
              </>
          ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Iniciar
              </>
          )}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
        {error ? (
          <div className="text-center p-8">
            <p className="text-red-600 mb-2">{error}</p>
            <Button onClick={startCamera} variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : isActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full"
          />
        ) : (
          <div className="text-center p-8">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Clique em "Iniciar" para ativar a câmera e começar a tocar violão
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}