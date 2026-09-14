import { giorniTra, addGiorni, oggiISO, formatIT } from './date.js';
import { infoViolazione, velocitaContestabile } from './cds.js';
import { CAMPI_OBBLIGATORI } from './verbale.js';

// Esiti possibili di un controllo.
export const CRITICO = 'critico';       // motivo di ricorso solido, se confermato
export const ATTENZIONE = 'attenzione'; // da verificare, può diventare un motivo
export const OK = 'ok';                 // controllo superato
export const INFO = 'info';             // scadenza o adempimento, non un vizio

/** Giorni entro cui va fatta ogni cosa. Un solo posto da correggere se la legge cambia. */
export const TERMINI = {
  notifica: 90,
  notificaEstero: 360,
  sconto: 5,
  giudiceDiPace: 30,
  prefetto: 60,
  datiConducente: 60,
  prescrizione: 365 * 5,
  tarauraValidita: 365,
};

/** Data da cui decorrono i termini: contestazione immediata o notifica. */
export function dataDecorrenza(v) {
  return v.contestazioneImmediata ? v.dataViolazione : v.dataNotifica || v.dataViolazione;
}

/**
 * Ogni regola è pura: riceve il verbale e la data odierna, restituisce un
 * esito oppure null quando non è applicabile a questo verbale.
 */
