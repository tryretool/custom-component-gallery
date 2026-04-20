import React from 'react'
import { type FC } from 'react'
import { type Attachment } from '../types'
import { formatFileSize } from '../utils/formatters'

interface AttachmentListProps {
  attachments: Attachment[]
  showAttachments: boolean
  textColor: string
  padding: number
}

export const AttachmentList: FC<AttachmentListProps> = ({
  attachments,
  showAttachments,
  textColor,
  padding
}) => {
  if (!showAttachments || !attachments || attachments.length === 0) {
    return null
  }

  return (
    <section
      aria-label="Email attachments"
      role="region"
      style={{
        borderTop: `2px solid rgba(0, 0, 0, 0.1)`,
        padding: `${padding * 1.5}px`,
        color: textColor,
        backgroundColor: '#fafafa'
      }}
    >
      <h2 style={{
        marginTop: 0,
        marginBottom: `${padding}px`,
        fontWeight: 600,
        color: textColor,
        fontSize: '1em',
        lineHeight: 'inherit'
      }}>
        Attachments ({attachments.length})
      </h2>
      <ul
        role="list"
        aria-label="Attachment list"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: `${padding}px`
        }}
      >
        {attachments.map((attachment, index) => (
          <li
            key={index}
            role="listitem"
            aria-label={`Attachment: ${attachment.filename}`}
            style={{
              padding: `${padding * 1.2}px`,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px'
            }}
          >
            <div style={{
              fontWeight: 600,
              fontSize: '0.95em',
              marginBottom: '6px',
              color: textColor,
              wordBreak: 'break-word' as const
            }}>
              {attachment.filename}
            </div>
            <div style={{
              fontSize: '0.85em',
              color: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexWrap: 'wrap' as const,
              gap: '8px',
              alignItems: 'center'
            }}>
              <span>{formatFileSize(attachment.size)}</span>
              {attachment.contentType && (
                <>
                  <span style={{ color: 'rgba(0, 0, 0, 0.3)' }}>•</span>
                  <span style={{
                    fontSize: '0.9em',
                    padding: '2px 8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {attachment.contentType}
                  </span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
