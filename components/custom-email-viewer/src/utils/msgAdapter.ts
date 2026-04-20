import MsgReader from '@kenjiuno/msgreader'
import type { FieldsData, AttachmentData } from '@kenjiuno/msgreader'
import { type EmailData, type Attachment } from '../types'

function formatRecipientEmail(recipient: FieldsData): string {
  const name = recipient.name || ''
  const email = recipient.email || recipient.smtpAddress || ''

  if (!email) return name

  if (name && name !== email) {
    return `${name} <${email}>`
  }

  return email
}

function getRecipientsString(
  recipients: FieldsData[] | undefined,
  type: 'to' | 'cc' | 'bcc'
): string {
  if (!recipients) return ''

  const filtered = recipients.filter((r) => r.recipType === type)

  return filtered.map(formatRecipientEmail).filter(Boolean).join(', ')
}

function convertAttachment(
  att: FieldsData,
  reader: MsgReader
): Attachment | null {
  try {
    const attachmentData: AttachmentData = reader.getAttachment(att)
    const result: Attachment = {
      filename: attachmentData.fileName || att.fileName || 'unnamed'
    }

    if (att.contentLength !== undefined) {
      result.size = att.contentLength
    }

    if (att.attachMimeTag) {
      result.contentType = att.attachMimeTag
    } else if (att.extension) {
      result.contentType = `application/${att.extension.replace('.', '') || 'octet-stream'}`
    }

    return result
  } catch (e) {
    const result: Attachment = {
      filename: att.fileName || 'unnamed'
    }

    if (att.contentLength !== undefined) {
      result.size = att.contentLength
    }

    if (att.attachMimeTag) {
      result.contentType = att.attachMimeTag
    }

    return result
  }
}

export function parseMsgFile(arrayBuffer: ArrayBuffer): EmailData {
  try {
    const msgReader = new MsgReader(arrayBuffer)
    const fileData: FieldsData = msgReader.getFileData()

    if (fileData.error) {
      return {
        subject: '',
        from: '',
        to: '',
        body: { text: `Error parsing MSG file: ${fileData.error}` },
        attachments: []
      }
    }

    const subject = fileData.subject || ''

    const senderEmail = fileData.senderEmail || fileData.senderSmtpAddress || ''
    const senderName = fileData.senderName || ''
    const from =
      senderName && senderEmail && senderName !== senderEmail
        ? `${senderName} <${senderEmail}>`
        : senderEmail || senderName || ''

    const to = getRecipientsString(fileData.recipients, 'to')
    const cc = getRecipientsString(fileData.recipients, 'cc')

    let htmlBody: string | undefined
    if (fileData.bodyHtml) {
      htmlBody = fileData.bodyHtml
    } else if (fileData.html) {
      htmlBody = new TextDecoder().decode(fileData.html)
    }

    const body = {
      html: htmlBody,
      text: fileData.body
    }

    const attachments: Attachment[] = []
    if (fileData.attachments) {
      for (const att of fileData.attachments) {
        if (att.attachmentHidden) continue

        const converted = convertAttachment(att, msgReader)
        if (converted) {
          attachments.push(converted)
        }
      }
    }

    const result: EmailData = {
      subject,
      from,
      to,
      body,
      attachments
    }

    if (cc) {
      result.cc = cc
    }

    if (fileData.clientSubmitTime) {
      result.date = new Date(fileData.clientSubmitTime).toLocaleString()
    } else if (fileData.messageDeliveryTime) {
      result.date = new Date(fileData.messageDeliveryTime).toLocaleString()
    }

    if (fileData.transportMessageHeaders) {
      const headers = fileData.transportMessageHeaders

      const mailedByMatch = headers.match(/X-Mailer:\s*([^\r\n]+)/i)
      if (mailedByMatch) {
        result.mailedBy = mailedByMatch[1].trim()
      }

      const dkimMatch = headers.match(/DKIM-Signature:.*?d=([^;]+)/i)
      if (dkimMatch) {
        result.signedBy = dkimMatch[1].trim()
      }
    }

    return result
  } catch (error) {
    console.warn('[EmailViewer] MSG parse error:', error)
    return {
      subject: '',
      from: '',
      to: '',
      body: {
        text: `Failed to parse MSG file: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      attachments: []
    }
  }
}

export function isMsgFormat(data: ArrayBuffer): boolean {
  if (data.byteLength < 8) return false

  const header = new Uint8Array(data, 0, 8)

  const cfbSignature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]

  for (let i = 0; i < 8; i++) {
    if (header[i] !== cfbSignature[i]) {
      return false
    }
  }

  return true
}
