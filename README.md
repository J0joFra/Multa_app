# MultaCheck

App Android per capire una multa stradale: **dove l'hai presa**, **entro quando**
puoi pagare o fare ricorso, e soprattutto **se è legittima**.

Fotografi il verbale, l'app legge i dati con l'OCR, ti fa correggere quello che
ha sbagliato e poi passa il verbale attraverso i controlli previsti dal Codice
della Strada. Quello che trova lo divide in tre: vizi contestabili, cose che devi
verificare tu, scadenze da rispettare. Se ci sono vizi, ti genera una bozza di
ricorso già compilata con i motivi trovati.

Tutto resta sul telefono: nessun dato viene inviato a un server.

## Cosa controlla

| Controllo | Riferimento |
|---|---|
| Notifica entro 90 giorni (360 per residenti all'estero) | art. 201 c. 1 CdS |
| Motivo della mancata contestazione immediata | art. 201 c. 1 CdS |
| Elementi essenziali del verbale | art. 383 Reg. esec. CdS |
| Indicazione di termini e autorità per il ricorso | art. 201 c. 5 CdS |
| Tolleranza sulla velocità: 5%, minimo 5 km/h | art. 142 c. 6 CdS |
| Strumento omologato e non solo approvato | Cass. civ. 10505/2024 |
| Taratura annuale del dispositivo | Corte cost. 113/2015 |
| Segnalazione preventiva della postazione | art. 142 c. 6-bis CdS; DM 15/08/2007 |
| Decreto prefettizio per il rilevamento senza contestazione | art. 4 D.L. 121/2002 |
| Segnaletica e autorizzazione del varco ZTL | DPR 250/1999; art. 7 CdS |
| Documentazione fotografica del rosso semaforico | art. 146 CdS |
| Congruità dell'importo e delle spese di notifica | art. 201 c. 4 CdS |
| Sconto del 30% entro 5 giorni, e quando non spetta | art. 202 c. 1-bis CdS |
| Limite del tratto a confronto con quello contestato | art. 142 CdS; dati OpenStreetMap |
| Termini di ricorso: 60 gg Prefetto, 30 gg Giudice di Pace | artt. 203 e 204-bis CdS |
| Comunicazione dei dati del conducente entro 60 giorni | art. 126-bis c. 2 CdS |
| Prescrizione quinquennale | art. 209 CdS; art. 28 L. 689/1981 |

Quando un dato manca o è su "Non so", il controllo non viene dato per superato:
diventa una verifica da fare, con scritto cosa cercare sul verbale o sul posto.

## Com'è fatta

```
src/lib/        la logica, senza React e testabile a parte
  date.js       aritmetica sulle date in ISO, senza fusi orari
  cds.js        catalogo delle violazioni: importi, punti, sanzioni accessorie
  verbale.js    struttura dati del verbale + campi obbligatori
  parser.js     estrazione dei campi dal testo dell'OCR
  regole.js     motore dei controlli + termini e scadenze strutturate
  ricorso.js    bozza di ricorso costruita sui vizi trovati
  luogo.js      link a mappa e Street View + cosa guardare sul posto
  geo.js        geocodifica Nominatim e limiti di velocità da Overpass/OSM
  procedure.js  le tre vie: Prefetto, Giudice di Pace, pagamento
  ocr.js        tesseract.js (modello italiano)
  storage.js    Capacitor Preferences, con fallback su localStorage
  store.jsx     stato condiviso fra le pagine (verbali salvati + bozza)
src/components/ PageHeader, ThemeToggle, SplashScreen, Mappa, SegnaleLimite
  layout/       AppLayout: colonna da 430px e bottom nav a 5 schede
src/pages/      Multe, Limiti, Analizza, Scheda, Esito, Ricorso, Guida
test/           44 test su parser, regole, geo e procedure
```

Impaginazione e struttura sono le stesse di GridUp: token di colore in HSL su
variabili CSS, `.app-card` bianche su fondo grigio, testata sticky a gradiente,
bottom nav fissa, transizioni di pagina con framer-motion, tema chiaro e scuro.
I colori sono blu LinkedIn (`#0A66C2`, `hsl(210 90% 40%)`) e bianco; in tema
scuro la stessa famiglia vira sul navy.

La bozza in compilazione vive nello store, non in uno `useState` di pagina:
`AnimatePresence` rimonta il componente entrante e lo stato locale andrebbe
perso a metà scheda.

Le regole sono funzioni pure `(verbale, oggi) -> esito | null`: per aggiungerne
una basta un oggetto in più nell'array `REGOLE` e un test.

## Sviluppo

```bash
npm install
npm run dev          # app nel browser
npm test             # test di parser e regole
npm run build        # bundle in dist/
npm run sync         # build + copia in android/
npm run apk          # APK di debug (serve l'SDK Android)
npm run android      # apre il progetto in Android Studio
```

L'APK non è stato compilato in questo repo: serve l'SDK Android, che nel
container di sviluppo non è installato. Il progetto `android/` è generato e
sincronizzato, quindi `./gradlew assembleDebug` funziona su una macchina con
l'SDK.

L'OCR scarica il modello italiano di tesseract.js alla prima esecuzione: quella
volta serve la rete, poi il riconoscimento gira in locale.

## La mappa e i limiti di velocità

La scheda **Limiti** apre su una mappa dell'Italia con gli **autovelox fissi**
mappati su OpenStreetMap (nodi `highway=speed_camera` ed `enforcement=maxspeed`),
caricati per il riquadro a schermo quando lo zoom è abbastanza stretto. Scrivi la
via (o usi la tua posizione) e leggi il limite di quel punto, senza dover creare
un verbale: toccando la mappa il punto di misura si sposta, e le ultime zone
guardate restano lì per la volta dopo. Da un punto si può aprire una multa già
compilata con luogo e limite.

Sulle postazioni, due precisazioni che stanno anche nell'app: sono **fisse**, cioè
installazioni che per legge devono essere segnalate, e servono qui a capire dove ti
hanno multato e se la postazione era segnalata — non ci sono avvisi in tempo reale
mentre guidi, e i controlli mobili non compaiono. E la mappa **non è completa**: una
postazione che manca può esistere lo stesso.

Nell'esito di un verbale la stessa mappa mostra il luogo della violazione, con il
limite del tratto messo a confronto con quello scritto sul verbale.

Vale la pena sapere come funziona, perché il dato non è ufficiale:

- **In Italia non esiste una mappa pubblica e completa dei limiti.** OpenStreetMap è
  la fonte libera migliore: il tag `maxspeed` copre bene autostrade e strade
  principali, molto meno le urbane.
- Quando il limite non è mappato, l'app ricade sui **limiti generali dell'art. 142
  CdS** per tipo di strada (130 / 110 / 90 / 50). È una presunzione, e l'interfaccia
  lo dice: "limite generale per questo tipo di strada", non "limite di questa strada".
- **Fa fede il cartello, non la mappa.** Un limite diverso da quello generale deve
  risultare da un'ordinanza e da segnaletica: se mappa e verbale non concordano,
  l'app apre un controllo da fare sul posto, non dichiara la multa illegittima.
- Servizi usati: Nominatim per l'indirizzo, Overpass per le strade, tile di OSM per
  la mappa. Tutti gratuiti e con limiti d'uso: se l'app cresce vanno sostituiti con
  un servizio con chiave (MapTiler, HERE, TomTom), che ha anche coperture migliori.
- Il risultato viene salvato nel verbale: la ricerca si fa una volta sola, e da lì
  in poi la mappa funziona anche offline (tranne le tile).

## Limiti da conoscere

- **Non è consulenza legale.** L'app applica controlli standard ai dati che le
  dai: non ha letto il tuo verbale e non conosce il caso. Su importi alti o
  sanzioni accessorie, senti un avvocato prima di decidere.
- **Gli importi del catalogo invecchiano.** Le sanzioni sono aggiornate per
  decreto ogni due anni: i valori in `cds.js` servono solo a segnalare un
  importo fuori scala, mai a dichiararlo illegittimo. Vanno rivisti a ogni
  aggiornamento (vedi `AGGIORNATO_AL`).
- **Le date le devi controllare.** L'OCR sbaglia spesso su cifre e date, ed è
  proprio sulle date che si giocano i controlli più importanti. I campi letti
  dalla foto hanno il bordo blu: rileggili sempre.
- **Pagare chiude la partita.** Il pagamento vale come acquiescenza: dopo non
  puoi più fare ricorso. Decidi prima di approfittare dello sconto del 30%.
- **Gli uffici del ricorso sono territoriali.** La procedura è nazionale, ma
  Prefettura e Giudice di Pace competenti sono quelli del luogo della violazione:
  la scheda Ricorso ci porta con una ricerca, non con URL fissi che invecchiano.
