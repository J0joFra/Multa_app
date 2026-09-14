import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle } from 'react-leaflet';
import { Move } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/**
 * La mappa del punto in cui è stata presa la multa.
 *
 * Parte bloccata: dentro una pagina che scorre, una mappa che cattura il
 * trascinamento è una trappola. Un tocco la attiva.
 */
export default function MappaLuogo({ geo, zoom = 17 }) {
  const [attiva, setAttiva] = useState(false);
  if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lon)) return null;

  const centro = [geo.lat, geo.lon];

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: 200 }}>
      <MapContainer
        center={centro}
        zoom={zoom}
        dragging={attiva}
        scrollWheelZoom={attiva}
        doubleClickZoom={attiva}
        touchZoom={attiva}
        zoomControl={attiva}
        attributionControl
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        {/* Il cerchio dice quello che la geocodifica sa davvero: il punto è
            l'indirizzo, non il metro esatto in cui eri. */}
        <Circle center={centro} radius={40} pathOptions={{ color: '#0A66C2', weight: 1, fillOpacity: 0.12 }} />
        <CircleMarker center={centro} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#0A66C2', fillOpacity: 1 }} />
      </MapContainer>

      {!attiva && (
        <button
          onClick={() => setAttiva(true)}
          className="absolute inset-0 z-[400] flex items-end justify-center pb-3 bg-transparent"
          aria-label="Attiva la mappa"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-white/90 text-gray-700 rounded-full px-3 py-1.5 shadow">
            <Move className="w-3 h-3" /> Tocca per muovere la mappa
          </span>
        </button>
      )}
    </div>
  );
}
