export type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged'

export type FlattenedMap = Record<string, unknown>

export type DiffRow = {
  field: string
  oldValue: unknown
  newValue: unknown
  status: DiffStatus
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const flattenValue = (value: unknown, prefix: string, output: FlattenedMap): void => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      output[prefix] = []
      return
    }
    value.forEach((item, index) => {
      const nextPath = prefix.length > 0 ? `${prefix}[${index}]` : `[${index}]`
      flattenValue(item, nextPath, output)
    })
    return
  }

  if (isRecord(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      output[prefix] = {}
      return
    }
    entries.forEach(([key, nestedValue]) => {
      const nextPath = prefix.length > 0 ? `${prefix}.${key}` : key
      flattenValue(nestedValue, nextPath, output)
    })
    return
  }

  output[prefix] = value
}

export const flattenObject = (value: unknown): FlattenedMap => {
  const output: FlattenedMap = {}

  if (value == null) {
    return output
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, nestedValue]) => {
      flattenValue(nestedValue, key, output)
    })
    return output
  }

  if (Array.isArray(value)) {
    flattenValue(value, 'root', output)
    return output
  }

  output.root = value
  return output
}

export const normalizeDisplayValue = (value: unknown): string => {
  if (value === undefined) {
    return '—'
  }
  if (typeof value === 'string') {
    return value
  }
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    return String(value)
  }
}

const areEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true
  }
  try {
    return JSON.stringify(left) === JSON.stringify(right)
  } catch (error) {
    return false
  }
}

const hasId = (value: unknown): value is { id: string | number } =>
  isRecord(value) && (typeof value.id === 'string' || typeof value.id === 'number')

const shouldCompareArrayById = (oldArray: unknown[], newArray: unknown[]): boolean => {
  const combined = [...oldArray, ...newArray]
  if (combined.length === 0) {
    return false
  }
  return combined.every(hasId)
}

const nextPath = (prefix: string, segment: string): string => (prefix.length > 0 ? `${prefix}.${segment}` : segment)

export const buildDiffRows = (oldData: unknown, newData: unknown): DiffRow[] => {
  const rows: DiffRow[] = []

  const walk = (field: string, oldValue: unknown, newValue: unknown, hasOld: boolean, hasNew: boolean): void => {
    const normalizedField = field.length > 0 ? field : 'root'

    if (hasOld && hasNew && Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (shouldCompareArrayById(oldValue, newValue)) {
        const oldMap = new Map(oldValue.filter(hasId).map((item) => [String(item.id), item]))
        const newMap = new Map(newValue.filter(hasId).map((item) => [String(item.id), item]))
        const allIds = new Set([...oldMap.keys(), ...newMap.keys()])
        ;[...allIds]
          .sort((a, b) => a.localeCompare(b))
          .forEach((id) => {
            walk(
              `${normalizedField}[id=${id}]`,
              oldMap.get(id),
              newMap.get(id),
              oldMap.has(id),
              newMap.has(id)
            )
          })
        return
      }

      const maxLength = Math.max(oldValue.length, newValue.length)
      for (let index = 0; index < maxLength; index += 1) {
        walk(
          `${normalizedField}[${index}]`,
          oldValue[index],
          newValue[index],
          index < oldValue.length,
          index < newValue.length
        )
      }
      return
    }

    if (hasOld && hasNew && isRecord(oldValue) && isRecord(newValue)) {
      const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])
      ;[...keys]
        .sort((a, b) => a.localeCompare(b))
        .forEach((key) => {
          walk(
            nextPath(normalizedField === 'root' ? '' : normalizedField, key),
            oldValue[key],
            newValue[key],
            Object.prototype.hasOwnProperty.call(oldValue, key),
            Object.prototype.hasOwnProperty.call(newValue, key)
          )
        })
      return
    }

    if (!hasOld && hasNew && (Array.isArray(newValue) || isRecord(newValue))) {
      if (Array.isArray(newValue)) {
        if (newValue.length === 0) {
          rows.push({ field: normalizedField, oldValue: undefined, newValue, status: 'added' })
          return
        }
        newValue.forEach((item, index) => {
          if (hasId(item)) {
            walk(`${normalizedField}[id=${String(item.id)}]`, undefined, item, false, true)
          } else {
            walk(`${normalizedField}[${index}]`, undefined, item, false, true)
          }
        })
        return
      }
      const keys = Object.keys(newValue)
      if (keys.length === 0) {
        rows.push({ field: normalizedField, oldValue: undefined, newValue, status: 'added' })
        return
      }
      keys.sort((a, b) => a.localeCompare(b)).forEach((key) => {
        walk(nextPath(normalizedField === 'root' ? '' : normalizedField, key), undefined, newValue[key], false, true)
      })
      return
    }

    if (hasOld && !hasNew && (Array.isArray(oldValue) || isRecord(oldValue))) {
      if (Array.isArray(oldValue)) {
        if (oldValue.length === 0) {
          rows.push({ field: normalizedField, oldValue, newValue: undefined, status: 'removed' })
          return
        }
        oldValue.forEach((item, index) => {
          if (hasId(item)) {
            walk(`${normalizedField}[id=${String(item.id)}]`, item, undefined, true, false)
          } else {
            walk(`${normalizedField}[${index}]`, item, undefined, true, false)
          }
        })
        return
      }
      const keys = Object.keys(oldValue)
      if (keys.length === 0) {
        rows.push({ field: normalizedField, oldValue, newValue: undefined, status: 'removed' })
        return
      }
      keys.sort((a, b) => a.localeCompare(b)).forEach((key) => {
        walk(nextPath(normalizedField === 'root' ? '' : normalizedField, key), oldValue[key], undefined, true, false)
      })
      return
    }

    let status: DiffStatus = 'unchanged'
    if (!hasOld && hasNew) {
      status = 'added'
    } else if (hasOld && !hasNew) {
      status = 'removed'
    } else if (!areEqual(oldValue, newValue)) {
      status = 'changed'
    }

    rows.push({
      field: normalizedField,
      oldValue,
      newValue,
      status
    })
  }

  walk('', oldData, newData, oldData !== undefined, newData !== undefined)
  return rows.sort((a, b) => a.field.localeCompare(b.field))
}
