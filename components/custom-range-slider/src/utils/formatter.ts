// Declare global window interface extension for moment
declare global {
  interface Window {
    moment?: typeof import('moment')
  }
}

/**
 * Creates a value formatter function from a string representation
 * Supports access to the moment library if available in Retool context
 * Falls back to numeric display if formatter fails
 */
export const createFormatter = (
  formatterString: string
): ((value: number) => string) => {
  if (!formatterString || formatterString.trim() === '') {
    return (value: number) => value.toString()
  }

  try {
    // Check if moment is available in the global scope (Retool environment)
    const momentAvailable = typeof window.moment !== 'undefined'

    // Create the formatter function with access to moment if available
    const formatterFunc = new Function(
      'value',
      'moment',
      `
      try {
        const formatter = ${formatterString};
        return formatter(value);
      } catch (error) {
        console.warn('Formatter function error:', error);
        return value.toString();
      }
    `
    )

    return (value: number) => {
      try {
        const moment = momentAvailable ? window.moment : undefined
        const result = formatterFunc(value, moment)
        return result !== undefined && result !== null
          ? String(result)
          : value.toString()
      } catch (error) {
        console.warn('Error executing formatter:', error)
        return value.toString()
      }
    }
  } catch (error) {
    console.error('Error creating formatter function:', error)
    return (value: number) => value.toString()
  }
}

/**
 * Default color theme
 */
export const DEFAULT_COLORS = {
  primary: '#f97316',
  primaryLight: '#fb923c',
  secondary: '#d1d5db',
  background: '#f3f4f6',
  text: '#1f2937',
  tooltip: '#1f2937'
}