export const REGOLE = [
  {
    id: 'notifica-termine',
    categoria: 'Notifica',
    titolo: 'Termine di notifica del verbale',
    riferimento: 'art. 201 comma 1 CdS',
    sintesi: 'Se non ti hanno fermato sul posto, il verbale deve arrivarti entro 90 giorni dalla violazione (360 se risiedi all\'estero). Oltre, non è più esigibile.',
    valuta(v) {
      if (v.contestazioneImmediata) {
        return {
          esito: OK,
          messaggio: 'Contestazione immediata: il verbale ti è stato consegnato sul posto, quindi il termine di notifica dei 90 giorni non si applica.',
        };
      }
      if (!v.dataViolazione || !v.dataNotifica) {
        return {
          esito: ATTENZIONE,
          messaggio: 'Mancano la data della violazione o quella di notifica: senza le due date non posso verificare il termine, ed è il controllo che fa cadere più verbali.',
          azione: 'Cerca sul verbale la data dell\'accertamento e la data di notifica (di solito sulla busta o sulla relata).',
        };
      }
      const limite = v.residenteEstero ? TERMINI.notificaEstero : TERMINI.notifica;
      const g = giorniTra(v.dataViolazione, v.dataNotifica);
      if (g === null) return null;
      if (g < 0) {
        return {
          esito: ATTENZIONE,
          messaggio: `La data di notifica (${formatIT(v.dataNotifica)}) è precedente alla violazione (${formatIT(v.dataViolazione)}): una delle due è sbagliata.`,
        };
      }
      if (g > limite) {
        return {
          esito: CRITICO,
          messaggio: `Notifica arrivata dopo ${g} giorni dalla violazione, oltre il limite di ${limite}. Il verbale notificato fuori termine perde efficacia: è il motivo di ricorso più forte che puoi far valere.`,
          azione: 'Conserva la busta con il timbro postale: la data che conta è quella della prima consegna tentata.',
        };
      }
      return {
        esito: OK,
        messaggio: `Notifica avvenuta dopo ${g} giorni, entro il limite di ${limite}.`,
        dettaglio: `Scadenza del termine: ${formatIT(addGiorni(v.dataViolazione, limite))}.`,
      };
    },
  },

  {
    id: 'motivazione-mancata-contestazione',
    categoria: 'Notifica',
    titolo: 'Motivo della mancata contestazione immediata',
    riferimento: 'art. 201 comma 1 CdS',
    sintesi: 'Quando non ti fermano, il verbale deve dire perché non era possibile farlo. Se non lo dice, è viziato.',
    valuta(v) {
      if (v.contestazioneImmediata) return null;
      if (v.motivazioneMancataContestazione === false) {
        return {
          esito: CRITICO,
          messaggio: 'Il verbale non spiega perché non ti hanno fermato sul posto. Quando la contestazione immediata manca, il verbale deve indicarne il motivo: l\'omissione è un vizio contestabile.',
        };
      }
      if (v.motivazioneMancataContestazione === null) {
        return {
          esito: ATTENZIONE,
          messaggio: 'Controlla se il verbale indica il motivo della mancata contestazione immediata (es. "impossibilità di raggiungere il veicolo", "rilevamento automatico"). Se non c\'è, è un vizio.',
        };
      }
      return { esito: OK, messaggio: 'Il verbale motiva la mancata contestazione immediata.' };
    },
  },

  {
    id: 'dati-essenziali',
    categoria: 'Forma del verbale',
    titolo: 'Elementi essenziali del verbale',
    riferimento: 'art. 383 Reg. esec. CdS',
    sintesi: 'Il verbale deve contenere numero, organo accertatore, data, luogo, norma violata e importo.',
    valuta(v) {
      const mancanti = CAMPI_OBBLIGATORI
        .filter(([campo]) => v[campo] === '' || v[campo] === null || v[campo] === undefined)
        .map(([, etichetta]) => etichetta);
      if (mancanti.length === 0) {
        return { esito: OK, messaggio: 'Tutti gli elementi essenziali risultano presenti.' };
      }
      return {
        esito: ATTENZIONE,
        messaggio: `Non risultano compilati: ${mancanti.join(', ')}. Se mancano davvero sul verbale (e non solo qui nell\'app) sono vizi di forma da segnalare nel ricorso.`,
        azione: 'Riapri il verbale e completa i campi mancanti nella scheda.',
      };
    },
  },

  {
    id: 'indicazione-ricorso',
    categoria: 'Forma del verbale',
    titolo: 'Indicazione dei modi di ricorso',
    riferimento: 'art. 201 comma 5 CdS',
    sintesi: 'Il verbale deve dirti a chi puoi fare ricorso, come e entro quando.',
    valuta(v) {
      if (v.indicazioneRicorso === 'no') {
        return {
          esito: CRITICO,
          messaggio: 'Il verbale non indica come e a chi fare ricorso né i relativi termini: è un\'omissione che puoi contestare.',
        };
      }
      if (v.indicazioneRicorso === 'si') {
        return { esito: OK, messaggio: 'Il verbale indica termini e autorità per il ricorso.' };
      }
      return null;
    },
  },

  {
    id: 'velocita-tolleranza',
    categoria: 'Autovelox',
    titolo: 'Tolleranza strumentale sulla velocità',
    riferimento: 'art. 142 comma 6 CdS',
    sintesi: 'Alla velocità misurata va tolto il 5%, con un minimo di 5 km/h. Spesso basta a cambiare fascia di sanzione, o a far sparire la violazione.',
    valuta(v) {
      const ril = Number(v.velocitaRilevata);
      if (!Number.isFinite(ril) || ril <= 0) return null;
      const attesa = velocitaContestabile(ril);
      const contestata = Number(v.velocitaContestata);
      if (!Number.isFinite(contestata) || contestata <= 0) {
        return {
          esito: ATTENZIONE,
          messaggio: `Sulla velocità rilevata di ${ril} km/h la velocità contestabile è ${attesa} km/h (tolleranza del 5%, minimo 5 km/h). Verifica che sul verbale sia indicata quella ridotta.`,
        };
      }
      if (contestata > attesa + 0.5) {
        return {
          esito: CRITICO,
          messaggio: `Il verbale contesta ${contestata} km/h ma, applicando la tolleranza di legge sui ${ril} km/h rilevati, la velocità contestabile è ${attesa} km/h. La differenza può cambiare la fascia di sanzione.`,
        };
      }
      const lim = Number(v.limiteVelocita);
      if (Number.isFinite(lim) && lim > 0 && attesa <= lim) {
        return {
          esito: CRITICO,
          messaggio: `Applicata la tolleranza, la velocità scende a ${attesa} km/h: pari o sotto il limite di ${lim} km/h. Così com\'è, la violazione non sussiste.`,
        };
      }
      return { esito: OK, messaggio: `Tolleranza applicata correttamente: ${contestata} km/h contestati su ${ril} rilevati.` };
    },
  },

  {
    id: 'limite-mappa',
    categoria: 'Autovelox',
    titolo: 'Limite di velocità del tratto',
    riferimento: 'art. 142 CdS; dati OpenStreetMap',
    sintesi: 'Il limite contestato deve essere quello davvero in vigore in quel punto: se la mappa ne dà un altro, è un\'incongruenza da chiarire.',
    valuta(v) {
      const contestato = Number(v.limiteVelocita);
      const mappa = Number(v.geo?.limiteOsm);
      if (!Number.isFinite(contestato) || !Number.isFinite(mappa) || contestato <= 0 || mappa <= 0) return null;
      if (contestato === mappa) {
        return {
          esito: OK,
          messaggio: v.geo.fonteLimite === 'osm'
            ? `Il limite di ${contestato} km/h coincide con quello mappato per ${v.geo.stradaOsm || 'questo tratto'}.`
            : `Il limite di ${contestato} km/h coincide con quello generale per questo tipo di strada.`,
        };
      }
      if (v.geo.fonteLimite === 'osm') {
        return {
          esito: ATTENZIONE,
          messaggio: `Il verbale contesta un limite di ${contestato} km/h, ma per ${v.geo.stradaOsm || 'questo tratto'} la mappa ne riporta ${mappa}. Se il limite vero è ${mappa}, cambia la fascia di sanzione o fa cadere la violazione.`,
          azione: 'Vai sul posto e fotografa il cartello del limite, con un riferimento che identifichi il punto. La mappa non fa prova, il cartello sì.',
        };
      }
      return {
        esito: ATTENZIONE,
        messaggio: `Il verbale contesta un limite di ${contestato} km/h, mentre il limite generale per questo tipo di strada sarebbe ${mappa}. Un limite diverso da quello generale deve risultare da un'ordinanza e da segnaletica.`,
        azione: 'Controlla la segnaletica del tratto e, se serve, chiedi al comune l\'ordinanza che istituisce il limite.',
      };
    },
  },

  {
    id: 'autovelox-omologazione',
    categoria: 'Autovelox',
    titolo: 'Omologazione dello strumento',
    riferimento: 'art. 142 comma 6 CdS; Cass. civ. n. 10505/2024',
    sintesi: 'Approvato e omologato non sono la stessa cosa: per la Cassazione un dispositivo solo approvato non regge la sanzione.',
    valuta(v) {
      if (v.tipoAccertamento !== 'autovelox' && v.tipoAccertamento !== 'semaforo') return null;
      if (v.strumentoOmologato === 'no') {
        return {
          esito: CRITICO,
          messaggio: 'Il verbale parla di strumento "approvato" ma non "omologato". Secondo la Cassazione (10505/2024) approvazione e omologazione non coincidono e la sanzione basata su un dispositivo solo approvato è contestabile.',
        };
      }
      if (v.strumentoOmologato === null) {
        return {
          esito: ATTENZIONE,
          messaggio: 'Cerca nel verbale la parola "omologato" riferita al dispositivo. Se trovi solo "approvato con decreto", è uno dei motivi di ricorso oggi più efficaci.',
        };
      }
      return { esito: OK, messaggio: 'Il verbale dichiara lo strumento omologato.' };
    },
  },

  {
    id: 'autovelox-taratura',
    categoria: 'Autovelox',
    titolo: 'Taratura periodica del dispositivo',
    riferimento: 'Corte cost. n. 113/2015; art. 142 comma 6 CdS',
    sintesi: 'Il dispositivo va verificato e tarato almeno una volta l\'anno, e il verbale deve darne conto.',
    valuta(v) {
      if (v.tipoAccertamento !== 'autovelox' && v.tipoAccertamento !== 'semaforo') return null;
      if (!v.dataTaratura) {
        return {
          esito: ATTENZIONE,
          messaggio: 'Il verbale deve dare conto della verifica periodica di funzionalità e taratura dello strumento. Se non la trovi, chiedila per accesso agli atti: senza, la misurazione non regge.',
          azione: 'Chiedi al comando copia del certificato di taratura valido alla data della violazione.',
        };
      }
      const g = giorniTra(v.dataTaratura, v.dataViolazione || oggiISO());
      if (g === null) return null;
      if (g < 0) {
        return {
          esito: ATTENZIONE,
          messaggio: `La taratura indicata (${formatIT(v.dataTaratura)}) è successiva alla violazione: alla data del rilievo non copriva lo strumento.`,
        };
      }
      if (g > TERMINI.tarauraValidita) {
        return {
          esito: CRITICO,
          messaggio: `Ultima taratura ${formatIT(v.dataTaratura)}, cioè ${g} giorni prima della violazione: oltre l'anno. La verifica va ripetuta almeno annualmente.`,
        };
      }
      return { esito: OK, messaggio: `Taratura del ${formatIT(v.dataTaratura)}, valida alla data della violazione (${g} giorni prima).` };
    },
  },

  {
    id: 'autovelox-segnaletica',
    categoria: 'Autovelox',
    titolo: 'Segnalazione preventiva della postazione',
    riferimento: 'art. 142 comma 6-bis CdS; DM 15/08/2007',
    sintesi: 'La postazione va segnalata prima, con un cartello visibile: il controllo serve a far rallentare, non a sorprendere.',
    valuta(v) {
      if (v.tipoAccertamento !== 'autovelox') return null;
      if (v.segnaleticaPreventiva === 'no') {
        return {
          esito: CRITICO,
          messaggio: 'Postazione non segnalata prima del punto di rilevamento. Il controllo della velocità deve essere preventivamente segnalato e ben visibile: senza segnale la sanzione è contestabile.',
          azione: 'Torna sul posto e fotografa il tratto: servono foto del percorso prima della postazione, con data.',
        };
      }
      if (v.segnaleticaPreventiva === null) {
        return {
          esito: ATTENZIONE,
          messaggio: 'Verifica sul posto (o su Street View) se prima della postazione c\'era il cartello di preavviso, visibile e a distanza adeguata.',
        };
      }
      return { esito: OK, messaggio: 'Segnalazione preventiva presente.' };
    },
  },

  {
    id: 'autovelox-decreto',
    categoria: 'Autovelox',
    titolo: 'Decreto prefettizio per il rilevamento senza contestazione',
    riferimento: 'art. 4 D.L. 121/2002',
    sintesi: 'Rilevare senza fermare il veicolo è ammesso solo sulle strade individuate con decreto del Prefetto.',
    valuta(v) {
      if (v.tipoAccertamento !== 'autovelox' || v.contestazioneImmediata) return null;
      if (v.decretoPrefettizio === 'no') {
        return {
          esito: CRITICO,
          messaggio: 'Il rilevamento automatico senza fermare il veicolo è ammesso solo sulle strade individuate con decreto del Prefetto. Se il tratto non è fra quelle, l\'accertamento è viziato.',
        };
      }
      if (v.decretoPrefettizio === null) {
        return {
          esito: ATTENZIONE,
          messaggio: 'Controlla se il verbale richiama il decreto prefettizio che autorizza quella postazione. Se non lo cita, chiedilo per accesso agli atti.',
        };
      }
      return { esito: OK, messaggio: 'Il verbale richiama il decreto prefettizio della postazione.' };
    },
  },

  {
    id: 'ztl-varco',
    categoria: 'ZTL',
    titolo: 'Segnaletica e autorizzazione del varco',
    riferimento: 'DPR 250/1999; art. 7 CdS',
    sintesi: 'Il varco dev\'essere autorizzato e il cartello con orari e deroghe leggibile prima di entrare.',
    valuta(v) {
      if (v.tipoAccertamento !== 'ztl') return null;
      return {
        esito: ATTENZIONE,
        messaggio: 'Per la ZTL controlla tre cose: che il varco elettronico sia autorizzato dal Ministero, che il cartello con orari e deroghe fosse leggibile e non coperto, e che l\'orario di accesso contestato ricada davvero nella fascia di vigenza.',
        azione: 'Fotografa la segnaletica all\'ingresso del varco e annota l\'orario esatto indicato sul verbale.',
      };
    },
  },

  {
    id: 'semaforo-documentazione',
    categoria: 'Semaforo',
    titolo: 'Documentazione fotografica del passaggio',
    riferimento: 'art. 146 CdS',
    sintesi: 'Per il rosso la prova sono i fotogrammi, e il giallo deve durare quanto previsto per quel limite.',
    valuta(v) {
      if (v.tipoAccertamento !== 'semaforo') return null;
      if (v.fotogrammaAllegato === 'no') {
        return {
          esito: CRITICO,
          messaggio: 'Nessun fotogramma allegato. Per il rosso semaforico la prova è la sequenza di immagini che mostra il veicolo oltre la linea d\'arresto con la lanterna rossa accesa: puoi chiederla e contestarne l\'assenza.',
        };
      }
      return {
        esito: ATTENZIONE,
        messaggio: 'Chiedi la sequenza completa dei fotogrammi e verifica la durata del giallo: un giallo più corto di quello previsto per quel limite di velocità rende la sanzione contestabile.',
      };
    },
  },

  {
    id: 'importo-fuori-scala',
    categoria: 'Importi',
    titolo: 'Congruità dell\'importo',
    riferimento: 'tabella sanzioni CdS',
    sintesi: 'L\'importo deve stare nella forbice prevista dall\'articolo contestato.',
    valuta(v) {
      const info = infoViolazione(v.articolo, v.comma);
      const imp = Number(v.importo);
      if (!info || !Number.isFinite(imp) || imp <= 0) return null;
      // Margine largo: gli importi sono aggiornati per decreto ogni due anni.
      if (imp < info.min * 0.8 || imp > info.max * 1.2) {
        return {
          esito: ATTENZIONE,
          messaggio: `L'importo di ${imp.toFixed(2)} € è fuori dalla forbice tipica per ${info.titolo} (${info.min}–${info.max} €). Può dipendere da maggiorazioni o dall'aggiornamento biennale degli importi, ma vale la pena controllare come è stato calcolato.`,
        };
      }
      return { esito: OK, messaggio: `Importo coerente con la forbice prevista per ${info.titolo} (${info.min}–${info.max} €).` };
    },
  },

  {
    id: 'spese-notifica',
    categoria: 'Importi',
    titolo: 'Spese di notifica e di procedimento',
    riferimento: 'art. 201 comma 4 CdS',
    sintesi: 'Le spese di notifica devono corrispondere a quelle realmente sostenute e vanno documentate su richiesta.',
    valuta(v) {
      const s = Number(v.speseNotifica);
      if (!Number.isFinite(s) || s <= 0) return null;
      if (s > 20) {
        return {
          esito: ATTENZIONE,
          messaggio: `Spese di notifica di ${s.toFixed(2)} €: sono più alte del solito. Devono corrispondere alla spesa effettivamente sostenuta e vanno documentate su richiesta.`,
        };
      }
      return { esito: OK, messaggio: `Spese di notifica di ${s.toFixed(2)} €, in linea con la prassi.` };
    },
  },

  {
    id: 'sconto-30',
    categoria: 'Scadenze',
    titolo: 'Pagamento ridotto del 30%',
    riferimento: 'art. 202 comma 1-bis CdS',
    sintesi: 'Pagando entro 5 giorni si sconta il 30%, tranne dove è prevista la sospensione della patente o la confisca. Pagare però chiude ogni ricorso.',
    valuta(v, oggi) {
      const base = dataDecorrenza(v);
      if (!base) return null;
      const info = infoViolazione(v.articolo, v.comma);
      if (info && (info.accessorie === 'sospensione' || info.accessorie === 'confisca')) {
        return {
          esito: INFO,
          messaggio: `Per ${info.titolo} è prevista una sanzione accessoria: lo sconto del 30% non spetta.`,
        };
      }
      const scadenza = addGiorni(base, TERMINI.sconto);
      const restanti = giorniTra(oggi, scadenza);
      const imp = Number(v.importo);
      const scontato = Number.isFinite(imp) && imp > 0 ? (imp * 0.7).toFixed(2) : null;
      if (restanti !== null && restanti < 0) {
        return { esito: INFO, messaggio: `Termine per il pagamento ridotto scaduto il ${formatIT(scadenza)}.` };
      }
      return {
        esito: INFO,
        messaggio: scontato
          ? `Pagando entro il ${formatIT(scadenza)} paghi ${scontato} € invece di ${imp.toFixed(2)} €. Attenzione: pagare chiude la partita, non potrai più fare ricorso.`
          : `Pagando entro il ${formatIT(scadenza)} hai diritto allo sconto del 30%. Attenzione: pagare chiude la partita, non potrai più fare ricorso.`,
        dettaglio: restanti !== null ? `Restano ${restanti} giorni.` : null,
      };
    },
  },

  {
    id: 'ricorso-prefetto',
    categoria: 'Scadenze',
    titolo: 'Ricorso al Prefetto',
    riferimento: 'art. 203 CdS',
    sintesi: '60 giorni, gratuito, ma se il Prefetto respinge l\'importo può salire.',
    valuta(v, oggi) {
      const base = dataDecorrenza(v);
      if (!base) return null;
      const scadenza = addGiorni(base, TERMINI.prefetto);
      const restanti = giorniTra(oggi, scadenza);
      if (restanti === null) return null;
      if (restanti < 0) {
        return { esito: INFO, messaggio: `Termine per il ricorso al Prefetto scaduto il ${formatIT(scadenza)}.` };
      }
      return {
        esito: INFO,
        messaggio: `Ricorso al Prefetto entro il ${formatIT(scadenza)} (${restanti} giorni). È gratuito, ma se lo respinge l'importo può salire.`,
      };
    },
  },

  {
    id: 'ricorso-giudice-di-pace',
    categoria: 'Scadenze',
    titolo: 'Ricorso al Giudice di Pace',
    riferimento: 'art. 204-bis CdS',
    sintesi: '30 giorni, con contributo unificato, ma a decidere è un giudice.',
    valuta(v, oggi) {
      const base = dataDecorrenza(v);
      if (!base) return null;
      const scadenza = addGiorni(base, TERMINI.giudiceDiPace);
      const restanti = giorniTra(oggi, scadenza);
      if (restanti === null) return null;
      if (restanti < 0) {
        return { esito: INFO, messaggio: `Termine per il ricorso al Giudice di Pace scaduto il ${formatIT(scadenza)}. Resta la strada del Prefetto se sei ancora nei 60 giorni.` };
      }
      return {
        esito: INFO,
        messaggio: `Ricorso al Giudice di Pace entro il ${formatIT(scadenza)} (${restanti} giorni). Prevede il contributo unificato ma decide un giudice.`,
      };
    },
  },

  {
    id: 'comunicazione-dati-conducente',
    categoria: 'Adempimenti',
    titolo: 'Comunicazione dei dati del conducente',
    riferimento: 'art. 126-bis comma 2 CdS',
    sintesi: 'Se la multa toglie punti ed è intestata al proprietario, va comunicato chi guidava entro 60 giorni: il silenzio costa una sanzione più pesante.',
    valuta(v, oggi) {
      const info = infoViolazione(v.articolo, v.comma);
      const punti = Number.isFinite(Number(v.puntiDecurtati))
        ? Number(v.puntiDecurtati)
        : (info ? info.punti : 0);
      if (!v.notificaAlProprietario || !punti) return null;
      const base = dataDecorrenza(v);
      const scadenza = base ? addGiorni(base, TERMINI.datiConducente) : null;
      const restanti = scadenza ? giorniTra(oggi, scadenza) : null;
      return {
        esito: INFO,
        messaggio: `La violazione comporta ${punti} punti e il verbale è intestato a te come proprietario: devi comunicare chi guidava${scadenza ? ` entro il ${formatIT(scadenza)}` : ''}. Non farlo costa una seconda sanzione, più pesante della prima.`,
        dettaglio: restanti !== null && restanti >= 0 ? `Restano ${restanti} giorni.` : null,
      };
    },
  },

  {
    id: 'prescrizione',
    categoria: 'Scadenze',
    titolo: 'Prescrizione quinquennale',
    riferimento: 'art. 209 CdS; art. 28 L. 689/1981',
    sintesi: 'Dopo 5 anni senza atti interruttivi il diritto a riscuotere si prescrive.',
    valuta(v, oggi) {
      if (!v.dataViolazione) return null;
      const g = giorniTra(v.dataViolazione, oggi);
      if (g === null || g < TERMINI.prescrizione - 365) return null;
      const scadenza = addGiorni(v.dataViolazione, TERMINI.prescrizione);
      if (g > TERMINI.prescrizione) {
        return {
          esito: CRITICO,
          messaggio: `Sono passati più di 5 anni dalla violazione (termine scaduto il ${formatIT(scadenza)}). Salvo atti interruttivi notificati nel frattempo, il diritto a riscuotere è prescritto.`,
        };
      }
      return {
        esito: ATTENZIONE,
        messaggio: `La violazione risale a oltre 4 anni fa: la prescrizione matura il ${formatIT(scadenza)}. Controlla se ci sono stati atti interruttivi.`,
      };
    },
  },
];

