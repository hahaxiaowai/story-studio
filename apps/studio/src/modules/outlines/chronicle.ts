import type { OutlineTimelineModel } from '@story-studio/outline-timeline-canvas'
import type { CharacterChange, EntityRecord, TimelineBeat, WorkspaceOutline } from '@story-studio/types'

export interface ChronicleModelInput {
  outline: WorkspaceOutline
  characters: EntityRecord[]
  getCharacterTitle: (record: EntityRecord) => string
}

export interface ChroniclePlotLineLane {
  id: string
  title: string
  color: string
  beats: TimelineBeat[]
}

export interface ChronicleCharacterLane {
  id: string
  title: string
  changesByBeatId: Record<string, CharacterChange[]>
}

export interface ChronicleModel {
  columns: TimelineBeat[]
  plotLineLanes: ChroniclePlotLineLane[]
  characterLanes: ChronicleCharacterLane[]
}

export interface ChronicleMobileCard {
  beat: TimelineBeat
  plotLines: Array<{
    id: string
    title: string
    color: string
  }>
  eventCount: number
  characterChangeCount: number
}

export function createChronicleModel(input: ChronicleModelInput): ChronicleModel {
  const columns = [...input.outline.beats].sort((left, right) => left.order - right.order)
  const plotLineLanes = [...input.outline.plotLines]
    .sort((left, right) => left.order - right.order)
    .map(plotLine => ({
      id: plotLine.id,
      title: plotLine.title,
      color: plotLine.color,
      beats: columns.filter(beat => beat.plotLineIds.includes(plotLine.id)),
    }))
  const characterLanes = input.characters
    .map(character => ({
      id: character.id,
      title: input.getCharacterTitle(character),
      changesByBeatId: Object.fromEntries(columns
        .map(beat => [
          beat.id,
          beat.characterChanges.filter(change => change.characterId === character.id),
        ])
        .filter(([, changes]) => changes.length > 0)) as Record<string, CharacterChange[]>,
    }))
    .filter(lane => Object.keys(lane.changesByBeatId).length > 0)

  return {
    columns,
    plotLineLanes,
    characterLanes,
  }
}

export function createChronicleMobileCards(model: ChronicleModel): ChronicleMobileCard[] {
  return model.columns.map(beat => ({
    beat,
    plotLines: model.plotLineLanes
      .filter(lane => lane.beats.some(laneBeat => laneBeat.id === beat.id))
      .map(lane => ({
        id: lane.id,
        title: lane.title,
        color: lane.color,
      })),
    eventCount: beat.events.length,
    characterChangeCount: model.characterLanes.reduce((count, lane) => count + (lane.changesByBeatId[beat.id]?.length ?? 0), 0),
  }))
}

export function createChronicleCanvasModel(model: ChronicleModel): OutlineTimelineModel {
  return {
    columns: model.columns.map(beat => ({
      eventCount: beat.events.length,
      id: beat.id,
      summary: beat.summary,
      timeLabel: beat.timeLabel,
      title: beat.title,
    })),
    lanes: [
      ...model.plotLineLanes.map(lane => ({
        color: lane.color,
        id: lane.id,
        items: lane.beats.map(beat => ({
          beatId: beat.id,
          color: lane.color,
          summary: beat.summary,
          title: beat.title,
        })),
        kind: 'plot' as const,
        title: lane.title,
      })),
      ...(model.characterLanes.length
        ? model.characterLanes.map(lane => ({
            color: '#64748b',
            id: lane.id,
            items: model.columns.flatMap((beat) => {
              const changes = lane.changesByBeatId[beat.id] ?? []

              if (!changes.length)
                return []

              return [{
                beatId: beat.id,
                color: '#64748b',
                summary: changes.map(change => change.summary).filter(Boolean).join(' / '),
                title: '人物变化',
              }]
            }),
            kind: 'character' as const,
            title: lane.title,
          }))
        : [{
            color: '#94a3b8',
            id: 'character-section-empty',
            items: [],
            kind: 'section' as const,
            title: '人物发展',
          }]),
    ],
  }
}
