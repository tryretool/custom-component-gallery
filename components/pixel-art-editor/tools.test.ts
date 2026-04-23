import { describe, it, expect } from 'vitest'
import { createGrid, getPixel, setPixel } from './src/engine/grid'
import { applyDraw, applyErase, applyFill, getLinePoints } from './src/engine/tools'

const RED = { r: 255, g: 0, b: 0, a: 255 }
const BLUE = { r: 0, g: 0, b: 255, a: 255 }
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 }

describe('applyDraw', () => {
  it('sets a pixel to the given color', () => {
    const grid = createGrid(4, 4)
    applyDraw(grid, 1, 2, RED)
    expect(getPixel(grid, 1, 2)).toEqual(RED)
  })

  it('ignores out-of-bounds coordinates', () => {
    const grid = createGrid(4, 4)
    applyDraw(grid, -1, 0, RED)
    applyDraw(grid, 4, 0, RED)
    // No error thrown, grid unchanged
    expect(getPixel(grid, 0, 0)).toEqual(TRANSPARENT)
  })
})

describe('applyErase', () => {
  it('sets a pixel to transparent', () => {
    const grid = createGrid(4, 4)
    applyDraw(grid, 1, 1, RED)
    applyErase(grid, 1, 1)
    expect(getPixel(grid, 1, 1)).toEqual(TRANSPARENT)
  })
})

describe('applyFill', () => {
  it('fills an empty grid entirely', () => {
    const grid = createGrid(4, 4)
    applyFill(grid, 0, 0, RED)
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        expect(getPixel(grid, x, y)).toEqual(RED)
      }
    }
  })

  it('fills only the connected region', () => {
    const grid = createGrid(4, 4)
    // Draw a vertical blue wall at x=2
    for (let y = 0; y < 4; y++) {
      setPixel(grid, 2, y, BLUE)
    }
    // Fill left side with red
    applyFill(grid, 0, 0, RED)
    // Left side should be red
    expect(getPixel(grid, 0, 0)).toEqual(RED)
    expect(getPixel(grid, 1, 1)).toEqual(RED)
    // Wall should still be blue
    expect(getPixel(grid, 2, 0)).toEqual(BLUE)
    // Right side should still be transparent
    expect(getPixel(grid, 3, 0)).toEqual(TRANSPARENT)
  })

  it('is a no-op when fill color matches target', () => {
    const grid = createGrid(4, 4)
    applyDraw(grid, 0, 0, RED)
    applyFill(grid, 0, 0, RED)
    // Should not infinite loop, just return
    expect(getPixel(grid, 0, 0)).toEqual(RED)
  })

  it('ignores out-of-bounds coordinates', () => {
    const grid = createGrid(4, 4)
    applyFill(grid, -1, 0, RED)
    expect(getPixel(grid, 0, 0)).toEqual(TRANSPARENT)
  })
})

describe('getLinePoints', () => {
  it('returns a single point for same start and end', () => {
    expect(getLinePoints(2, 3, 2, 3)).toEqual([[2, 3]])
  })

  it('returns correct points for a horizontal line', () => {
    const points = getLinePoints(0, 0, 3, 0)
    expect(points).toEqual([[0, 0], [1, 0], [2, 0], [3, 0]])
  })

  it('returns correct points for a vertical line', () => {
    const points = getLinePoints(0, 0, 0, 3)
    expect(points).toEqual([[0, 0], [0, 1], [0, 2], [0, 3]])
  })

  it('returns correct points for a diagonal line', () => {
    const points = getLinePoints(0, 0, 2, 2)
    expect(points).toEqual([[0, 0], [1, 1], [2, 2]])
  })
})
