import { useState, useCallback, useEffect, useLayoutEffect, useRef, RefObject, MutableRefObject } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import './DocumentPreview.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BoundingBox {
  fieldKey: string
  label?: string
  page: number
  x: number       // normalised 0–1, left edge
  y: number       // normalised 0–1, top edge
  width: number   // normalised 0–1
  height: number  // normalised 0–1
}

interface OverlayRect {
  x: number
  y: number
  w: number
  h: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CANVAS_PADDING = 24 // 12px each side
const MIN_ZOOM       = 0.5
const MAX_ZOOM       = 5
const ZOOM_FACTOR    = 1.15
const BOX_PAD_X      = 2 // px breathing room left/right
const BOX_PAD_Y      = 3 // px breathing room top/bottom (1px extra vs horizontal)

/**
 * Compute the image's rendered size at zoom=1 so it fits inside the container
 * while preserving aspect ratio (same logic as object-fit: contain).
 */
function computeFitSize(
  naturalW: number,
  naturalH: number,
  containerW: number,
  containerH: number,
): { w: number; h: number } {
  const availW = containerW - CANVAS_PADDING
  const availH = containerH - CANVAS_PADDING
  const aspect = naturalW / naturalH
  if (availW / availH >= aspect) {
    return { w: availH * aspect, h: availH }
  }
  return { w: availW, h: availW / aspect }
}

// ---------------------------------------------------------------------------
// Hook: track rendered position of <img> inside wrapper.
// Uses useLayoutEffect so the SVG overlay never lags by a frame.
// ---------------------------------------------------------------------------

function useImageOverlayRect(
  wrapperRef: RefObject<HTMLDivElement>,
  imgRef: RefObject<HTMLImageElement>,
  deps: unknown[]
): OverlayRect | null {
  const [rect, setRect] = useState<OverlayRect | null>(null)

  const compute = useCallback(() => {
    const wrapper = wrapperRef.current
    const img     = imgRef.current
    if (!wrapper || !img || img.naturalWidth === 0) { setRect(null); return }
    const wRect = wrapper.getBoundingClientRect()
    const iRect = img.getBoundingClientRect()
    setRect({
      x: iRect.left - wRect.left,
      y: iRect.top  - wRect.top,
      w: iRect.width,
      h: iRect.height,
    })
  }, [wrapperRef, imgRef])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { compute() }, deps)

