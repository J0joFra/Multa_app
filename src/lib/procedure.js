import { TERMINI } from './regole.js';

/**
 * Le vie per contestare una multa. La disciplina è nazionale (Codice della
 * Strada): cambia solo l'ufficio a cui ti rivolgi, che è quello del luogo
 * in cui è avvenuta la violazione.
 */
export const VIE = [
  {
    id: 'prefetto',
    titolo: 'Ricorso al Prefetto',
    sommario: 'Gratuito, lo decide l\'autorità amministrativa. Se lo respinge, l\'importo sale.',
    giorni: TERMINI.prefetto,
    riferimento: 'art. 203 CdS',
    costo: 'Gratuito, niente bollo',
    decide: 'Il Prefetto della provincia dove è avvenuta la violazione',
    passi: [
      'Prepara il ricorso: dati tuoi e del verbale, i motivi, la richiesta di annullamento.',
      'Allega copia del verbale, un documento d\'identità e le prove che hai (foto della segnaletica, testimoni).',
      'Presentalo all\'ufficio o al comando che ha fatto il verbale, oppure direttamente alla Prefettura.',
      'Spediscilo per raccomandata A/R o PEC, e conserva la ricevuta: è la prova che sei nei termini.',
      'Non pagare nel frattempo: pagare chiude il ricorso.',
    ],
    note: [
      'Se il Prefetto non decide entro 120 giorni da quando riceve gli atti, il ricorso si intende accolto (art. 204 c. 1-bis CdS).',
      'Se lo respinge, l\'ordinanza-ingiunzione fissa una somma non inferiore al doppio del minimo previsto, più le spese. È il rischio di questa strada.',
      'Contro l\'ordinanza di rigetto puoi ancora andare dal Giudice di Pace, entro 30 giorni.',
    ],
    ricerca: (citta) => `prefettura di ${citta} ricorso verbale codice della strada`,
  },
  {
    id: 'giudice',
    titolo: 'Ricorso al Giudice di Pace',
    sommario: 'Lo decide un giudice, puoi difenderti da solo. Costa il contributo unificato.',
    giorni: TERMINI.giudiceDiPace,
    riferimento: 'art. 204-bis CdS; art. 7 D.Lgs. 150/2011',
    costo: 'Contributo unificato: di norma 43 € per valore fino a 1.100 €',
    decide: 'Il Giudice di Pace del luogo in cui è stata commessa la violazione',
    passi: [
      'Prepara il ricorso indicando il verbale, i motivi e cosa chiedi.',
      'Puoi stare in giudizio personalmente: l\'avvocato non è obbligatorio.',
      'Depositalo presso il Giudice di Pace competente, oppure consegnalo all\'organo accertatore che lo trasmette.',
      'Paga il contributo unificato e allega la ricevuta.',
      'Se ti serve, chiedi nel ricorso la sospensione dell\'esecuzione del verbale.',
    ],
    note: [
      'Il termine è di 30 giorni, la metà di quello per il Prefetto: se sei indeciso, è questo a scadere prima.',
      'Il giudice può annullare il verbale, confermarlo, oppure rideterminare la sanzione — mai sotto il minimo previsto.',
      'In caso di rigetto le spese restano a tuo carico.',
    ],
    ricerca: (citta) => `giudice di pace ${citta} opposizione verbale codice della strada deposito`,
  },
  {
    id: 'paga',
    titolo: 'Pagare e chiudere',
    sommario: 'Entro 5 giorni costa il 30% in meno, ma rinunci per sempre a contestarla.',
    giorni: TERMINI.sconto,
    riferimento: 'art. 202 CdS',
    costo: 'L\'importo del verbale, ridotto del 30% entro 5 giorni',
    decide: 'Nessuno: la chiudi tu',
    passi: [
      'Controlla se ti spetta lo sconto del 30%: non vale dove è prevista la sospensione della patente o la confisca.',
      'Paga con il bollettino o il PagoPA indicati sul verbale, entro 5 giorni per lo sconto o entro 60 per l\'importo minimo.',
      'Conserva la ricevuta.',
    ],
    note: [
      'Il pagamento vale come acquiescenza: dopo non puoi più fare ricorso, nemmeno se scopri un vizio.',
      'Oltre i 60 giorni la somma viene iscritta a ruolo e arriva la cartella, con l\'importo che cresce.',
    ],
    ricerca: (citta) => `pagamento verbale codice della strada ${citta} pagoPA`,
  },
];

/** Il comune dove fare ricorso: è quello della violazione, non dove abiti. */
export function cittaCompetente(verbale) {
  const daLuogo = String(verbale?.luogo || '').split(',').map((p) => p.trim()).filter(Boolean).pop();
  if (daLuogo && !/^\d/.test(daLuogo) && daLuogo.length > 2) return daLuogo;
  const daOrgano = String(verbale?.organo || '').match(/(?:di|del|della)\s+([A-ZÀ-Ù][\wà-ù'’\- ]{2,})$/);
  if (daOrgano) return daOrgano[1].trim();
  return '';
}

/**
 * Un link di ricerca, non un indirizzo fisso: gli uffici competenti sono
 * centinaia e i loro siti cambiano. Meglio una ricerca che porta all'ufficio
 * giusto di un URL che fra sei mesi è morto.
 */
export function linkUfficio(via, verbale) {
  const citta = cittaCompetente(verbale);
  if (!citta) return null;
  return `https://www.google.com/search?q=${encodeURIComponent(via.ricerca(citta))}`;
}
