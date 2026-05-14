import { SceneElement } from '../types'
import { getBoundingBox } from './geometry'

function distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2
  if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2
  t = Math.max(0, Math.min(1, t))
  const projX = x1 + t * (x2 - x1)
  const projY = y1 + t * (y2 - y1)
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2)
}

export function hitTest(elements: SceneElement[], x: number, y: number, threshold = 5): SceneElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i]
    const { minX, minY, maxX, maxY } = getBoundingBox(el)

    if (el.type === 'rectangle' || el.type === 'ellipse' || el.type === 'text') {
      // For solid shapes or text, check if point is in bounding box
      if (x >= minX - threshold && x <= maxX + threshold && y >= minY - threshold && y <= maxY + threshold) {
        return el
      }
    } else if (el.type === 'line') {
      // For lines, check distance to the line segment
      const [start, end] = el.points
      if (start && end) {
        const dist = distanceToLineSegment(x, y, start[0], start[1], end[0], end[1])
        if (dist <= threshold) return el
      }
    } else if (el.type === 'pen') {
      // For pen, check distance to any segment in the stroke
      let hit = false
      for (let j = 0; j < el.points.length - 1; j++) {
        const p1 = el.points[j]
        const p2 = el.points[j + 1]
        const dist = distanceToLineSegment(x, y, p1[0], p1[1], p2[0], p2[1])
        if (dist <= threshold) {
          hit = true
          break
        }
      }
      if (hit) return el
    }
  }
  return null
}
