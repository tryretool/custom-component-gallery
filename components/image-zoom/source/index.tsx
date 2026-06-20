/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react'
import { type FC } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import ImageMagnifier from './components/ImageMagnifier'

Retool.useComponentSettings({
    defaultHeight: 50,
    defaultWidth: 7,
  });

const ZoomImage: FC = () => {
  const [imageUrl, _setImageUrl] = Retool.useStateString({ 
    name: 'imageUrl',
    initialValue: 'https://justifiedgrid.com/wp-content/gallery/life/flowers/167527802.jpg' 
  })
  const [imageAlt, setImageAlt] = Retool.useStateString({ name: 'imageAlt' })
  const [zoomMode] = Retool.useStateString({
    name: 'zoomMode',
    initialValue: 'normal',
    description: 'Choose between normal or glass magnifier modes',
  })
  const [zoomLevel, setZoomLevel] = Retool.useStateNumber({
    name: 'zoomLevel',
    initialValue: 3
  })

  const [zoomInfo, setZoomInfo] = useState({ x: 0, y: 0, level: 1 })
  const [isClicking, setIsClicking] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startDragPosition, setStartDragPosition] = useState<{
    x: number
    y: number
  } | null>(null)

  const [cursorPosition, setCursorPosition] = useState<{
    x: number
    y: number
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Start dragging
  const handleMouseDown = (event: React.MouseEvent) => {
    if (zoomInfo.level > 1) {
      setIsClicking(true)
      setStartDragPosition({
        x: event.clientX - zoomInfo.x,
        y: event.clientY - zoomInfo.y
      })
    }
  }

  // Drag the image
  const handleMouseMove = (event: React.MouseEvent) => {
    if (isClicking && startDragPosition) {
      const newPosX = event.clientX - startDragPosition.x
      const newPosY = event.clientY - startDragPosition.y
      setZoomInfo((prev) => ({ ...prev, x: newPosX, y: newPosY }))
      setIsDragging(true)
    }

    if (!containerRef.current) return
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    setCursorPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
  }

  // Stop dragging
  const handleMouseUp = (event: React.MouseEvent) => {
    setIsClicking(false)
    if (!isDragging) {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const cursorX = event.clientX - rect.left
      const cursorY = event.clientY - rect.top
      setZoomInfo((prev) => ({
        level: prev.level === 1 ? zoomLevel : 1,
        x:
          prev.level === 1
            ? cursorX - ((cursorX - prev.x) * zoomLevel) / prev.level
            : 0,
        y:
          prev.level === 1
            ? cursorY - ((cursorY - prev.y) * zoomLevel) / prev.level
            : 0
      }))
    }
    setIsDragging(false)
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        margin: '0 auto',
        width: 'auto',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '8px',
        cursor: zoomInfo.level > 1 && isDragging ? 'grab' : 'default'
      }}
      // onWheel={handleZoomScroll}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      // onMouseLeave={handleMouseUp}
    >
      {zoomMode !== 'normal' && cursorPosition && containerRef.current ? (
        <ImageMagnifier
          src={imageUrl}
          alt={imageAlt}
          width={'auto'}
          height={'100%'}
          magnifierWidth={zoomMode === 'glass' ? 180 : 400 / zoomLevel}
          magnifierHeight={zoomMode === 'glass' ? 180 : 400 / zoomLevel}
          mode={zoomMode}
          zoomLevel={zoomLevel}
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={imageAlt}
          // onClick={handleZoomClick}
          style={{
            position: 'relative',
            margin: '0 auto',
            width: 'auto',
            height: '100%',
            objectFit: 'contain',
            transition: isDragging ? 'none' : 'all 200ms',
            top: zoomInfo.y,
            left: zoomInfo.x,
            transform: `scale(${zoomInfo.level})`,
            transformOrigin: '0 0',
            cursor: isDragging
              ? 'grabbing'
              : zoomInfo.level === 1
                ? 'zoom-in'
                : 'zoom-out'
          }}
          draggable={false}
        />
      ) : (
        <div>No image available</div>
      )}
    </div>
  )

}

export default ZoomImage;