  useEffect(() => {
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [compute])

  return rect
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentPreview() {
  // ── Retool state ───────────────────────────────────────────────────────────

  const [imageUrls] = Retool.useStateArray({
    name: 'imageUrls',
    initialValue: [],
    label: 'Image URLs',
    description: 'Array of Retool Storage image URLs, one per document page.',
    inspector: 'text',
  })

  const [rawBoundingBoxes] = Retool.useStateArray({
    name: 'boundingBoxes',
    initialValue: [],
    label: 'Bounding boxes',
    description: 'Array of { fieldKey, label, page, x, y, width, height }. Coordinates are normalised 0-1 relative to the page image.',
    inspector: 'text',
  })

  const [hoveredField, setHoveredField] = Retool.useStateString({
    name: 'hoveredField',
    initialValue: '',
    label: 'Hovered field',
    description: 'fieldKey of the currently highlighted field. Set this from a Retool state variable to highlight a box from outside.',
    inspector: 'text',
  })

  // Fires whenever the hovered field changes — use this in Retool to update
  // a shared state variable (e.g. state_hovered_field.setValue(fieldKey))
  // Cast: Retool types useEventCallback as () => void, but it accepts a payload at runtime.
  const triggerHoverChange = Retool.useEventCallback({
    name: 'onHoverChange',
  }) as (data: { fieldKey: string }) => void

  // ── Local state ────────────────────────────────────────────────────────────

  const [currentPage, setCurrentPage] = useState(0)
  const [loadError,   setLoadError]   = useState(false)
  const [isLoading,   setIsLoading]   = useState(true)
  const [imageMounted, setImageMounted] = useState(0)

  // Zoom & pan
  const [zoom, setZoom]           = useState(1)
  const [panX, setPanX]           = useState(0)
  const [panY, setPanY]           = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Fit dimensions at zoom=1 (computed on load / wrapper resize)
  const [fitWidth,  setFitWidth]  = useState<number | null>(null)
  const [fitHeight, setFitHeight] = useState<number | null>(null)

  // ── Refs ──────────────────────────────────────────────────────────────────

  const wrapperRef = useRef<HTMLDivElement>(null)
  const imgRef     = useRef<HTMLImageElement>(null)

  // Mutable refs for use inside event handlers (avoid stale closures)
  const zoomRef      = useRef(1)
  const panXRef      = useRef(0)
  const panYRef      = useRef(0)
  const fitWidthRef  = useRef<number | null>(null)
  const fitHeightRef = useRef<number | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  // Debounce timer for clearing hoveredField on box mouseLeave.
  // When moving from one box to another, onMouseLeave fires before onMouseEnter
  // of the next box. Without debouncing, setHoveredField('') races with
  // setHoveredField(nextKey) — the clear can arrive last and wipe the new value.
  // Cancelling the timer in onMouseEnter eliminates the race entirely.
  const hoverClearRef: MutableRefObject<ReturnType<typeof setTimeout> | null> = useRef(null)

  // Track currentPage in a ref so the auto-navigate effect reads the latest
  // value without going stale (effects close over initial render values).
  const currentPageRef = useRef(currentPage)
  useEffect(() => { currentPageRef.current = currentPage }, [currentPage])

  // ── Derived values ─────────────────────────────────────────────────────────

  // Guard against null/undefined during Retool query reloads after inactivity
  const safeImageUrls      = Array.isArray(imageUrls)       ? imageUrls       : []
  const safeBoundingBoxes  = Array.isArray(rawBoundingBoxes) ? rawBoundingBoxes : []

  const totalPages = safeImageUrls.length
  const currentUrl =
    typeof safeImageUrls[currentPage] === 'string'
      ? (safeImageUrls[currentPage] as string)
      : null

  const boundingBoxes = safeBoundingBoxes as unknown as BoundingBox[]
  const currentBoxes  = boundingBoxes.filter((b) => b.page === currentPage)

  // ── Overlay rect (tracks translated image position) ───────────────────────

  const overlayRect = useImageOverlayRect(wrapperRef, imgRef, [
    currentUrl, imageMounted, zoom, panX, panY, fitWidth, fitHeight,
  ])

  // ── View helpers ──────────────────────────────────────────────────────────

  const applyView = useCallback((z: number, px: number, py: number) => {
    zoomRef.current = z
    panXRef.current = px
    panYRef.current = py
    setZoom(z)
    setPanX(px)
    setPanY(py)
  }, [])

  const resetView = useCallback(() => applyView(1, 0, 0), [applyView])

  // ── Fit-size computation ──────────────────────────────────────────────────

  const updateFitSize = useCallback(() => {
    const img     = imgRef.current
    const wrapper = wrapperRef.current
    if (!img || !wrapper || img.naturalWidth === 0) return
    const { width, height } = wrapper.getBoundingClientRect()
    const { w, h } = computeFitSize(img.naturalWidth, img.naturalHeight, width, height)
    fitWidthRef.current  = w
    fitHeightRef.current = h
    setFitWidth(w)
    setFitHeight(h)
  }, [])

  // Recompute fit on wrapper resize (e.g. Retool panel resize)
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const ro = new ResizeObserver(() => { updateFitSize() })
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [updateFitSize])

  // ── Page navigation ───────────────────────────────────────────────────────

  const goTo = useCallback((page: number) => {
    setCurrentPage(page)
    setLoadError(false)
    setIsLoading(true)
    setImageMounted(0)
    setFitWidth(null)
    setFitHeight(null)
    fitWidthRef.current  = null
    fitHeightRef.current = null
    resetView()
  }, [resetView])

  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
    setImageMounted((n) => n + 1)
    updateFitSize()
  }, [updateFitSize])

  const handleImageError = useCallback(() => {
    setIsLoading(false)
    setLoadError(true)
  }, [])

  // ── Wheel zoom (toward cursor, no scale transform — avoids pixel blur) ────
  //
  // Instead of CSS scale(), we set the image's actual width/height to
  // fitWidth * zoom so the browser renders from the source at full quality.
  // Panning is a plain translate on the canvas, not a scale.
  //
  // Image position in wrapper coords:
  //   imgX = panX + (wrapperW - fitWidth  * zoom) / 2
  //   imgY = panY + (wrapperH - fitHeight * zoom) / 2
  //
  // To keep the canvas point under the cursor fixed after zoom:
  //   newImgX = cx - (cx - imgX) * newZoom / zoom
  //   newPanX = newImgX - (wrapperW - fitWidth * newZoom) / 2

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const fw = fitWidthRef.current
    const fh = fitHeightRef.current
    if (!fw || !fh) return

    const factor  = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * factor))

    const wrapper = wrapperRef.current
    if (!wrapper) return
    const wRect = wrapper.getBoundingClientRect()
    const cx = e.clientX - wRect.left
    const cy = e.clientY - wRect.top
    const wW = wRect.width
    const wH = wRect.height
    const z  = zoomRef.current

    const imgX = panXRef.current + (wW - fw * z)  / 2
    const imgY = panYRef.current + (wH - fh * z)  / 2

    const newImgX = cx - (cx - imgX) * newZoom / z
    const newImgY = cy - (cy - imgY) * newZoom / z

    const newPanX = newImgX - (wW - fw * newZoom) / 2
    const newPanY = newImgY - (wH - fh * newZoom) / 2

    applyView(newZoom, newPanX, newPanY)
  }, [applyView])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    wrapper.addEventListener('wheel', handleWheel, { passive: false })
    return () => wrapper.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Drag to pan ────────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragStartRef.current = {
      x: e.clientX, y: e.clientY,
      panX: panXRef.current, panY: panYRef.current,
    }
    setIsDragging(true)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      const newPanX = dragStartRef.current.panX + (e.clientX - dragStartRef.current.x)
      const newPanY = dragStartRef.current.panY + (e.clientY - dragStartRef.current.y)
      panXRef.current = newPanX
      panYRef.current = newPanY
      setPanX(newPanX)
      setPanY(newPanY)
    }
    const onUp = () => { dragStartRef.current = null; setIsDragging(false) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [])

  // ── Auto-navigate to page when external hover changes ─────────────────────
  // When hoveredField is set from outside (OrderlineTable hover), navigate to
  // the page of the matching bounding box. No-op if box is already on the
  // current page (covers the case where the user hovered a box on this page).
  useEffect(() => {
    if (!hoveredField) return
    const boxes = safeBoundingBoxes as unknown as BoundingBox[]
    const box = boxes.find((b) => b.fieldKey === hoveredField)
    if (box && box.page !== currentPageRef.current) {
      goTo(box.page)
    }
  }, [hoveredField, goTo, rawBoundingBoxes])

  // ── Render ────────────────────────────────────────────────────────────────

  if (!totalPages) {
    return (
      <div className="dm-dp-empty">
        <span>No document images provided.</span>
      </div>
    )
  }

  // Explicit pixel dimensions for the image — avoids CSS scale() blurring.
  // Falls back to CSS max-width/max-height while the image is still loading.
  const imgStyle =
    fitWidth && fitHeight
      ? { width: fitWidth * zoom, height: fitHeight * zoom, maxWidth: 'none', maxHeight: 'none' }
      : undefined

  return (
    <div className="dm-dp-container">
      <div
        className={`dm-dp-image-wrapper${isDragging ? ' dm-dp-image-wrapper--dragging' : ''}`}
        ref={wrapperRef}
        onMouseDown={handleMouseDown}
      >
        {/* Loading spinner */}
        {isLoading && !loadError && (
          <div className="dm-dp-loading-overlay">
            <div className="dm-dp-spinner" />
          </div>
        )}

        {/* Error state */}
        {loadError && (
          <div className="dm-dp-error">
            <span>Failed to load image.</span>
            <code className="dm-dp-url-hint">{currentUrl}</code>
          </div>
        )}

        {/* Canvas — translate only (no scale), so the image renders at true pixel size */}
        <div
          className="dm-dp-canvas"
          style={{ transform: `translate(${panX}px, ${panY}px)` }}
        >
          {!loadError && (
            <img
              ref={imgRef}
              key={currentUrl}
              src={currentUrl ?? ''}
              alt={`Document page ${currentPage + 1}`}
              className="dm-dp-image"
              style={imgStyle}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          )}
        </div>

        {/* Bounding box SVG overlay — outside the canvas, position tracked via
            getBoundingClientRect which correctly reads the translated image.
            All box hit-areas are always rendered (so mouse events work even when
            boxes are visually hidden). The visual rect + tooltip only appear for
            the currently hovered field. */}
        {overlayRect && !isLoading && !loadError && currentBoxes.length > 0 && (
          <svg
            className="dm-dp-overlay"
            style={{
              left:   overlayRect.x,
              top:    overlayRect.y,
              width:  overlayRect.w,
              height: overlayRect.h,
              pointerEvents: 'none',
            }}
          >
            {currentBoxes.map((box) => {
              const isActive = hoveredField === box.fieldKey
              const px = box.x      * overlayRect.w
              const py = box.y      * overlayRect.h
              const pw = box.width  * overlayRect.w
              const ph = box.height * overlayRect.h

              return (
                <g
                  key={box.fieldKey}
                  className="dm-dp-box-group"
                  style={{ pointerEvents: isDragging ? 'none' : 'all' }}
                  onMouseEnter={() => {
                    if (hoverClearRef.current) {
                      clearTimeout(hoverClearRef.current)
                      hoverClearRef.current = null
                    }
                    setHoveredField(box.fieldKey)
                    triggerHoverChange({ fieldKey: box.fieldKey })
                  }}
                  onMouseLeave={() => {
                    hoverClearRef.current = setTimeout(() => {
                      hoverClearRef.current = null
                      setHoveredField('')
                      triggerHoverChange({ fieldKey: '' })
                    }, 50)
                  }}
                >
                  {/* Invisible hit area — always present, captures mouse events
                      (fill="transparent" registers pointer hits; fill="none" would not) */}
                  <rect
                    x={px - BOX_PAD_X} y={py - BOX_PAD_Y} width={pw + BOX_PAD_X * 2} height={ph + BOX_PAD_Y * 2}
                    fill="transparent" stroke="none"
                  />
                  {/* Visual box — only rendered when this field is the active one */}
                  {isActive && (
                    <rect
                      x={px - BOX_PAD_X} y={py - BOX_PAD_Y} width={pw + BOX_PAD_X * 2} height={ph + BOX_PAD_Y * 2}
                      className="dm-dp-box dm-dp-box--active"
                    />
                  )}
                  {isActive && box.label && (
                    <foreignObject
                      x={px}
                      y={Math.max(0, py - 26)}
                      width={Math.min(pw + 60, overlayRect.w - px)}
                      height={24}
                    >
                      <div className="dm-dp-box-tooltip">{box.label}</div>
                    </foreignObject>
                  )}
                </g>
              )
            })}
          </svg>
        )}

        {/* Reset / recenter button — bottom-left corner */}
        <button
          className="dm-dp-reset-btn"
          onClick={(e) => { e.stopPropagation(); resetView() }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Reset zoom & recenter"
          aria-label="Reset zoom and recenter"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M1 1h4M1 1v4"       stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 1h-4M14 1v4"    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 14h4M1 14v-4"    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 14h-4M14 14v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="dm-dp-controls">
          <button
            className="dm-dp-nav-btn"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 0}
          >
            ‹
          </button>
          <span className="dm-dp-page-indicator">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            className="dm-dp-nav-btn"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
