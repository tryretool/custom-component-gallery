import { Scene } from '../types'

export const screenToWorld = (screenX: number, screenY: number, scene: Scene) => {
  return {
    x: (screenX - scene.viewportX) / scene.zoom,
    y: (screenY - scene.viewportY) / scene.zoom
  }
}

export const worldToScreen = (worldX: number, worldY: number, scene: Scene) => {
  return {
    x: worldX * scene.zoom + scene.viewportX,
    y: worldY * scene.zoom + scene.viewportY
  }
}
