import type { Object3D } from 'three/src/core/Object3D.js'
import type { Material } from 'three/src/materials/Material.js'
import type {
  CreateOutlineTimelineRendererOptions,
  OutlineTimelineDensity,
  OutlineTimelineLayout,
  OutlineTimelineModel,
  OutlineTimelineNode,
  OutlineTimelineRenderer,
} from './types'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera.js'
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js'
import { BufferGeometry } from 'three/src/core/BufferGeometry.js'
import { Raycaster } from 'three/src/core/Raycaster.js'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry.js'
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js'
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial.js'
import { SpriteMaterial } from 'three/src/materials/SpriteMaterial.js'
import { Color } from 'three/src/math/Color.js'
import { Vector2 } from 'three/src/math/Vector2.js'
import { Vector3 } from 'three/src/math/Vector3.js'
import { Group } from 'three/src/objects/Group.js'
import { LineSegments } from 'three/src/objects/LineSegments.js'
import { Mesh } from 'three/src/objects/Mesh.js'
import { Sprite } from 'three/src/objects/Sprite.js'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js'
import { Scene } from 'three/src/scenes/Scene.js'
import { CanvasTexture } from 'three/src/textures/CanvasTexture.js'
import { createOutlineTimelineLayout, hitTestOutlineTimelineNode } from './layout'

const CAMERA_DISTANCE = 1000
const CLICK_DRAG_TOLERANCE = 4
const MAX_ZOOM = 2.4
const MIN_ZOOM = 0.28

export function createOutlineTimelineRenderer(
  container: HTMLElement,
  options: CreateOutlineTimelineRendererOptions,
): OutlineTimelineRenderer {
  return new ThreeOutlineTimelineRenderer(container, options)
}

export function createOutlineTimelineDisposeRegistry(): {
  add: (cleanup: () => void) => void
  dispose: () => void
} {
  const cleanups = new Set<() => void>()
  let disposed = false

  return {
    add(cleanup) {
      if (disposed) {
        cleanup()
        return
      }

      cleanups.add(cleanup)
    },
    dispose() {
      if (disposed)
        return

      disposed = true
      cleanups.forEach(cleanup => cleanup())
      cleanups.clear()
    },
  }
}

