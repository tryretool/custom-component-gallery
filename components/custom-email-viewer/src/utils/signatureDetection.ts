import { type SignatureDetectionResult } from '../types'

export function detectHtmlSignature(
  htmlContent: string
): SignatureDetectionResult {
  const signatureMarkers = [
    /--\s*<br\s*\/?>/i,
    /<div[^>]*class="[^"]*signature[^"]*"[^>]*>/i,
    /<div[^>]*id="[^"]*signature[^"]*"[^>]*>/i,
    /<div[^>]*class="[^"]*gmail_signature[^"]*"[^>]*>/i,
    /Best regards,?\s*<br/i,
    /Sincerely,?\s*<br/i,
    /Thanks,?\s*<br/i,
    /Cheers,?\s*<br/i,
    /Sent from my (iPhone|iPad|Android)/i
  ]

  for (const marker of signatureMarkers) {
    const match = htmlContent.match(marker)
    if (match && match.index !== undefined) {
      return {
        contentWithoutSignature: htmlContent.substring(0, match.index),
        signature: htmlContent.substring(match.index),
        hasSignature: true
      }
    }
  }

  return {
    contentWithoutSignature: htmlContent,
    signature: '',
    hasSignature: false
  }
}

export function detectPlainTextSignature(
  text: string
): SignatureDetectionResult {
  const lines = text.split('\n')

  const dashIndex = lines.findIndex((line) => line.trim() === '--')
  if (dashIndex !== -1) {
    return {
      contentWithoutSignature: lines.slice(0, dashIndex).join('\n'),
      signature: lines.slice(dashIndex).join('\n'),
      hasSignature: true
    }
  }

  const lastLines = lines.slice(-10)
  const signOffPatterns = [
    /^(Best regards|Sincerely|Thanks|Cheers|Regards),?\s*$/i,
    /^Sent from my (iPhone|iPad|Android)/i
  ]

  for (let i = 0; i < lastLines.length; i++) {
    if (signOffPatterns.some((pattern) => pattern.test(lastLines[i]))) {
      const splitIndex = lines.length - (lastLines.length - i)
      return {
        contentWithoutSignature: lines.slice(0, splitIndex).join('\n'),
        signature: lines.slice(splitIndex).join('\n'),
        hasSignature: true
      }
    }
  }

  return {
    contentWithoutSignature: text,
    signature: '',
    hasSignature: false
  }
}
