import { Color, GridData } from './types'
import { getPixel, setPixel, colorsMatch } from './grid'

export function applyDraw(grid: GridData, x: number, y: number, color: Color): void {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return
  setPixel(grid, x, y, color)
}

export function applyErase(grid: GridData, x: number, y: number): void {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return
  setPixel(grid, x, y, { r: 0, g: 0, b: 0, a: 0 })
}

export function applyFill(grid: GridData, x: number, y: number, color: Color): void {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return

  const target = getPixel(grid, x, y)
  if (colorsMatch(target, color)) return

  const queue: [number, number][] = [[x, y]]
  const visited = new Uint8Array(grid.width * grid.height)

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!
    const vi = cy * grid.width + cx

    if (cx < 0 || cx >= grid.width || cy < 0 || cy >= grid.height) continue
    if (visited[vi]) continue
    visited[vi] = 1

    const current = getPixel(grid, cx, cy)
    if (!colorsMatch(current, target)) continue

    setPixel(grid, cx, cy, color)

    queue.push([cx + 1, cy])
    queue.push([cx - 1, cy])
    queue.push([cx, cy + 1])
    queue.push([cx, cy - 1])
  }
}

// Bresenham line interpolation for smooth drag drawing
export function getLinePoints(
  x0: number, y0: number,
  x1: number, y1: number
): [number, number][] {
  const points: [number, number][] = []
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let cx = x0
  let cy = y0

  while (true) {
    points.push([cx, cy])
    if (cx === x1 && cy === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      cx += sx
    }
    if (e2 < dx) {
      err += dx
      cy += sy
    }
  }

  return points
}
