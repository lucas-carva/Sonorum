// hooks/useWebSocket.ts
import { useEffect, useState, useRef } from 'react';
import { DetectionData } from '../types/detection_yolo';

export const useWebSocket = (url: string) => {
  const [data, setData] = useState<DetectionData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => {
      console.log('✅ Conectado ao WebSocket');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      if (receivedData.type === 'detection_data') {
        setData(receivedData.data as DetectionData);
        setMessageCount(prev => prev + 1);
      }
    };

    ws.current.onclose = () => {
      console.log('❌ Conexão WebSocket fechada');
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  return { data, isConnected, messageCount };
};