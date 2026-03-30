import React, { useCallback, useRef, useState } from 'react'
import { type FC } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import Webcam from 'react-webcam'

type FilterName = 'none' | 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast' | 'invert' | 'saturate'

const FILTERS: { name: FilterName; label: string; css: string }[] = [
    { name: 'none', label: 'None', css: 'none' },
    { name: 'grayscale', label: 'Grayscale', css: 'grayscale(100%)' },
    { name: 'sepia', label: 'Sepia', css: 'sepia(100%)' },
    { name: 'blur', label: 'Blur', css: 'blur(3px)' },
    { name: 'brightness', label: 'Bright', css: 'brightness(1.4)' },
    { name: 'contrast', label: 'Contrast', css: 'contrast(1.6)' },
    { name: 'invert', label: 'Invert', css: 'invert(100%)' },
    { name: 'saturate', label: 'Saturate', css: 'saturate(2)' },
]

export const WebcamCapture: FC = () => {
    const webcamRef = useRef<Webcam>(null)
    const [activeFilter, setActiveFilter] = useState<FilterName>('none')
    const [mirrored, setMirrored] = useState(true)
    const [showPreview, setShowPreview] = useState(false)

    // Retool state: expose captured image as base64
    const [capturedImage, setCapturedImage] = Retool.useStateString({
        name: 'capturedImage',
        initialValue: '',
        inspector: 'hidden',
        label: 'Captured Image (Base64)',
    })

    // Retool state: expose active filter name
    const [_filterName, setFilterName] = Retool.useStateString({
        name: 'activeFilter',
        initialValue: 'none',
        inspector: 'hidden',
        label: 'Active Filter',
    })

    // Retool event: fires when a photo is captured
    const onCapture = Retool.useEventCallback({ name: 'capture' })

    const currentFilter = FILTERS.find((f) => f.name === activeFilter) ?? FILTERS[0]

    const capture = useCallback(() => {
        if (!webcamRef.current) return

        // Create a canvas to apply the filter to the captured image
        const video = webcamRef.current.video
        if (!video) return

        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Apply filter and mirror
        if (currentFilter.css !== 'none') {
            ctx.filter = currentFilter.css
        }
        if (mirrored) {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const base64 = canvas.toDataURL('image/png')
        setCapturedImage(base64)
        setFilterName(activeFilter)
        setShowPreview(true)
        onCapture()
    }, [activeFilter, currentFilter, mirrored, setCapturedImage, setFilterName, onCapture])

    const clearCapture = useCallback(() => {
        setCapturedImage('')
        setShowPreview(false)
    }, [setCapturedImage])

    const handleFilterChange = (filterName: FilterName) => {
        setActiveFilter(filterName)
        setFilterName(filterName)
    }

    return (
        <div style={styles.container}>
            {/* Camera Feed */}
            <div style={styles.videoContainer}>
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/png"
                    mirrored={mirrored}
                    style={{
                        ...styles.video,
                        filter: currentFilter.css !== 'none' ? currentFilter.css : undefined,
                    }}
                    videoConstraints={{
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    }}
                />

                {/* Captured image preview overlay */}
                {showPreview && capturedImage && (
                    <div style={styles.previewOverlay}>
                        <img src={capturedImage} alt="Captured" style={styles.previewImage} />
                        <button style={styles.dismissButton} onClick={clearCapture}>
                            &times;
                        </button>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={styles.controls}>
                {/* Filter pills */}
                <div style={styles.filterRow}>
                    {FILTERS.map((f) => (
                        <button
                            key={f.name}
                            onClick={() => handleFilterChange(f.name)}
                            style={{
                                ...styles.filterPill,
                                ...(activeFilter === f.name ? styles.filterPillActive : {}),
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Action buttons */}
                <div style={styles.actionRow}>
                    <button
                        style={{
                            ...styles.button,
                            ...styles.mirrorButton,
                            ...(mirrored ? styles.mirrorButtonActive : {}),
                        }}
                        onClick={() => setMirrored(!mirrored)}
                    >
                        {mirrored ? '⟷ Mirrored' : '⟷ Normal'}
                    </button>

                    <button style={{ ...styles.button, ...styles.captureButton }} onClick={capture}>
                        📸 Capture
                    </button>

                    {capturedImage && (
                        <button style={{ ...styles.button, ...styles.clearButton }} onClick={clearCapture}>
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#ffffff',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid #d5d8dc',
    },
    videoContainer: {
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        background: '#f0f1f3',
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
    },
    previewOverlay: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 10,
    },
    previewImage: {
        maxWidth: '90%',
        maxHeight: '90%',
        borderRadius: 4,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
    },
    dismissButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'rgba(0,0,0,0.4)',
        border: 'none',
        color: '#fff',
        fontSize: 24,
        width: 36,
        height: 36,
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    controls: {
        padding: '12px 16px',
        background: '#f7f8fa',
        borderTop: '1px solid #d5d8dc',
    },
    filterRow: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    filterPill: {
        padding: '5px 12px',
        borderRadius: 20,
        border: '1px solid #d5d8dc',
        background: '#ffffff',
        color: '#5c6470',
        fontSize: 12,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    filterPillActive: {
        background: '#e8f0fe',
        borderColor: '#4c90f0',
        color: '#2d72d2',
    },
    actionRow: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
    },
    button: {
        padding: '8px 16px',
        borderRadius: 4,
        border: '1px solid #d5d8dc',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    captureButton: {
        background: '#2d72d2',
        borderColor: '#2d72d2',
        color: '#fff',
        flex: 1,
    },
    mirrorButton: {
        background: '#ffffff',
        color: '#5c6470',
    },
    mirrorButtonActive: {
        background: '#e8f0fe',
        borderColor: '#4c90f0',
        color: '#2d72d2',
    },
    clearButton: {
        background: '#ffffff',
        color: '#5c6470',
    },
}
