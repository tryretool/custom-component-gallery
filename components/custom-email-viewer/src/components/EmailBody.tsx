import React, { useMemo } from 'react'
import { type FC } from 'react'
import { type EmailBody as EmailBodyType, type StyleConfig } from '../types'
import { getEmailContent } from '../utils/emailContent'
import {
  detectHtmlSignature,
  detectPlainTextSignature
} from '../utils/signatureDetection'
import { sanitizeHtml } from '../utils/sanitize'

interface EmailBodyProps {
  body: EmailBodyType
  showSignature: boolean
  styles: StyleConfig
  allowRemoteImages: boolean
}

export const EmailBody: FC<EmailBodyProps> = ({
  body,
  showSignature,
  styles,
  allowRemoteImages
}) => {
  const { content, contentType } = useMemo(
    () => getEmailContent(body),
    [body]
  )

  const signatureDetection = useMemo(() => {
    if (!content) {
      return {
        contentWithoutSignature: '',
        signature: '',
        hasSignature: false
      }
    }
    return contentType === 'html'
      ? detectHtmlSignature(content)
      : detectPlainTextSignature(content)
  }, [content, contentType])

  const rawDisplayContent =
    showSignature || !signatureDetection.hasSignature
      ? content
      : signatureDetection.contentWithoutSignature

  const displayContent = useMemo(() => {
    if (!rawDisplayContent) return ''
    if (contentType === 'html') {
      return sanitizeHtml(rawDisplayContent, { allowRemoteImages })
    }
    return rawDisplayContent
  }, [rawDisplayContent, contentType, allowRemoteImages])

  if (!displayContent) {
    return (
      <section
        role="region"
        aria-label="Email body"
        style={{
          padding: `${styles.padding * 1.5}px`,
          fontFamily: styles.fontFamily,
          fontSize: `${styles.fontSize}px`,
          color: 'rgba(0, 0, 0, 0.4)',
          fontStyle: 'italic',
          textAlign: 'center' as const,
          paddingTop: `${styles.padding * 3}px`
        }}
      >
        (No content)
      </section>
    )
  }

  if (contentType === 'html') {
    return (
      <section
        role="region"
        aria-label="Email body"
        style={{
          padding: `${styles.padding * 1.5}px`,
          flex: 1,
          minWidth: 0,
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
          backgroundColor: '#ffffff'
        }}
      >
        <div
          style={{
            fontFamily: styles.fontFamily,
            fontSize: `${styles.fontSize}px`,
            color: styles.textColor,
            lineHeight: '1.7',
            maxWidth: '100%'
          }}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        <style>{`
          .email-viewer-body img {
            max-width: 100%;
            height: auto;
          }
        `}</style>
      </section>
    )
  }

  return (
    <section
      role="region"
      aria-label="Email body"
      style={{
        padding: `${styles.padding * 1.5}px`,
        flex: 1,
        minWidth: 0,
        backgroundColor: '#ffffff'
      }}
    >
      <pre
        style={{
          fontFamily: styles.fontFamily,
          fontSize: `${styles.fontSize}px`,
          color: styles.textColor,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          margin: 0,
          lineHeight: '1.7',
          overflowWrap: 'break-word'
        }}
      >
        {displayContent}
      </pre>
    </section>
  )
}
