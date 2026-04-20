import type { Bucket } from '../types'

/**
 * Transforms object-of-arrays format to Bucket array
 * Input: { bucket_index: [0,1,2], bucket_min: [0,10,20], bucket_max: [10,20,30], count: [5,3,8] }
 * Output: [{ bucket_index: 0, bucket_min: 0, bucket_max: 10, count: 5 }, ...]
 */
export const transformObjectOfArrays = (
  data: Record<string, unknown>
): Bucket[] => {
  if (
    !Array.isArray(data.bucket_index) ||
    !Array.isArray(data.bucket_min) ||
    !Array.isArray(data.bucket_max) ||
    !Array.isArray(data.count)
  ) {
    return []
  }

  const bucketIndex = data.bucket_index as (number | string)[]
  const bucketMin = data.bucket_min as (number | string)[]
  const bucketMax = data.bucket_max as (number | string)[]
  const count = data.count as (number | string)[]
  const length = bucketIndex.length

  return Array.from({ length }, (_, i) => ({
    bucket_index: Number(bucketIndex[i]),
    bucket_min: Number(bucketMin[i]),
    bucket_max: Number(bucketMax[i]),
    count: Number(count[i])
  }))
}

/**
 * Transforms array containing object-of-arrays format to Bucket array
 * Input: [{ bucket_index: [0,1,2], bucket_min: [0,10,20], bucket_max: [10,20,30], count: [5,3,8] }]
 * Output: [{ bucket_index: 0, bucket_min: 0, bucket_max: 10, count: 5 }, ...]
 */
export const transformArrayWrappedObjectOfArrays = (
  data: unknown[]
): Bucket[] => {
  if (data.length === 0) {
    return []
  }

  const firstItem = data[0]

  if (!firstItem || typeof firstItem !== 'object') {
    return []
  }

  const item = firstItem as Record<string, unknown>

  if (
    Array.isArray(item.bucket_index) &&
    Array.isArray(item.bucket_min) &&
    Array.isArray(item.bucket_max) &&
    Array.isArray(item.count)
  ) {
    return transformObjectOfArrays(item)
  }

  return []
}
