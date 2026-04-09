import React, { FC, useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Retool } from '@tryretool/custom-component-support'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import './styles.css'

function parseHTMLToMentions(html: string, users: any[]): string {
  if (!html || !users.length) return html
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const textNodes: Text[] = []
  
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node as Text)
    } else {
      node.childNodes.forEach(walk)
    }
  }
  
  walk(doc.body)
  
  let changed = false
  
  textNodes.forEach(node => {
    if (node.parentElement?.classList.contains('mention')) return
    
    const text = node.textContent || ''
    let lastIndex = 0
    const fragment = document.createDocumentFragment()
    let index: number
    
    while ((index = text.indexOf('@', lastIndex)) !== -1) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)))
      
      const remain = text.slice(index + 1)
      const endMatch = remain.search(/[^A-Za-z\s]/)
      const possible = endMatch === -1 ? remain : remain.slice(0, endMatch)
      const words = possible.trim().split(/\s+/).filter(Boolean)
      
      if (!words.length) {
        fragment.appendChild(document.createTextNode('@'))
        lastIndex = index + 1
        continue
      }
      
      let matchedUser = null
      let matchedLength = 0
      
      for (let i = 1; i <= words.length; i++) {
        const candidate = words.slice(0, i).join(' ')
        const user = users.find(u => (u.label || u.name || '').trim().toLowerCase() === candidate.toLowerCase())
        if (user) {
          matchedUser = user
          matchedLength = candidate.length
        }
      }
      
      if (matchedUser) {
        changed = true
        const label = matchedUser.label || matchedUser.name
        const id = matchedUser.id ?? matchedUser.value ?? label
        const span = doc.createElement('span')
        span.className = 'mention'
        span.setAttribute('data-type', 'mention')
        span.setAttribute('data-id', id)
        span.setAttribute('data-label', label)
        span.textContent = `@${label}`
        fragment.appendChild(span)
        lastIndex = index + 1 + matchedLength
      } else {
        fragment.appendChild(document.createTextNode('@'))
        lastIndex = index + 1
      }
    }
    
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    
    if (fragment.childNodes.length > 1 || (fragment.childNodes[0] as Text)?.textContent !== text) {
      node.parentNode?.replaceChild(fragment, node)
      changed = true
    }
  })
  
  return changed ? doc.body.innerHTML : html
}

function convertQuillIndentToNested(html: string): string {
  if (!html || !html.includes('ql-indent')) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  doc.querySelectorAll('ol, ul').forEach(list => {
    const items = Array.from(list.children) as HTMLElement[]
    const root = doc.createElement(list.tagName)
    const stack: { el: HTMLElement; level: number }[] = [{ el: root, level: 0 }]

    items.forEach(item => {
      let level = 0
      item.classList.forEach(cls => {
        const match = cls.match(/^ql-indent-(\d+)$/)
        if (match) level = parseInt(match[1], 10)
      })
      item.classList.remove(...Array.from(item.classList).filter(c => c.startsWith('ql-indent')))

      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop()
      }

      const parent = stack[stack.length - 1].el

      if (level > stack[stack.length - 1].level) {
        const lastLi = parent.lastElementChild as HTMLElement
        if (lastLi && lastLi.tagName === 'LI') {
          const nestedList = doc.createElement(list.tagName)
          nestedList.appendChild(item)
          lastLi.appendChild(nestedList)
          stack.push({ el: nestedList, level })
        } else {
          parent.appendChild(item)
        }
      } else {
        parent.appendChild(item)
      }
    })

    list.replaceWith(root)
  })

  return doc.body.innerHTML
}

interface MentionListProps {
  items: any[]
  command: (item: any) => void
}

interface MentionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

