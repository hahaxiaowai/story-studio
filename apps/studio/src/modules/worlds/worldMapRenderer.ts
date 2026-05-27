import type { FantasyMapStrokeDraft } from '@story-studio/fantasy-map'
import type { WorldMapPoint } from '@story-studio/types'

export type AddWorldMapStroke = (input: { color: string, width: number, points: WorldMapPoint[] }) => void

export function createWorldMapStrokeHandler(addMapStroke: AddWorldMapStroke): (stroke: FantasyMapStrokeDraft) => void {
  return stroke => addMapStroke({
    color: stroke.color,
    points: stroke.points,
    width: stroke.width,
  })
}