class ThreeOutlineTimelineRenderer implements OutlineTimelineRenderer {
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 3000)
  private readonly nodeGroup = new Group()
  private readonly pointer = new Vector2()
  private readonly raycaster = new Raycaster()
  private readonly renderer = new WebGLRenderer({ alpha: true, antialias: true })
  private readonly resizeObserver = new ResizeObserver(() => this.resize())
  private readonly scene = new Scene()

  private density: OutlineTimelineDensity
  private disposed = false
  private layout: OutlineTimelineLayout
  private model: OutlineTimelineModel
  private panning = false
  private pointerDown = new Vector2()
  private previousPanPointer = new Vector2()
  private selectedBeatId?: string

  constructor(
    private readonly container: HTMLElement,
    private readonly options: CreateOutlineTimelineRendererOptions,
  ) {
    this.model = options.model
    this.density = options.density ?? 'standard'
    this.selectedBeatId = options.selectedBeatId
    this.layout = createOutlineTimelineLayout(this.model, this.density)

    this.setupRenderer()
    this.setupScene()
    this.bindEvents()
    this.resizeObserver.observe(container)
    this.resize()
    this.resetView()
  }

  setModel(model: OutlineTimelineModel): void {
    this.model = model
    this.layout = createOutlineTimelineLayout(model, this.density)
    this.renderLayout()
    this.resetView()
  }

  setSelectedBeatId(beatId: string | undefined): void {
    this.selectedBeatId = beatId
    this.renderLayout()
  }

  setDensity(density: OutlineTimelineDensity): void {
    this.density = density
    this.layout = createOutlineTimelineLayout(this.model, density)
    this.renderLayout()
    this.resetView()
  }

  resetView(): void {
    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)
    const zoom = Math.min(
      width / Math.max(this.layout.width + 80, 1),
      height / Math.max(this.layout.height + 80, 1),
      1,
    )

    this.camera.position.set(0, 0, CAMERA_DISTANCE)
    this.camera.zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM)
    this.camera.updateProjectionMatrix()
    this.render()
  }

  resize(): void {
    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)

    this.camera.left = -width / 2
    this.camera.right = width / 2
    this.camera.top = height / 2
    this.camera.bottom = -height / 2
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.renderLayout()
  }

  dispose(): void {
    if (this.disposed)
      return

    this.disposed = true
    this.resizeObserver.disconnect()
    this.unbindEvents()
    this.clearNodes()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private setupRenderer(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.height = '100%'
    this.renderer.domElement.style.touchAction = 'none'
    this.renderer.domElement.style.width = '100%'
    this.container.append(this.renderer.domElement)
  }

  private setupScene(): void {
    this.scene.background = new Color('#f8fafc')
    this.scene.add(this.nodeGroup)
    this.renderLayout()
  }

  private bindEvents(): void {
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown)
    this.renderer.domElement.addEventListener('pointermove', this.handlePointerMove)
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp)
    this.renderer.domElement.addEventListener('pointercancel', this.handlePointerUp)
    this.renderer.domElement.addEventListener('wheel', this.handleWheel, { passive: false })
  }

  private unbindEvents(): void {
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown)
    this.renderer.domElement.removeEventListener('pointermove', this.handlePointerMove)
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp)
    this.renderer.domElement.removeEventListener('pointercancel', this.handlePointerUp)
    this.renderer.domElement.removeEventListener('wheel', this.handleWheel)
  }

  private renderLayout(): void {
    this.clearNodes()
    this.addGrid()
    this.layout.nodes.forEach(node => this.addNode(node))
    this.render()
  }

  private addGrid(): void {
    const positions: number[] = []
    const left = -this.layout.width / 2
    const right = this.layout.width / 2
    const top = this.layout.height / 2
    const bottom = -this.layout.height / 2

    this.layout.nodes
      .filter(node => node.type === 'column-header')
      .forEach((node) => {
        const x = left + node.x

        positions.push(x, 4, bottom, x, 4, top)
      })

    this.layout.nodes
      .filter(node => node.type === 'lane-header')
      .forEach((node) => {
        const y = top - node.y

        positions.push(left, y, 4, right, y, 4)
      })

    if (!positions.length)
      return

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    const grid = new LineSegments(geometry, new LineBasicMaterial({
      color: '#cbd5e1',
      opacity: 0.7,
      transparent: true,
    }))

    this.nodeGroup.add(grid)
  }

  private addNode(node: OutlineTimelineNode): void {
    const selected = !!node.beatId && node.beatId === this.selectedBeatId
    const mesh = new Mesh(
      new PlaneGeometry(node.width, node.height),
      new MeshBasicMaterial({
        color: getNodeFillColor(node, selected),
      }),
    )
    const position = getNodeWorldPosition(this.layout, node, selected ? 18 : 10)

    mesh.position.set(position.x, position.y, position.z)
    this.nodeGroup.add(mesh)

    if (node.type !== 'empty-section') {
      const accent = new Mesh(
        new PlaneGeometry(4, Math.max(node.height - 16, 8)),
        new MeshBasicMaterial({ color: node.color }),
      )

      accent.position.set(position.x - node.width / 2 + 8, position.y, position.z + 1)
      this.nodeGroup.add(accent)
    }

    const text = this.createTextSprite(node, selected)
    text.position.set(position.x, position.y, position.z + 2)
    text.scale.set(node.width, node.height, 1)
    this.nodeGroup.add(text)
  }

  private createTextSprite(node: OutlineTimelineNode, selected: boolean): Sprite {
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = Math.max(Math.round(node.width * scale), 1)
    canvas.height = Math.max(Math.round(node.height * scale), 1)
    const context = canvas.getContext('2d')!

    context.scale(scale, scale)
    context.fillStyle = selected ? '#0f172a' : '#111827'
    context.font = '600 13px sans-serif'
    context.textBaseline = 'top'
    drawTextLine(context, node.title, 18, 14, node.width - 28)

    if (node.summary) {
      context.fillStyle = '#64748b'
      context.font = '12px sans-serif'
      drawTextLine(context, node.summary, 18, 34, node.width - 28)
    }

    const texture = new CanvasTexture(canvas)
    const sprite = new Sprite(new SpriteMaterial({
      map: texture,
      transparent: true,
    }))

    return sprite
  }

  private clearNodes(): void {
    this.nodeGroup.children.forEach(disposeObject)
    this.nodeGroup.clear()
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.panning = true
    this.pointerDown.set(event.clientX, event.clientY)
    this.previousPanPointer.set(event.clientX, event.clientY)
    this.renderer.domElement.setPointerCapture(event.pointerId)
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.panning)
      return

    const deltaX = event.clientX - this.previousPanPointer.x
    const deltaY = event.clientY - this.previousPanPointer.y

    this.previousPanPointer.set(event.clientX, event.clientY)
    this.camera.position.x -= deltaX / this.camera.zoom
    this.camera.position.y += deltaY / this.camera.zoom
    this.render()
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.renderer.domElement.hasPointerCapture(event.pointerId))
      this.renderer.domElement.releasePointerCapture(event.pointerId)

    const distance = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y)
    this.panning = false

    if (distance > CLICK_DRAG_TOLERANCE)
      return

    const point = this.getLayoutPointFromPointer(event)
    const node = hitTestOutlineTimelineNode(this.layout, point)

    if (node?.beatId)
      this.options.onSelectBeat?.(node.beatId)
  }

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault()
    const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08

    this.camera.zoom = clamp(this.camera.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM)
    this.camera.updateProjectionMatrix()
    this.render()
  }

  private getLayoutPointFromPointer(event: PointerEvent): { x: number, y: number } {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const worldPoint = new Vector3()

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    worldPoint.copy(this.raycaster.ray.origin)

    return {
      x: worldPoint.x + this.layout.width / 2,
      y: this.layout.height / 2 - worldPoint.y,
    }
  }

  private readonly render = (): void => {
    if (this.disposed)
      return

    this.renderer.render(this.scene, this.camera)
  }
}

function getNodeWorldPosition(layout: OutlineTimelineLayout, node: OutlineTimelineNode, z: number): { x: number, y: number, z: number } {
  return {
    x: node.x + node.width / 2 - layout.width / 2,
    y: layout.height / 2 - node.y - node.height / 2,
    z,
  }
}

function getNodeFillColor(node: OutlineTimelineNode, selected: boolean): string {
  if (selected)
    return '#dbeafe'

  if (node.type === 'column-header')
    return '#ffffff'

  if (node.type === 'lane-header')
    return '#f8fafc'

  if (node.type === 'empty-section')
    return '#f1f5f9'

  return '#ffffff'
}

function drawTextLine(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
): void {
  let value = text

  while (value && context.measureText(value).width > maxWidth)
    value = value.slice(0, -1)

  context.fillText(value.length < text.length ? `${value.slice(0, -1)}...` : value, x, y)
}

function disposeObject(object: Object3D): void {
  if (object instanceof Sprite) {
    object.material.map?.dispose()
    object.material.dispose()
    return
  }

  if (!(object instanceof Mesh) && !(object instanceof LineSegments))
    return

  object.geometry.dispose()

  if (Array.isArray(object.material))
    object.material.forEach((material: Material) => material.dispose())
  else
    object.material.dispose()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
