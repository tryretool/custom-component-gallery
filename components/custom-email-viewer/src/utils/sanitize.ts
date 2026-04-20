import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  // Structure
  'div',
  'span',
  'p',
  'br',
  'hr',
  'blockquote',
  'pre',
  'code',
  // Headings
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Lists
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  // Tables
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
  // Inline
  'a',
  'b',
  'i',
  'u',
  'em',
  'strong',
  'small',
  'sub',
  'sup',
  'mark',
  'del',
  'ins',
  's',
  'strike',
  // Media
  'img',
  // Email-specific
  'font',
  'center',
  'abbr',
  'address',
  'cite',
  'dfn',
  'var',
  'kbd',
  'samp',
  'wbr',
  // Sections
  'article',
  'section',
  'header',
  'footer',
  'aside',
  'details',
  'summary',
  'figure',
  'figcaption'
]

const ALLOWED_ATTR = [
  'class',
  'id',
  'style',
  'href',
  'src',
  'alt',
  'title',
  'width',
  'height',
  'align',
  'valign',
  'bgcolor',
  'color',
  'border',
  'cellpadding',
  'cellspacing',
  'colspan',
  'rowspan',
  'dir',
  'lang',
  'role',
  'aria-label',
  'aria-hidden',
  'scope',
  'face',
  'size',
  'target',
  'rel'
]

const FORBID_ATTR = [
  'onerror',
  'onload',
  'onclick',
  'onmouseover',
  'onmouseout',
  'onmouseenter',
  'onmouseleave',
  'onfocus',
  'onblur',
  'onsubmit',
  'onreset',
  'onchange',
  'oninput',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'ondblclick',
  'oncontextmenu',
  'ondrag',
  'ondrop',
  'onscroll',
  'onwheel',
  'ontouchstart',
  'ontouchend',
  'ontouchmove',
  'onanimationstart',
  'onanimationend',
  'ontransitionend',
  'onpointerdown',
  'onpointerup'
]

export interface SanitizeOptions {
  allowRemoteImages?: boolean
}

export function sanitizeHtml(
  dirtyHtml: string,
  options?: SanitizeOptions
): string {
  const allowRemoteImages = options?.allowRemoteImages ?? true

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')

      const rawHref = node.getAttribute('href') || ''
      const normalizedHref = rawHref.replace(/[\s\u0000-\u001F]/g, '').toLowerCase()
      if (
        normalizedHref.startsWith('javascript:') ||
        normalizedHref.startsWith('vbscript:') ||
        normalizedHref.startsWith('data:')
      ) {
        node.removeAttribute('href')
      }
    }

    if (node.tagName === 'IMG') {
      if (!node.hasAttribute('alt')) {
        node.setAttribute('alt', '')
      }

      if (!allowRemoteImages) {
        const rawSrc = node.getAttribute('src') || ''
        const normalizedSrc = rawSrc.trim().toLowerCase()
        if (
          normalizedSrc.startsWith('http://') ||
          normalizedSrc.startsWith('https://') ||
          normalizedSrc.startsWith('//')
        ) {
          node.removeAttribute('src')
          node.setAttribute('alt', 'Remote image blocked')
          node.setAttribute(
            'style',
            'display:inline-block;padding:4px 8px;background:#f0f0f0;border:1px solid #ccc;color:#666;font-size:12px;'
          )
        }
      }
    }
  })

  const clean = DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR,
    ALLOW_DATA_ATTR: false
  })

  DOMPurify.removeAllHooks()

  return clean
}
