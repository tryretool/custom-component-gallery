export type Tool = 'draw' | 'erase' | 'fill'

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export interface GridData {
  width: number
  height: number
  pixels: Uint8Array // length = width * height * 4 (RGBA)
}

export interface RenderOptions {
  showGrid: boolean
  cursorX: number | null
  cursorY: number | null
  currentColor: Color
  currentTool: Tool
}
