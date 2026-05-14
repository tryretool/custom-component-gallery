import { Scene } from '../types'

export interface HistoryState {
  stack: Scene[]
  index: number
}

const MAX_HISTORY = 50

export const createHistory = (initialScene: Scene): HistoryState => ({
  stack: [initialScene],
  index: 0
})

export const pushState = (history: HistoryState, scene: Scene): HistoryState => {
  // Truncate any future (redo) states
  const newStack = history.stack.slice(0, history.index + 1)
  newStack.push(scene)
  
  // Enforce max length
  if (newStack.length > MAX_HISTORY) {
    newStack.shift()
  }
  
  return {
    stack: newStack,
    index: newStack.length - 1
  }
}

export const undo = (history: HistoryState): HistoryState => {
  if (history.index > 0) {
    return {
      ...history,
      index: history.index - 1
    }
  }
  return history
}

export const redo = (history: HistoryState): HistoryState => {
  if (history.index < history.stack.length - 1) {
    return {
      ...history,
      index: history.index + 1
    }
  }
  return history
}

export const getCurrentScene = (history: HistoryState): Scene => {
  return history.stack[history.index]
}
