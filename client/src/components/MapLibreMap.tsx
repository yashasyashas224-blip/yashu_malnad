import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';

interface MapProps {
  buildings: any[];
  userLocation: [number, number];
  destinationNode: any | null;
  activeRoute: any | null;
  onSelectBuilding: (building: any) => void;
}

export const MapLibreMap: React.FC<MapProps> = ({
  buildings,
  userLocation,
  destinationNode,
  activeRoute,
  onSelectBuilding
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const buildingMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [isSatellite, setIsSatellite] = useState(false);

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'administrative':
        return { icon: '🏛️', bg: 'linear-gradient(135deg, #0f2c59, #1e3a8a)', color: '#ffffff' };
      case 'academic':
        return { icon: '💻', bg: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#ffffff' };
      case 'amenity':
        return { icon: '☕', bg: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#ffffff' };
      case 'hostel':
        return { icon: '🏠', bg: 'linear-gradient(135deg, #b45309, #d97706)', color: '#ffffff' };
      case 'sports':
        return { icon: '⚽', bg: 'linear-gradient(135deg, #047857, #10b981)', color: '#ffffff' };
      case 'spiritual':
        return { icon: '🕉️', bg: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#ffffff' };
      default:
        return { icon: '📍', bg: 'linear-gradient(135deg, #0f2c59, #334155)', color: '#ffffff' };
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 100% Free, zero-API-key OpenStreetMap and ESRI World Satellite basemaps
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors | Malnad College of Engineering'
          },
          satellite: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics | Malnad College of Engineering'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 20
          },
          {
            id: 'satellite-tiles',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 20,
            layout: {
              visibility: 'none'
            }
          }
        ]
      },
      center: [76.10354, 13.02365],
      zoom: 16.7,
      pitch: 35,
      bearing: 15,
      maxBounds: [
        [76.095, 13.015],
        [76.115, 13.032]
      ]
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

    map.on('load', () => {
      // Fetch and render Campus Boundary and Walkways
      fetch('/api/campus/geojson')
        .then(res => res.json())
        .then(data => {
          if (!map.getSource('mce-campus')) {
            map.addSource('mce-campus', { type: 'geojson', data });

            // Campus boundary ambient glow
            map.addLayer({
              id: 'mce-boundary-fill',
              type: 'fill',
              source: 'mce-campus',
              filter: ['==', 'type', 'boundary'],
              paint: {
                'fill-color': '#0f2c59',
                'fill-opacity': 0.06
              }
            });

            map.addLayer({
              id: 'mce-boundary-line',
              type: 'line',
              source: 'mce-campus',
              filter: ['==', 'type', 'boundary'],
              paint: {
                'line-color': '#0f2c59',
                'line-width': 2.5,
                'line-dasharray': [3, 2]
              }
            });

            // Walkways network (Realistic campus paved walkways)
            map.addLayer({
              id: 'mce-walkways-casing',
              type: 'line',
              source: 'mce-campus',
              filter: ['==', 'type', 'walkway'],
              paint: {
                'line-color': '#ffffff',
                'line-width': 5,
                'line-opacity': 0.9
              }
            });

            map.addLayer({
              id: 'mce-walkways',
              type: 'line',
              source: 'mce-campus',
              filter: ['==', 'type', 'walkway'],
              paint: {
                'line-color': '#94a3b8',
                'line-width': 3,
                'line-opacity': 0.8
              }
            });

            // Route Source & Layer with modern glowing polyline
            map.addSource('route-source', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: [] }
              }
            });

            map.addLayer({
              id: 'route-line-halo',
              type: 'line',
              source: 'route-source',
              paint: {
                'line-color': '#60a5fa',
                'line-width': 10,
                'line-opacity': 0.4
              }
            });

            map.addLayer({
              id: 'route-line-main',
              type: 'line',
              source: 'route-source',
              layout: {
                'line-cap': 'round',
                'line-join': 'round'
              },
              paint: {
                'line-color': '#2563eb',
                'line-width': 5
              }
            });
          }
        })
        .catch(err => console.warn('Could not load MCE campus GeoJSON:', err));
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update building pins with high-end badges
  useEffect(() => {
    if (!mapRef.current) return;

    buildingMarkersRef.current.forEach(m => m.remove());
    buildingMarkersRef.current = [];

    buildings.forEach(b => {
      const meta = getCategoryMeta(b.category);
      const el = document.createElement('div');
      el.className = 'mce-marker-container';
      el.innerHTML = `
        <div class="mce-marker-card">
          <div class="mce-marker-icon" style="background:${meta.bg}">${meta.icon}</div>
          <span class="mce-marker-label">${b.shortCode}</span>
        </div>
        <div class="mce-marker-stem"></div>
      `;

      el.addEventListener('click', () => {
        onSelectBuilding(b);
        mapRef.current?.flyTo({
          center: b.coordinates,
          zoom: 17.5,
          pitch: 45,
          duration: 900
        });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(b.coordinates)
        .addTo(mapRef.current!);

      buildingMarkersRef.current.push(marker);
    });
  }, [buildings, onSelectBuilding]);

  // Live User Location Pulse Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-location-halo';
      el.innerHTML = `
        <div class="user-location-pulse"></div>
        <div class="user-location-dot"></div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(userLocation)
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat(userLocation);
    }
  }, [userLocation]);

  // Destination Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (destinationNode) {
      if (!destMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'mce-marker-container animate-bounce';
        el.innerHTML = `
          <div class="mce-marker-card" style="background:#dc2626; border-color:#fca5a5;">
            <div class="mce-marker-icon" style="background:white; color:#dc2626;">🏁</div>
            <span class="mce-marker-label" style="color:white;">Destination</span>
          </div>
          <div class="mce-marker-stem" style="border-top-color:#dc2626;"></div>
        `;
        destMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(destinationNode.coordinates)
          .addTo(mapRef.current);
      } else {
        destMarkerRef.current.setLngLat(destinationNode.coordinates);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  }, [destinationNode]);

  // Update Route Line & Camera framing
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const source = map.getSource('route-source') as maplibregl.GeoJSONSource;
    if (source) {
      if (activeRoute && activeRoute.pathCoordinates && activeRoute.pathCoordinates.length > 0) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: activeRoute.pathCoordinates
          }
        });

        if (activeRoute.pathCoordinates.length > 1) {
          const bounds = new maplibregl.LngLatBounds();
          activeRoute.pathCoordinates.forEach((coord: [number, number]) => bounds.extend(coord));
          map.fitBounds(bounds, { padding: 90, duration: 1000, maxZoom: 18 });
        } else if (activeRoute.pathCoordinates.length === 1) {
          map.flyTo({ center: activeRoute.pathCoordinates[0], zoom: 17, duration: 800 });
        }
      } else {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] }
        });
      }
    }
  }, [activeRoute]);

  const toggleSatellite = () => {
    const next = !isSatellite;
    setIsSatellite(next);
    if (mapRef.current && mapRef.current.getLayer('satellite-tiles')) {
      mapRef.current.setLayoutProperty('satellite-tiles', 'visibility', next ? 'visible' : 'none');
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="map-container" />
      
      {/* Floating Map Controls Dock (Top Right or Bottom Right) */}
      <div className="absolute bottom-28 right-4 z-20 flex flex-col space-y-2.5">
        {/* Toggle Satellite / Street Basemap */}
        <button
          onClick={toggleSatellite}
          className="w-12 h-12 bg-white/95 hover:bg-white text-slate-800 rounded-2xl shadow-xl border border-white/70 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center hover:shadow-2xl group"
          title={isSatellite ? "Switch to Standard Map" : "Switch to Satellite Imagery"}
        >
          <span className="text-xl group-hover:scale-110 transition-transform">
            {isSatellite ? '🗺️' : '🛰️'}
          </span>
        </button>

        {/* Recenter on Campus User Location */}
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.flyTo({ center: userLocation, zoom: 17.2, pitch: 35, duration: 800 });
            }
          }}
          className="w-12 h-12 bg-white/95 hover:bg-white text-[#0f2c59] rounded-2xl shadow-xl border border-white/70 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center hover:shadow-2xl group"
          title="Recenter on My Location"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🎯</span>
        </button>
      </div>
    </div>
  );
};
