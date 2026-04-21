import React, { useEffect } from 'react'
import { type FC } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import styles from './ProgressTimeline.module.css'

type NormalizedMilestone = {
    id: string
    title: string
    status: string
    date: string
    description?: string
}

type StatusDefinition = {
    value: string
    label: string
    color: string
}

type FieldMapping = {
    id: string
    title: string
    status: string
    date: string
    description: string
}

type SortBy = 'date' | 'title' | 'status' | 'none'
type SortDirection = 'asc' | 'desc'
type ThemeConfig = {
    backgroundColor: string
    cardBackgroundColor: string
    titleColor: string
    textColor: string
    borderColor: string
    trackColor: string
    lineGradientStart: string
    lineGradientEnd: string
    borderRadius: number
    titleFontSize: number
    descriptionFontSize: number
    dateFontSize: number
    statusFontSize: number
}

const fallbackStatus: StatusDefinition = {
    value: 'unknown',
    label: 'Unknown',
    color: '#9ca3af'
}

const pad = (value: number): string => value.toString().padStart(2, '0')

const parseDateValue = (rawDate: string): Date | null => {
    const trimmed = rawDate.trim()
    if (trimmed.length === 0) {
        return null
    }

    if (/^\d+$/.test(trimmed)) {
        const asNumber = Number(trimmed)
        if (Number.isFinite(asNumber)) {
            const timestamp = trimmed.length <= 10 ? asNumber * 1000 : asNumber
            const fromTimestamp = new Date(timestamp)
            if (!Number.isNaN(fromTimestamp.getTime())) {
                return fromTimestamp
            }
        }
    }

    const parsedDate = new Date(trimmed)
    if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate
    }

    return null
}

const formatDateWithTokens = (rawDate: string, outputFormat: string): string => {
    const parsedDate = parseDateValue(rawDate)
    if (parsedDate == null) {
        return rawDate
    }

    const monthShort = parsedDate.toLocaleString('en-US', { month: 'short' })
    const monthLong = parsedDate.toLocaleString('en-US', { month: 'long' })
    const replacements: Array<[string, string]> = [
        ['YYYY', String(parsedDate.getFullYear())],
        ['MMMM', monthLong],
        ['MMM', monthShort],
        ['MM', pad(parsedDate.getMonth() + 1)],
        ['DD', pad(parsedDate.getDate())],
        ['D', String(parsedDate.getDate())]
    ]

    return replacements.reduce((result, [token, value]) => result.split(token).join(value), outputFormat)
}

const normalizeMilestones = (
    rawMilestones: Record<string, unknown>[],
    fieldMapping: FieldMapping
): NormalizedMilestone[] =>
    rawMilestones
        .map((milestone, index) => ({
            id: String(milestone[fieldMapping.id] ?? `milestone-${index + 1}`),
            title: String(milestone[fieldMapping.title] ?? `Untitled milestone ${index + 1}`),
            status: String(milestone[fieldMapping.status] ?? fallbackStatus.value),
            date: String(milestone[fieldMapping.date] ?? ''),
            description:
                milestone[fieldMapping.description] != null && String(milestone[fieldMapping.description]).length > 0
                    ? String(milestone[fieldMapping.description])
                    : undefined
        }))

const sortMilestones = (
    milestones: NormalizedMilestone[],
    sortBy: SortBy,
    sortDirection: SortDirection
): NormalizedMilestone[] => {
    if (sortBy === 'none') {
        return milestones
    }

    const multiplier = sortDirection === 'desc' ? -1 : 1
    const sorted = [...milestones].sort((left, right) => {
        if (sortBy === 'title') {
            return left.title.localeCompare(right.title)
        }
        if (sortBy === 'status') {
            return left.status.localeCompare(right.status)
        }

        const leftTime = parseDateValue(left.date)?.getTime() ?? Number.POSITIVE_INFINITY
        const rightTime = parseDateValue(right.date)?.getTime() ?? Number.POSITIVE_INFINITY
        return leftTime - rightTime
    })

    if (multiplier === -1) {
        sorted.reverse()
    }
    return sorted
}

