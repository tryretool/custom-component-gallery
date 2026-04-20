import {
  type EmailData,
  type EmailAddress,
  type EmailBody,
  type Attachment
} from '../types'
import { parseEmailWithPostalMime } from './postalMimeAdapter'
import { parseMsgFile, isMsgFormat } from './msgAdapter'
import { parseMboxFile, isMboxFormat } from './mboxAdapter'

export function isEmailAddress(value: unknown): value is EmailAddress {
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    return typeof obj.email === 'string'
  }
  return false
}

export function isEmailBody(value: unknown): value is EmailBody {
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    return (
      (typeof obj.html === 'string' || obj.html === undefined) &&
      (typeof obj.text === 'string' || obj.text === undefined)
    )
  }
  return false
}

export function isAttachment(value: unknown): value is Attachment {
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    return typeof obj.filename === 'string'
  }
  return false
}

function isBase64String(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const trimmed = str.trim()
  if (trimmed.length === 0 || trimmed.length % 4 !== 0) {
    return false
  }

  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  return base64Regex.test(trimmed.replace(/\s/g, ''))
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.trim())
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes.buffer
}

const MAX_INPUT_SIZE_BYTES = 10 * 1024 * 1024

export async function parseEmailData(data: unknown): Promise<EmailData> {
  if (typeof data === 'string') {
    const trimmed = data.trim()

    if (new Blob([trimmed]).size > MAX_INPUT_SIZE_BYTES) {
      console.warn(
        '[EmailViewer] Input rejected: exceeds 10MB size limit'
      )
      return {
        subject: '',
        from: '',
        to: '',
        body: {
          text: 'Email data too large. Maximum supported size is 10MB.'
        },
        attachments: []
      }
    }

    if (trimmed === '') {
      return {
        subject: '',
        from: '',
        to: '',
        body: {},
        attachments: []
      }
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        return await parseEmailData(parsed)
      } catch (e) {
        console.warn('[EmailViewer] JSON parse error:', e)
        const detail =
          e instanceof Error ? e.message : 'Unknown error'
        return {
          subject: '',
          from: '',
          to: '',
          body: { text: `Invalid JSON data: ${detail}` },
          attachments: []
        }
      }
    }

    try {
      if (isBase64String(trimmed)) {
        const arrayBuffer = base64ToArrayBuffer(trimmed)

        if (isMsgFormat(arrayBuffer)) {
          return parseMsgFile(arrayBuffer)
        }

        const decoded = atob(trimmed)
        if (isMboxFormat(decoded)) {
          return await parseMboxFile(decoded)
        }
        return await parseEmailWithPostalMime(decoded)
      }

      if (isMboxFormat(trimmed)) {
        return await parseMboxFile(trimmed)
      }

      return await parseEmailWithPostalMime(trimmed)
    } catch (e) {
      console.warn('[EmailViewer] Email parse error:', e)
      const detail =
        e instanceof Error ? e.message : 'Unknown error'
      return {
        subject: '',
        from: '',
        to: '',
        body: { text: `Error parsing email data: ${detail}` },
        attachments: []
      }
    }
  }

  if (typeof data !== 'object' || data === null) {
    return {
      subject: '',
      from: '',
      to: '',
      body: {},
      attachments: []
    }
  }

  const obj = data as Record<string, unknown>

  const subject = typeof obj.subject === 'string' ? obj.subject : ''

  let from: string | EmailAddress = ''
  if (typeof obj.from === 'string') {
    from = obj.from
  } else if (isEmailAddress(obj.from)) {
    from = obj.from
  }

  let to: string | EmailAddress = ''
  if (typeof obj.to === 'string') {
    to = obj.to
  } else if (isEmailAddress(obj.to)) {
    to = obj.to
  }

  let body: EmailBody = {}
  if (isEmailBody(obj.body)) {
    body = obj.body
  } else if (typeof obj.body === 'object' && obj.body !== null) {
    const bodyObj = obj.body as Record<string, unknown>
    body = {
      html: typeof bodyObj.html === 'string' ? bodyObj.html : undefined,
      text: typeof bodyObj.text === 'string' ? bodyObj.text : undefined
    }
  }

  let attachments: Attachment[] = []
  if (Array.isArray(obj.attachments)) {
    attachments = obj.attachments.filter(isAttachment)
  }

  return {
    subject,
    from,
    to,
    body,
    attachments
  }
}
