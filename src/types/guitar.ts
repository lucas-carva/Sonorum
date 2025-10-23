// types/guitar.ts

export interface Point {
  x: number;
  y: number;
}

// Para arrays que vêm como tuples do Python
export type PointTuple = [number, number]; // [x, y]
export type PointTupleWithConf = [number, number, number]; // [x, y, confidence]
export type BoxTuple = [PointTuple, PointTuple, number]; // [pt1, pt2, conf]

export interface Box {
  pt1: PointTuple;
  pt2: PointTuple;
  conf: number;
}

// Para compatibilidade - pode receber tanto objeto quanto tuple
export type BoxData = Box | BoxTuple;

export interface Circle {
  cx: number;
  cy: number;
  conf: number;
}

export type CircleTuple = [number, number, number]; // [cx, cy, conf]
export type CircleData = Circle | CircleTuple;

export interface Projection {
  pt: PointTuple;
  proj: PointTuple;
}

export interface ExpectedPoint {
  pt: PointTuple;
}

export interface FinalProjectedPoint {
  pt: PointTuple;
  ordem?: number;
  distance?: number;
}

export interface Pestana {
  start_point: PointTuple;
  end_point: PointTuple;
  text: string;
  text_position: PointTuple;
  casa: number;
  cordas: number[];
}

export interface Position {
  point: PointTuple;
  text: string;
  text_position: PointTuple;
  casa: number;
  corda: number;
  tocar: boolean;
}

export interface ChordData {
  name: string;
  pestana: Pestana | null;
  positions: Position[];
}

export interface Casas {
  [casa: number]: {
    [corda: number]: PointTuple;
  };
}

export interface GuitarData {
  // Detecções básicas - agora aceitando tanto objetos quanto tuples
  frets_box: BoxData[];
  nut: CircleData[];
  neck_box: BoxData[];
  
  // Validação e eixo
  valid: boolean;
  axis: [PointTuple, PointTuple] | null;
  angle_deg?: number;
  
  // Projeções e pontos
  projections: Projection[];
  expected: ExpectedPoint[];
  pt_projected_final: FinalProjectedPoint[];
  
  // Casas do braço
  casas: Casas;
  
  // Acordes
  chords_points: {
    [chordName: string]: ChordData;
  };
}

// Props do componente
export interface GuitarOverlayProps {
  data: Partial<GuitarData>;
  chordName?: string;
  allowedClasses?: string[] | null;
  width?: number;
  height?: number;
}