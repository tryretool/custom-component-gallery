import { GridData } from './types'

const EXPORT_SIZE = 512

function renderToCanvas(grid: GridData): HTMLCanvasElement {
  const native = document.createElement('canvas')
  native.width = grid.width
  native.height = grid.height
  const nCtx = native.getContext('2d')!
  const imageData = nCtx.createImageData(grid.width, grid.height)
  imageData.data.set(grid.pixels)
  nCtx.putImageData(imageData, 0, 0)

  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_SIZE
  canvas.height = EXPORT_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(native, 0, 0, EXPORT_SIZE, EXPORT_SIZE)
  return canvas
}

export function exportAsPng(grid: GridData): Promise<Blob> {
  const canvas = renderToCanvas(grid)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to export PNG'))
    }, 'image/png')
  })
}

export function gridToDataUrl(grid: GridData): string {
  return renderToCanvas(grid).toDataURL('image/png')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
