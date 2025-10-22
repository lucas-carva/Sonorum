import sounddevice as sd
import numpy as np
import sys
import collections
import librosa
import json

try:
    # tenta definir o dispositivo e a taxa de amostragem
    sd.default.device[0] = 13 
    RATE = 48000
    # Tenta abrir um stream rápido para verificar se a taxa é válida
    with sd.InputStream(samplerate=RATE, channels=1, dtype='int16', blocksize=1):
        pass
    print(f"Microfone ID {sd.default.device[0]} e Taxa {RATE} Hz OK.")
except Exception as e:
    print(f"AVISO: Não foi possível definir o microfone preferido (ID 13, 48k Hz). Erro: {e}")
    print("Tentando usar as configurações padrão do sistema...")
    # Se falhar, usa o padrão do sistema
    sd.default.device[0] = sd.default.device[0] # Usa o padrão
    RATE = int(sd.query_devices(sd.default.device[0], 'input')['default_samplerate'])
    print(f"Usando dispositivo padrão: ID {sd.default.device[0]} @ {RATE} Hz")

# Constantes de Áudio
CHUNK = 1024
VOLUME_THRESHOLD = 0.08 
SILENCE_CHUNKS = 10
MIN_CHORDS_CHUNKS = 5
MAX_FREQ_LIMIT = 800
CHORDS_JSON = "./chords.json" 
SIMILARITY_THRESHOLD = 0.85 

def extract_chroma(y, sr):
    """
    Extrai e normaliza o cromagrama médio de um sinal de áudio.
    """
    try:
        chroma = librosa.feature.chroma_stft(y=y, sr=sr, fmax=MAX_FREQ_LIMIT)
        chroma_mean = np.mean(chroma, axis=1)
        norm = np.linalg.norm(chroma_mean)
        
        if norm > 0:
            chroma_norm = chroma_mean / norm
        else:
            chroma_norm = chroma_mean 
            
        return chroma_norm.tolist()

    except Exception as e:
        print(f"Erro no processamento de audio: {e}", file=sys.stderr)
        return None

def sound_event_generator():
    """
    Escuta o áudio e agrupa os chunks de som em "eventos" únicos.
    """
    silent_chunks_buffer = collections.deque(maxlen=SILENCE_CHUNKS)
    recording = False
    recorded_chunks = []

    print("\nAguardando som...")
    with sd.InputStream(samplerate=RATE, channels=1, dtype='int16', blocksize=CHUNK) as stream:
        while True:
            try:
                y_raw, overflowed = stream.read(CHUNK)
                if overflowed:
                    print("Aviso: Overflow detectado", file=sys.stderr)

                y = y_raw.flatten().astype(np.float32) / 32768.0
                volume = np.sqrt(np.mean(y**2))
                is_loud = volume > VOLUME_THRESHOLD
                
                if not recording:
                    if is_loud:
                        print("Som detectado, gravando...")
                        recording = True
                        recorded_chunks = [y]
                        silent_chunks_buffer.clear()
                else:
                    recorded_chunks.append(y)
                    silent_chunks_buffer.append(not is_loud)
                    
                    if all(item == True for item in silent_chunks_buffer):
                        print("Som terminado. Processando...")
                        if len(recorded_chunks) > MIN_CHORDS_CHUNKS:
                            full_audio = np.concatenate(recorded_chunks)
                            yield full_audio, RATE

                        recording = False
                        recorded_chunks = []
                        silent_chunks_buffer.clear()
                        print("\nAguardando som...")
            
            except sd.PortAudioError as e:
                print(f"Erro de PortAudio no loop: {e}", file=sys.stderr)
                pass

def cosine_similarity(v1, v2):
    """
    Calcula a similaridade entre dois cromagramas.
    """
    v1 = np.array(v1)
    v2 = np.array(v2)
    if np.linalg.norm(v1) == 0 or np.linalg.norm(v2) == 0:
        return 0.0
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

def load_reference_chords(json_file=CHORDS_JSON):
    try:
        with open(json_file, "r") as f:
            print(f"Base de dados '{json_file}' carregada com sucesso.")
            return json.load(f)
    except FileNotFoundError:
        print(f"ERRO CRÍTICO: Arquivo de referência '{json_file}' não encontrado.", file=sys.stderr)
        print("Por favor, adicione o arquivo 'chords.json' ao diretório.", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"ERRO CRÍTICO: Arquivo '{json_file}' está corrompido ou mal formatado.", file=sys.stderr)
        sys.exit(1)

def identify_chord(y, sr, reference_chords):
    print("\n--- INICIANDO NOVA ANÁLISE ---")
    chroma_vector = extract_chroma(y, sr)
    if chroma_vector is None:
        return None, 0.0

    # Imprime o vetor do microfone para vermos como ele se parece
    print(f"Vetor do Microfone: {[round(n, 3) for n in chroma_vector]}")
    print("Comparando com a base de dados:")

    best_match = None
    best_similarity = -1
    all_similarities = {} # Para guardar todos os resultados

    for chord_name, ref_vector in reference_chords.items():
        sim = cosine_similarity(chroma_vector, ref_vector)
        all_similarities[chord_name] = sim # Guarda o resultado
        if sim > best_similarity:
            best_similarity = sim
            best_match = chord_name

    # Imprime a pontuação de TODOS os acordes, do melhor para o pior
    sorted_sims = sorted(all_similarities.items(), key=lambda item: item[1], reverse=True)
    for chord, sim in sorted_sims:
        print(f"  - {chord:<10}: {sim:.4f}")

    if best_similarity >= SIMILARITY_THRESHOLD:
        return best_match, best_similarity
    else:
        return None, best_similarity



if __name__ == "__main__":
    
    print("--- Iniciando identificação de acordes em tempo real ---")
    reference_chords = load_reference_chords()
    
    try:
        for y, sr in sound_event_generator():
            chord, similarity = identify_chord(y, sr, reference_chords)

            if chord:
                print(f"Acorde detectado: {chord} (similaridade: {similarity:.4f})")
            else:
                print(f"Nenhum acorde identificado (similaridade máxima: {similarity:.4f})")

    except KeyboardInterrupt:
        print("\nInterrompido pelo usuário.")
    except Exception as e:
        print(f"\nUm erro crítico ocorreu: {e}", file=sys.stderr)