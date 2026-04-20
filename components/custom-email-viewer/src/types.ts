export interface EmailAddress {
  email: string
  name?: string
}

export interface Attachment {
  filename: string
  size?: number
  contentType?: string
  [key: string]: string | number
}

export interface EmailBody {
  html?: string
  text?: string
}

export interface EmailData {
  subject: string
  from: string | EmailAddress
  to: string
  cc?: string
  date?: string
  mailedBy?: string
  signedBy?: string
  body: EmailBody
  attachments?: Attachment[]
}

export interface ParseError {
  message: string
  source: 'parse' | 'render' | 'unknown'
  timestamp: string
}

export interface SignatureDetectionResult {
  contentWithoutSignature: string
  signature: string
  hasSignature: boolean
}

export interface StyleConfig {
  backgroundColor: string
  textColor: string
  headerBackgroundColor: string
  fontFamily: string
  fontSize: number
  padding: number
}
