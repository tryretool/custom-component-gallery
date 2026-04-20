import { type EmailAddress } from '../types'

export function formatEmailAddress(
  address: string | EmailAddress | undefined
): string {
  if (!address) return ''
  if (typeof address === 'string') return address
  if (address.name) return `${address.name} <${address.email}>`
  return address.email
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
