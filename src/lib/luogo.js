/**
 * "Dove l'ho presa": non serve una mappa dentro l'app, servono i link giusti
 * per andare a guardare il posto — ed è Street View che fa vedere se il
 * cartello c'era.
 */
export function linkLuogo(luogo) {
  const q = encodeURIComponent(String(luogo || '').trim());
  if (!q) return null;
  return {
    mappa: `https://www.google.com/maps/search/?api=1&query=${q}`,
    streetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${q}`,
    osm: `https://www.openstreetmap.org/search?query=${q}`,
  };
}

/** Cosa andare a verificare sul posto, a seconda di come ti hanno multato. */
export const COSA_GUARDARE = {
  autovelox: [
    'Il cartello di preavviso prima della postazione: c\'è, è leggibile, quanto prima?',
    'Il limite di velocità effettivamente segnalato nel tratto, non quello scritto sul verbale.',
    'Se la postazione è fissa, se è visibile e segnalata come tale.',
  ],
  ztl: [
    'Il cartello del varco: orari, giorni e deroghe devono essere leggibili prima di entrare.',
    'Se il cartello era coperto da rami, altri segnali o veicoli.',
    'Se esiste una via d\'uscita prima del varco: senza, l\'accesso è obbligato.',
  ],
  semaforo: [
    'La posizione della linea d\'arresto rispetto al semaforo.',
    'La durata del giallo: deve essere proporzionata al limite di quel tratto.',
    'La visibilità della lanterna arrivando dalla tua direzione.',
  ],
  sosta: [
    'Il segnale di divieto e la sua distanza dal punto in cui eri.',
    'La segnaletica orizzontale: strisce blu sbiadite o assenti valgono come non apposte.',
    'Se c\'erano deroghe (carico/scarico, disabili, orari) non considerate nel verbale.',
  ],
  agente: [
    'La visuale dell\'agente dal punto in cui dice di aver accertato la violazione.',
    'La segnaletica che imponeva l\'obbligo che ti contestano.',
  ],
  altro: [
    'La segnaletica presente nel punto esatto indicato dal verbale.',
    'Se il luogo scritto sul verbale corrisponde davvero a dove eri.',
  ],
};
