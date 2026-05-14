import { createHistory, pushState, undo, redo, getCurrentScene } from './history'
import { describe, it, expect } from 'vitest'

describe('History State Manager', () => {
  const initialScene = { version: 1, elements: [], viewportX: 0, viewportY: 0, zoom: 1 }

  it('initializes correctly', () => {
    const history = createHistory(initialScene)
    expect(history.index).toBe(0)
    expect(history.stack).toHaveLength(1)
    expect(getCurrentScene(history)).toBe(initialScene)
  })

  it('pushes a new state', () => {
    let history = createHistory(initialScene)
    const nextScene = { ...initialScene, version: 2 }
    history = pushState(history, nextScene)
    
    expect(history.index).toBe(1)
    expect(history.stack).toHaveLength(2)
    expect(getCurrentScene(history)).toBe(nextScene)
  })

  it('undoes and redoes correctly', () => {
    let history = createHistory(initialScene)
    const scene2 = { ...initialScene, version: 2 }
    const scene3 = { ...initialScene, version: 3 }
    
    history = pushState(history, scene2)
    history = pushState(history, scene3)
    
    history = undo(history)
    expect(history.index).toBe(1)
    expect(getCurrentScene(history)).toBe(scene2)
    
    history = undo(history)
    expect(history.index).toBe(0)
    expect(getCurrentScene(history)).toBe(initialScene)
    
    history = redo(history)
    expect(history.index).toBe(1)
    expect(getCurrentScene(history)).toBe(scene2)
  })

  it('drops future states on push', () => {
    let history = createHistory(initialScene)
    const scene2 = { ...initialScene, version: 2 }
    const scene3 = { ...initialScene, version: 3 }
    const alternateScene = { ...initialScene, version: 4 }
    
    history = pushState(history, scene2)
    history = pushState(history, scene3)
    
    // Undo to scene2
    history = undo(history)
    
    // Push new path
    history = pushState(history, alternateScene)
    
    expect(history.stack).toHaveLength(3)
    expect(history.index).toBe(2)
    expect(history.stack[2]).toBe(alternateScene)
  })
})
