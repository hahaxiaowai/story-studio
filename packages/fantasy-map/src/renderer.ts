import type {
  Object3D,
} from 'three/src/core/Object3D.js'
import type {
  Material,
} from 'three/src/materials/Material.js'
import type {
  CreateFantasyMapRendererOptions,
  FantasyMapBrush,
  FantasyMapMode,
  FantasyMapPoint,
  FantasyMapRenderer,
  FantasyMapSize,
  FantasyMapStroke,
} from './types'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera.js'
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js'
import { BufferGeometry } from 'three/src/core/BufferGeometry.js'
import { Raycaster } from 'three/src/core/Raycaster.js'
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js'
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial.js'
import { Color } from 'three/src/math/Color.js'
import { Plane } from 'three/src/math/Plane.js'
import { Vector2 } from 'three/src/math/Vector2.js'
import { Vector3 } from 'three/src/math/Vector3.js'
import { Group } from 'three/src/objects/Group.js'
import { LineSegments } from 'three/src/objects/LineSegments.js'
import { Mesh } from 'three/src/objects/Mesh.js'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js'
import { Scene } from 'three/src/scenes/Scene.js'
import { DEFAULT_MAP_SIZE, mapPointToWorld, worldPointToMap } from './coordinates'
import { createFantasyMapStrokeDraft } from './strokes'

const DEFAULT_BRUSH: FantasyMapBrush = {
  color: '#1d4ed8',
  width: 4,
}

const CAMERA_DISTANCE = 880
const DRAW_POINT_MIN_DISTANCE = 3
const MAX_ZOOM = 3.2
const MIN_ZOOM = 0.65
const TERRAIN_Y = 0
const STROKE_Y = 6

export function createFantasyMapRenderer(
  container: HTMLElement,
  options: CreateFantasyMapRendererOptions,
): FantasyMapRenderer {
  return new ThreeFantasyMapRenderer(container, options)
}

class ThreeFantasyMapRenderer implements FantasyMapRenderer {
  private readonly camera: OrthographicCamera
  private readonly drawPlane = new Plane(new Vector3(0, 1, 0), -TERRAIN_Y)
  private readonly mapSize: FantasyMapSize
  private readonly pointer = new Vector2()
  private readonly raycaster = new Raycaster()
  private readonly renderer: WebGLRenderer
  private readonly resizeObserver: ResizeObserver
  private readonly scene = new Scene()
  private readonly strokeGroup = new Group()
  private readonly viewTarget = new Vector3()

  private brush: FantasyMapBrush
  private disposed = false
  private drawing = false
  private mode: FantasyMapMode
  private panning = false
  private pendingPoints: FantasyMapPoint[] = []
  private previousPanPointer = new Vector2()
  private previewMesh?: Mesh<BufferGeometry, MeshBasicMaterial>

  constructor(
    private readonly container: HTMLElement,
    private readonly options: CreateFantasyMapRendererOptions,
  ) {
    this.mapSize = options.mapSize ?? DEFAULT_MAP_SIZE
    this.brush = options.brush ?? DEFAULT_BRUSH
    this.mode = options.mode ?? 'draw'
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 3000)
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
    this.resizeObserver = new ResizeObserver(() => this.resize())

