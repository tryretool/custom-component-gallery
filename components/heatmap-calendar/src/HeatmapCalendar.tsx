import React, { type FC, useMemo } from 'react'
import { Retool } from '@tryretool/custom-component-support'

const COLOR_THEMES: Record<string, string[]> = {
    github: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    blue: ['#ebedf0', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'],
    orange: ['#ebedf0', '#fdba74', '#f97316', '#c2410c', '#7c2d12'],
    purple: ['#ebedf0', '#d8b4fe', '#a855f7', '#7e22ce', '#581c87'],
}

const cssStyles = `
.heatmap-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #ffffff;
    box-sizing: border-box;
    padding: 10px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
}

.heatmap-scroll-area {
    display: flex;
    position: relative;
    overflow-x: auto;
    padding-bottom: 10px;
}

.heatmap-core {
    display: flex;
    gap: 4px;
}

/* Y-Axis Labels (Days) */
.heatmap-y-axis {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-right: 4px;
    margin-top: 16px; /* Offset for month header */
}

.heatmap-day-label {
    font-size: 9px;
    color: #24292e;
    height: 11px;
    line-height: 11px;
    width: 25px;
    text-align: left;
}

.heatmap-day-label.hidden {
    visibility: hidden;
}

/* The Grid Container */
.heatmap-grid-container {
    display: flex;
    flex-direction: column;
}

/* X-Axis Labels (Months) */
.heatmap-months {
    display: flex;
    height: 16px;
    position: relative;
    width: 100%;
}

.heatmap-month-label {
    position: absolute;
    font-size: 9px;
    color: #24292e;
    top: 0;
}

/* Weeks block */
.heatmap-weeks {
    display: flex;
    gap: 4px;
}

.heatmap-week {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.heatmap-day {
    width: 11px;
    height: 11px;
    border-radius: 2px;
    transition: transform 0.1s, box-shadow 0.1s;
    cursor: pointer;
    position: relative;
    outline: 1px solid rgba(27, 31, 35, 0.06);
    outline-offset: -1px;
}

.heatmap-day:hover {
    transform: scale(1.2);
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    z-index: 10;
}

.heatmap-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    margin-top: 10px;
    font-size: 11px;
    color: #586069;
}

.legend-block {
    display: flex;
    gap: 3px;
    margin: 0 4px;
}

.legend-cell {
    width: 11px;
    height: 11px;
    border-radius: 2px;
}
`

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const HeatmapCalendar: FC = () => {
    Retool.useComponentSettings({
        defaultHeight: 5,
    })

    const [data] = Retool.useStateArray({
        name: 'data',
        initialValue: [],
        label: 'Activity Data Array',
        inspector: 'text',
        description: 'An array of objects: [{ date: "YYYY-MM-DD", count: <number> }]',
    })

    const [colorTheme] = Retool.useStateEnumeration({
        name: 'colorTheme',
        initialValue: 'github',
        label: 'Color Theme',
        enumDefinition: ['github', 'blue', 'orange', 'purple'],
        inspector: 'select',
    })

    const [footerText] = Retool.useStateString({
        name: 'footerText',
        initialValue: 'Activities in the last year',
        label: 'Footer Text',
        inspector: 'text',
        description: 'Text displayed at the bottom left of the legend.'
    })

    const [tooltipUnit] = Retool.useStateString({
        name: 'tooltipUnit',
        initialValue: 'activities',
        label: 'Tooltip Unit',
        inspector: 'text',
        description: 'The unit word displayed when hovering over a square (e.g., "sales", "errors").'
    })

    const [selectedDate, setSelectedDate] = Retool.useStateString({
        name: 'selectedDate',
        initialValue: '',
        inspector: 'hidden',
    })

    const emitClick = Retool.useEventCallback({ name: 'click' })

    const { weeks, monthLabels, maxCount } = useMemo(() => {
        const parsedData = Array.isArray(data) ? data : []
        const dataMap = new Map<string, number>()
        let max = 0

        parsedData.forEach((item: any) => {
            if (item && item.date && typeof item.count === 'number') {
                dataMap.set(item.date, item.count)
                if (item.count > max) max = item.count
            }
        })

        // Generate exactly 52 weeks representing approx 1 year
        const numWeeks = 52
        const totalDays = numWeeks * 7

        const endDate = new Date()
        const startDate = new Date(endDate)
        // Set to exactly 52 weeks ago
        startDate.setDate(endDate.getDate() - totalDays + 1)

        // Align to the previous Sunday to ensure perfectly full columns
        while (startDate.getDay() !== 0) {
            startDate.setDate(startDate.getDate() - 1)
        }

        const weeksArr: Array<Array<{ date: string; count: number; level: number }>> = []
        let currentWeek: Array<{ date: string; count: number; level: number }> = []

        const newMonthLabels: Array<{ text: string; colIndex: number }> = []
        let lastMonth = -1

        for (let i = 0; i < totalDays; i++) {
            const d = new Date(startDate.getTime() + i * 86400000)
            const dateStr = d.toISOString().split('T')[0]
            const count = dataMap.get(dateStr) || 0

            let level = 0
            if (count > 0) {
                if (max === 0 || count <= max * 0.25) level = 1
                else if (count <= max * 0.5) level = 2
                else if (count <= max * 0.75) level = 3
                else level = 4
            }

            // Track month changes (only push label if it's the first day of the actual month, 
            // or if it changed on the first week to give a starting label)
            if (d.getDate() <= 7 && d.getMonth() !== lastMonth) {
                const colIndex = Math.floor(i / 7)
                // Don't squish labels at the very end
                if (colIndex < numWeeks - 2) {
                    newMonthLabels.push({ text: MONTH_NAMES[d.getMonth()], colIndex })
                    lastMonth = d.getMonth()
                }
            }

            currentWeek.push({ date: dateStr, count, level })

            if (currentWeek.length === 7) {
                weeksArr.push(currentWeek)
                currentWeek = []
            }
        }

        return { weeks: weeksArr, monthLabels: newMonthLabels, maxCount: max }
    }, [data])

    const activeColors = COLOR_THEMES[colorTheme] || COLOR_THEMES.github

    const handleDayClick = (dateStr: string) => {
        setSelectedDate(dateStr)
        emitClick()
    }

    return (
        <div className="heatmap-container">
            <style>{cssStyles}</style>

            <div className="heatmap-scroll-area">
                <div className="heatmap-core">
                    {/* Y-Axis (Days) */}
                    <div className="heatmap-y-axis">
                        <div className="heatmap-day-label hidden">Sun</div>
                        <div className="heatmap-day-label">Mon</div>
                        <div className="heatmap-day-label hidden">Tue</div>
                        <div className="heatmap-day-label">Wed</div>
                        <div className="heatmap-day-label hidden">Thu</div>
                        <div className="heatmap-day-label">Fri</div>
                        <div className="heatmap-day-label hidden">Sat</div>
                    </div>

                    <div className="heatmap-grid-container">
                        {/* X-Axis (Months) */}
                        <div className="heatmap-months">
                            {monthLabels.map((m, idx) => (
                                <div
                                    key={idx}
                                    className="heatmap-month-label"
                                    style={{ left: m.colIndex * 15 }} // 11px width + 4px gap = 15px
                                >
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="heatmap-weeks">
                            {weeks.map((week, wIndex) => (
                                <div key={wIndex} className="heatmap-week">
                                    {week.map((day, dIndex) => (
                                        <div
                                            key={dIndex}
                                            className="heatmap-day"
                                            style={{ backgroundColor: activeColors[day.level] }}
                                            title={day.count > 0 ? `${day.count} ${tooltipUnit} on ${day.date}` : `0 ${tooltipUnit} on ${day.date}`}
                                            onClick={() => handleDayClick(day.date)}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="heatmap-footer">
                <span style={{ flex: 1, textAlign: 'left', marginLeft: '30px' }}>
                    {data && (data as any[]).length > 0 ? footerText : "Awaiting data input..."}
                </span>
                <span>Less</span>
                <div className="legend-block">
                    {activeColors.map((color, idx) => (
                        <div key={idx} className="legend-cell" style={{ backgroundColor: color }} />
                    ))}
                </div>
                <span>More</span>
            </div>
        </div>
    )
}
