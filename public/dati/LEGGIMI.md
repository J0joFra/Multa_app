# Archivio delle postazioni autovelox

Qui va `autovelox-it.geojson`, l'elenco delle postazioni fisse italiane estratte
da OpenStreetMap. **Non è nel repository**: va generato una volta, e poi
rigenerato ogni tanto perché le postazioni cambiano.

```bash
npm run autovelox        # interroga Overpass per tutta l'Italia
npm run sync             # lo porta dentro android/
```

Senza questo file l'app funziona lo stesso: la scheda Limiti ripiega su
Overpass a ogni spostamento della mappa, che richiede rete e mostra le
postazioni solo da uno zoom più stretto. Con il file, le postazioni si vedono
subito, da più lontano e anche offline.

I dati sono OpenStreetMap, licenza ODbL: vanno attribuiti, e l'app lo fa nella
mappa e in fondo alla scheda Limiti. Chi ridistribuisce il file deve mantenere
la stessa licenza.
