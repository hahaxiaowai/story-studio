export type OutlineTimelineDensity = 'compact' | 'standard' | 'expanded'

export type OutlineTimelineLaneKind = 'plot' | 'character' | 'section'

export interface OutlineTimelineColumn {
  id: string
  title: string
  timeLabel: string
  summary: string
  eventCount: number
}

export interface OutlineTimelineLaneItem {
  beatId: string
  title: string
  summary: string
  color: string
}

export interface OutlineTimelineLane {
  id: string
  kind: OutlineTimelineLaneKind
  title: string
  color: string
  items: OutlineTimelineLaneItem[]
}

export interface OutlineTimelineModel {
  columns: OutlineTimelineColumn[]
  lanes: OutlineTimelineLane[]
}

export type OutlineTimelineNodeType = 'column-header' | 'lane-header' | 'beat-card' | 'empty-section'

export interface OutlineTimelineNode {
  id: string
  type: OutlineTimelineNodeType
  x: number
  y: number
  width: number
  height: number
  title: string
  summary: string
  color: string
  beatId?: string
  laneId?: string
}

export interface OutlineTimelineLayout {
  density: OutlineTimelineDensity
  width: number
  height: number
  nodes: OutlineTimelineNode[]
}

export interface OutlineTimelinePoint {
  x: number
  y: number
}

export interface OutlineTimelineRenderer {
  setModel: (model: OutlineTimelineModel) => void
  setSelectedBeatId: (beatId: string | undefined) => void
  setDensity: (density: OutlineTimelineDensity) => void
  resetView: () => void
  resize: () => void
  dispose: () => void
}

export interface CreateOutlineTimelineRendererOptions {
  density?: OutlineTimelineDensity
  model: OutlineTimelineModel
  onSelectBeat?: (beatId: string) => void
  selectedBeatId?: string
}
