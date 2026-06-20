import { describe, it, expect } from 'vitest'
import { createGrid, getPixel, setPixel, clearGrid, colorsMatch } from './src/engine/grid'

describe('createGrid', () => {
  it('creates a grid with correct dimensions', () => {
    const grid = createGrid(32, 32)
    expect(grid.width).toBe(32)
    expect(grid.height).toBe(32)
    expect(grid.pixels.length).toBe(32 * 32 * 4)
  })

  it('initializes all pixels to transparent', () => {
    const grid = createGrid(4, 4)
    for (let i = 0; i < grid.pixels.length; i++) {
      expect(grid.pixels[i]).toBe(0)
    }
  })
})

describe('getPixel / setPixel', () => {
  it('round-trips a pixel correctly', () => {
    const grid = createGrid(4, 4)
    const color = { r: 255, g: 128, b: 64, a: 255 }
    setPixel(grid, 2, 3, color)
    expect(getPixel(grid, 2, 3)).toEqual(color)
  })

  it('does not affect other pixels', () => {
    const grid = createGrid(4, 4)
    setPixel(grid, 0, 0, { r: 255, g: 0, b: 0, a: 255 })
    expect(getPixel(grid, 1, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })
})

describe('clearGrid', () => {
  it('resets all pixels to transparent', () => {
    const grid = createGrid(4, 4)
    setPixel(grid, 0, 0, { r: 255, g: 0, b: 0, a: 255 })
    setPixel(grid, 3, 3, { r: 0, g: 255, b: 0, a: 255 })
    clearGrid(grid)
    expect(getPixel(grid, 0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 })
    expect(getPixel(grid, 3, 3)).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })
})

describe('colorsMatch', () => {
  it('returns true for matching colors', () => {
    expect(colorsMatch(
      { r: 255, g: 128, b: 64, a: 255 },
      { r: 255, g: 128, b: 64, a: 255 }
    )).toBe(true)
  })

  it('returns false for different colors', () => {
    expect(colorsMatch(
      { r: 255, g: 0, b: 0, a: 255 },
      { r: 0, g: 255, b: 0, a: 255 }
    )).toBe(false)
  })
})
