import { GridData, RenderOptions } from './types'

const CHECKER_LIGHT = '#e8e8e8'
const CHECKER_DARK = '#d0d0d0'
const GRID_LINE_COLOR = 'rgba(0, 0, 0, 0.08)'

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  grid: GridData,
  options: RenderOptions
): void {
  const cellW = canvasWidth / grid.width
  const cellH = canvasHeight / grid.height

  // Draw checkerboard background (shows transparency)
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH)
    }
  }

  // Draw filled pixels
  const pixels = grid.pixels
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const i = (y * grid.width + x) * 4
      const a = pixels[i + 3]
      if (a === 0) continue

      ctx.fillStyle = `rgba(${pixels[i]}, ${pixels[i + 1]}, ${pixels[i + 2]}, ${a / 255})`
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH)
    }
  }

  // Draw grid lines
  if (options.showGrid) {
    ctx.strokeStyle = GRID_LINE_COLOR
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x <= grid.width; x++) {
      const px = Math.round(x * cellW) + 0.5
      ctx.moveTo(px, 0)
      ctx.lineTo(px, canvasHeight)
    }
    for (let y = 0; y <= grid.height; y++) {
      const py = Math.round(y * cellH) + 0.5
      ctx.moveTo(0, py)
      ctx.lineTo(canvasWidth, py)
    }
    ctx.stroke()
  }

  // Draw cursor highlight
  if (options.cursorX !== null && options.cursorY !== null) {
    const cx = options.cursorX
    const cy = options.cursorY
    if (cx >= 0 && cx < grid.width && cy >= 0 && cy < grid.height) {
      if (options.currentTool === 'erase') {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'
        ctx.lineWidth = 2
        ctx.strokeRect(cx * cellW + 1, cy * cellH + 1, cellW - 2, cellH - 2)
      } else {
        const c = options.currentColor
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.4)`
        ctx.fillRect(cx * cellW, cy * cellH, cellW, cellH)
      }
    }
  }
}
