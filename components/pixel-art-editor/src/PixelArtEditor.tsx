import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import { Tool, Color } from './engine/types'
import { GRID_SIZE, DISPLAY_SIZE, PALETTE } from './engine/constants'
import { createGrid } from './engine/grid'
import { renderGrid } from './engine/renderer'
import { applyDraw, applyErase, applyFill, getLinePoints } from './engine/tools'
import { exportAsPng, gridToDataUrl, downloadBlob } from './engine/export'
import styles from './PixelArtEditor.module.css'

function hexToColor(hex: string): Color {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 }
}

export const PixelArtEditor: FC = () => {
  Retool.useComponentSettings({ defaultWidth: 30, defaultHeight: 40 })

  const [disabled] = Retool.useStateBoolean({
    name: 'disabled',
    initialValue: false,
    label: 'Disabled',
    inspector: 'checkbox'
  })
  const [, setImageDataUrl] = Retool.useStateString({
    name: 'imageDataUrl',
    initialValue: '',
    inspector: 'hidden'
  })
  const [, setCurrentTool] = Retool.useStateString({
    name: 'currentTool',
    initialValue: 'draw',
    inspector: 'hidden'
  })
  const [, setCurrentColor] = Retool.useStateString({
    name: 'currentColor',
    initialValue: '#000000',
    inspector: 'hidden'
  })
  const [, setIsEmpty] = Retool.useStateBoolean({
    name: 'isEmpty',
    initialValue: true,
    inspector: 'hidden'
  })
  const onChange = Retool.useEventCallback({ name: 'change' })
  const onExport = Retool.useEventCallback({ name: 'export' })

  const [tool, setTool] = useState<Tool>('draw')
  const [colorHex, setColorHex] = useState('#000000')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef(createGrid(GRID_SIZE, GRID_SIZE))
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const cursorRef = useRef<{ x: number; y: number } | null>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cursor = cursorRef.current
    renderGrid(ctx, DISPLAY_SIZE, DISPLAY_SIZE, gridRef.current, {
      showGrid: true,
      cursorX: cursor?.x ?? null,
      cursorY: cursor?.y ?? null,
      currentColor: hexToColor(colorHex),
      currentTool: tool
    })
  }, [colorHex, tool])

  useEffect(() => {
    redraw()
  }, [redraw])

  useEffect(() => {
    setCurrentTool(tool)
  }, [tool, setCurrentTool])

  useEffect(() => {
    setCurrentColor(colorHex)
  }, [colorHex, setCurrentColor])

  const emitGridState = useCallback(() => {
    const grid = gridRef.current
    let empty = true
    for (let i = 3; i < grid.pixels.length; i += 4) {
      if (grid.pixels[i] !== 0) {
        empty = false
        break
      }
    }
    setIsEmpty(empty)
    setImageDataUrl(empty ? '' : gridToDataUrl(grid))
    onChange()
  }, [setIsEmpty, setImageDataUrl, onChange])

  const canvasToGrid = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = Math.floor(((e.clientX - rect.left) * scaleX) / (canvas.width / GRID_SIZE))
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / (canvas.height / GRID_SIZE))
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null
      return { x, y }
    },
    []
  )

  const applyToolAt = useCallback(
    (x: number, y: number) => {
      const grid = gridRef.current
      const color = hexToColor(colorHex)
      if (tool === 'draw') applyDraw(grid, x, y, color)
      else if (tool === 'erase') applyErase(grid, x, y)
      else if (tool === 'fill') applyFill(grid, x, y, color)
    },
    [tool, colorHex]
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (disabled) return
      const pos = canvasToGrid(e)
      if (!pos) return

      if (tool === 'fill') {
        applyToolAt(pos.x, pos.y)
        redraw()
        emitGridState()
        return
      }

      isDrawingRef.current = true
      lastPosRef.current = pos
      applyToolAt(pos.x, pos.y)
      redraw()
    },
    [canvasToGrid, applyToolAt, tool, redraw, emitGridState, disabled]
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (disabled) return
      const pos = canvasToGrid(e)
      cursorRef.current = pos

      if (isDrawingRef.current && pos && (tool === 'draw' || tool === 'erase')) {
        const last = lastPosRef.current
        if (last) {
          const points = getLinePoints(last.x, last.y, pos.x, pos.y)
          for (const [px, py] of points) {
            applyToolAt(px, py)
          }
        } else {
          applyToolAt(pos.x, pos.y)
        }
        lastPosRef.current = pos
      }

      redraw()
    },
    [canvasToGrid, applyToolAt, tool, redraw, disabled]
  )

  const onMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    lastPosRef.current = null
    emitGridState()
  }, [emitGridState])

  const onMouseLeave = useCallback(() => {
    const wasDrawing = isDrawingRef.current
    isDrawingRef.current = false
    lastPosRef.current = null
    cursorRef.current = null
    redraw()
    if (wasDrawing) emitGridState()
  }, [redraw, emitGridState])

  const handleClear = useCallback(() => {
    if (disabled) return
    gridRef.current = createGrid(GRID_SIZE, GRID_SIZE)
    redraw()
    emitGridState()
  }, [redraw, emitGridState, disabled])

  const handleExport = useCallback(async () => {
    const blob = await exportAsPng(gridRef.current)
    downloadBlob(blob, 'pixel-art.png')
    onExport()
  }, [onExport])

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          {(['draw', 'erase', 'fill'] as Tool[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.toolButton} ${tool === t ? styles.toolButtonActive : ''}`}
              onClick={() => setTool(t)}
              disabled={disabled}
            >
              {t === 'draw' ? 'Pencil' : t === 'erase' ? 'Eraser' : 'Fill'}
            </button>
          ))}
        </div>

        <div className={styles.separator} />

        <div className={styles.palette}>
          {PALETTE.map((hex) => (
            <button
              key={hex}
              type="button"
              className={`${styles.swatch} ${colorHex === hex ? styles.swatchActive : ''}`}
              style={{ background: hex }}
              onClick={() => setColorHex(hex)}
              title={hex}
              disabled={disabled}
            />
          ))}
          <input
            type="color"
            className={styles.colorPicker}
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            title="Custom color"
            disabled={disabled}
          />
        </div>

        <div className={styles.separator} />

        <button
          type="button"
          className={styles.actionButton}
          onClick={handleClear}
          disabled={disabled}
        >
          Clear
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.exportButton}`}
          onClick={handleExport}
        >
          Export PNG
        </button>
      </div>

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={DISPLAY_SIZE}
          height={DISPLAY_SIZE}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />
      </div>
    </div>
  )
}
