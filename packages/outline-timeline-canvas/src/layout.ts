import type {
  OutlineTimelineDensity,
  OutlineTimelineLayout,
  OutlineTimelineModel,
  OutlineTimelineNode,
  OutlineTimelinePoint,
} from './types'

interface DensitySettings {
  cardHeight: number
  columnWidth: number
  gap: number
  laneHeight: number
  laneHeaderWidth: number
  padding: number
  topHeaderHeight: number
}

const DENSITY_SETTINGS: Record<OutlineTimelineDensity, DensitySettings> = {
  compact: {
    cardHeight: 58,
    columnWidth: 176,
    gap: 10,
    laneHeight: 92,
    laneHeaderWidth: 156,
    padding: 20,
    topHeaderHeight: 78,
  },
  standard: {
    cardHeight: 72,
    columnWidth: 220,
    gap: 12,
    laneHeight: 116,
    laneHeaderWidth: 184,
    padding: 24,
    topHeaderHeight: 90,
  },
  expanded: {
    cardHeight: 96,
    columnWidth: 280,
    gap: 14,
    laneHeight: 148,
    laneHeaderWidth: 216,
    padding: 28,
    topHeaderHeight: 108,
  },
}

const EMPTY_SECTION_COLOR = '#94a3b8'

export function createOutlineTimelineLayout(
  model: OutlineTimelineModel,
  density: OutlineTimelineDensity,
): OutlineTimelineLayout {
  const settings = DENSITY_SETTINGS[density]
  const columnCount = Math.max(model.columns.length, 1)
  const laneCount = Math.max(model.lanes.length, 1)
  const width = settings.padding * 2 + settings.laneHeaderWidth + columnCount * settings.columnWidth
  const height = settings.padding * 2 + settings.topHeaderHeight + laneCount * settings.laneHeight
  const nodes: OutlineTimelineNode[] = []

  model.columns.forEach((column, columnIndex) => {
    const x = settings.padding + settings.laneHeaderWidth + columnIndex * settings.columnWidth

    nodes.push({
      id: `column-${column.id}`,
      beatId: column.id,
      color: '#0f172a',
      height: settings.topHeaderHeight - settings.gap,
      summary: column.timeLabel || column.summary,
      title: column.title,
      type: 'column-header',
      width: settings.columnWidth - settings.gap,
      x,
      y: settings.padding,
    })
  })

  model.lanes.forEach((lane, laneIndex) => {
    const y = settings.padding + settings.topHeaderHeight + laneIndex * settings.laneHeight

    nodes.push({
      id: `lane-${lane.id}`,
      color: lane.color,
      height: settings.laneHeight - settings.gap,
      laneId: lane.id,
      summary: lane.kind === 'plot' ? '线路' : lane.kind === 'character' ? '人物' : '',
      title: lane.title,
      type: 'lane-header',
      width: settings.laneHeaderWidth - settings.gap,
      x: settings.padding,
      y,
    })

    if (lane.kind === 'section' && lane.items.length === 0) {
      nodes.push({
        id: `section-${lane.id}`,
        color: EMPTY_SECTION_COLOR,
        height: settings.cardHeight,
        laneId: lane.id,
        summary: '',
        title: lane.title,
        type: 'empty-section',
        width: settings.columnWidth * columnCount - settings.gap,
        x: settings.padding + settings.laneHeaderWidth,
        y: y + (settings.laneHeight - settings.cardHeight) / 2,
      })
      return
    }

    lane.items.forEach((item) => {
      const columnIndex = model.columns.findIndex(column => column.id === item.beatId)

      if (columnIndex < 0)
        return

      nodes.push({
        id: `${lane.id}-${item.beatId}`,
        beatId: item.beatId,
        color: item.color,
        height: settings.cardHeight,
        laneId: lane.id,
        summary: item.summary,
        title: item.title,
        type: 'beat-card',
        width: settings.columnWidth - settings.gap,
        x: settings.padding + settings.laneHeaderWidth + columnIndex * settings.columnWidth,
        y: y + (settings.laneHeight - settings.cardHeight) / 2,
      })
    })
  })

  return {
    density,
    height,
    nodes,
    width,
  }
}

export function hitTestOutlineTimelineNode(
  layout: OutlineTimelineLayout,
  point: OutlineTimelinePoint,
): OutlineTimelineNode | undefined {
  return [...layout.nodes]
    .reverse()
    .find(node =>
      node.beatId
      && point.x >= node.x
      && point.x <= node.x + node.width
      && point.y >= node.y
      && point.y <= node.y + node.height,
    )
}
