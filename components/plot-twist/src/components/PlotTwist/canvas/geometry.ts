import { SceneElement } from '../types'

export function getBoundingBox(el: SceneElement): { minX: number, minY: number, maxX: number, maxY: number } {
  if (el.type === 'rectangle' || el.type === 'ellipse') {
    const minX = Math.min(el.x, el.x + el.width)
    const maxX = Math.max(el.x, el.x + el.width)
    const minY = Math.min(el.y, el.y + el.height)
    const maxY = Math.max(el.y, el.y + el.height)
    return { minX, minY, maxX, maxY }
  } else if (el.type === 'line') {
    const [p1, p2] = el.points
    if (!p1 || !p2) return { minX: el.x, minY: el.y, maxX: el.x, maxY: el.y }
    return {
      minX: Math.min(p1[0], p2[0]),
      minY: Math.min(p1[1], p2[1]),
      maxX: Math.max(p1[0], p2[0]),
      maxY: Math.max(p1[1], p2[1])
    }
  } else if (el.type === 'pen') {
    if (el.points.length === 0) return { minX: el.x, minY: el.y, maxX: el.x, maxY: el.y }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of el.points) {
      if (p[0] < minX) minX = p[0]
      if (p[0] > maxX) maxX = p[0]
      if (p[1] < minY) minY = p[1]
      if (p[1] > maxY) maxY = p[1]
    }
    return { minX, minY, maxX, maxY }
  } else if (el.type === 'text') {
    const approxWidth = el.text.length * (el.fontSize * 0.6)
    return {
      minX: el.x,
      minY: el.y,
      maxX: el.x + approxWidth,
      maxY: el.y + el.fontSize
    }
  }
  return { minX: el.x, minY: el.y, maxX: el.x, maxY: el.y }
}
