import React from 'react'
import { type FC } from 'react'
import { type EmailAddress } from '../types'
import { formatEmailAddress } from '../utils/formatters'

interface EmailHeaderProps {
  subject: string
  from: string | EmailAddress
  to: string
  cc?: string
  date?: string
  mailedBy?: string
  signedBy?: string
  headerBackgroundColor: string
  textColor: string
  padding: number
}

export const EmailHeader: FC<EmailHeaderProps> = ({
  subject,
  from,
  to,
  cc,
  date,
  mailedBy,
  signedBy,
  headerBackgroundColor,
  textColor,
  padding
}) => {
  const rowStyle = {
    display: 'flex',
    marginBottom: `${padding * 0.8}px`,
    lineHeight: '1.6'
  }

  const labelStyle = {
    fontWeight: 600,
    minWidth: '100px',
    flexShrink: 0,
    color: textColor
  }

  const valueStyle = {
    flex: 1,
    color: textColor,
    wordBreak: 'break-word' as const
  }

  const isLastField = (currentField: string): boolean => {
    const fields = ['to', 'cc', 'date', 'mailedBy', 'signedBy']
    const index = fields.indexOf(currentField)

    for (let i = index + 1; i < fields.length; i++) {
      const fieldName = fields[i]
      if (fieldName === 'cc' && cc) return false
      if (fieldName === 'date' && date) return false
      if (fieldName === 'mailedBy' && mailedBy) return false
      if (fieldName === 'signedBy' && signedBy) return false
    }

    return true
  }

  return (
    <header
      aria-label="Email header"
      style={{
        backgroundColor: headerBackgroundColor,
        padding: `${padding * 1.5}px`,
        borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
        color: textColor,
        fontFamily: 'inherit'
      }}
      className="email-viewer-header"
    >
      <div style={rowStyle}>
        <span style={labelStyle}>Subject:</span>
        <h2
          className="email-viewer-subject"
          style={{
            ...valueStyle,
            margin: 0,
            fontSize: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 'inherit'
          }}
        >
          {subject || '(No Subject)'}
        </h2>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>From:</span>
        <span style={valueStyle}>
          {formatEmailAddress(from) || '(Unknown)'}
        </span>
      </div>

      <div style={isLastField('to') ? { ...rowStyle, marginBottom: 0 } : rowStyle}>
        <span style={labelStyle}>To:</span>
        <span style={valueStyle}>
          {to || '(Unknown)'}
        </span>
      </div>

      {cc && (
        <div style={isLastField('cc') ? { ...rowStyle, marginBottom: 0 } : rowStyle}>
          <span style={labelStyle}>CC:</span>
          <span style={valueStyle}>{cc}</span>
        </div>
      )}

      {date && (
        <div style={isLastField('date') ? { ...rowStyle, marginBottom: 0 } : rowStyle}>
          <span style={labelStyle}>Date:</span>
          <span style={valueStyle}>{date}</span>
        </div>
      )}

      {mailedBy && (
        <div style={isLastField('mailedBy') ? { ...rowStyle, marginBottom: 0 } : rowStyle}>
          <span style={labelStyle}>Mailed-by:</span>
          <span style={valueStyle}>{mailedBy}</span>
        </div>
      )}

      {signedBy && (
        <div style={isLastField('signedBy') ? { ...rowStyle, marginBottom: 0 } : rowStyle}>
          <span style={labelStyle}>Signed-by:</span>
          <span style={valueStyle}>{signedBy}</span>
        </div>
      )}
    </header>
  )
}
