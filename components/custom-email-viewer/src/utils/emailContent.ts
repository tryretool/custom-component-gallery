import { type EmailBody } from '../types'

export function getEmailContent(body: EmailBody): {
  content: string
  contentType: 'html' | 'text'
} {
  if (body.html && body.html.trim().length > 0) {
    return { content: body.html, contentType: 'html' }
  }
  if (body.text && body.text.trim().length > 0) {
    return { content: body.text, contentType: 'text' }
  }
  return { content: '', contentType: 'text' }
}