const MentionList = forwardRef<MentionListHandle, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    setSelectedIndex(0)
  }, [props.items])

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const selectItem = useCallback((index: number) => {
    const item = props.items[index]
    if (!item) return
    const displayName = item.label || item.name || 'Unknown'
    props.command({ id: item.id ?? item.value ?? displayName, label: displayName })
  }, [props])

  useImperativeHandle(ref, () => ({
    onKeyDown(event: KeyboardEvent): boolean {
      if (event.key === 'ArrowUp') {
        setSelectedIndex(i => Math.max(0, i - 1))
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex(i => Math.min(props.items.length - 1, i + 1))
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }), [props.items.length, selectedIndex, selectItem])

  if (!props.items.length) return null

  return (
    <div className="mention-dropdown">
      {props.items.map((item: any, index: number) => {
        const displayName = item.label || item.name || 'Unknown'
        const email = item.email || ''
        const initials = displayName.split(' ').map((n: string) => n[0] ?? '').join('').toUpperCase().slice(0, 2)
        const username = email ? email.split('@')[0] : displayName.toLowerCase().replace(/\s+/g, '')
        const isSelected = index === selectedIndex
        
        return (
          <div
            key={item.id ?? item.value ?? displayName}
            ref={el => { itemRefs.current[index] = el }}
            className={`mention-item${isSelected ? ' mention-item-selected' : ''}`}
            onMouseDown={e => {
              e.preventDefault()
              e.stopPropagation()
              selectItem(index)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="mention-avatar">{initials}</div>
            <div className="mention-info">
              <span className="mention-name">{displayName}</span>
              <span className="mention-handle">@{username}</span>
            </div>
            {isSelected && <div className="mention-check">✓</div>}
          </div>
        )
      })}
    </div>
  )
})

MentionList.displayName = 'MentionList'

interface MentionPortalProps {
  items: any[]
  clientRect: (() => DOMRect | null) | null
  command: (item: any) => void
  listRef: React.RefObject<MentionListHandle>
}

const MentionPortal: FC<MentionPortalProps> = ({ items, clientRect, command, listRef }) => {
  const rect = clientRect?.()
  if (!rect || !items.length) return null
  
  return createPortal(
    <div style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, zIndex: 9999 }}>
      <MentionList ref={listRef} items={items} command={command} />
    </div>,
    document.body
  )
}

interface LinkDialogProps {
  onConfirm: (url: string) => void
  onCancel: () => void
  initialUrl?: string
}

const LinkDialog: FC<LinkDialogProps> = ({ onConfirm, onCancel, initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl)
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onConfirm(url)
    if (e.key === 'Escape') onCancel()
  }, [url, onConfirm, onCancel])
  
  return createPortal(
    <div className="link-dialog-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="link-dialog">
        <div className="link-dialog-title">Insert Link</div>
        <input
          className="link-dialog-input"
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className="link-dialog-actions">
          <button className="link-dialog-btn link-dialog-cancel" onMouseDown={e => { e.preventDefault(); onCancel() }}>
            Cancel
          </button>
          <button className="link-dialog-btn link-dialog-confirm" onMouseDown={e => { e.preventDefault(); onConfirm(url) }}>
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  ariaLabel?: string
  children: React.ReactNode
}

