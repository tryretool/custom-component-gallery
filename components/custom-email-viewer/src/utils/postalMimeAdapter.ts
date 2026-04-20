import PostalMime from 'postal-mime'
import type { Email, Address, Attachment as PostalAttachment } from 'postal-mime'
import { type EmailData, type EmailAddress, type Attachment } from '../types'

function formatAddress(address: Address | undefined): string | EmailAddress {
  if (!address) return ''

  if ('address' in address && address.address) {
    if (address.name) {
      return {
        email: address.address,
        name: address.name
      }
    }
    return address.address
  }

  return ''
}

function formatAddressArray(addresses: Address[] | undefined): string {
  if (!addresses || addresses.length === 0) return ''

  return addresses
    .map((addr) => {
      if ('address' in addr && addr.address) {
        if (addr.name) {
          return `${addr.name} <${addr.address}>`
        }
        return addr.address
      }
      return ''
    })
    .filter(Boolean)
    .join(', ')
}

function convertAttachment(attachment: PostalAttachment): Attachment {
  const result: Attachment = {
    filename: attachment.filename || 'unnamed'
  }

  if (attachment.content instanceof ArrayBuffer) {
    result.size = attachment.content.byteLength
  } else if (attachment.content instanceof Uint8Array) {
    result.size = attachment.content.length
  } else if (typeof attachment.content === 'string') {
    result.size = new Blob([attachment.content]).size
  }

  if (attachment.mimeType) {
    result.contentType = attachment.mimeType
  }

  return result
}

export function convertPostalMimeToEmailData(email: Email): EmailData {
  const from = formatAddress(email.from)
  const to = formatAddressArray(email.to)
  const cc = formatAddressArray(email.cc)

  const result: EmailData = {
    subject: email.subject || '',
    from,
    to,
    body: {
      html: email.html,
      text: email.text
    },
    attachments: email.attachments.map(convertAttachment)
  }

  if (cc) {
    result.cc = cc
  }

  if (email.date) {
    result.date = new Date(email.date).toLocaleString()
  }

  if (email.headers && typeof email.headers === 'object') {
    const headers = email.headers as Record<string, string | string[]>

    const mailedBy = headers['x-google-smtp-source'] || headers['x-mailer'] || headers['user-agent']
    if (mailedBy) {
      result.mailedBy = Array.isArray(mailedBy) ? mailedBy[0] : mailedBy
    }

    const dkimSignature = headers['dkim-signature']
    if (dkimSignature) {
      const signatureStr = Array.isArray(dkimSignature) ? dkimSignature[0] : dkimSignature
      const dMatch = signatureStr.match(/d=([^;]+)/)
      if (dMatch) {
        result.signedBy = dMatch[1]
      }
    }
  }

  return result
}

export async function parseEmailWithPostalMime(
  emailContent: string
): Promise<EmailData> {
  try {
    const parsed = await PostalMime.parse(emailContent)
    return convertPostalMimeToEmailData(parsed)
  } catch (error) {
    console.warn('[EmailViewer] postal-mime parse error:', error)
    const detail =
      error instanceof Error ? error.message : 'Unknown error'
    return {
      subject: '',
      from: '',
      to: '',
      body: { text: `Error parsing email: ${detail}` },
      attachments: []
    }
  }
}
