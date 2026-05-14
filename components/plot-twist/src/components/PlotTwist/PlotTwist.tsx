import React, { FC, useEffect, useRef, useState } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import { renderScene } from './canvas/renderer'
import {
  Scene,
  ToolType,
  BaseElement,
  PenElement,
  RectElement,
  EllipseElement,
  LineElement,
  TextElement
} from './types'
import {
  DEFAULT_BG_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_WIDTH
} from './constants'
import { generateId, addElement, updateElement } from './state/scene'
import { createHistory, pushState, undo, redo, getCurrentScene, HistoryState } from './state/history'
import { screenToWorld } from './state/viewport'
import { getBoundingBox } from './canvas/geometry'
import { hitTest } from './canvas/hitTest'
import {
  CursorIcon,
  PanIcon,
  FocusIcon,
  PenIcon,
  RectIcon,
  EllipseIcon,
  LineIcon,
  TextIcon,
  SaveIcon,
  ExportIcon,
  TrashIcon,
  StrokeThinIcon,
  StrokeMedIcon,
  StrokeThickIcon,
  UndoIcon,
  RedoIcon
} from './Icons'
import styles from './PlotTwist.module.css'

const COLORS = [
  '#E03131',
  '#2F9E44',
  '#1971C2',
  '#F08C00',
  '#6741D9',
  '#1E1E1E',
  'transparent'
]