const ToolbarButton: FC<ToolbarButtonProps> = ({ onClick, active, disabled, title, ariaLabel, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={ariaLabel || title}
    className={`toolbar-button${active ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
  >
    {children}
  </button>
)

export const CustomRichTextEditor: FC = () => {
  const [value, setValue] = Retool.useStateString({
    name: 'value',
    label: 'Content',
    description: '',
    initialValue: ''
  })
  
  const [users] = Retool.useStateArray({
    name: 'users',
    label: 'Users',
    description: "Users for @mentions. Format: [{ label: 'John Doe', email: 'john@test.com' }]",
    initialValue: []
  })

  const onClear = Retool.useEventCallback({ name: 'clearValue' })

  Retool.useComponentSettings({ defaultWidth: 12, defaultHeight: 40 })

  const containerRef = useRef<HTMLDivElement>(null)
  const [editorMinHeight, setEditorMinHeight] = useState(120)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const ro = new ResizeObserver(() => {
      const proseMirror = containerRef.current?.querySelector('.ProseMirror') as HTMLElement | null
      if (proseMirror) {
        const contentHeight = proseMirror.scrollHeight
        setEditorMinHeight(Math.max(120, contentHeight + 10))
      }
    })
    
    const proseMirror = containerRef.current?.querySelector('.ProseMirror')
    if (proseMirror) ro.observe(proseMirror)
    
    return () => ro.disconnect()
  }, [])

  const usersRef = useRef<any[]>([])
  usersRef.current = users as any[]

  const lastPushedHtml = useRef<string>('')
  const editorHtml = useRef<string>('')
  const suggestionActive = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mentionState, setMentionState] = useState<{
    items: any[]
    clientRect: (() => DOMRect | null) | null
    command: (item: any) => void
  } | null>(null)
  
  const mentionListRef = useRef<MentionListHandle>(null)
  const [headingOpen, setHeadingOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; initial: string }>({ open: false, initial: '' })
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    lastPushedHtml.current = ''
    editorHtml.current = ''
    setValue('')
  }, [setValue])

  const pushToRetool = useCallback((html: string) => {
    lastPushedHtml.current = html
    setValue(html)
  }, [setValue])

  const scheduleWrite = useCallback((html: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (!suggestionActive.current) pushToRetool(html)
    }, 150)
  }, [pushToRetool])

  const flushAfterMention = useCallback((editorInstance: any) => {
    requestAnimationFrame(() => {
      const html = editorInstance.getHTML()
      editorHtml.current = html
      pushToRetool(html)
    })
  }, [pushToRetool])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
      Superscript,
      Subscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ HTMLAttributes: { class: 'editor-image' } }),
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        renderLabel: ({ options, node }) => `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`,
        suggestion: {
          char: '@',
          allowSpaces: true,
          startOfLine: false,
          command: ({ editor, range, props }) => {
            editor.chain().focus().insertContentAt(range, [
              { type: 'mention', attrs: props },
              { type: 'text', text: ' ' },
            ]).run()
          },
          items: ({ query }: { query: string }) => {
            const list = usersRef.current || []
            if (!query) return list.slice(0, 8)
            const parts = query.toLowerCase().split(' ').filter(Boolean)
            return list
              .filter(u => {
                const name = (u.label || u.name || '').toLowerCase()
                return parts.every((p: string) => name.includes(p))
              })
              .slice(0, 8)
          },
          render: () => ({
            onStart(props: SuggestionProps) {
              suggestionActive.current = true
              setMentionState({ items: props.items, clientRect: props.clientRect ?? null, command: props.command })
            },
            onUpdate(props: SuggestionProps) {
              const { items, command } = props
              const query = (props as any).query ?? ''
              if (items.length === 1) {
                const item = items[0]
                const label = (item.label || item.name || '').trim()
                if (label.toLowerCase() === query.trim().toLowerCase()) {
                  command({ id: item.id ?? item.value ?? label, label })
                  return
                }
              }
              setMentionState({ items: props.items, clientRect: props.clientRect ?? null, command: props.command })
            },
            onKeyDown({ event }: SuggestionKeyDownProps): boolean {
              if (event.key === 'Escape') {
                setMentionState(null)
                return true
              }
              return mentionListRef.current?.onKeyDown(event) ?? false
            },
            onExit() {
              suggestionActive.current = false
              setMentionState(null)
            },
          }),
        },
      }),
    ],
    content: '',
    onUpdate: ({ editor, transaction }) => {
      const html = editor.getHTML()
      editorHtml.current = html
      if (suggestionActive.current) return
      
      const mentionInserted = transaction.steps.some((step: any) => {
        try {
          const slice = step.slice
          if (!slice) return false
          let found = false
          slice.content?.forEach?.((node: any) => {
            if (node.type?.name === 'mention') found = true
          })
          return found
        } catch {
          return false
        }
      })
      
      if (mentionInserted) {
        flushAfterMention(editor)
      } else {
        scheduleWrite(html)
      }
    },
  })

  useEffect(() => {
    if (!editor) return
    if (value === lastPushedHtml.current) return
    if (value === editorHtml.current) return
    
    const withMentions = parseHTMLToMentions(value || '', usersRef.current)
    const processed = convertQuillIndentToNested(withMentions)
    editorHtml.current = processed
    lastPushedHtml.current = processed
    editor.commands.setContent(processed, false, { preserveWhitespace: 'full' })
  }, [value, editor])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const clearEditor = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    lastPushedHtml.current = ''
    editorHtml.current = ''
    setValue('')
    editor?.commands.clearContent(true)
    onClear()
  }, [editor, onClear, setValue])

  const [triggerClear] = Retool.useStateBoolean({ name: 'triggerClear', initialValue: false, inspector: 'hidden' })
  const prevTriggerClear = useRef(false)
  
  useEffect(() => {
    if (triggerClear && !prevTriggerClear.current) {
      clearEditor()
    }
    prevTriggerClear.current = triggerClear
  }, [triggerClear, clearEditor])

  useEffect(() => {
    const close = () => {
      setHeadingOpen(false)
      setListOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      editor.chain().focus().setImage({ src }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [editor])

  const openLinkDialog = useCallback(() => {
    const prev = editor?.getAttributes('link').href ?? ''
    setLinkDialog({ open: true, initial: prev })
  }, [editor])

  const applyLink = useCallback((url: string) => {
    setLinkDialog({ open: false, initial: '' })
    if (!editor) return
    
    if (!url) {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) return null

  const activeHeading = [1, 2, 3].find(l => editor.isActive('heading', { level: l })) ?? 0
  const headingLabel = activeHeading === 0 ? 'H▾' : `H${activeHeading}▾`

  return (
    <div className="editor-container" ref={containerRef}>
      {mentionState && (
        <MentionPortal
          items={mentionState.items}
          clientRect={mentionState.clientRect}
          command={mentionState.command}
          listRef={mentionListRef}
        />
      )}

      {linkDialog.open && (
        <LinkDialog
          initialUrl={linkDialog.initial}
          onConfirm={applyLink}
          onCancel={() => setLinkDialog({ open: false, initial: '' })}
        />
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      <div className="toolbar">
        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Undo (Ctrl+Z)"
            ariaLabel="Undo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M9.70711 3.70711C10.0976 3.31658 10.0976 2.68342 9.70711 2.29289C9.31658 1.90237 8.68342 1.90237 8.29289 2.29289L3.29289 7.29289C2.90237 7.68342 2.90237 8.31658 3.29289 8.70711L8.29289 13.7071C8.68342 14.0976 9.31658 14.0976 9.70711 13.7071C10.0976 13.3166 10.0976 12.6834 9.70711 12.2929L6.41421 9H14.5C15.0909 9 15.6761 9.1164 16.2221 9.34254C16.768 9.56869 17.2641 9.90016 17.682 10.318C18.0998 10.7359 18.4313 11.232 18.6575 11.7779C18.8836 12.3239 19 12.9091 19 13.5C19 14.0909 18.8836 14.6761 18.6575 15.2221C18.4313 15.768 18.0998 16.2641 17.682 16.682C17.2641 17.0998 16.768 17.4313 16.2221 17.6575C15.6761 17.8836 15.0909 18 14.5 18H11C10.4477 18 10 18.4477 10 19C10 19.5523 10.4477 20 11 20H14.5C15.3536 20 16.1988 19.8319 16.9874 19.5052C17.7761 19.1786 18.4926 18.6998 19.0962 18.0962C19.6998 17.4926 20.1786 16.7761 20.5052 15.9874C20.8319 15.1988 21 14.3536 21 13.5C21 12.6464 20.8319 11.8012 20.5052 11.0126C20.1786 10.2239 19.6998 9.50739 19.0962 8.90381C18.4926 8.30022 17.7761 7.82144 16.9874 7.49478C16.1988 7.16813 15.3536 7 14.5 7H6.41421L9.70711 3.70711Z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Redo (Ctrl+Shift+Z)"
            ariaLabel="Redo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.7071 2.29289C15.3166 1.90237 14.6834 1.90237 14.2929 2.29289C13.9024 2.68342 13.9024 3.31658 14.2929 3.70711L17.5858 7H9.5C7.77609 7 6.12279 7.68482 4.90381 8.90381C3.68482 10.1228 3 11.7761 3 13.5C3 14.3536 3.16813 15.1988 3.49478 15.9874C3.82144 16.7761 4.30023 17.4926 4.90381 18.0962C6.12279 19.3152 7.77609 20 9.5 20H13C13.5523 20 14 19.5523 14 19C14 18.4477 13.5523 18 13 18H9.5C8.30653 18 7.16193 17.5259 6.31802 16.682C5.90016 16.2641 5.56869 15.768 5.34254 15.2221C5.1164 14.6761 5 14.0909 5 13.5C5 12.3065 5.47411 11.1619 6.31802 10.318C7.16193 9.47411 8.30653 9 9.5 9H17.5858L14.2929 12.2929C13.9024 12.6834 13.9024 13.3166 14.2929 13.7071C14.6834 14.0976 15.3166 14.0976 15.7071 13.7071L20.7071 8.70711C21.0976 8.31658 21.0976 7.68342 20.7071 7.29289L15.7071 2.29289Z" />
            </svg>
          </ToolbarButton>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group" style={{ position: 'relative' }}>
          <button
            type="button"
            className={`toolbar-button toolbar-dropdown-btn${activeHeading ? ' is-active' : ''}`}
            title="Heading"
            aria-label="Heading"
            onMouseDown={e => {
              e.preventDefault()
              e.stopPropagation()
              setHeadingOpen(o => !o)
              setListOpen(false)
            }}
          >
            {headingLabel}
          </button>
          {headingOpen && (
            <div className="toolbar-dropdown" onMouseDown={e => e.stopPropagation()}>
              <button
                className={`toolbar-dropdown-item${activeHeading === 0 ? ' is-active' : ''}`}
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().setParagraph().run()
                  setHeadingOpen(false)
                }}
              >
                Normal
              </button>
              <button
                className={`toolbar-dropdown-item${activeHeading === 1 ? ' is-active' : ''}`}
                style={{ fontSize: 16, fontWeight: 700 }}
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                  setHeadingOpen(false)
                }}
              >
                Heading 1
              </button>
              <button
                className={`toolbar-dropdown-item${activeHeading === 2 ? ' is-active' : ''}`}
                style={{ fontSize: 14, fontWeight: 700 }}
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                  setHeadingOpen(false)
                }}
              >
                Heading 2
              </button>
              <button
                className={`toolbar-dropdown-item${activeHeading === 3 ? ' is-active' : ''}`}
                style={{ fontSize: 13, fontWeight: 600 }}
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                  setHeadingOpen(false)
                }}
              >
                Heading 3
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-group" style={{ position: 'relative' }}>
          <button
            type="button"
            className={`toolbar-button toolbar-dropdown-btn${editor.isActive('bulletList') || editor.isActive('orderedList') ? ' is-active' : ''}`}
            title="Lists"
            aria-label="Lists"
            onMouseDown={e => {
              e.preventDefault()
              e.stopPropagation()
              setListOpen(o => !o)
              setHeadingOpen(false)
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M7 6C7 5.44772 7.44772 5 8 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H8C7.44772 7 7 6.55228 7 6Z M7 12C7 11.4477 7.44772 11 8 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H8C7.44772 13 7 12.5523 7 12Z M7 18C7 17.4477 7.44772 17 8 17H21C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H8C7.44772 19 7 18.5523 7 18Z M2 6C2 5.44772 2.44772 5 3 5H3.01C3.56228 5 4.01 5.44772 4.01 6C4.01 6.55228 3.56228 7 3.01 7H3C2.44772 7 2 6.55228 2 6Z M2 12C2 11.4477 2.44772 11 3 11H3.01C3.56228 11 4.01 11.4477 4.01 12C4.01 12.5523 3.56228 13 3.01 13H3C2.44772 13 2 12.5523 2 12Z M2 18C2 17.4477 2.44772 17 3 17H3.01C3.56228 17 4.01 17.4477 4.01 18C4.01 18.5523 3.56228 19 3.01 19H3C2.44772 19 2 18.5523 2 18Z" />
            </svg>
            <span style={{ fontSize: 9, marginLeft: 1 }}>▾</span>
          </button>
          {listOpen && (
            <div className="toolbar-dropdown" onMouseDown={e => e.stopPropagation()}>
              <button
                className={`toolbar-dropdown-item${editor.isActive('bulletList') ? ' is-active' : ''}`}
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().toggleBulletList().run()
                  setListOpen(false)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M7 6C7 5.44772 7.44772 5 8 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H8C7.44772 7 7 6.55228 7 6Z M7 12C7 11.4477 7.44772 11 8 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H8C7.44772 13 7 12.5523 7 12Z M7 18C7 17.4477 7.44772 17 8 17H21C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H8C7.44772 19 7 18.5523 7 18Z M2 6C2 5.44772 2.44772 5 3 5H3.01C3.56228 5 4.01 5.44772 4.01 6C4.01 6.55228 3.56228 7 3.01 7H3C2.44772 7 2 6.55228 2 6Z M2 12C2 11.4477 2.44772 11 3 11H3.01C3.56228 11 4.01 11.4477 4.01 12C4.01 12.5523 3.56228 13 3.01 13H3C2.44772 13 2 12.5523 2 12Z M2 18C2 17.4477 2.44772 17 3 17H3.01C3.56228 17 4.01 17.4477 4.01 18C4.01 18.5523 3.56228 19 3.01 19H3C2.44772 19 2 18.5523 2 18Z" />
                </svg>
                <span style={{ marginLeft: 6 }}>Bullet List</span>
              </button>
              <button
                className={`toolbar-dropdown-item${editor.isActive('orderedList') ? ' is-active' : ''}`}
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().toggleOrderedList().run()
                  setListOpen(false)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9 6C9 5.44772 9.44772 5 10 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H10C9.44772 7 9 6.55228 9 6Z M9 12C9 11.4477 9.44772 11 10 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H10C9.44772 13 9 12.5523 9 12Z M9 18C9 17.4477 9.44772 17 10 17H21C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H10C9.44772 19 9 18.5523 9 18Z M3 6C3 5.44772 3.44772 5 4 5H5C5.55228 5 6 5.44772 6 6V10C6 10.5523 5.55228 11 5 11C4.44772 11 4 10.5523 4 10V7C3.44772 7 3 6.55228 3 6Z M3 10C3 9.44772 3.44772 9 4 9H6C6.55228 9 7 9.44772 7 10C7 10.5523 6.55228 11 6 11H4C3.44772 11 3 10.5523 3 10Z M5.82219 13.0431C6.54543 13.4047 6.99997 14.1319 6.99997 15C6.99997 15.5763 6.71806 16.0426 6.48747 16.35C6.31395 16.5814 6.1052 16.8044 5.91309 17H5.99997C6.55226 17 6.99997 17.4477 6.99997 18C6.99997 18.5523 6.55226 19 5.99997 19H3.99997C3.44769 19 2.99997 18.5523 2.99997 18C2.99997 17.4237 3.28189 16.9575 3.51247 16.65C3.74323 16.3424 4.03626 16.0494 4.26965 15.8161C4.27745 15.8083 4.2852 15.8006 4.29287 15.7929C4.55594 15.5298 4.75095 15.3321 4.88748 15.15C4.96287 15.0495 4.99021 14.9922 4.99911 14.9714C4.99535 14.9112 4.9803 14.882 4.9739 14.8715C4.96613 14.8588 4.95382 14.845 4.92776 14.8319C4.87723 14.8067 4.71156 14.7623 4.44719 14.8944C3.95321 15.1414 3.35254 14.9412 3.10555 14.4472C2.85856 13.9533 3.05878 13.3526 3.55276 13.1056C4.28839 12.7378 5.12272 12.6934 5.82219 13.0431Z" />
                </svg>
                <span style={{ marginLeft: 6 }}>Ordered List</span>
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().liftListItem('listItem').run()}
            disabled={!editor.can().liftListItem('listItem')}
            title="Outdent"
            ariaLabel="Outdent"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="3.5" x2="14" y2="3.5" />
              <line x1="1" y1="7.5" x2="14" y2="7.5" />
              <line x1="1" y1="11.5" x2="14" y2="11.5" />
              <polyline points="5,5.5 3,7.5 5,9.5" fill="none" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
            disabled={!editor.can().sinkListItem('listItem')}
            title="Indent"
            ariaLabel="Indent"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="3.5" x2="14" y2="3.5" />
              <line x1="1" y1="7.5" x2="14" y2="7.5" />
              <line x1="1" y1="11.5" x2="14" y2="11.5" />
              <polyline points="3,5.5 5,7.5 3,9.5" fill="none" />
            </svg>
          </ToolbarButton>
        </div>

        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Blockquote"
            ariaLabel="Blockquote"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
              <path d="M2 3h4v5H4c0 1.1.9 2 2 2v2c-2.2 0-4-1.8-4-4V3zm7 0h4v5h-2c0 1.1.9 2 2 2v2c-2.2 0-4-1.8-4-4V3z" />
            </svg>
          </ToolbarButton>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
            ariaLabel="Bold"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
            ariaLabel="Italic"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            title="Strikethrough"
            ariaLabel="Strikethrough"
          >
            <s>S</s>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            title="Inline Code"
            ariaLabel="Inline Code"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4.5,10.5 1.5,7.5 4.5,4.5" />
              <polyline points="10.5,4.5 13.5,7.5 10.5,10.5" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
            ariaLabel="Underline"
          >
            <u>U</u>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive('highlight')}
            title="Highlight"
            ariaLabel="Highlight"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2.5l3 3-6 6-3.5.5.5-3.5 6-6z" />
              <line x1="2" y1="13" x2="13" y2="13" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={openLinkDialog}
            active={editor.isActive('link')}
            title="Link"
            ariaLabel="Insert Link"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 8.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L6 3" />
              <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L9 12" />
            </svg>
          </ToolbarButton>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            active={editor.isActive('superscript')}
            title="Superscript"
            ariaLabel="Superscript"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12.7071 7.29289C13.0976 7.68342 13.0976 8.31658 12.7071 8.70711L4.70711 16.7071C4.31658 17.0976 3.68342 17.0976 3.29289 16.7071C2.90237 16.3166 2.90237 15.6834 3.29289 15.2929L11.2929 7.29289C11.6834 6.90237 12.3166 6.90237 12.7071 7.29289Z M3.29289 7.29289C3.68342 6.90237 4.31658 6.90237 4.70711 7.29289L12.7071 15.2929C13.0976 15.6834 13.0976 16.3166 12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L3.29289 8.70711C2.90237 8.31658 2.90237 7.68342 3.29289 7.29289Z M17.405 1.40657C18.0246 1.05456 18.7463 0.92634 19.4492 1.04344C20.1521 1.16054 20.7933 1.51583 21.2652 2.0497L21.2697 2.05469L21.2696 2.05471C21.7431 2.5975 22 3.28922 22 4.00203C22 5.08579 21.3952 5.84326 20.7727 6.34289C20.1966 6.80531 19.4941 7.13675 18.9941 7.37261C18.9714 7.38332 18.9491 7.39383 18.9273 7.40415C18.4487 7.63034 18.2814 7.78152 18.1927 7.91844C18.1778 7.94155 18.1625 7.96834 18.1473 8.00003H21C21.5523 8.00003 22 8.44774 22 9.00003C22 9.55231 21.5523 10 21 10H17C16.4477 10 16 9.55231 16 9.00003C16 8.17007 16.1183 7.44255 16.5138 6.83161C16.9107 6.21854 17.4934 5.86971 18.0728 5.59591C18.6281 5.33347 19.1376 5.09075 19.5208 4.78316C19.8838 4.49179 20 4.25026 20 4.00203C20 3.77192 19.9178 3.54865 19.7646 3.37182C19.5968 3.18324 19.3696 3.05774 19.1205 3.01625C18.8705 2.97459 18.6137 3.02017 18.3933 3.14533C18.1762 3.26898 18.0191 3.45826 17.9406 3.67557C17.7531 4.19504 17.18 4.46414 16.6605 4.27662C16.141 4.0891 15.8719 3.51596 16.0594 2.99649C16.303 2.3219 16.7817 1.76125 17.4045 1.40689L17.405 1.40657Z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            active={editor.isActive('subscript')}
            title="Subscript"
            ariaLabel="Subscript"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.29289 7.29289C3.68342 6.90237 4.31658 6.90237 4.70711 7.29289L12.7071 15.2929C13.0976 15.6834 13.0976 16.3166 12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L3.29289 8.70711C2.90237 8.31658 2.90237 7.68342 3.29289 7.29289Z M12.7071 7.29289C13.0976 7.68342 13.0976 8.31658 12.7071 8.70711L4.70711 16.7071C4.31658 17.0976 3.68342 17.0976 3.29289 16.7071C2.90237 16.3166 2.90237 15.6834 3.29289 15.2929L11.2929 7.29289C11.6834 6.90237 12.3166 6.90237 12.7071 7.29289Z M17.4079 14.3995C18.0284 14.0487 18.7506 13.9217 19.4536 14.0397C20.1566 14.1578 20.7977 14.5138 21.2696 15.0481L21.2779 15.0574L21.2778 15.0575C21.7439 15.5988 22 16.2903 22 17C22 18.0823 21.3962 18.8401 20.7744 19.3404C20.194 19.8073 19.4858 20.141 18.9828 20.378C18.9638 20.387 18.9451 20.3958 18.9266 20.4045C18.4473 20.6306 18.2804 20.7817 18.1922 20.918C18.1773 20.9412 18.1619 20.9681 18.1467 21H21C21.5523 21 22 21.4477 22 22C22 22.5523 21.5523 23 21 23H17C16.4477 23 16 22.5523 16 22C16 21.1708 16.1176 20.4431 16.5128 19.832C16.9096 19.2184 17.4928 18.8695 18.0734 18.5956C18.6279 18.334 19.138 18.0901 19.5207 17.7821C19.8838 17.49 20 17.2477 20 17C20 16.7718 19.9176 16.5452 19.7663 16.3672C19.5983 16.1792 19.3712 16.0539 19.1224 16.0121C18.8722 15.9701 18.6152 16.015 18.3942 16.1394C18.1794 16.2628 18.0205 16.4549 17.9422 16.675C17.7572 17.1954 17.1854 17.4673 16.665 17.2822C16.1446 17.0972 15.8728 16.5254 16.0578 16.005C16.2993 15.3259 16.7797 14.7584 17.4039 14.4018L17.4079 14.3995L17.4079 14.3995Z" />
            </svg>
          </ToolbarButton>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
            ariaLabel="Align Left"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
              <rect x="1" y="2" width="13" height="1.5" rx=".75" />
              <rect x="1" y="5.5" width="9" height="1.5" rx=".75" />
              <rect x="1" y="9" width="13" height="1.5" rx=".75" />
              <rect x="1" y="12.5" width="9" height="1.5" rx=".75" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
            ariaLabel="Align Center"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
              <rect x="1" y="2" width="13" height="1.5" rx=".75" />
              <rect x="3" y="5.5" width="9" height="1.5" rx=".75" />
              <rect x="1" y="9" width="13" height="1.5" rx=".75" />
              <rect x="3" y="12.5" width="9" height="1.5" rx=".75" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
            ariaLabel="Align Right"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
              <rect x="1" y="2" width="13" height="1.5" rx=".75" />
              <rect x="5" y="5.5" width="9" height="1.5" rx=".75" />
              <rect x="1" y="9" width="13" height="1.5" rx=".75" />
              <rect x="5" y="12.5" width="9" height="1.5" rx=".75" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
            ariaLabel="Justify"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
              <rect x="1" y="2" width="13" height="1.5" rx=".75" />
              <rect x="1" y="5.5" width="13" height="1.5" rx=".75" />
              <rect x="1" y="9" width="13" height="1.5" rx=".75" />
              <rect x="1" y="12.5" width="13" height="1.5" rx=".75" />
            </svg>
          </ToolbarButton>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-button toolbar-add-btn"
            title="Insert Image"
            aria-label="Insert Image"
            onClick={() => imageInputRef.current?.click()}
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="2" width="13" height="11" rx="1.5" />
              <circle cx="5" cy="5.5" r="1.2" fill="currentColor" stroke="none" />
              <polyline points="1,10 5,6.5 8,9.5 10.5,7 14,10" />
            </svg>
            <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 600 }}>Add</span>
          </button>
        </div>
      </div>

      <div className="editor-wrapper" style={{ minHeight: editorMinHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}