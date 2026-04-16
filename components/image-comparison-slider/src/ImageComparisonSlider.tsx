import { FC, useCallback, useRef, useState } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import styles from './ImageComparisonSlider.module.css'

const FALLBACK_BEFORE_IMAGE =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80&auto=format&fit=crop'
const FALLBACK_AFTER_IMAGE =
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600&q=80&auto=format&fit=crop'

export const ImageComparisonSlider: FC = () => {
  const [beforeImageUrl] = Retool.useStateString({
    name: 'beforeImageUrl',
    label: 'Before image URL',
    description: 'URL for the before image. Supports Retool Storage URLs.',
    initialValue:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80&auto=format&fit=crop',
  })
  const [afterImageUrl] = Retool.useStateString({
    name: 'afterImageUrl',
    label: 'After image URL',
    description: 'URL for the after image. Supports Retool Storage URLs.',
    initialValue:
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600&q=80&auto=format&fit=crop',
  })

  const beforeSrc = beforeImageUrl?.trim() || FALLBACK_BEFORE_IMAGE
  const afterSrc = afterImageUrl?.trim() || FALLBACK_AFTER_IMAGE

  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    if (rect.width === 0) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, pct)))
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsDragging(true)
      updatePosition(e.clientX)
    },
    [updatePosition]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
      updatePosition(e.clientX)
    },
    [updatePosition]
  )

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setIsDragging(false)
  }, [])

  return (
    <div className={styles.container} ref={containerRef}>
      <img src={afterSrc} className={styles.image} alt="" draggable={false} />
      <div
        className={styles.beforeWrapper}
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img src={beforeSrc} className={styles.image} alt="" draggable={false} />
      </div>
      <div
        className={`${styles.divider} ${isDragging ? styles.dragging : ''}`}
        style={{ left: `${position}%` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label="Image comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
      >
        <div className={styles.line} />
        <div className={styles.handle}>
          <span className={`${styles.arrow} ${styles.arrowLeft}`} />
          <span className={`${styles.arrow} ${styles.arrowRight}`} />
        </div>
      </div>
    </div>
  )
}
