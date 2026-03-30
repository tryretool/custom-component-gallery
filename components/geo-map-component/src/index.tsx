import React, { type FC, useEffect, useRef } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './style.css'

let geoJsonCache: any = null

export const GeoMapComponent: FC = () => {
  Retool.useComponentSettings({
    defaultWidth: 12,
    defaultHeight: 60
  })

  const [data] = Retool.useStateArray<any>({ name: 'data', initialValue: [] })
  const [countryKey] = Retool.useStateString({ name: 'countryKey', initialValue: 'country' })
  const [valueKey] = Retool.useStateString({ name: 'valueKey', initialValue: 'value' })

  const [lowColor] = Retool.useStateString({ name: 'lowColor', label: 'Low Value Color (0%)', initialValue: '#ffaa6e' })
  const [midLowColor] = Retool.useStateString({ name: 'midLowColor', label: 'Mid-Low Color (25%)', initialValue: '#f7c873' })
  const [midHighColor] = Retool.useStateString({ name: 'midHighColor', label: 'Mid-High Color (75%)', initialValue: '#7297ef' })
  const [highColor] = Retool.useStateString({ name: 'highColor', label: 'High Value Color (100%)', initialValue: '#1d2e6b' })

  const [selectedCountry, setSelectedCountry] = Retool.useStateObject({
    name: 'selectedCountry',
    initialValue: {}
  })

  const onSelect = Retool.useEventCallback({ name: 'onSelect' })

  const mapRef = useRef<L.Map | null>(null)
  const geoLayerRef = useRef<L.GeoJSON | null>(null)
  const layerMapRef = useRef<Map<string, any>>(new Map())
  const currentDataRef = useRef<Map<string, number>>(new Map())
  const selectedLayerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const safeLowColor = lowColor || '#ffaa6e'
  const safeMidLowColor = midLowColor || '#f7c873'
  const safeMidHighColor = midHighColor || '#7297ef'
  const safeHighColor = highColor || '#1d2e6b'

  const countryCodeMap: Record<string, string> = {
    us: 'united states of america',
    usa: 'united states of america',
    in: 'india',
    ind: 'india',
    br: 'brazil',
    bra: 'brazil',
    uk: 'united kingdom',
    gb: 'united kingdom'
  }

  const normalize = (v: string) =>
    v.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim()

  const resolveCountry = (input: string) =>
    countryCodeMap[normalize(input)] || normalize(input)

  const hexToRgb = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ]

  const interpolate = (a: string, b: string, t: number) => {
    const [r1, g1, b1] = hexToRgb(a)
    const [r2, g2, b2] = hexToRgb(b)
    return `rgb(${r1 + (r2 - r1) * t},${g1 + (g2 - g1) * t},${b1 + (b2 - b1) * t})`
  }

  const getColor = (v: number) => {
    v = Math.max(0, Math.min(100, v))
    if (v <= 25) return interpolate(safeLowColor, safeMidLowColor, v / 25)
    if (v <= 75) return interpolate(safeMidLowColor, safeMidHighColor, (v - 25) / 50)
    return interpolate(safeMidHighColor, safeHighColor, (v - 75) / 25)
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      minZoom: 1.5,
      maxZoom: 5,
      attributionControl: false,
      worldCopyJump: true,
      maxBoundsViscosity: 0,
      scrollWheelZoom: true,
      inertia: true
    }).setView([20, 0], 2)

    mapRef.current = map

    const loadGeo = async () => {
      if (!geoJsonCache) {
        const res = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        geoJsonCache = await res.json()
      }

      const layer = L.geoJSON(geoJsonCache, {
        style: { fillColor: '#fff', weight: 0.5, color: '#ccc', fillOpacity: 1 },
        onEachFeature: (feature, layer) => {
          const name = resolveCountry(feature.properties.name)
          layerMapRef.current.set(name, layer)

          layer.on('click', () => {
            const clickedName = feature.properties.name
            const normalized = resolveCountry(clickedName)
            const val = currentDataRef.current.get(normalized)

            if (selectedLayerRef.current) {
              selectedLayerRef.current.setStyle({ weight: 0.5, color: '#666' })
            }

            layer.setStyle({ weight: 2, color: '#000' })
            selectedLayerRef.current = layer

            const payload = { country: clickedName, value: val ?? null }

            setSelectedCountry(payload)
            onSelect(payload)
          })
        }
      }).addTo(map)

      geoLayerRef.current = layer
    }

    loadGeo()
  }, [])

  useEffect(() => {
    if (!geoLayerRef.current) return

    const parsed = new Map<string, number>()
    let min = Infinity, max = -Infinity

    for (const row of data) {
      const c = resolveCountry(row[countryKey])
      const v = parseFloat(String(row[valueKey]).replace('%', ''))
      if (!isNaN(v)) {
        parsed.set(c, v)
        min = Math.min(min, v)
        max = Math.max(max, v)
      }
    }

    currentDataRef.current = parsed

    const normalizeVal = (v: number) =>
      max <= 100 ? v : min === max ? 50 : ((v - min) / (max - min)) * 100

    layerMapRef.current.forEach((layer, name) => {
      const val = parsed.get(name)

      if (val !== undefined) {
        const norm = normalizeVal(val)
        const color = getColor(norm)

        layer.setStyle({
          fillColor: color,
          color: '#666',
          fillOpacity: 0.9,
          weight: selectedLayerRef.current === layer ? 2 : 0.5
        })

        const label = valueKey.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

        const displayValue = max <= 100 ? `${val.toFixed(2)}%` : val.toLocaleString()

        layer.bindTooltip(
          `<div style="min-width:170px;padding:10px 12px;border-radius:10px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,0.15);font-family:system-ui">
            <div style="font-size:13px;font-weight:600;color:#444;margin-bottom:6px;">${layer.feature.properties.name}</div>
            <div style="font-size:20px;font-weight:700;color:#111;margin-bottom:4px;">${displayValue}</div>
            <div style="font-size:11px;color:#777;display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
              ${label}
            </div>
          </div>`,
          { sticky: true, direction: 'top', opacity: 1, className: 'custom-modern-tooltip' }
        )
      } else {
        layer.setStyle({
          fillColor: '#fff',
          color: '#ccc',
          fillOpacity: 1,
          weight: 0.5
        })
        layer.unbindTooltip()
      }
    })
  }, [data, countryKey, valueKey, lowColor, midLowColor, midHighColor, highColor])

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      <div style={{
        position: 'absolute',
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#fff',
        padding: '10px 8px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'system-ui',
        zIndex: 999
      }}>
        <div style={{ fontSize: '10px', color: '#555' }}>100</div>

        <div style={{
          width: '12px',
          height: '150px',
          borderRadius: '6px',
          background: `linear-gradient(to bottom, ${safeHighColor}, ${safeMidHighColor}, ${safeMidLowColor}, ${safeLowColor})`
        }} />

        <div style={{ fontSize: '10px', color: '#555' }}>0</div>
      </div>
    </div>
  )
}