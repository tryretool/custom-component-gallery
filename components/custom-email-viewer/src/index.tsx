import React, { useCallback, useEffect, useRef, useState } from 'react'
import { type FC } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import { type EmailData, type ParseError, type StyleConfig } from './types'
import { EmailHeader } from './components/EmailHeader'
import { EmailBody } from './components/EmailBody'
import { AttachmentList } from './components/AttachmentList'
import { ErrorBoundary } from './components/ErrorBoundary'
import { formatEmailAddress } from './utils/formatters'
import { parseEmailData } from './utils/typeGuards'

export const EmailViewer: FC = () => {
  Retool.useComponentSettings({
    defaultHeight: 40,
    defaultWidth: 12
  })

  const [emailData] = Retool.useStateString({
    name: 'emailData',
    label: 'Email Data',
    description:
      'Base64 email data, MIME/RFC822 string, or JSON object with email fields',
    initialValue: ''
  })

  const [backgroundColor] = Retool.useStateString({
    name: 'backgroundColor',
    label: 'Background Color',
    description: 'Background color for the email viewer',
    initialValue: '#ffffff'
  })

  const [textColor] = Retool.useStateString({
    name: 'textColor',
    label: 'Text Color',
    description: 'Primary text color',
    initialValue: '#000000'
  })

  const [headerBackgroundColor] = Retool.useStateString({
    name: 'headerBackgroundColor',
    label: 'Header Background',
    description: 'Background color for email header section',
    initialValue: '#f5f5f5'
  })

  const [fontFamily] = Retool.useStateEnumeration({
    name: 'fontFamily',
    label: 'Font Family',
    enumDefinition: [
      'Arial',
      'Helvetica',
      'Georgia',
      'Times New Roman',
      'Courier New'
    ],
    initialValue: 'Arial',
    inspector: 'select'
  })

  const [fontSize] = Retool.useStateNumber({
    name: 'fontSize',
    label: 'Font Size',
    description: 'Base font size in pixels',
    initialValue: 14
  })

  const [padding] = Retool.useStateNumber({
    name: 'padding',
    label: 'Internal Padding',
    description: 'Internal padding in pixels',
    initialValue: 16
  })

  const [showSignature] = Retool.useStateBoolean({
    name: 'showSignature',
    label: 'Show Email Signature',
    description: 'Toggle to show or hide the email signature',
    initialValue: true,
    inspector: 'checkbox'
  })

  const [showAttachments] = Retool.useStateBoolean({
    name: 'showAttachments',
    label: 'Show Attachments',
    description: 'Toggle to show or hide attachment list',
    initialValue: true,
    inspector: 'checkbox'
  })

  const [allowRemoteImages] = Retool.useStateBoolean({
    name: 'allowRemoteImages',
    label: 'Allow Remote Images',
    description:
      'When disabled, remote images (tracking pixels) are blocked. Inline and embedded images are always allowed.',
    initialValue: false,
    inspector: 'checkbox'
  })

  const [_errorState, setErrorState] = Retool.useStateObject({
    name: 'error',
    inspector: 'hidden',
    initialValue: {}
  })

  const [parsedEmail, setParsedEmail] = useState<EmailData>({
    subject: '',
    from: '',
    to: '',
    body: {},
    attachments: []
  })
  const [parseError, setParseError] = useState<ParseError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const parseEmail = async () => {
      setIsLoading(true)
      setParseError(null)
      setErrorState({})
      try {
        const result = await parseEmailData(emailData)
        if (isMounted) {
          setParsedEmail(result)
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : 'Failed to parse email'
          const err: ParseError = {
            message,
            source: 'parse',
            timestamp: new Date().toISOString()
          }
          console.warn('[EmailViewer] Parse error:', message)
          setParseError(err)
          setErrorState(err)
          setParsedEmail({
            subject: '',
            from: '',
            to: '',
            body: {},
            attachments: []
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    parseEmail()

    return () => {
      isMounted = false
    }
  }, [emailData])

  const handleRenderError = useCallback(
    (error: ParseError) => {
      setErrorState(error)
    },
    [setErrorState]
  )

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && contentRef.current) {
      contentRef.current.focus({ preventScroll: true })
    }
  }, [isLoading])

  const styles: StyleConfig = {
    backgroundColor,
    textColor,
    headerBackgroundColor,
    fontFamily,
    fontSize,
    padding
  }

  return (
    <div
      role="article"
      aria-label="Email viewer"
      style={{
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        backgroundColor: backgroundColor,
        fontFamily: fontFamily
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .email-viewer-header {
            font-size: 14px !important;
          }
          .email-viewer-subject {
            font-size: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .email-viewer-header {
            font-size: 12px !important;
          }
          .email-viewer-subject {
            font-size: 14px !important;
          }
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>

      <div
        aria-live="polite"
        ref={contentRef}
        tabIndex={-1}
        style={{ outline: 'none', display: 'contents' }}
      >
      {isLoading ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading email"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${padding * 2}px`,
            color: textColor,
            fontFamily: fontFamily
          }}
        >
          <span aria-hidden="true">Loading email...</span>
          <span className="sr-only">Loading email, please wait</span>
        </div>
      ) : parseError ? (
        <div
          role="alert"
          style={{
            padding: `${padding * 2}px`,
            color: textColor,
            textAlign: 'center',
            fontFamily: fontFamily
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>
            Failed to load email
          </p>
          <p style={{ fontSize: '0.9em', opacity: 0.7 }}>
            {parseError.message}
          </p>
        </div>
      ) : (
        <ErrorBoundary
          textColor={textColor}
          padding={padding}
          onError={handleRenderError}
        >
          <span className="sr-only">
            Email from {formatEmailAddress(parsedEmail.from)} about{' '}
            {parsedEmail.subject}
          </span>

          <EmailHeader
            subject={parsedEmail.subject}
            from={parsedEmail.from}
            to={parsedEmail.to}
            cc={parsedEmail.cc}
            date={parsedEmail.date}
            mailedBy={parsedEmail.mailedBy}
            signedBy={parsedEmail.signedBy}
            headerBackgroundColor={headerBackgroundColor}
            textColor={textColor}
            padding={padding}
          />

          <EmailBody
            body={parsedEmail.body}
            showSignature={showSignature}
            styles={styles}
            allowRemoteImages={allowRemoteImages}
          />

          <AttachmentList
            attachments={parsedEmail.attachments || []}
            showAttachments={showAttachments}
            textColor={textColor}
            padding={padding}
          />
        </ErrorBoundary>
      )}
      </div>
    </div>
  )
}
