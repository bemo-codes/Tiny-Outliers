import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hospital, HospitalMatchResult } from '../../types';

interface EmergencyMapProps {
  patientCoords?: { lat: number; lng: number } | null;
  hospitals: Hospital[];
  matches?: HospitalMatchResult[];
  selectedHospitalId?: string | null;
  onSelectHospital?: (hospitalId: string) => void;
  className?: string;
}

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  patientCoords,
  hospitals,
  matches,
  selectedHospitalId,
  onSelectHospital,
  className = 'h-96 w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (Metro Mumbai/Bangalore corridor default or patient)
    const initialLat = patientCoords?.lat ?? 19.076;
    const initialLng = patientCoords?.lng ?? 72.8777;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 12,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Clean OpenStreetMap tiles with high-contrast grayscale styling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
        className: 'filter grayscale contrast-125 brightness-95',
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Patient Marker
    if (patientCoords && patientCoords.lat && patientCoords.lng) {
      const patientIcon = L.divIcon({
        className: 'custom-patient-icon',
        html: `
          <div style="background-color: #111111; color: #FFFFFF; border: 2px solid #FFFFFF; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
            SOS
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const pMarker = L.marker([patientCoords.lat, patientCoords.lng], { icon: patientIcon })
        .bindPopup(
          `
          <div style="font-family: sans-serif; font-size: 12px; color: #111;">
            <strong style="text-transform: uppercase; letter-spacing: 0.05em;">Patient Incident Location</strong>
            <p style="margin: 4px 0 0 0; color: #555;">GPS: ${patientCoords.lat.toFixed(4)}, ${patientCoords.lng.toFixed(4)}</p>
          </div>
        `
        )
        .addTo(layer);

      bounds.extend([patientCoords.lat, patientCoords.lng]);
    }

    // 2. Hospital Markers
    hospitals.forEach((h) => {
      if (!h.latitude || !h.longitude) return;

      const match = matches?.find((m) => m.hospital_id === h.id);
      const isSelected = selectedHospitalId === h.id;
      const status = match?.eligibility_status || 'unknown';

      // Strict monochromatic styling for pins
      let bg = '#1A1A1A';
      let border = '#777777';
      let text = '#FFFFFF';
      let symbol = h.code.slice(0, 3);

      if (status === 'eligible') {
        bg = '#111111';
        border = '#FFFFFF';
        text = '#FFFFFF';
      } else if (status === 'requires_verification') {
        bg = '#777777';
        border = '#D9D9D9';
        text = '#FFFFFF';
      } else if (status === 'ineligible') {
        bg = '#303030';
        border = '#777777';
        text = '#D9D9D9';
      }

      const hospIcon = L.divIcon({
        className: 'custom-hosp-icon',
        html: `
          <div style="
            background: ${bg};
            color: ${text};
            border: ${isSelected ? '3px solid #FFFFFF' : `1.5px solid ${border}`};
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
            display: inline-block;
            white-space: nowrap;
            box-shadow: ${isSelected ? '0 0 0 3px #111111, 0 4px 12px rgba(0,0,0,0.6)' : '0 2px 6px rgba(0,0,0,0.4)'};
            transform: translate(-50%, -50%);
          ">
            ${symbol} ${match?.match_score ? `• ${match.match_score}` : ''}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([h.latitude, h.longitude], { icon: hospIcon }).addTo(layer);

      marker.on('click', () => {
        if (onSelectHospital) {
          onSelectHospital(h.id);
        }
      });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; color: #111; line-height: 1.4;">
          <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; margin-bottom: 2px;">
            ${h.name}
          </div>
          <div style="color: #666; font-size: 11px;">${h.address}</div>
          <div style="margin-top: 6px; padding: 4px 6px; background: #f5f5f5; border: 1px solid #d9d9d9; font-size: 11px;">
            <strong>Status:</strong> ${status.toUpperCase().replace(/_/g, ' ')}<br/>
            ${match?.eta_minutes ? `<strong>ETA:</strong> ~${match.eta_minutes} mins<br/>` : ''}
            ${match?.distance_km ? `<strong>Dist:</strong> ${match.distance_km} km<br/>` : ''}
            <strong>Direct Phone:</strong> ${h.contact_phone || 'N/A'}
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);

      bounds.extend([h.latitude, h.longitude]);
    });

    if (bounds.isValid() && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [hospitals, matches, patientCoords, selectedHospitalId, onSelectHospital]);

  return (
    <div className={`relative border border-[#303030] bg-[#111111] overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
      <div className="absolute top-3 left-3 z-[1000] bg-[#111111]/90 border border-[#303030] px-3 py-1.5 text-[10px] tracking-widest uppercase font-mono text-[#F5F5F5] backdrop-blur-sm pointer-events-none">
        TACTICAL RADAR / TILE OVERLAY [LEAFLET]
      </div>
    </div>
  );
};
