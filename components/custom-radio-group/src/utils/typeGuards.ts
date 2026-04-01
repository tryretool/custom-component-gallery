import { Retool } from '@tryretool/custom-component-support'

type SerializableObject = Retool.SerializableObject
type SerializableType = Retool.SerializableType

/**
 * Type guard to check if an item is a group header
 * @param item - The item to check
 * @returns True if the item is a group header
 */
export const isGroupHeader = (
  item: SerializableType
): item is SerializableObject => {
  return (
    item !== null &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    'type' in item &&
    item.type === 'header'
  )
}

/**
 * Type guard to check if an item is a valid radio option
 * @param item - The item to check
 * @returns True if the item is a valid radio option with required properties
 */
export const isValidRadioOption = (
  item: SerializableType
): item is SerializableObject => {
  return (
    item !== null &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    'id' in item &&
    'title' in item &&
    !('type' in item && item.type === 'header')
  )
}

/**
 * Evaluates a conditional display expression (showIf)
 * @param expression - JavaScript expression string to evaluate
 * @returns Boolean result of the expression, or true if evaluation fails
 */
export const evaluateShowIf = (expression: string): boolean => {
  if (!expression || typeof expression !== 'string') {
    return true
  }
  try {
    // Create a safe evaluation function
    // eslint-disable-next-line no-new-func
    const evalFunc = new Function('return ' + expression)
    return Boolean(evalFunc())
  } catch (error) {
    console.warn('Failed to evaluate showIf expression:', expression, error)
    return true // Show by default if evaluation fails
  }
}
