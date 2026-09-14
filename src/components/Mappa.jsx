import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Move } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/**
 * La mappa dell'app: il punto misurato, e le postazioni autovelox lì intorno.
 *
 * Parte bloccata quando è dentro una pagina che scorre: una mappa che cattura
 * il trascinamento in mezzo a un elenco è una trappola. Un tocco la attiva.
 */
export default function MappaLuogo({
  geo,
  centro,
  zoom = 17,
  altezza = 200,
  interattiva = false,
  autovelox = [],
  onPunto,
  onVista,
}) {
  const [sbloccata, setSbloccata] = useState(interattiva);

  const punto = geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lon) ? [geo.lat, geo.lon] : null;
  const vista = centro || punto;
  if (!vista) return null;

  const attiva = interattiva || sbloccata;

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: altezza }}>
      <MapContainer
        center={vista}
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

        {autovelox.map((a) => (
          <CircleMarker
            key={a.id}
            center={[a.lat, a.lon]}
            radius={7}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#d8232a', fillOpacity: 1 }}
          >
            <Popup>
              <span className="text-sm">
                <strong>Autovelox fisso</strong>
                {a.limite ? <> · {a.limite} km/h</> : null}
                {a.nome ? <><br />{a.nome}</> : null}
                <br />
                <span className="text-gray-500">Postazione mappata su OpenStreetMap</span>
              </span>
            </Popup>
          </CircleMarker>
        ))}

        {punto && (
          <>
            {/* Il cerchio dice quello che la geocodifica sa davvero: il punto è
                l'indirizzo, non il metro esatto in cui eri. */}
            <Circle center={punto} radius={40} pathOptions={{ color: '#0A66C2', weight: 1, fillOpacity: 0.12 }} />
            <CircleMarker center={punto} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#0A66C2', fillOpacity: 1 }} />
          </>
        )}

        {onPunto && <AlTocco onPunto={onPunto} />}
        {onVista && <AllaVista onVista={onVista} />}
        <Ricentra centro={centro ? null : punto} zoomMinimo={zoom} />
      </MapContainer>

      {!attiva && !interattiva && (
        <button
          onClick={() => setSbloccata(true)}
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

/** Il tocco sulla mappa sposta il punto di misura. */
function AlTocco({ onPunto }) {
  useMapEvents({ click: (e) => onPunto(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** A ogni spostamento la pagina sa che riquadro è a schermo, e con che zoom. */
function AllaVista({ onVista }) {
  const mappa = useMapEvents({
    moveend: () => segnala(mappa),
    zoomend: () => segnala(mappa),
  });
  React.useEffect(() => { segnala(mappa); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  function segnala(m) {
    const b = m.getBounds();
    onVista({
      bbox: { sud: b.getSouth(), ovest: b.getWest(), nord: b.getNorth(), est: b.getEast() },
      zoom: m.getZoom(),
    });
  }
  return null;
}

/**
 * Una nuova ricerca deve spostare la mappa. Quando invece è l'utente a
 * navigarla (centro passato dalla pagina) non gliela si strappa di mano.
 */
function Ricentra({ centro, zoomMinimo = 0 }) {
  const mappa = useMap();
  React.useEffect(() => {
    // Se si arrivava da una vista larga, avvicina: un punto preciso mostrato
    // da 100 km di quota non dice niente.
    if (centro) mappa.setView(centro, Math.max(mappa.getZoom(), zoomMinimo), { animate: true });
  }, [centro?.[0], centro?.[1]]);   // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
