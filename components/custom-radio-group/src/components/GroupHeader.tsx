import React from 'react'

interface GroupHeaderProps {
  title: string
  titleColor: string
  titleFontSize: number
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({
  title,
  titleColor,
  titleFontSize
}) => {
  return (
    <div
      style={{
        padding: '12px 0px 8px 0px',
        marginBottom: '8px',
        marginTop: '16px'
      }}
    >
      <div
        style={{
          color: titleColor,
          fontFamily:
            "'Lexend', sans-serif, Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          fontSize: `${titleFontSize}px`,
          fontWeight: '700',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          lineHeight: '1.2'
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: '8px',
          height: '2px',
          backgroundColor: titleColor,
          opacity: 0.2,
          borderRadius: '1px'
        }}
      />
    </div>
  )
}