const normalizeStatusConfig = (rawStatusConfig: StatusDefinition[]): StatusDefinition[] => {
    const valid = rawStatusConfig.filter(
        (item) =>
            item != null &&
            typeof item.value === 'string' &&
            item.value.length > 0 &&
            typeof item.label === 'string' &&
            item.label.length > 0 &&
            typeof item.color === 'string' &&
            item.color.length > 0
    )

    if (valid.length > 0) {
        return valid
    }

    return [
        { value: 'completed', label: 'Completed', color: '#16a34a' },
        { value: 'in_progress', label: 'In Progress', color: '#2563eb' },
        { value: 'upcoming', label: 'Upcoming', color: '#9ca3af' }
    ]
}

const toSerializableMilestone = (
    milestone: NormalizedMilestone
): import('@tryretool/custom-component-support').Retool.SerializableObject => ({
    id: milestone.id,
    title: milestone.title,
    status: milestone.status,
    date: milestone.date,
    description: milestone.description ?? null
})

const defaultTheme: ThemeConfig = {
    backgroundColor: 'transparent',
    cardBackgroundColor: '#ffffff',
    titleColor: '#111827',
    textColor: '#6b7280',
    borderColor: '#e5e7eb',
    trackColor: '#e5e7eb',
    lineGradientStart: '#2563eb',
    lineGradientEnd: '#22c55e',
    borderRadius: 10,
    titleFontSize: 16,
    descriptionFontSize: 14,
    dateFontSize: 12,
    statusFontSize: 12
}

const cssSupportsColor = (value: string): boolean => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return false
    }
    return globalThis.CSS?.supports?.('color', value.trim()) ?? false
}

const withValidColor = (value: string, fallback: string): string =>
    cssSupportsColor(value) ? value.trim() : fallback

