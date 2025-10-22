import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Music, RotateCcw } from 'lucide-react';

import NoteAImage from '../assets/images/A_MAJOR.png';
import NoteBImage from '../assets/images/B_MAJOR.png';
import NoteCImage from '../assets/images/C_MAJOR.png';
import NoteDImage from '../assets/images/D_MAJOR.png';
import NoteEImage from '../assets/images/E_MAJOR.png';
import NoteFImage from '../assets/images/F_MAJOR.png';
import NoteGImage from '../assets/images/G_MAJOR.png';

interface Note {
  id: string;
  name: string;
  fullName: string;
  detected: boolean;
  lastDetected?: Date;
}

interface NotesPanelProps {
  cameraActive: boolean;
}

const NOTE_IMAGES: { [key: string]: string } = {
  'C': NoteCImage,
  'D': NoteDImage,
  'E': NoteEImage,
  'F': NoteFImage,
  'G': NoteGImage,
  'A': NoteAImage,
  'B': NoteBImage,
} 

const initialNotes: Note[] = [
  { id: 'C', name: 'C', fullName: 'Dó maior', detected: false },
  { id: 'D', name: 'D', fullName: 'Ré maior', detected: false }, 
  { id: 'E', name: 'E', fullName: 'Mi maior', detected: false }, 
  { id: 'F', name: 'F', fullName: 'Fá maior', detected: false },
  { id: 'G', name: 'G', fullName: 'Sol maior', detected: false },
  { id: 'A', name: 'A', fullName: 'Lá maior', detected: false },
  { id: 'B', name: 'B', fullName: 'Si maior', detected: false },
];

export function NotesPanel({ cameraActive }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const resetDetection = () => {
    setNotes(initialNotes);
  };

  const handleNoteClick = (noteId: string) => {
    // Permite ativação manual para demonstração
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, 
          detected: !note.detected
         }
        : {
          ...note,
          detected: false }
    ));
  };

  const selectedNote = notes.find(note => note.detected) || null;
  const imagePath = selectedNote ? NOTE_IMAGES[selectedNote.id] : null; 


  const notesToRender = notes.some(note => note.detected)
    ? notes.filter(note => note.detected)
    : notes;

  return (
    <Card className="p-4 h-full bg-white shadow-lg flex flex-col" style={{border: '3px solid #3b82f6'}}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">Notas</h2>
        </div>
        <Button
          onClick={resetDetection}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      <Badge 
        variant={cameraActive ? "default" : "secondary"}
        className="w-full justify-center py-2 mb-1"
      >
        {cameraActive ? "🎵 Detectando..." : "📷 Câmera desligada"}
      </Badge>

      <div className="flex-1 overflow-hidden">
        <h3 className="text-sm font-medium mb-2 text-gray-600">Todas as Notas</h3>
        <div className="grid gap-2 overflow-y-auto max-h-48">
          {notesToRender.map((note) => (
            <Button
              key={note.id}
              variant={note.detected ? "default" : "outline"}
              className={`p-2 h-auto justify-between transition-all text-left text-xs ${
                note.detected ? 'p-4 shadow-md' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleNoteClick(note.id)}
            > {/* destructive eh vermei, green eh sucesso */}
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1">
                  <div className="font-semibold text-xs">{note.name}</div>
                  <div className="text-xs opacity-75">{note.fullName}</div>
                </div>
                {note.detected && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </div>
            </Button>
          ))}
        </div>
        {selectedNote && imagePath && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col items-center flex-shrink-0"> {/* linha divisoria*/}
              <div className="w-32 h-32 flex items-center justify-center bg-green-50 rounded-full shadow-inner">
                  <img 
                      src={imagePath} // Usa o caminho da imagem mapeado
                      alt={`Imagem Principal da Nota ${selectedNote.name}`} 
                      className="w-24 h-24 object-contain"
                  />
              </div>
          </div>
        )}
      </div>

     {/*  <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
        <p className="font-medium mb-1">💡 Dica:</p>
        <p>Clique nas notas para simular detecção ou use a câmera para detecção automática.</p>
      </div> */}
    </Card>
  );
}