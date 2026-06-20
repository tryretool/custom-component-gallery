import { Color, GridData } from './types'

export function createGrid(width: number, height: number): GridData {
  return {
    width,
    height,
    pixels: new Uint8Array(width * height * 4)
  }
}

export function getPixel(grid: GridData, x: number, y: number): Color {
  const i = (y * grid.width + x) * 4
  return {
    r: grid.pixels[i],
    g: grid.pixels[i + 1],
    b: grid.pixels[i + 2],
    a: grid.pixels[i + 3]
  }
}

export function setPixel(grid: GridData, x: number, y: number, color: Color): void {
  const i = (y * grid.width + x) * 4
  grid.pixels[i] = color.r
  grid.pixels[i + 1] = color.g
  grid.pixels[i + 2] = color.b
  grid.pixels[i + 3] = color.a
}

export function clearGrid(grid: GridData): void {
  grid.pixels.fill(0)
}

export function colorsMatch(a: Color, b: Color): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}
