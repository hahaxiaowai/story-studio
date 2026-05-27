export type FantasyMapMode = 'draw' | 'pan'

export interface FantasyMapPoint {
  x: number
  y: number
}

export interface FantasyMapBrush {
  color: string
  width: number
}

export interface FantasyMapStroke {
  id?: string
  color: string
  width: number
  points: FantasyMapPoint[]
}

export interface FantasyMapStrokeDraft {
  color: string
  width: number
  points: FantasyMapPoint[]
}

export interface FantasyMapSize {
  width: number
  height: number
}

export interface FantasyMapWorldPoint {
  x: number
  z: number
}

export interface FantasyMapRenderer {
  setStrokes: (strokes: FantasyMapStroke[]) => void
  setMode: (mode: FantasyMapMode) => void
  setBrush: (brush: FantasyMapBrush) => void
  resetView: () => void
  resize: () => void
  dispose: () => void
}

export interface CreateFantasyMapRendererOptions {
  brush?: FantasyMapBrush
  mapSize?: FantasyMapSize
  mode?: FantasyMapMode
  onStrokeComplete: (stroke: FantasyMapStrokeDraft) => void
}