/**
 * Esegue tutti i controlli su un verbale.
 * @returns {{esiti: Array, conteggi: object, verdetto: {livello: string, titolo: string, testo: string}}}
 */
export function analizzaVerbale(verbale, oggi = oggiISO()) {
  const esiti = [];
  for (const regola of REGOLE) {
    let r = null;
    try {
      r = regola.valuta(verbale, oggi);
    } catch {
      r = null; // una regola che esplode non deve far cadere l'analisi
    }
    if (!r) continue;
    esiti.push({
      id: regola.id,
      categoria: regola.categoria,
      titolo: regola.titolo,
      riferimento: regola.riferimento,
      dettaglio: null,
      azione: null,
      ...r,
    });
  }

  const conteggi = { critico: 0, attenzione: 0, ok: 0, info: 0 };
  for (const e of esiti) conteggi[e.esito] += 1;

  return { esiti, conteggi, verdetto: verdetto(conteggi) };
}

/**
 * Le scadenze di un verbale in forma strutturata, per l'agenda.
 * Le regole INFO raccontano la stessa cosa a parole: qui servono le date.
 */
export function scadenzeVerbale(v, oggi = oggiISO()) {
  const base = dataDecorrenza(v);
  if (!base) return [];

  const info = infoViolazione(v.articolo, v.comma);
  const accessoria = info && (info.accessorie === 'sospensione' || info.accessorie === 'confisca');
  const punti = Number.isFinite(Number(v.puntiDecurtati)) ? Number(v.puntiDecurtati) : (info ? info.punti : 0);
  const imp = Number(v.importo);

  const voci = [
    !accessoria && {
      id: 'sconto',
      titolo: 'Pagamento ridotto del 30%',
      data: addGiorni(base, TERMINI.sconto),
      nota: Number.isFinite(imp) && imp > 0 ? `Paghi ${(imp * 0.7).toFixed(2)} € invece di ${imp.toFixed(2)} €` : 'Sconto del 30% sull\'importo',
    },
    {
      id: 'giudice',
      titolo: 'Ricorso al Giudice di Pace',
      data: addGiorni(base, TERMINI.giudiceDiPace),
      nota: 'Con contributo unificato, decide un giudice',
    },
    {
      id: 'prefetto',
      titolo: 'Ricorso al Prefetto',
      data: addGiorni(base, TERMINI.prefetto),
      nota: 'Gratuito, ma in caso di rigetto l\'importo può salire',
    },
    v.notificaAlProprietario && punti > 0 && {
      id: 'conducente',
      titolo: 'Comunicazione dei dati del conducente',
      data: addGiorni(base, TERMINI.datiConducente),
      nota: `Obbligatoria: la violazione comporta ${punti} punti`,
    },
  ].filter(Boolean);

  return voci
    .map((s) => {
      const restanti = giorniTra(oggi, s.data);
      return { ...s, restanti, scaduta: restanti !== null && restanti < 0, verbaleId: v.id };
    })
    .sort((a, b) => String(a.data).localeCompare(String(b.data)));
}

function verdetto({ critico, attenzione }) {
  if (critico > 0) {
    return {
      livello: CRITICO,
      titolo: critico === 1 ? 'Un motivo serio per contestarla' : `${critico} motivi seri per contestarla`,
      testo: 'Ho trovato elementi che, se confermati dai documenti, reggono un ricorso. Guarda i punti in rosso e valuta di non pagare prima di aver deciso.',
    };
  }
  if (attenzione > 0) {
    return {
      livello: ATTENZIONE,
      titolo: `${attenzione} ${attenzione === 1 ? 'cosa da verificare' : 'cose da verificare'}`,
      testo: 'Non ci sono vizi evidenti con i dati che mi hai dato, ma restano controlli che solo tu puoi fare guardando il verbale e il posto. Completali prima di decidere.',
    };
  }
  return {
    livello: OK,
    titolo: 'Nessun vizio rilevato',
    testo: 'Con i dati inseriti la multa risulta regolare. Restano le scadenze qui sotto: se decidi di pagare, farlo entro 5 giorni costa il 30% in meno.',
  };
}
