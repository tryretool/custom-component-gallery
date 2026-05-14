import rough from 'roughjs/bin/rough'
import { getStroke } from 'perfect-freehand'
import { Scene } from '../types'
import { GRID_SIZE } from '../constants'
import { getBoundingBox } from './geometry'

function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )
  d.push('Z')
  return d.join(' ')
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  width: number,
  height: number,
  backgroundColor: string,
  showGrid: boolean = true,
  selectedElementId: string | null = null
) {
  ctx.save()
  // Clear the canvas
  ctx.clearRect(0, 0, width, height)

  // Draw background (always covers screen)
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)

  // Apply Camera Transform
  ctx.translate(scene.viewportX, scene.viewportY)
  ctx.scale(scene.zoom, scene.zoom)

  // Draw grid
  if (showGrid) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1 / scene.zoom // keep grid line crisp regardless of zoom
    ctx.beginPath()

    // Calculate visible world bounds to draw grid efficiently
    const startX = -scene.viewportX / scene.zoom
    const startY = -scene.viewportY / scene.zoom
    const endX = startX + width / scene.zoom
    const endY = startY + height / scene.zoom
    
    // Snap grid start to grid size
    const gridStartX = Math.floor(startX / GRID_SIZE) * GRID_SIZE
    const gridStartY = Math.floor(startY / GRID_SIZE) * GRID_SIZE

    for (let x = gridStartX; x <= endX; x += GRID_SIZE) {
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
    }

    for (let y = gridStartY; y <= endY; y += GRID_SIZE) {
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
    }

    ctx.stroke()
  }

  // Draw elements
  const rc = rough.canvas(ctx.canvas)

  for (const element of scene.elements) {
    ctx.save()
    ctx.globalAlpha = element.opacity ?? 1

    const roughOptions: any = {
      stroke: element.strokeColor,
      strokeWidth: element.strokeWidth,
      fill: element.fillColor !== 'transparent' ? element.fillColor : undefined,
      fillStyle: 'hachure',
      seed: element.seed || 1
    }

    if (element.type === 'pen') {
      const strokePoints = getStroke(element.points as any, {
        size: element.strokeWidth * 3,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      })
      const pathData = getSvgPathFromStroke(strokePoints as number[][])
      const path = new Path2D(pathData)
      ctx.fillStyle = element.strokeColor
      ctx.fill(path)
    } else if (element.type === 'rectangle') {
      rc.rectangle(element.x, element.y, element.width, element.height, roughOptions)
    } else if (element.type === 'ellipse') {
      rc.ellipse(
        element.x + element.width / 2,
        element.y + element.height / 2,
        element.width,
        element.height,
        roughOptions
      )
    } else if (element.type === 'line') {
      const [start, end] = element.points
      if (start && end) {
        rc.line(start[0], start[1], end[0], end[1], roughOptions)
      }
    } else if (element.type === 'text') {
      ctx.fillStyle = element.strokeColor
      ctx.font = `${element.fontSize}px ${element.fontFamily || "'Caveat', cursive"}`
      ctx.fillText(element.text, element.x, element.y + element.fontSize)
    }

    ctx.restore()
  }

  // Draw selection highlight
  if (selectedElementId) {
    const selectedEl = scene.elements.find(e => e.id === selectedElementId)
    if (selectedEl) {
      const { minX, minY, maxX, maxY } = getBoundingBox(selectedEl)
      ctx.save()
      ctx.strokeStyle = '#6BBAFF'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 5])
      ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10)
      
      // Draw tiny corner handles
      ctx.fillStyle = '#6BBAFF'
      ctx.setLineDash([])
      const handleSize = 6
      ctx.fillRect(minX - 5 - handleSize / 2, minY - 5 - handleSize / 2, handleSize, handleSize)
      ctx.fillRect(maxX + 5 - handleSize / 2, minY - 5 - handleSize / 2, handleSize, handleSize)
      ctx.fillRect(minX - 5 - handleSize / 2, maxY + 5 - handleSize / 2, handleSize, handleSize)
      ctx.fillRect(maxX + 5 - handleSize / 2, maxY + 5 - handleSize / 2, handleSize, handleSize)
      ctx.restore()
    }
  }
  
  // Restore top-level camera transform
  ctx.restore()
}
