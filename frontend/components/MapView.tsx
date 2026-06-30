'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Complaint {
  id: string
  lat: number
  lng: number
  city: string
  category: string
  severity: string
  amount_inr: number
  timestamp: string
}

interface Hotspot {
  city: string
  lat: number
  lng: number
  count: number
  total_amount_inr: number
  patrol_score: number
  top_category: string
}

interface MapViewProps {
  complaints: Complaint[]
  hotspots: Hotspot[]
  category: string
  onHotspotClick: (h: Hotspot) => void
}

const CAT_COLOURS: Record<string, string> = {
  digital_arrest: '#E5484D',
  counterfeit_seizure: '#F5A623',
  mule_account: '#3E63DD',
  phishing: '#9B59B6',
  investment_fraud: '#30A46C',
}

export default function MapView({ complaints, hotspots, category, onHotspotClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      },
      center: [78.9629, 20.5937],
      zoom: 4.5,
    })
    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    complaints.slice(0, 300).forEach(c => {
      const colour = CAT_COLOURS[c.category] ?? '#94A3B8'
      const el = document.createElement('div')
      el.style.cssText = `width:8px;height:8px;border-radius:50%;background:${colour};opacity:0.7;border:1px solid ${colour}40;cursor:pointer;`
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([c.lng, c.lat])
        .addTo(map)
      markersRef.current.push(marker)
    })

    hotspots.forEach(h => {
      const r = Math.max(16, Math.min(40, h.count / 3))
      const el = document.createElement('div')
      const score = h.patrol_score
      const bg = score > 0.75 ? '#E5484D' : score > 0.5 ? '#F5A623' : '#3E63DD'
      el.style.cssText = `width:${r}px;height:${r}px;border-radius:50%;background:${bg}30;border:2px solid ${bg};display:flex;align-items:center;justify-content:center;cursor:pointer;color:${bg};font-size:10px;font-weight:700;font-family:monospace;`
      el.textContent = String(h.count)
      el.addEventListener('click', () => onHotspotClick(h))
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([h.lng, h.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
          `<div style="background:#121821;color:#E2E8F0;padding:8px;border-radius:4px;font-family:monospace;font-size:11px;">
            <strong>${h.city}</strong><br/>
            Reports: ${h.count}<br/>
            Priority: ${(h.patrol_score * 100).toFixed(0)}%
          </div>`
        ))
        .addTo(map)
      markersRef.current.push(marker)
    })
  }, [complaints, hotspots, category, onHotspotClick])

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: 400 }}>
      <style>{`
        .maplibregl-popup-content { background: #121821 !important; color: #E2E8F0 !important; border: 1px solid #1C2530 !important; border-radius: 4px !important; padding: 0 !important; }
        .maplibregl-popup-tip { border-top-color: #1C2530 !important; }
      `}</style>
    </div>
  )
}
