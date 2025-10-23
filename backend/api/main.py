import asyncio
import cv2
import os
import sys
import logging
import uvicorn
import numpy as np
import json
from ultralytics import YOLO
from fastapi import FastAPI
from pydantic import BaseModel
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.mediastreams import MediaStreamTrack
from fastapi.middleware.cors import CORSMiddleware 

# Importações simuladas/reais para YOLO
# --- CONFIGURAÇÃO DE AMBIENTE E INSTÂNCIAS GLOBAIS ---
backend_root = os.path.join(os.path.dirname(__file__), '..')
sys.path.insert(0, backend_root)

from backend_yolo.src.core.config import Config
from backend_yolo.src.core.state_manager import StateManager
from backend_yolo.src.services.detection_pipeline import DetectionPipeline
from backend_yolo.src.modules.extract_data import extract_all_data

# Importação da sua classe de processamento de áudio
from backend_chord.chord_matcher import AudioEventProcessor 


# --- CONFIGURAÇÃO DE AMBIENTE E INSTÂNCIAS GLOBAIS ---
backend_root = os.path.join(os.path.dirname(__file__), '..')
sys.path.insert(0, backend_root)

ACORDE_PROCESSOR = AudioEventProcessor()

logging.basicConfig(level=logging.INFO)
TARGET_HOST = "127.0.0.1" # Endereço de loopback para teste local
TARGET_PORT = 8080

app = FastAPI()
pcs = set() 

origins = [
    # Endereços comuns de desenvolvimento Front-end
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",

    # O endereço IP específico que você está usando no Front-end (127.0.0.61)
    "http://127.0.0.61",
    "http://127.0.0.61:8080", # Embora a porta do FastAPI seja 8080, o navegador só envia a origem (porta 3000 ou 5173)

    # Endereço de loopback padrão
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permite todos os métodos (GET, POST, OPTIONS, etc.)
    allow_headers=["*"], # Permite todos os cabeçalhos
)
# ----------------------------------------------------
# MODELO YOLO PRE-FUNCIONAMENTO
# ----------------------------------------------------
model = YOLO(str(Config.MODEL_PATH))
state = StateManager()
pipeline = DetectionPipeline(model, state)
placeholder = cv2.imread(str(Config.IMAGE_PATH))

# Modelo para validar o JSON do SDP Offer que vem do Front-end
class SdpOffer(BaseModel):
    sdp: str
    type: str

# ----------------------------------------------------
# 1. FUNÇÕES DE CONSUMO/DISTRIBUIÇÃO (Os Loops em Tempo Real)
# ----------------------------------------------------

async def consume_video_track(track: MediaStreamTrack, data_channel):
    """Lê frames de vídeo e os distribui"""
    print("Consumo de VÍDEO iniciado.")
    while True:
        try:
            # Recebe o próximo frame de vídeo (PyAV VideoFrame)
            frame = await track.recv() 
            
            # EXEMPLO DE ACESSO AO DADO BRUTO:
            frame_data = frame.to_ndarray(format="bgr24") # Retorna um array NumPy
            
            pipeline_data = pipeline.process_frame(frame_data)
            data = extract_all_data(pipeline_data)
            # print(data)
            
            
            # Log simples de que está recebendo dados
            # print(f"  [VÍDEO HUB] Recebido frame. Shape: {frame_data}")
            
        except Exception:
            # print("  [VÍDEO HUB] Faixa de vídeo encerrada.")
            break

async def consume_audio_track(track: MediaStreamTrack, data_channel):
    """Lê frames de áudio e os distribui """
    print("Consumo de ÁUDIO iniciado.")
    while True:
        try:
            # Recebe o próximo frame de áudio (PyAV AudioFrame)
            frame = await track.recv()
            
            # EXEMPLO DE ACESSO AO DADO BRUTO:
            audio_buffer = frame.to_ndarray()
            # print(f"  [ÁUDIO HUB] audio buffer: {audio_buffer}")
            
            # --- TODO: PASSO 3 (Distribuição para o Backend de Acordes) ---
            # Implemente o envio deste audio_buffer para o seu programa de Acordes.
            chord_result = await asyncio.to_thread(ACORDE_PROCESSOR.process_audio_chunk, audio_buffer)
            if chord_result and data_channel and data_channel.readyState == 'open':
                chord_result['source'] = 'acorde' 
                data_channel.send(json.dumps(chord_result))


            if chord_result != None:
                print(f"  [ÁUDIO HUB] Enviando dados de Acorde: {chord_result}")
            
        except StopAsyncIteration:
            # 1. Trilha de áudio fechada pelo navegador. Conexão OK, mas stream parou.
            print("  [ÁUDIO HUB] Faixa de áudio encerrada pelo cliente (StopAsyncIteration).")
            break
        except asyncio.CancelledError:
            # 2. Tarefa assíncrona foi cancelada.
            print("  [ÁUDIO HUB] Tarefa de áudio cancelada.")
            break
        except Exception as e:
            # 3. Qualquer outro erro (incluindo falha na conexão ou no PyAV)
            print(f"  [ÁUDIO HUB] Erro inesperado no consumo de áudio: {type(e).__name__}: {e}")
            break
    print("Consumo de ÁUDIO finalizado.")

# ----------------------------------------------------
# 2. ENDPOINT DE SINALIZAÇÃO WEB (FastAPI)
# ----------------------------------------------------

@app.post("/offer")
async def offer_handler(offer_data: SdpOffer):
    print("\n--- INICIANDO SINALIZAÇÃO ---")
    pc = RTCPeerConnection()
    pcs.add(pc) 

    results_channel = pc.createDataChannel("results_channel")

    # Opcional: Handler para limpar a conexão quando ela fecha
    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        if pc.iceConnectionState == "closed" or pc.iceConnectionState == "failed":
            await pc.close()
            pcs.discard(pc)
            print(f"Conexão WebRTC fechada. Total de conexões ativas: {len(pcs)}")

    # Handler principal: Disparado quando as faixas chegam do navegador
    @pc.on("track")
    def on_track(track):
        if track.kind == "video":
            # Inicia o consumo do VÍDEO em segundo plano
            asyncio.ensure_future(consume_video_track(track, results_channel))
        elif track.kind == "audio":
            # Inicia o consumo do ÁUDIO em segundo plano
            asyncio.ensure_future(consume_audio_track(track, results_channel))
    
    # 1. Aplica o SDP Offer recebido
    offer = RTCSessionDescription(sdp=offer_data.sdp, type=offer_data.type)
    await pc.setRemoteDescription(offer)

    # 2. Cria e aplica o SDP Answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    # 3. Retorna o Answer para o Front-end
    print("--- SINALIZAÇÃO CONCLUÍDA. ENVIANDO ANSWER. ---")
    return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}

# ----------------------------------------------------
# 3. EXECUÇÃO
# ----------------------------------------------------

if __name__ == "__main__":
    print(f"Iniciando Hub WebRTC em http://{TARGET_HOST}:{TARGET_PORT}")
    # Nota: Não use reload=True se estiver no mesmo ambiente de execução do React.
    # use o comando `poetry run uvicorn main:app --host 127.0.0.1 --port 8080` no terminal.
    uvicorn.run("main:app", host=TARGET_HOST, port=TARGET_PORT, log_level="info")