    this.setupScene()
    this.setupRenderer()
    this.bindEvents()
    this.resizeObserver.observe(container)
    this.resize()
  }

  setStrokes(strokes: FantasyMapStroke[]): void {
    this.clearStrokeMeshes()

    strokes.forEach((stroke) => {
      const mesh = this.createStrokeMesh(stroke.points, stroke)

      if (mesh)
        this.strokeGroup.add(mesh)
    })

    this.render()
  }

  setMode(mode: FantasyMapMode): void {
    this.mode = mode

    if (mode === 'pan')
      this.cancelDrawing()
    else
      this.cancelPanning()

    this.render()
  }

  setBrush(brush: FantasyMapBrush): void {
    this.brush = brush

    if (this.previewMesh) {
      const geometry = this.createStrokeGeometry(this.pendingPoints, brush.width)

      if (!geometry)
        return

      this.previewMesh.material.color = new Color(brush.color)
      this.previewMesh.geometry.dispose()
      this.previewMesh.geometry = geometry
    }

    this.render()
  }

  resetView(): void {
    this.positionCamera()
    this.render()
  }

  resize(): void {
    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)
    const aspect = width / height
    const viewHeight = Math.max(this.mapSize.height, this.mapSize.width / aspect) * 1.08
    const viewWidth = viewHeight * aspect

    this.camera.left = -viewWidth / 2
    this.camera.right = viewWidth / 2
    this.camera.top = viewHeight / 2
    this.camera.bottom = -viewHeight / 2
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.render()
  }

  dispose(): void {
    if (this.disposed)
      return

    this.disposed = true
    this.resizeObserver.disconnect()
    this.unbindEvents()
    this.clearStrokeMeshes()
    this.disposePreviewMesh()
    this.scene.traverse(disposeObject)
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private setupScene(): void {
    this.scene.background = new Color('#f8fafc')

    const terrain = new Mesh(
      this.createTerrainGeometry(),
      new MeshBasicMaterial({
        color: '#e6f0dc',
      }),
    )
    this.scene.add(terrain)

    const grid = new LineSegments(
      this.createGridGeometry(),
      new LineBasicMaterial({
        color: '#94a3b8',
        opacity: 0.36,
        transparent: true,
      }),
    )
    grid.position.y = TERRAIN_Y + 1
    this.scene.add(grid)
    this.scene.add(this.strokeGroup)
    this.positionCamera()
  }

  private setupRenderer(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.height = '100%'
    this.renderer.domElement.style.touchAction = 'none'
    this.renderer.domElement.style.width = '100%'
    this.container.append(this.renderer.domElement)
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

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.mode === 'pan') {
      this.panning = true
      this.previousPanPointer.set(event.clientX, event.clientY)
      this.renderer.domElement.setPointerCapture(event.pointerId)
      return
    }

    if (this.mode !== 'draw')
      return

    const point = this.getMapPointFromPointer(event)

    if (!point)
      return

    this.drawing = true
    this.pendingPoints = [point]
    this.renderer.domElement.setPointerCapture(event.pointerId)
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.panning && this.mode === 'pan') {
      this.panCamera(event)
      return
    }

    if (!this.drawing || this.mode !== 'draw')
      return

    const point = this.getMapPointFromPointer(event)
    const previousPoint = this.pendingPoints.at(-1)

    if (!point || !previousPoint || getPointDistance(previousPoint, point) < DRAW_POINT_MIN_DISTANCE)
      return

    this.pendingPoints = [...this.pendingPoints, point]
    this.updatePreviewMesh()
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.panning) {
      this.cancelPanning()

      if (this.renderer.domElement.hasPointerCapture(event.pointerId))
        this.renderer.domElement.releasePointerCapture(event.pointerId)

      return
    }

    if (!this.drawing)
      return

    if (this.renderer.domElement.hasPointerCapture(event.pointerId))
      this.renderer.domElement.releasePointerCapture(event.pointerId)

    this.drawing = false
    const stroke = createFantasyMapStrokeDraft(this.pendingPoints, this.brush, this.mapSize)
    this.pendingPoints = []
    this.disposePreviewMesh()

    if (stroke)
      this.options.onStrokeComplete(stroke)

    this.render()
  }

  private readonly handleWheel = (event: WheelEvent): void => {
    if (this.mode !== 'pan')
      return

    event.preventDefault()

    const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08
    this.camera.zoom = clamp(this.camera.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM)
    this.camera.updateProjectionMatrix()
    this.render()
  }

  private updatePreviewMesh(): void {
    this.disposePreviewMesh()
    this.previewMesh = this.createStrokeMesh(this.pendingPoints, this.brush)

    if (this.previewMesh)
      this.scene.add(this.previewMesh)

    this.render()
  }

  private cancelDrawing(): void {
    this.drawing = false
    this.pendingPoints = []
    this.disposePreviewMesh()
  }

  private cancelPanning(): void {
    this.panning = false
  }

  private panCamera(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const deltaX = event.clientX - this.previousPanPointer.x
    const deltaY = event.clientY - this.previousPanPointer.y
    const worldWidth = (this.camera.right - this.camera.left) / this.camera.zoom
    const worldHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom
    const movementX = (deltaX / rect.width) * worldWidth
    const movementZ = (deltaY / rect.height) * worldHeight

    this.previousPanPointer.set(event.clientX, event.clientY)
    this.camera.position.x -= movementX
    this.camera.position.z -= movementZ
    this.viewTarget.x -= movementX
    this.viewTarget.z -= movementZ
    this.camera.lookAt(this.viewTarget)
    this.render()
  }

  private getMapPointFromPointer(event: PointerEvent): FantasyMapPoint | undefined {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const worldPoint = new Vector3()

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)

    if (!this.raycaster.ray.intersectPlane(this.drawPlane, worldPoint))
      return undefined

    return worldPointToMap({ x: worldPoint.x, z: worldPoint.z }, this.mapSize)
  }

  private createStrokeMesh(points: FantasyMapPoint[], brush: FantasyMapBrush): Mesh<BufferGeometry, MeshBasicMaterial> | undefined {
    const geometry = this.createStrokeGeometry(points, brush.width)

    if (!geometry)
      return undefined

    return new Mesh(geometry, new MeshBasicMaterial({
      color: brush.color,
    }))
  }

  private createTerrainGeometry(): BufferGeometry {
    const halfWidth = this.mapSize.width / 2
    const halfHeight = this.mapSize.height / 2
    const geometry = new BufferGeometry()

    geometry.setAttribute('position', new Float32BufferAttribute([
      -halfWidth,
      TERRAIN_Y,
      -halfHeight,
      halfWidth,
      TERRAIN_Y,
      -halfHeight,
      halfWidth,
      TERRAIN_Y,
      halfHeight,
      -halfWidth,
      TERRAIN_Y,
      halfHeight,
    ], 3))
    geometry.setIndex([0, 2, 1, 0, 3, 2])

    return geometry
  }

  private createGridGeometry(): BufferGeometry {
    const divisions = 24
    const halfWidth = this.mapSize.width / 2
    const halfHeight = this.mapSize.height / 2
    const positions: number[] = []

    for (let index = 0; index <= divisions; index += 1) {
      const x = -halfWidth + (this.mapSize.width * index) / divisions
      const z = -halfHeight + (this.mapSize.height * index) / divisions

      positions.push(x, 0, -halfHeight, x, 0, halfHeight)
      positions.push(-halfWidth, 0, z, halfWidth, 0, z)
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))

    return geometry
  }

  private createStrokeGeometry(points: FantasyMapPoint[], width: number): BufferGeometry | undefined {
    if (points.length < 2)
      return undefined

    const halfWidth = Math.max(width / 2, 1)
    const worldPoints = points.map((point) => {
      const worldPoint = mapPointToWorld(point, this.mapSize)

      return { x: worldPoint.x, z: worldPoint.z }
    })
    const positions: number[] = []
    const indices: number[] = []

    worldPoints.forEach((point, index) => {
      const previousPoint = worldPoints[Math.max(index - 1, 0)]
      const nextPoint = worldPoints[Math.min(index + 1, worldPoints.length - 1)]
      const directionX = nextPoint.x - previousPoint.x
      const directionZ = nextPoint.z - previousPoint.z
      const length = Math.hypot(directionX, directionZ) || 1
      const normalX = -(directionZ / length) * halfWidth
      const normalZ = (directionX / length) * halfWidth

      positions.push(point.x + normalX, STROKE_Y, point.z + normalZ)
      positions.push(point.x - normalX, STROKE_Y, point.z - normalZ)
    })

    for (let index = 0; index < worldPoints.length - 1; index += 1) {
      const vertex = index * 2

      indices.push(vertex, vertex + 1, vertex + 2)
      indices.push(vertex + 1, vertex + 3, vertex + 2)
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)

    return geometry
  }

  private clearStrokeMeshes(): void {
    this.strokeGroup.children.forEach(disposeObject)
    this.strokeGroup.clear()
  }

  private disposePreviewMesh(): void {
    if (!this.previewMesh)
      return

    this.scene.remove(this.previewMesh)
    disposeObject(this.previewMesh)
    this.previewMesh = undefined
  }

  private positionCamera(): void {
    this.viewTarget.set(0, 0, 0)
    this.camera.zoom = 1
    this.camera.position.set(0, CAMERA_DISTANCE, CAMERA_DISTANCE * 0.42)
    this.camera.lookAt(this.viewTarget)
    this.camera.updateProjectionMatrix()
  }

  private readonly render = (): void => {
    if (this.disposed)
      return

    this.renderer.render(this.scene, this.camera)
  }
}

function disposeObject(object: Object3D): void {
  if (!(object instanceof Mesh) && !(object instanceof LineSegments))
    return

  object.geometry.dispose()

  if (Array.isArray(object.material))
    object.material.forEach((material: Material) => material.dispose())
  else
    object.material.dispose()
}

function getPointDistance(left: FantasyMapPoint, right: FantasyMapPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
