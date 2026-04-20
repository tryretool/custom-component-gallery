import { parseEmailWithPostalMime } from './postalMimeAdapter'
import { type EmailData } from '../types'

const MBOX_SEPARATOR_REGEX = /^From\s+\S+/

export function isMboxFormat(data: string): boolean {
  if (!data || typeof data !== 'string') return false

  const trimmed = data.trim()
  return MBOX_SEPARATOR_REGEX.test(trimmed)
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function isFromSeparator(line: string): boolean {
  const trimmedLine = line.trimStart()
  return MBOX_SEPARATOR_REGEX.test(trimmedLine)
}

function unescapeFromLines(line: string): string {
  if (line.startsWith('>From ')) {
    return line.substring(1)
  }
  if (line.startsWith('>>From ')) {
    return line.substring(1)
  }
  return line
}

function extractFirstEmailFromMbox(mboxContent: string): string | null {
  const normalized = normalizeLineEndings(mboxContent)
  const lines = normalized.split('\n')
  const emailLines: string[] = []
  let inEmail = false
  let foundFirstEmail = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (isFromSeparator(line)) {
      if (foundFirstEmail) {
        break
      }
      inEmail = true
      foundFirstEmail = true
      continue
    }

    if (inEmail) {
      const unescapedLine = unescapeFromLines(line)
      emailLines.push(unescapedLine)
    }
  }

  if (emailLines.length === 0) {
    return null
  }

  const emailContent = emailLines.join('\n').trim()

  if (emailContent.length === 0) {
    return null
  }

  return emailContent
}

export async function parseMboxFile(
  data: string | ArrayBuffer
): Promise<EmailData> {
  try {
    let mboxContent: string

    if (data instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8')
      mboxContent = decoder.decode(data)
    } else {
      mboxContent = data
    }

    if (!isMboxFormat(mboxContent)) {
      return {
        subject: '',
        from: '',
        to: '',
        body: { text: 'Invalid mbox format' },
        attachments: []
      }
    }

    const firstEmail = extractFirstEmailFromMbox(mboxContent)

    if (!firstEmail) {
      return {
        subject: '',
        from: '',
        to: '',
        body: { text: 'No emails found in mbox file' },
        attachments: []
      }
    }

    return await parseEmailWithPostalMime(firstEmail)
  } catch (error) {
    console.warn('[EmailViewer] mbox parse error:', error)
    const detail =
      error instanceof Error ? error.message : 'Unknown error'
    return {
      subject: '',
      from: '',
      to: '',
      body: { text: `Error parsing mbox file: ${detail}` },
      attachments: []
    }
  }
}