export const ProgressTimeline: FC = () => {
    const [rawMilestones] = Retool.useStateArray({
        name: 'milestones',
        label: 'Milestones',
        description: 'Array of milestone rows. Each row should include title, status, date, and optional description fields.',
        initialValue: [
            {
                title: 'Project kickoff',
                status: 'completed',
                date: '2026-04-08',
                description: 'Align goals and initial timeline.'
            },
            {
                title: 'Implementation',
                status: 'in_progress',
                date: '2026-04-18',
                description: 'Build the first functional version.'
            },
            {
                title: 'Release',
                status: 'upcoming',
                date: '2026-05-02',
                description: 'Ship the feature to end users.'
            }
        ]
    })

    const [rawFieldMapping] = Retool.useStateObject({
        name: 'fieldMapping',
        label: 'Field Mapping',
        description: 'Maps your incoming milestone row keys to the fields used by this component.',
        initialValue: {
            id: 'id',
            title: 'title',
            status: 'status',
            date: 'date',
            description: 'description'
        }
    })

    const [rawStatusConfig] = Retool.useStateArray({
        name: 'statusConfig',
        label: 'Status Config',
        description: 'Defines available statuses and their visual labels/colors. Milestone status values should match these values.',
        initialValue: [
            { value: 'completed', label: 'Completed', color: '#16a34a' },
            { value: 'in_progress', label: 'In Progress', color: '#2563eb' },
            { value: 'upcoming', label: 'Upcoming', color: '#9ca3af' }
        ]
    })

    const [rawDoneStatuses] = Retool.useStateArray({
        name: 'doneStatuses',
        label: 'Done Statuses',
        description: 'List of status values counted as complete for progress-line fill.',
        initialValue: ['completed']
    })

    const [dateFormat] = Retool.useStateString({
        name: 'dateFormat',
        label: 'Date Format',
        description: 'Token-based output format for card dates (supports YYYY, MMMM, MMM, MM, DD, D).',
        initialValue: 'MMM D, YYYY'
    })

    const [backgroundColor] = Retool.useStateString({
        name: 'backgroundColor',
        label: 'Background color',
        description: 'Background color behind the full timeline component.',
        initialValue: 'transparent'
    })
    const [cardBackgroundColor] = Retool.useStateString({
        name: 'cardBackgroundColor',
        label: 'Card background',
        description: 'Background color used for each milestone card.',
        initialValue: '#ffffff'
    })
    const [titleColor] = Retool.useStateString({
        name: 'titleColor',
        label: 'Title color',
        description: 'Text color for milestone titles.',
        initialValue: '#111827'
    })
    const [textColor] = Retool.useStateString({
        name: 'textColor',
        label: 'Text color',
        description: 'Text color for date and description content.',
        initialValue: '#6b7280'
    })
    const [borderColor] = Retool.useStateString({
        name: 'borderColor',
        label: 'Border color',
        description: 'Border color for milestone cards.',
        initialValue: '#e5e7eb'
    })
    const [trackColor] = Retool.useStateString({
        name: 'trackColor',
        label: 'Track color',
        description: 'Color of the vertical timeline track behind the progress fill.',
        initialValue: '#e5e7eb'
    })
    const [lineGradientStart] = Retool.useStateString({
        name: 'lineGradientStart',
        label: 'Line gradient start',
        description: 'Starting color of the vertical progress gradient.',
        initialValue: '#2563eb'
    })
    const [lineGradientEnd] = Retool.useStateString({
        name: 'lineGradientEnd',
        label: 'Line gradient end',
        description: 'Ending color of the vertical progress gradient.',
        initialValue: '#22c55e'
    })
    const [borderRadius] = Retool.useStateNumber({
        name: 'borderRadius',
        label: 'Border radius',
        description: 'Corner radius for milestone cards (in pixels).',
        initialValue: 10
    })
    const [titleFontSize] = Retool.useStateNumber({
        name: 'titleFontSize',
        label: 'Title font size',
        description: 'Font size for milestone titles (in pixels).',
        initialValue: 16
    })
    const [descriptionFontSize] = Retool.useStateNumber({
        name: 'descriptionFontSize',
        label: 'Description font size',
        description: 'Font size for milestone descriptions (in pixels).',
        initialValue: 14
    })
    const [dateFontSize] = Retool.useStateNumber({
        name: 'dateFontSize',
        label: 'Date font size',
        description: 'Font size for date text (in pixels).',
        initialValue: 12
    })
    const [statusFontSize] = Retool.useStateNumber({
        name: 'statusFontSize',
        label: 'Status font size',
        description: 'Font size for status badges (in pixels).',
        initialValue: 12
    })

    const [sortByRaw, setSortByRaw] = Retool.useStateEnumeration({
        name: 'sortBy',
        label: 'Sort by',
        description: 'Select a sort field, or None to keep incoming milestone order.',
        inspector: 'select',
        enumDefinition: ['', 'none', 'date', 'title', 'status'],
        enumLabels: {
            '': 'None (legacy)',
            none: 'None',
            date: 'Date',
            title: 'Title',
            status: 'Status'
        },
        initialValue: 'none'
    })

    const [sortDirectionRaw] = Retool.useStateEnumeration({
        name: 'sortDirection',
        label: 'Sort direction',
        description: 'Sort order for the selected sort field (ignored when Sort by is None).',
        inspector: 'select',
        enumDefinition: ['asc', 'desc'],
        enumLabels: {
            asc: 'Ascending',
            desc: 'Descending'
        },
        initialValue: 'asc'
    })

    useEffect(() => {
        if (sortByRaw === '') {
            setSortByRaw('none')
        }
    }, [sortByRaw, setSortByRaw])

    const [emptyStateText] = Retool.useStateString({
        name: 'emptyStateText',
        label: 'Empty state text',
        description: 'Message shown when no milestones are provided.',
        initialValue: 'No milestones yet'
    })

    const [, setSelectedMilestone] = Retool.useStateObject({
        name: 'selectedMilestone',
        inspector: 'hidden',
        initialValue: {}
    })

    const onMilestoneClick = Retool.useEventCallback({ name: 'milestoneClick' })

    const fieldMapping = {
        id: String((rawFieldMapping as Partial<FieldMapping>)?.id ?? 'id'),
        title: String((rawFieldMapping as Partial<FieldMapping>)?.title ?? 'title'),
        status: String((rawFieldMapping as Partial<FieldMapping>)?.status ?? 'status'),
        date: String((rawFieldMapping as Partial<FieldMapping>)?.date ?? 'date'),
        description: String((rawFieldMapping as Partial<FieldMapping>)?.description ?? 'description')
    }
    const baseMilestones = normalizeMilestones(rawMilestones as Record<string, unknown>[], fieldMapping)
    const sortBy = (['none', 'date', 'title', 'status'] as const).includes(sortByRaw as SortBy)
        ? (sortByRaw as SortBy)
        : 'none'
    const sortDirection = (sortDirectionRaw === 'desc' ? 'desc' : 'asc') as SortDirection
    const milestones = sortMilestones(baseMilestones, sortBy, sortDirection)
    const statusConfig = normalizeStatusConfig(rawStatusConfig as StatusDefinition[])
    const statusMap = statusConfig.reduce<Record<string, StatusDefinition>>((map, item) => {
        map[item.value] = item
        return map
    }, {})
    const doneStatuses = (rawDoneStatuses as unknown[])
        .filter((status): status is string => typeof status === 'string' && status.length > 0)
    const doneStatusSet = new Set(doneStatuses)
    const completedMilestones = milestones.filter((milestone) => doneStatusSet.has(milestone.status)).length
    const progressPercent = (() => {
        if (milestones.length <= 1) {
            return completedMilestones > 0 ? 100 : 0
        }
        // Snap the fill to milestone-to-milestone segments to avoid visual gaps near the next node.
        const segmentProgress = completedMilestones / (milestones.length - 1)
        return Math.max(0, Math.min(1, segmentProgress)) * 100
    })()
    const theme = {
        backgroundColor: withValidColor(backgroundColor, defaultTheme.backgroundColor),
        cardBackgroundColor: withValidColor(cardBackgroundColor, defaultTheme.cardBackgroundColor),
        titleColor: withValidColor(titleColor, defaultTheme.titleColor),
        textColor: withValidColor(textColor, defaultTheme.textColor),
        borderColor: withValidColor(borderColor, defaultTheme.borderColor),
        trackColor: withValidColor(trackColor, defaultTheme.trackColor),
        lineGradientStart: withValidColor(lineGradientStart, defaultTheme.lineGradientStart),
        lineGradientEnd: withValidColor(lineGradientEnd, defaultTheme.lineGradientEnd),
        borderRadius,
        titleFontSize,
        descriptionFontSize,
        dateFontSize,
        statusFontSize
    }

    const rootStyle = {
        '--timeline-background-color': theme.backgroundColor,
        '--timeline-card-background': theme.cardBackgroundColor,
        '--timeline-title-color': theme.titleColor,
        '--timeline-text-color': theme.textColor,
        '--timeline-border-color': theme.borderColor,
        '--timeline-track-color': theme.trackColor,
        '--timeline-line-start': theme.lineGradientStart,
        '--timeline-line-end': theme.lineGradientEnd,
        '--timeline-radius': `${theme.borderRadius}px`,
        '--timeline-title-font-size': `${theme.titleFontSize}px`,
        '--timeline-description-font-size': `${theme.descriptionFontSize}px`,
        '--timeline-date-font-size': `${theme.dateFontSize}px`,
        '--timeline-status-font-size': `${theme.statusFontSize}px`
    } as React.CSSProperties

    const selectMilestone = (milestone: NormalizedMilestone): void => {
        setSelectedMilestone(toSerializableMilestone(milestone))
        onMilestoneClick()
    }

    if (milestones.length === 0) {
        return (
            <div className={styles.emptyState}>
                {emptyStateText}
            </div>
        )
    }

    return (
        <div className={styles.root} style={rootStyle}>
            <div
                className={styles.lineTrack}
                style={{
                    '--progress': `${Math.max(0, Math.min(1, progressPercent / 100))}`
                } as React.CSSProperties
            }
            >
                <div
                    className={styles.lineFill}
                    style={{
                        height: 'calc(100% * var(--progress))'
                    }}
                />
            </div>
            <ol className={styles.list}>
                {milestones.map((milestone, index) => {
                    const status = statusMap[milestone.status] ?? fallbackStatus
                    return (
                        <li
                            key={milestone.id}
                            className={styles.item}
                            role='button'
                            tabIndex={0}
                            aria-label={`Select milestone ${milestone.title}`}
                            style={{
                                animationDelay: `${index * 80}ms`
                            }}
                            onClick={() => selectMilestone(milestone)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    selectMilestone(milestone)
                                }
                            }}
                        >
                            <div
                                className={styles.dot}
                                style={{
                                    backgroundColor: status.color,
                                    boxShadow: `0 0 0 4px ${status.color}22`
                                }}
                            />
                            <div className={styles.row}>
                                <p className={styles.title}>{milestone.title}</p>
                                <span
                                    className={styles.badge}
                                    style={{
                                        color: status.color,
                                        backgroundColor: `${status.color}1A`
                                    }}
                                >
                                    {status.label}
                                </span>
                            </div>
                            <p className={styles.date}>
                                {formatDateWithTokens(milestone.date, dateFormat)}
                            </p>
                            {milestone.description != null && milestone.description.length > 0 ? (
                                <p className={styles.description}>{milestone.description}</p>
                            ) : null}
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}
