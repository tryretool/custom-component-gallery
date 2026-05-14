import { describe, it, expect } from 'vitest'
import { screenToWorld, worldToScreen } from './viewport'
import { Scene } from '../types'

describe('Viewport Coordinate Math', () => {
  const defaultScene: Scene = { version: 1, elements: [], viewportX: 0, viewportY: 0, zoom: 1 }

  it('handles basic 1:1 scale at origin', () => {
    const screen = { x: 100, y: 150 }
    const world = screenToWorld(screen.x, screen.y, defaultScene)
    expect(world).toEqual({ x: 100, y: 150 })
    
    const backToScreen = worldToScreen(world.x, world.y, defaultScene)
    expect(backToScreen).toEqual(screen)
  })

  it('correctly maps coordinates when zoomed in (2x)', () => {
    const zoomedScene: Scene = { ...defaultScene, zoom: 2 }
    
    // If we click pixel 200 on screen while zoomed in 2x, 
    // we are actually clicking pixel 100 in the world!
    const screen = { x: 200, y: 400 }
    const world = screenToWorld(screen.x, screen.y, zoomedScene)
    
    expect(world.x).toBe(100)
    expect(world.y).toBe(200)
    
    // Reverse it back
    const backToScreen = worldToScreen(world.x, world.y, zoomedScene)
    expect(backToScreen).toEqual(screen)
  })

  it('correctly maps coordinates when panned', () => {
    // Panned 500 pixels to the right
    const pannedScene: Scene = { ...defaultScene, viewportX: 500, viewportY: -100 }
    
    // If we click pixel 100 on screen, but we have panned 500 right,
    // we are actually clicking at -400 in the world!
    const screen = { x: 100, y: 100 }
    const world = screenToWorld(screen.x, screen.y, pannedScene)
    
    expect(world.x).toBe(-400)
    expect(world.y).toBe(200)
  })

  it('correctly maps complex zoom + pan simultaneously', () => {
    const complexScene: Scene = { ...defaultScene, viewportX: 500, viewportY: 100, zoom: 0.5 }
    
    // Zoomed out by half, panned 500 right.
    const screen = { x: 600, y: 150 }
    const world = screenToWorld(screen.x, screen.y, complexScene)
    
    expect(world.x).toBe(200) // (600 - 500) / 0.5
    expect(world.y).toBe(100) // (150 - 100) / 0.5
    
    const backToScreen = worldToScreen(world.x, world.y, complexScene)
    expect(backToScreen).toEqual(screen)
  })
})
