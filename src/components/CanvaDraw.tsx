// components/CameraDraw.tsx
import React, { useRef, useEffect } from 'react';
import { 
  GuitarData, 
  GuitarOverlayProps,
  BoxData,
  CircleData,
  BoxTuple,
  CircleTuple,
  PointTuple
} from '../types/guitar';

// Helper functions para lidar com dados em formato tuple ou object
const parseBoxData = (box: BoxData): { pt1: PointTuple, pt2: PointTuple, conf: number } => {
  if (Array.isArray(box)) {
    // É um tuple: [pt1, pt2, conf]
    const [pt1, pt2, conf] = box as BoxTuple;
    return { pt1, pt2, conf };
  } else {
    // É um objeto: { pt1, pt2, conf }
    return box;
  }
};

const parseCircleData = (circle: CircleData): { cx: number, cy: number, conf: number } => {
  if (Array.isArray(circle)) {
    // É um tuple: [cx, cy, conf]
    const [cx, cy, conf] = circle as CircleTuple;
    return { cx, cy, conf };
  } else {
    // É um objeto: { cx, cy, conf }
    return circle;
  }
};

const CameraDraw: React.FC<GuitarOverlayProps> = ({ 
  data = {} as GuitarData, 
  chordName = '', 
  allowedClasses = null,
  width = 640, 
  height = 480 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Função principal de desenho
  const draw = (ctx: CanvasRenderingContext2D, data: Partial<GuitarData>, allowedClasses: string[] | null) => {
    if (!ctx) return;

    // Limpar o canvas de forma transparente
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Frets Box - CORRIGIDO
    if (allowedClasses === null || allowedClasses.includes('frets_box')) {
      const fretsBox = data.frets_box || [];
      fretsBox.forEach((boxData) => {
        const { pt1, pt2, conf } = parseBoxData(boxData);
        const [x1, y1] = pt1;
        const [x2, y2] = pt2;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      });
    }

    // Nut - CORRIGIDO
    if (allowedClasses === null || allowedClasses.includes('nut')) {
      const nut = data.nut || [];
      nut.forEach((circleData) => {
        const { cx, cy, conf } = parseCircleData(circleData);
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Neck Box - CORRIGIDO
    if (allowedClasses === null || allowedClasses.includes('neck')) {
      const neckBox = data.neck_box || [];
      neckBox.forEach((boxData) => {
        const { pt1, pt2, conf } = parseBoxData(boxData);
        const [x1, y1] = pt1;
        const [x2, y2] = pt2;
        ctx.strokeStyle = '#0000ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      });
    }

    const valid = data.valid || false;
    if (valid) {
      // Axis
      if (allowedClasses === null || allowedClasses.includes('axis')) {
        const axisData = data.axis;
        if (axisData) {
          const [start, end] = axisData;
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(start[0], start[1]);
          ctx.lineTo(end[0], end[1]);
          ctx.stroke();
        }
      }

      // Final Projected Points
      if (allowedClasses === null || allowedClasses.includes('pt_projected_final')) {
        const ptProjectedFinal = data.pt_projected_final || [];
        ptProjectedFinal.forEach(p => {
          const pt = p.pt;
          if (pt) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }

      // Casas do braço
      if (allowedClasses === null || allowedClasses.includes('casas')) {
        const casas = data.casas || {};
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';

        Object.entries(casas).forEach(([casa, cordas]) => {
          Object.entries(cordas).forEach(([corda, point]) => {
            const [x, y] = point;
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
        });
      }
    }
  };

  // Função para desenhar acordes (mantida igual)
  const drawChords = (ctx: CanvasRenderingContext2D, data: Partial<GuitarData>, chordName: string) => {
    if (!ctx) return;

    const chordsPoints = data.chords_points || {};

    if (!chordsPoints[chordName]) {
      return;
    }

    const chordData = chordsPoints[chordName];

    // Configurações de estilo
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Desenhar pestana (se existir)
    if (chordData.pestana) {
      const pestana = chordData.pestana;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pestana.start_point[0], pestana.start_point[1]);
      ctx.lineTo(pestana.end_point[0], pestana.end_point[1]);
      ctx.stroke();

      // Texto da pestana
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(
        pestana.text,
        pestana.text_position[0],
        pestana.text_position[1]
      );
    }

    // Desenhar posições dos dedos
    const positions = chordData.positions || [];
    positions.forEach(position => {
      if (position.tocar) {
        // Círculo da posição
        ctx.fillStyle = '#007bff';
        ctx.beginPath();
        ctx.arc(position.point[0], position.point[1], 8, 0, 2 * Math.PI);
        ctx.fill();

        // Borda branca
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Texto da posição
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(
          position.text,
          position.text_position[0],
          position.text_position[1]
        );
      }
    });

    // Nome do acorde no topo
    if (chordData.name) {
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(
        chordData.name.replace('_', ' '),
        ctx.canvas.width / 2,
        30
      );
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Sempre limpar e redesenhar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar elementos principais
    draw(ctx, data, allowedClasses);
    
    // Desenhar acordes se especificado
    if (chordName) {
      drawChords(ctx, data, chordName);
    }
  }, [data, chordName, allowedClasses]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        backgroundColor: 'transparent'
      }}
    />
  );
};

export default CameraDraw;