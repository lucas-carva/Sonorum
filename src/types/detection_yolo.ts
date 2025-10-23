// types/detection.ts
export interface ChordPosition {
  point: [number, number];
  text: string;
  text_position: [number, number];
  casa: number;
  corda: number;
  tocar: boolean;
}

export interface Pestana {
  start_point: [number, number];
  end_point: [number, number];
  text: string;
  text_position: [number, number];
  casa: number;
  cordas: number[];
}

export interface ChordData {
  name: string;
  pestana: Pestana | null;
  positions: ChordPosition[];
}

export interface DetectionData {
  chords_points: {
    A_MAJOR: ChordData;
    B_MAJOR: ChordData;
    C_MAJOR: ChordData;
    D_MAJOR: ChordData;
    E_MAJOR: ChordData;
    F_MAJOR: ChordData;
    G_MAJOR: ChordData;
  };
  axis: [[number, number], [number, number]] | null;
  angle_deg: number | null;
  nut: any[];
  neck_box: any[];
  frets_box: any[];
  pt_projected_final: any[];
  casas: { [key: number]: { [key: number]: [number, number] } };
  valid: boolean;
}