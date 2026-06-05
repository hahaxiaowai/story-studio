import type { TimelineBeat, WorkspaceOutline } from '@story-studio/types'

export interface InputModeBeatCard {
  beat: TimelineBeat
  plotLines: Array<{
    id: string
    title: string
    color: string
  }>
  eventCount: number
  characterChangeCount: number
}

export function createInputModeBeatCards(outline: WorkspaceOutline): InputModeBeatCard[] {
  const plotLineById = new Map(outline.plotLines.map(plotLine => [plotLine.id, plotLine]))

  return [...outline.beats]
    .sort((left, right) => left.order - right.order)
    .map(beat => ({
      beat,
      plotLines: beat.plotLineIds
        .map(plotLineId => plotLineById.get(plotLineId))
        .filter(plotLine => plotLine !== undefined)
        .map(plotLine => ({
          id: plotLine.id,
          title: plotLine.title,
          color: plotLine.color,
        })),
      eventCount: beat.events.length,
      characterChangeCount: beat.characterChanges.length,
    }))
}
