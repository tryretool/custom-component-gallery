export type ToolType = 'pen' | 'rectangle' | 'ellipse' | 'line' | 'text' | 'select' | 'pan'

export type Point = [number, number]
export type PressurePoint = [number, number, number]

export interface BaseElement {
  id: string
  type: ToolType
  x: number
  y: number
  strokeColor: string
  fillColor: string
  strokeWidth: number
  opacity: number
  createdBy?: string
  createdAt: number
  updatedAt: number
  seed?: number
}

export interface PenElement extends BaseElement {
  type: 'pen'
  points: PressurePoint[]
}

export interface RectElement extends BaseElement {
  type: 'rectangle'
  width: number
  height: number
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse'
  width: number
  height: number
}

export interface LineElement extends BaseElement {
  type: 'line'
  points: Point[]
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
}

export type SceneElement = PenElement | RectElement | EllipseElement | LineElement | TextElement

export interface Scene {
  version: number
  elements: SceneElement[]
  viewportX: number
  viewportY: number
  zoom: number
}