export const PlotTwist: FC = () => {
  // Set default dimensions for Retool
  Retool.useComponentSettings({ defaultWidth: 800, defaultHeight: 600 })

  // Retool Model Props
  const [backgroundColor] = Retool.useStateString({
    name: 'backgroundColor',
    label: 'Background Color',
    initialValue: '#1E1E1E'
  })

  // Local State
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTool, setActiveTool] = useState<ToolType>('pen')
  const [strokeColor, setStrokeColor] = useState('#E03131')
  const [fillColor, setFillColor] = useState('transparent')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentElementId, setCurrentElementId] = useState<string | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [lastPointer, setLastPointer] = useState<{ x: number, y: number } | null>(null)
  const [isSpacePan, setIsSpacePan] = useState(false)

  const [selectedElement, setSelectedElement] = Retool.useStateObject({
    name: 'selectedElement'
  })
  const elementSelectedEvent = Retool.useEventCallback({
    name: 'elementSelected'
  })
  const [, setExportDataUrl] = Retool.useStateString({ name: 'exportDataUrl' })
  const saveEvent = Retool.useEventCallback({ name: 'save' })
  const exportImageEvent = Retool.useEventCallback({ name: 'exportImage' })
  const [sceneData, setSceneData] = Retool.useStateObject({ name: 'sceneData' })
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  const [history, setHistory] = useState<HistoryState>(createHistory({
    version: 1,
    elements: [],
    viewportX: 0,
    viewportY: 0,
    zoom: 1
  }))

  // Load data from Retool (handles initial load AND switching sessions)
  useEffect(() => {
    console.log('PlotTwist [IN] - Received sceneData from Retool:', sceneData)
    
    let incomingScene: any = null

    if (sceneData && typeof sceneData === 'object' && Array.isArray((sceneData as any).elements)) {
      incomingScene = sceneData
    } else if (
      !sceneData || 
      (typeof sceneData === 'object' && Object.keys(sceneData).length === 0) ||
      (typeof sceneData === 'string' && sceneData.trim() === '')
    ) {
      // It's an empty row in the database! We should clear the board.
      incomingScene = {
        version: 1,
        elements: [],
        viewportX: 0,
        viewportY: 0,
        zoom: 1
      }
    }

    if (incomingScene) {
      const incomingString = JSON.stringify(incomingScene)
      
      // If we recently sent this exact state to Retool, it's just a delayed echo. Ignore it.
      if (sentStatesRef.current.has(incomingString)) {
        return
      }

      const current = getCurrentScene(history)
      if (incomingString !== JSON.stringify(current)) {
        console.log('PlotTwist [IN] - Bootstrapping canvas with data. Elements:', incomingScene.elements.length)
        setHistory(createHistory(incomingScene))
      }
    } else {
      console.log('PlotTwist [IN] - Data is an unknown format. Keeping current canvas state.')
    }

    if (!initialLoadDone) {
      setInitialLoadDone(true)
    }
  }, [sceneData, history, initialLoadDone])

  // Sync internal history state back out to Retool whenever an action completes
  useEffect(() => {
    if (initialLoadDone) {
      const current = getCurrentScene(history)
      const stringified = JSON.stringify(current)
      
      // Record that we sent this exact state
      sentStatesRef.current.add(stringified)
      
      // To prevent memory leaks over long sessions, limit the set size
      if (sentStatesRef.current.size > 50) {
        const iter = sentStatesRef.current.values()
        sentStatesRef.current.delete(iter.next().value)
      }

      console.log('PlotTwist [OUT] - Syncing latest canvas state to Retool:', current)
      setSceneData(current)
    }
  }, [history, initialLoadDone, setSceneData])
  const [draftScene, setDraftScene] = useState<Scene | null>(null)
  
  const [textInputState, setTextInputState] = useState<{ x: number, y: number, value: string, id: string } | null>(null)
  const textInputRef = useRef<{ x: number, y: number, value: string, id: string } | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  
  // Track states we've sent out to prevent delayed echoes from overwriting our canvas
  const sentStatesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (textInputState && textAreaRef.current) {
      // Focus asynchronously to avoid the native mousedown event blurring the newly created textarea
      setTimeout(() => {
        textAreaRef.current?.focus()
      }, 10)
    }
  }, [textInputState?.id])

  const setTextInput = (val: { x: number, y: number, value: string, id: string } | null) => {
    textInputRef.current = val
    setTextInputState(val)
  }

  const commitTextElement = (targetId: string) => {
    const current = textInputRef.current
    if (current && current.id === targetId) {
      if (current.value.trim()) {
        const fontSize = strokeWidth <= 2 ? 16 : strokeWidth <= 4 ? 24 : 36
        const el: TextElement = {
          id: current.id,
          type: 'text',
          x: current.x,
          y: current.y,
          text: current.value,
          fontSize,
          fontFamily: "'Caveat', cursive",
          strokeColor,
          fillColor,
          strokeWidth,
          opacity: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          seed: Math.floor(Math.random() * 2 ** 31)
        }
        setHistory((prev) => pushState(prev, addElement(getCurrentScene(prev), el)))
      }
      setTextInput(null)
    }
  }

  const scene = draftScene || getCurrentScene(history)

  const updateScene = (updater: (prev: Scene) => Scene) => {
    setDraftScene((prev) => updater(prev || getCurrentScene(history)))
  }

  // Handle resizing and High-DPI (Retina) display support
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Use the body size to ensure we fill the available Retool space
        const { width, height } = entry.contentRect
        const dpr = window.devicePixelRatio || 1

        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = width * dpr
        canvas.height = height * dpr

        // Set logical size in CSS
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Normalize coordinate system to use css pixels
          ctx.scale(dpr, dpr)
          renderScene(
            ctx,
            scene,
            width,
            height,
            backgroundColor || DEFAULT_BG_COLOR,
            true,
            selectedElementId
          )
        }
      }
    })

    resizeObserver.observe(document.body)

    const container = containerRef.current
    let handleWheel: ((e: WheelEvent) => void) | null = null

    if (container) {
      handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        const rect = container.getBoundingClientRect()
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top

        setHistory((prev) => {
          const current = getCurrentScene(prev)
          const newStack = [...prev.stack]
          let newZoom = current.zoom
          let newViewportX = current.viewportX
          let newViewportY = current.viewportY

          if (e.ctrlKey || e.metaKey) {
            // Pinch / Zoom
            const zoomStep = -e.deltaY * 0.01
            newZoom = Math.min(Math.max(0.1, current.zoom + zoomStep), 10)
            const worldBefore = screenToWorld(screenX, screenY, current)
            newViewportX = screenX - worldBefore.x * newZoom
            newViewportY = screenY - worldBefore.y * newZoom
          } else {
            // Pan
            newViewportX -= e.deltaX
            newViewportY -= e.deltaY
          }

          newStack[prev.index] = {
            ...current,
            zoom: newZoom,
            viewportX: newViewportX,
            viewportY: newViewportY
          }
          return { ...prev, stack: newStack }
        })
      }
      container.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      resizeObserver.disconnect()
      if (container && handleWheel) {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, []) // Empty dependency array because we manually trigger render when scene changes

  // Trigger manual render when scene or background changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Dimensions are logically canvas.width / dpr, but we can just read from CSS
      const rect = canvas.getBoundingClientRect()
      renderScene(
        ctx,
        scene,
        rect.width,
        rect.height,
        backgroundColor || DEFAULT_BG_COLOR,
        true,
        selectedElementId
      )
    }
  }, [scene, backgroundColor, selectedElementId])

  // Delete shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return
      if (e.code === 'Space') {
        setIsSpacePan(true)
        e.preventDefault()
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          setHistory(redo)
        } else {
          setHistory(undo)
        }
        e.preventDefault()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        saveEvent()
        e.preventDefault()
        return
      }

      // Tool shortcuts
      const keyToolMap: Record<string, ToolType> = {
        v: 'select',
        p: 'pen',
        r: 'rectangle',
        e: 'ellipse',
        l: 'line',
        t: 'text'
      }
      
      const tool = keyToolMap[e.key.toLowerCase()]
      if (tool && !e.metaKey && !e.ctrlKey) {
        setActiveTool(tool)
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        setHistory((prev) => {
          const current = getCurrentScene(prev)
          return pushState(prev, {
            ...current,
            elements: current.elements.filter((el) => el.id !== selectedElementId)
          })
        })
        setSelectedElementId(null)
        setSelectedElement(null)
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePan(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedElementId])

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    // Always capture pointer so we track outside canvas
    e.currentTarget.setPointerCapture(e.pointerId)

    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    
    // Check if we should pan
    if (activeTool === 'pan' || isSpacePan || e.button === 1) {
      setIsDrawing(true)
      setLastPointer({ x: screenX, y: screenY })
      return
    }

    const { x, y } = screenToWorld(screenX, screenY, scene)

    if (activeTool === 'select') {
      const hit = hitTest(scene.elements, x, y)
      if (hit) {
        setSelectedElementId(hit.id)
        setSelectedElement(hit)
        elementSelectedEvent()
        setIsDrawing(true) // Reuse for dragging
        setCurrentElementId(hit.id)
        setLastPointer({ x, y })
      } else {
        setSelectedElementId(null)
        setSelectedElement(null)
      }
      return
    }

    if (activeTool === 'text') {
      if (textInputRef.current) {
        commitTextElement(textInputRef.current.id)
      }
      setTextInput({ x, y, value: '', id: generateId() })
      return
    }

    setIsDrawing(true)
    const id = generateId()
    setCurrentElementId(id)

    const baseEl: BaseElement = {
      id,
      type: activeTool,
      x,
      y,
      strokeColor,
      fillColor,
      strokeWidth,
      opacity: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      seed: Math.floor(Math.random() * 2 ** 31)
    }

    if (activeTool === 'pen') {
      const el: PenElement = {
        ...baseEl,
        type: 'pen',
        points: [[x, y, e.pressure]]
      }
      updateScene((prev) => addElement(prev, el))
    } else if (activeTool === 'rectangle' || activeTool === 'ellipse') {
      const el = { ...baseEl, type: activeTool, width: 0, height: 0 } as
        | RectElement
        | EllipseElement
      updateScene((prev) => addElement(prev, el))
    } else if (activeTool === 'line') {
      const el: LineElement = {
        ...baseEl,
        type: 'line',
        points: [
          [x, y],
          [x, y]
        ]
      }
      updateScene((prev) => addElement(prev, el))
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    
    if ((activeTool === 'pan' || isSpacePan || e.buttons === 4) && lastPointer) {
      const dx = screenX - lastPointer.x
      const dy = screenY - lastPointer.y
      setLastPointer({ x: screenX, y: screenY })
      
      setHistory(prev => {
        const newStack = [...prev.stack]
        newStack[prev.index] = {
          ...newStack[prev.index],
          viewportX: newStack[prev.index].viewportX + dx,
          viewportY: newStack[prev.index].viewportY + dy
        }
        return { ...prev, stack: newStack }
      })
      return
    }

    if (!currentElementId) return
    
    const { x, y } = screenToWorld(screenX, screenY, scene)

    if (activeTool === 'select' && currentElementId && lastPointer) {
      const dx = x - lastPointer.x
      const dy = y - lastPointer.y
      setLastPointer({ x, y })
      updateScene((prev) => {
        const el = prev.elements.find((e) => e.id === currentElementId)
        if (!el) return prev
        const updates: Partial<BaseElement & any> = {
          x: el.x + dx,
          y: el.y + dy
        }

        if (el.type === 'pen' || el.type === 'line') {
          updates.points = el.points.map((p: any) => {
            const newP = [...p]
            newP[0] += dx
            newP[1] += dy
            return newP
          })
        }
        return updateElement(prev, currentElementId, updates)
      })
      return
    }

    updateScene((prev) => {
      const el = prev.elements.find((e) => e.id === currentElementId)
      if (!el) return prev

      if (el.type === 'pen') {
        return updateElement(prev, currentElementId, {
          points: [...el.points, [x, y, e.pressure]]
        })
      } else if (el.type === 'rectangle' || el.type === 'ellipse') {
        return updateElement(prev, currentElementId, {
          width: x - el.x,
          height: y - el.y
        })
      } else if (el.type === 'line') {
        return updateElement(prev, currentElementId, {
          points: [el.points[0], [x, y]]
        })
      }
      return prev
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draftScene) {
      setHistory(prev => pushState(prev, draftScene))
      setDraftScene(null)
    }
    setIsDrawing(false)
    setCurrentElementId(null)
    setLastPointer(null)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleExport = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      setExportDataUrl(dataUrl)
      exportImageEvent()
      
      // Auto-trigger the download directly in the browser
      const link = document.createElement('a')
      link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleResetView = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const padding = 50

    setHistory((prev) => {
      const current = getCurrentScene(prev)
      const newStack = [...prev.stack]

      if (current.elements.length === 0) {
        newStack[prev.index] = { ...current, viewportX: 0, viewportY: 0, zoom: 1 }
        return { ...prev, stack: newStack }
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      current.elements.forEach(el => {
        const box = getBoundingBox(el)
        if (box.minX < minX) minX = box.minX
        if (box.minY < minY) minY = box.minY
        if (box.maxX > maxX) maxX = box.maxX
        if (box.maxY > maxY) maxY = box.maxY
      })

      const width = maxX - minX || 1
      const height = maxY - minY || 1
      
      const zoomX = (rect.width - padding * 2) / width
      const zoomY = (rect.height - padding * 2) / height
      let newZoom = Math.min(zoomX, zoomY)
      newZoom = Math.min(Math.max(0.1, newZoom), 2) // clamp zoom

      const worldCenterX = minX + width / 2
      const worldCenterY = minY + height / 2

      const newViewportX = rect.width / 2 - worldCenterX * newZoom
      const newViewportY = rect.height / 2 - worldCenterY * newZoom

      newStack[prev.index] = {
        ...current,
        viewportX: newViewportX,
        viewportY: newViewportY,
        zoom: newZoom
      }

      return { ...prev, stack: newStack }
    })
  }

  return (
    <div className={styles.root} ref={containerRef}>
      <div className={styles.topToolbar}>
        <div className={styles.toolbarGroup}>
          <button
            className={`${styles.toolBtn} ${activeTool === 'select' ? styles.toolBtnActive : ''}`}
            onClick={() => setActiveTool('select')}
            data-tooltip="Select (V)"
          >
            <CursorIcon />
          </button>
          <button
            className={`${styles.toolBtn} ${activeTool === 'pan' ? styles.toolBtnActive : ''}`}
            onClick={() => setActiveTool('pan')}
            data-tooltip="Pan (Space)"
          >
            <PanIcon />
          </button>
          <button
            className={`${styles.toolBtn} ${activeTool === 'pen' ? styles.toolBtnActive : ''}`}
            onClick={() => setActiveTool('pen')}
            data-tooltip="Pen (P)"
          >
            <PenIcon />
          </button>
          <button
            className={`${styles.toolBtn} ${activeTool === 'rectangle' ? styles.toolBtnActive : ''}`}
            onClick={() => setActiveTool('rectangle')}
            data-tooltip="Rectangle (R)"
          >
            <RectIcon />
          </button>
          <button
            className={`${styles.toolBtn} ${activeTool === 'ellipse' ? styles.toolBtnActive : ''}`}
            onClick={() => setActiveTool('ellipse')}
            data-tooltip="Ellipse (E)"
          >
            <EllipseIcon />
          </button>
          <button
            className={`${styles.toolBtn} ${activeTool === 'line' ? styles.toolBtnActive : ''}`}
            onClick={() => setActiveTool('line')}
            data-tooltip="Line (L)"
          >
            <LineIcon />
          </button>
          <button
            className={`${styles.toolBtn} ${activeTool === 'text' ? styles.toolBtnActive : ''}`}
            onClick={() => setActiveTool('text')}
            data-tooltip="Text (T)"
          >
            <TextIcon />
          </button>
        </div>
        <div className={styles.divider} />
        <div className={styles.toolbarGroup}>
          <button
            className={styles.actionBtn}
            onClick={() => setHistory(undo)}
            data-tooltip="Undo (Cmd+Z)"
          >
            <UndoIcon />
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setHistory(redo)}
            data-tooltip="Redo (Cmd+Shift+Z)"
          >
            <RedoIcon />
          </button>
        </div>
        <div className={styles.divider} />
        <div className={styles.toolbarGroup}>
          <button
            className={styles.actionBtn}
            onClick={handleResetView}
            data-tooltip="Focus / Reset View"
          >
            <FocusIcon />
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setHistory(prev => pushState(prev, { ...getCurrentScene(prev), elements: [] }))}
            data-tooltip="Clear All"
          >
            <TrashIcon />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.primaryAction}`}
            onClick={saveEvent}
            data-tooltip="Save to Database"
          >
            <SaveIcon />
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleExport}
            data-tooltip="Export PNG"
          >
            <ExportIcon />
          </button>
        </div>
      </div>

      <div className={styles.leftToolbar}>
        <div className={styles.verticalGroup}>
          <div className={styles.colorLabels}>
            <span>Stroke</span>
            <span>Fill</span>
          </div>
          <div className={styles.colorGrid}>
            <div className={styles.colorCol}>
              {COLORS.map((c) => (
                <button
                  key={`stroke-${c}`}
                  className={`${styles.colorBtn} ${strokeColor === c ? styles.colorBtnActive : ''}`}
                  style={{
                    backgroundColor: c === 'transparent' ? 'transparent' : c,
                    border:
                      c === 'transparent'
                        ? strokeColor === c
                          ? '2px solid white'
                          : '2px dashed #a0a0a0'
                        : undefined
                  }}
                  onClick={() => setStrokeColor(c)}
                  data-tooltip="Stroke Color"
                />
              ))}
            </div>
            <div className={styles.colorCol}>
              {COLORS.map((c) => (
                <button
                  key={`fill-${c}`}
                  className={`${styles.colorBtn} ${fillColor === c ? styles.colorBtnActive : ''}`}
                  style={{
                    backgroundColor: c === 'transparent' ? 'transparent' : c,
                    border:
                      c === 'transparent'
                        ? fillColor === c
                          ? '2px solid white'
                          : '2px dashed #a0a0a0'
                        : undefined
                  }}
                  onClick={() => setFillColor(c)}
                  data-tooltip="Fill Color"
                />
              ))}
            </div>
          </div>
        </div>
        <div className={styles.horizontalDivider} />
        <div className={styles.verticalGroup}>
          <button
            className={`${styles.toolBtn} ${strokeWidth === 2 ? styles.toolBtnActive : ''}`}
            onClick={() => setStrokeWidth(2)}
            data-tooltip="Thin"
          >
            <StrokeThinIcon />
          </button>
          <button
            className={`${styles.toolBtn} ${strokeWidth === 4 ? styles.toolBtnActive : ''}`}
            onClick={() => setStrokeWidth(4)}
            data-tooltip="Medium"
          >
            <StrokeMedIcon />
          </button>
          <button
            className={`${styles.toolBtn} ${strokeWidth === 8 ? styles.toolBtnActive : ''}`}
            onClick={() => setStrokeWidth(8)}
            data-tooltip="Thick"
          >
            <StrokeThickIcon />
          </button>
        </div>
      </div>
      <div className={styles.canvasContainer} ref={containerRef}>
        <canvas
          className={styles.canvas}
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        {scene.elements.length === 0 && !textInputState && (
          <div className={styles.emptyState} style={{ zIndex: 10 }}>
            Select a session or start drawing
          </div>
        )}
        {textInputState && (
          <textarea
            ref={textAreaRef}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(${textInputState.x * scene.zoom + scene.viewportX}px, ${textInputState.y * scene.zoom + scene.viewportY}px) scale(${scene.zoom})`,
              transformOrigin: 'top left',
              fontSize: `${strokeWidth <= 2 ? 16 : strokeWidth <= 4 ? 24 : 36}px`,
              fontFamily: "'Caveat', cursive",
              color: strokeColor,
              background: 'transparent',
              border: '1px dashed #6bbaff',
              outline: 'none',
              minWidth: '100px',
              minHeight: '30px',
              resize: 'none',
              overflow: 'hidden',
              whiteSpace: 'pre',
              padding: 0,
              margin: 0,
              lineHeight: 1
            }}
            value={textInputState.value}
            onChange={(e) => {
              setTextInput({ ...textInputState, value: e.target.value })
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
              e.target.style.width = 'auto'
              e.target.style.width = Math.max(100, e.target.scrollWidth) + 'px'
            }}
            onBlur={() => commitTextElement(textInputState.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                commitTextElement(textInputState.id)
              }
              if (e.key === 'Escape') {
                setTextInput(null)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
