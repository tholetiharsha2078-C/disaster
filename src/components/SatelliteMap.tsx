import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident, UserLocation } from '../types';
import { calculateDistanceKm, getAlertZoneLevel } from '../utils/geo';
import { AlertTriangle, CheckCircle2, HelpCircle, Layers, LocateFixed, Eye } from 'lucide-react';

interface SatelliteMapProps {
  incidents: Incident[];
  userLocation: UserLocation;
  selectedIncident?: Incident | null;
  onSelectIncident?: (incident: Incident) => void;
  heightClass?: string;
  showZones?: boolean;
}

export const SatelliteMap: React.FC<SatelliteMapProps> = ({
  incidents,
  userLocation,
  selectedIncident,
  onSelectIncident,
  heightClass = 'h-[500px] sm:h-[600px]',
  showZones = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapType, setMapType] = useState<'satellite' | 'streets'>('satellite');
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    // Default layer: SATELLITE (Esri World Imagery)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
      }
    );

    satelliteLayer.addTo(map);
    baseTileLayerRef.current = satelliteLayer;

    // Layers for dynamic markers and zones
    const zonesLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    zonesLayerRef.current = zonesLayer;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map type toggle (Satellite vs Streets)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    if (mapType === 'satellite') {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution: 'Satellite Tiles &copy; Esri Earthstar Geographics',
        }
      );
      satLayer.addTo(map);
      baseTileLayerRef.current = satLayer;
    } else {
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      });
      streetLayer.addTo(map);
      baseTileLayerRef.current = streetLayer;
    }
  }, [mapType]);

  // Update user location marker (solid dark dot) and alert zones
  useEffect(() => {
    if (!mapInstanceRef.current || !zonesLayerRef.current) return;
    const map = mapInstanceRef.current;
    const zonesLayer = zonesLayerRef.current;

    // Remove previous user marker
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }

    // User location marker: Solid dark dot per user specification
    const darkDotHtml = `
      <div id="user-location-dark-dot" style="
        width: 14px;
        height: 14px;
        background-color: #111827;
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0,0,0,0.6);
        cursor: pointer;
      " title="Your Location"></div>
    `;

    const userIcon = L.divIcon({
      html: darkDotHtml,
      className: 'user-marker-icon',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    const accuracyText = userLocation.accuracyMeters
      ? ` (Accuracy: ~${userLocation.accuracyMeters}m)`
      : '';
    userMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 13px; color: #111827; line-height: 1.4; padding: 2px;">
        <div style="font-weight: 700; margin-bottom: 2px;">Your Current Location</div>
        <div style="color: #4b5563;">${userLocation.address || 'Civil Sector Coordinates'}</div>
        <div style="color: #6b7280; font-size: 11px; margin-top: 4px;">Lat: ${userLocation.latitude.toFixed(4)}°, Lon: ${userLocation.longitude.toFixed(4)}°${accuracyText}</div>
      </div>
    `);

    userMarkerRef.current = userMarker;

    // Draw Alert Zones from user location
    zonesLayer.clearLayers();
    if (showZones) {
      // 0–5 km HIGH ALERT
      L.circle([userLocation.latitude, userLocation.longitude], {
        radius: 5000,
        color: '#dc2626',
        weight: 1.5,
        opacity: 0.8,
        fillColor: '#dc2626',
        fillOpacity: 0.1,
        dashArray: '4, 4',
      })
        .bindTooltip('0–5 km: High Alert Perimeter', { sticky: true, className: 'zone-tooltip' })
        .addTo(zonesLayer);

      // 5–10 km ALERT
      L.circle([userLocation.latitude, userLocation.longitude], {
        radius: 10000,
        color: '#ea580c',
        weight: 1.2,
        opacity: 0.7,
        fillColor: '#ea580c',
        fillOpacity: 0.05,
        dashArray: '3, 4',
      })
        .bindTooltip('5–10 km: Alert Perimeter', { sticky: true, className: 'zone-tooltip' })
        .addTo(zonesLayer);

      // 10–15 km STAY CAUTIOUS
      L.circle([userLocation.latitude, userLocation.longitude], {
        radius: 15000,
        color: '#4b5563',
        weight: 1,
        opacity: 0.6,
        fillColor: '#4b5563',
        fillOpacity: 0.03,
        dashArray: '2, 5',
      })
        .bindTooltip('10–15 km: Caution Perimeter', { sticky: true, className: 'zone-tooltip' })
        .addTo(zonesLayer);
    }
  }, [userLocation, showZones]);

  // Update incident markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    incidents.forEach((incident) => {
      const isSelected = selectedIncident?.id === incident.id;
      const isConfirmed = incident.status === 'CONFIRMED';
      const isCritical = incident.severity === 'CRITICAL' || incident.severity === 'HIGH';

      // Determine marker color and icon style
      let markerBg = '#b91c1c'; // Red for confirmed/critical
      let borderColor = '#ffffff';
      let statusLabel = 'CONFIRMED';

      if (incident.status === 'UNVERIFIED') {
        markerBg = '#d97706'; // Amber for unverified
        statusLabel = 'UNVERIFIED';
      } else if (incident.status === 'RESOLVED') {
        markerBg = '#16a34a'; // Green for resolved
        statusLabel = 'RESOLVED';
      }

      const dist = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        incident.latitude,
        incident.longitude
      );

      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isSelected ? '32px' : '26px'};
          height: ${isSelected ? '32px' : '26px'};
          background-color: ${markerBg};
          border: 2px solid ${borderColor};
          border-radius: 50%;
          color: #ffffff;
          font-family: sans-serif;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
          cursor: pointer;
        " title="${incident.type} - ${statusLabel}">
          !
        </div>
      `;

      const incidentIcon = L.divIcon({
        html: markerHtml,
        className: 'incident-map-marker',
        iconSize: isSelected ? [32, 32] : [26, 26],
        iconAnchor: isSelected ? [16, 16] : [13, 13],
      });

      const marker = L.marker([incident.latitude, incident.longitude], {
        icon: incidentIcon,
      }).addTo(markersLayer);

      marker.on('click', () => {
        if (onSelectIncident) {
          onSelectIncident(incident);
        }
      });

      // Simple, clear popup
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #111827; max-width: 220px; line-height: 1.4;">
          <div style="font-size: 11px; font-weight: 700; color: ${markerBg}; margin-bottom: 2px; text-transform: uppercase;">
            ${statusLabel} • ${incident.severity} SEVERITY
          </div>
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 3px;">
            ${incident.type}
          </div>
          <div style="color: #374151; margin-bottom: 6px; font-size: 12px;">
            ${incident.description.slice(0, 90)}...
          </div>
          <div style="font-size: 11px; color: #4b5563; border-top: 1px solid #e5e7eb; pt-1; margin-top: 4px;">
            Approx. <strong>${dist} km</strong> from your location
          </div>
        </div>
      `);
    });
  }, [incidents, selectedIncident, userLocation, onSelectIncident]);

  // Center on user button
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  };

  return (
    <div className="relative w-full rounded-md border border-neutral-300 overflow-hidden bg-neutral-900 shadow-xs">
      {/* Map Container */}
      <div id="satellite-incident-map" ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      {/* Map Layer Switcher & Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {/* Layer toggle: Satellite vs Street */}
        <div className="bg-white/95 backdrop-blur-xs border border-neutral-300 rounded-sm shadow-sm p-1 flex text-xs font-medium">
          <button
            type="button"
            id="map-toggle-satellite-btn"
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 rounded-xs transition-colors ${
              mapType === 'satellite'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            id="map-toggle-street-btn"
            onClick={() => setMapType('streets')}
            className={`px-3 py-1.5 rounded-xs transition-colors ${
              mapType === 'streets'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Roads
          </button>
        </div>

        {/* Recenter button */}
        <button
          type="button"
          id="map-recenter-user-btn"
          onClick={handleRecenter}
          className="bg-white/95 hover:bg-white text-neutral-800 text-xs font-semibold px-3 py-2 rounded-sm border border-neutral-300 shadow-sm flex items-center gap-1.5 self-end"
          title="Center on my location"
        >
          <LocateFixed className="w-4 h-4 text-neutral-900" />
          <span>My Location</span>
        </button>
      </div>

      {/* Map Legend (Bottom left, clean and unobtrusive) */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs border border-neutral-300 rounded-sm shadow-xs p-3 text-xs max-w-xs text-neutral-800">
        <div className="font-bold text-neutral-900 mb-2 border-b border-neutral-200 pb-1">
          Map Legend
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-neutral-900 border border-white inline-block"></span>
            <span>Your Device Location (Dark Dot)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-white inline-block"></span>
            <span>Confirmed Emergency Incident</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white inline-block"></span>
            <span>Unverified Community Report</span>
          </div>
          {showZones && (
            <div className="pt-1.5 mt-1.5 border-t border-neutral-200 text-[11px] text-neutral-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-red-600 inline-block"></span>
                <span>0–5 km: High Alert Perimeter</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-amber-600 inline-block"></span>
                <span>5–10 km: Alert Perimeter</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-neutral-600 inline-block"></span>
                <span>10–15 km: Caution Perimeter</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
