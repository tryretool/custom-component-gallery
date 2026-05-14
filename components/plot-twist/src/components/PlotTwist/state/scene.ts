import { Scene, SceneElement } from '../types'

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function addElement(scene: Scene, element: SceneElement): Scene {
  return {
    ...scene,
    version: scene.version + 1,
    elements: [...scene.elements, element]
  }
}

export function updateElement(scene: Scene, id: string, changes: Partial<SceneElement>): Scene {
  return {
    ...scene,
    version: scene.version + 1,
    elements: scene.elements.map(el => el.id === id ? { ...el, ...changes } as SceneElement : el)
  }
}

export function deleteElement(scene: Scene, id: string): Scene {
  return {
    ...scene,
    version: scene.version + 1,
    elements: scene.elements.filter(el => el.id !== id)
  }
}
