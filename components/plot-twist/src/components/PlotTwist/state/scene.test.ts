import { addElement, updateElement, generateId } from './scene'
import { Scene, RectElement } from '../types'
import { describe, it, expect } from 'vitest'

describe('Scene Manager', () => {
  const emptyScene: Scene = { version: 1, elements: [], viewportX: 0, viewportY: 0, zoom: 1 }
  
  it('adds an element', () => {
    const el: RectElement = {
      id: generateId(),
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      strokeColor: 'red',
      fillColor: 'blue',
      strokeWidth: 2,
      opacity: 1,
      createdAt: 123,
      updatedAt: 123
    }
    
    const newScene = addElement(emptyScene, el)
    expect(newScene.elements).toHaveLength(1)
    expect(newScene.elements[0]).toBe(el)
    expect(newScene.version).toBe(2)
  })

  it('updates an element', () => {
    const id = generateId()
    const el: RectElement = {
      id,
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      strokeColor: 'red',
      fillColor: 'blue',
      strokeWidth: 2,
      opacity: 1,
      createdAt: 123,
      updatedAt: 123
    }
    
    let scene = addElement(emptyScene, el)
    scene = updateElement(scene, id, { width: 200 })
    
    expect(scene.elements[0].width).toBe(200)
    expect(scene.elements[0].height).toBe(100) // Unchanged
    expect(scene.version).toBe(3)
  })
})
