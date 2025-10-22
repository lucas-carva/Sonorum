import { useState } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { NotesPanel } from './components/NotesPanel';

/*
import { useWebSocketAudio } from './hooks/useWebSocketAudio';

const [cameraActive, setCameraActive] = useState(false);

const { isConnected } = useWebSocketAudio({
    wsUrl: 'ws://localhost:8000/ws/audio', // Substitua pelo seu URL de WS
    isEnabled: cameraActive // Liga quando a câmera estiver ativa
  });
*/

export default function App() {
  const [cameraActive, setCameraActive] = useState(false);

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Screen Content */}
          <div className="flex gap-4"
          style={{ height: '95vh'}}
          >
            {/* Camera Feed - Maior espaço */}
            <div className="flex-1" style={{width: '75%'}}>
              <CameraFeed onCameraStateChange={setCameraActive} />
            </div>

            {/* Notes Panel - Menor espaço */}
            <div className="flex-shrink-0" style={{width: '25%'}}>
              <NotesPanel cameraActive={cameraActive} />
            </div>
          </div>


        </div>
      </div>
    );
  }