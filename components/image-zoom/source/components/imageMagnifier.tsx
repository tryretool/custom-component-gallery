import React, { useRef, useState } from 'react'

const ImageMagnifier = ({
  src,
  className = '',
  width,
  height,
  alt,
  mode = 'glass',
  magnifierHeight = 150,
  magnifierWidth = 150,
  zoomLevel = 3
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [[imgWidth, imgHeight], setSize] = useState([0, 0])
  const [[x, y], setXY] = useState([0, 0])

  const mouseEnter = (e) => {
    const el = e.currentTarget

    const { width, height } = el.getBoundingClientRect()
    setSize([width, height])
    setShowMagnifier(true)
  }

  const mouseLeave = (e) => {
    e.preventDefault()
    setShowMagnifier(false)
  }

  const mouseMove = (e) => {
    const el = e.currentTarget
    const { top, left } = el.getBoundingClientRect()

    const x = e.pageX - left - window.scrollX
    const y = e.pageY - top - window.scrollY

    setXY([x, y])
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: '100%',
        cursor:
          mode === 'glass'
            ? 'none'
            : mode === 'self' || mode === 'side'
              ? 'crosshair'
              : 'default'
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          height: '100%'
        }}
      >
        <img
          src={src}
          className={className}
          width={width}
          height={height}
          alt={alt}
          onMouseEnter={(e) => mouseEnter(e)}
          onMouseLeave={(e) => mouseLeave(e)}
          onMouseMove={(e) => mouseMove(e)}
        />
        {mode === 'glass' ? (
          <>
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: showMagnifier ? '#00000022' : 'transparent',
                transition: 'all 500ms',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                display: showMagnifier ? '' : 'none',
                position: 'absolute',
                pointerEvents: 'none',
                height: `${magnifierHeight}px`,
                width: `${magnifierWidth}px`,
                opacity: '1',
                border: '1px solid lightgrey',
                backgroundColor: 'white',
                borderRadius: '999px',
                backgroundImage: `url('${src}')`,
                backgroundRepeat: 'no-repeat',
                top: `${y - magnifierHeight / 2}px`,
                left: `${x - magnifierWidth / 2}px`,
                backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
                backgroundPositionX: `${-x * zoomLevel + magnifierWidth / 2}px`,
                backgroundPositionY: `${-y * zoomLevel + magnifierHeight / 2}px`
              }}
            />
          </>
        ) : mode === 'side' ? (
          <>
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: showMagnifier ? '#00000033' : 'transparent',
                transition: 'all 500ms',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                display: showMagnifier ? '' : 'none',
                position: 'absolute',
                pointerEvents: 'none',
                height: `${magnifierHeight}px`,
                width: `${magnifierWidth}px`,
                opacity: '1',
                border: '1px solid lightgrey',
                backgroundColor: 'white',
                borderRadius: '5px',
                backgroundImage: `url('${src}')`,
                backgroundRepeat: 'no-repeat',
                top: `${y - magnifierHeight / 2}px`,
                left: `${x - magnifierWidth / 2}px`,
                backgroundSize: `${imgWidth * 1}px ${imgHeight * 1}px`,
                backgroundPositionX: `${-x * 1 + magnifierWidth / 2}px`,
                backgroundPositionY: `${-y * 1 + magnifierHeight / 2}px`
              }}
            />
          </>
        ) : mode === 'self' ? (
          <div
            style={{
              opacity: showMagnifier ? 1 : 0,
              transition: 'opacity 300ms',
              transitionDelay: '200ms',
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              border: '1px solid lightgrey',
              backgroundColor: 'white',
              borderRadius: '5px',
              backgroundImage: `url('${src}')`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
              backgroundPositionX: `${-x * zoomLevel + x}px`,
              backgroundPositionY: `${-y * zoomLevel + y}px`
            }}
          />
        ) : null}
      </div>
      {mode === 'side' ? (
        <div
          style={{
            display: showMagnifier ? '' : 'none',
            pointerEvents: 'none',
            width: `400px`,
            height: `400px`,
            opacity: '1',
            border: '1px solid lightgrey',
            backgroundColor: 'white',
            borderRadius: '10px',
            backgroundImage: `url('${src}')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
            backgroundPositionX: `${-x * zoomLevel + 200}px`,
            backgroundPositionY: `${-y * zoomLevel + 200}px`
          }}
        />
      ) : null}
    </div>
  )
}

export default ImageMagnifier
