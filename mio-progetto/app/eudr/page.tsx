"use client";
import { useState, useMemo } from "react";
import BackToHome from "../components/BackToHome";

// ─── DATA ────────────────────────────────────────────────────────────────────

const COMPANY_ROLES = [
  { id: "operator",      label: "Operatore",          desc: "Immette per primo prodotti interessati sul mercato UE o li esporta dall'UE" },
  { id: "trader_large",  label: "Commerciante non PMI", desc: "Mette a disposizione prodotti già immessi da altri (fatturato > €40M o > 250 dipendenti)" },
  { id: "trader_sme",    label: "Commerciante PMI",    desc: "Mette a disposizione prodotti già immessi da altri (microimpresa, piccola o media impresa)" },
  { id: "none",          label: "Non so / Nessuno",   desc: "Non sono sicuro del mio ruolo o non opero come operatore/commerciante" },
];

const COMMODITIES = [
  { id: "bovini",  label: "Bovini",        desc: "Animali vivi, carni, frattaglie, cuoio e pelli bovine" },
  { id: "cacao",   label: "Cacao",         desc: "Fave, gusci, pasta, burro, polvere, cioccolato" },
  { id: "caffe",   label: "Caffè",         desc: "Verde, torrefatto, decaffeinizzato, succedanei" },
  { id: "palma",   label: "Olio di palma", desc: "Palmisti, olio grezzo/raffinato, acidi grassi, glicerolo" },
  { id: "gomma",   label: "Gomma naturale", desc: "Gomma greggia, pneumatici, guanti, nastri, tubi" },
  { id: "soia",    label: "Soia",          desc: "Fave, farine, olio, panelli" },
  { id: "legno",   label: "Legno",         desc: "Grezzo, segato, carta, mobili, costruzioni, libri stampati" },
  { id: "none",    label: "Nessuna",       desc: "Non tratto materie prime o prodotti soggetti al regolamento" },
];

const CATEGORIES = [
  {
    id: "perimetro", code: "A", title: "Perimetro & Ruolo", subtitle: "Identificazione del ruolo e degli obblighi applicabili",
    totalAttributes: 6,
    regulation: "Art. 2 (Definizioni), Art. 3 (Divieti), Art. 7 (Operatori extra-UE) EUDR",
    keyAttributes: [
      "Definizione di 'operatore' (Art. 2, punto 15) e 'commerciante' (Art. 2, punto 17)",
      "Prima immissione sul mercato UE o esportazione = obblighi da operatore",
      "Entità extra-UE: il primo soggetto UE a mettere a disposizione è l'operatore",
      "Materie prime interessate: bovini, cacao, caffè, palma, gomma, soia, legno",
      "Data limite di riferimento: 31 dicembre 2020",
    ],
    questions: [
      { id: "perim_role", text: "L'azienda ha identificato con precisione il proprio ruolo ai fini EUDR (operatore, commerciante non PMI, commerciante PMI)?", hint: "Il ruolo di 'operatore' (Art. 2, punto 15) attiva gli obblighi più stringenti di dovuta diligenza. Un'azienda può ricoprire più ruoli contemporaneamente.", ref: "Art. 2 (15-17); Art. 3 EUDR", mandatory: ["operator", "trader_large", "trader_sme"], voluntary: [] },
      { id: "perim_commodities", text: "L'azienda ha censito tutte le materie prime e i prodotti interessati che immette/esporta o mette a disposizione sul mercato UE?", hint: "L'allegato I del regolamento elenca i codici NC dei prodotti interessati per ciascuna materia prima. Verificare con il team doganale/acquisti.", ref: "Art. 1; Allegato I EUDR", mandatory: ["operator", "trader_large", "trader_sme"], voluntary: [] },
      { id: "perim_volume", text: "L'azienda dispone di dati sui volumi (per materia prima, per Stato membro di immissione) di prodotti interessati movimentati?", hint: "I dati di volume sono necessari per le dichiarazioni di dovuta diligenza e per la rendicontazione verso le autorità competenti.", ref: "Art. 9 (1)(b); Art. 22 EUDR", mandatory: ["operator", "trader_large"], voluntary: ["trader_sme"] },
      { id: "perim_cutoff", text: "L'azienda è a conoscenza della data limite del 31 dicembre 2020 e del suo impatto sulla catena di approvvigionamento?", hint: "Nessun prodotto interessato può essere immesso sul mercato o esportato se prodotto su terreni soggetti a deforestazione o degrado forestale dopo il 31/12/2020.", ref: "Art. 2 (13); Art. 46 EUDR", mandatory: ["operator", "trader_large", "trader_sme"], voluntary: [] },
    ],
  },
  {
    id: "diligenza", code: "B", title: "Sistema di Dovuta Diligenza", subtitle: "Raccolta informazioni, valutazione e attenuazione del rischio",
    totalAttributes: 10,
    regulation: "Art. 8 (Dovuta diligenza), Art. 9 (Informazioni), Art. 10 (Valutazione), Art. 11 (Attenuazione) EUDR",
    keyAttributes: [
      "Tre pilastri: raccolta informazioni, valutazione del rischio, attenuazione del rischio",
      "Geolocalizzazione obbligatoria degli appezzamenti (lat/long, min. 6 decimali)",
      "Poligoni richiesti per appezzamenti > 4 ettari",
      "Informazioni da conservare per 5 anni",
      "Valutazione del rischio da aggiornare almeno annualmente",
      "Responsabile della conformità (compliance officer) a livello dirigenziale per non PMI",
    ],
    questions: [
      { id: "dilig_system", text: "L'azienda ha istituito un sistema formale di dovuta diligenza che comprende raccolta informazioni, valutazione del rischio e misure di attenuazione?", hint: "Il sistema deve essere documentato e non può limitarsi a pratiche informali. Include obblighi di informazione (Art. 9), valutazione (Art. 10) e attenuazione (Art. 11).", ref: "Art. 8; Art. 12 EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "dilig_info", text: "L'azienda raccoglie sistematicamente tutte le informazioni richieste dall'Art. 9 (descrizione, quantità, paese, geolocalizzazione, fornitori, clienti, prove di deforestazione zero)?", hint: "Le informazioni devono essere 'adeguatamente probanti e verificabili'. Il sistema informativo deve consentire di recuperarle per 5 anni.", ref: "Art. 9 (1)(a)-(h) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "dilig_geo", text: "L'azienda raccoglie le coordinate di geolocalizzazione (latitudine/longitudine, min. 6 decimali) di tutti gli appezzamenti di origine delle materie prime?", hint: "Per appezzamenti > 4 ettari è richiesto un poligono. Per i bovini la geolocalizzazione si riferisce agli stabilimenti di allevamento. È uno degli obblighi più impegnativi.", ref: "Art. 2 (28); Art. 9 (1)(d) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "dilig_risk", text: "L'azienda effettua una valutazione del rischio strutturata tenendo conto dei criteri dell'Art. 10 (paese, foreste, popoli indigeni, corruzione, complessità filiera, ecc.)?", hint: "La valutazione del rischio deve essere documentata, rivista almeno annualmente e messa a disposizione delle autorità su richiesta.", ref: "Art. 10 EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "dilig_mitig", text: "In caso di rischio non trascurabile, l'azienda adotta misure di attenuazione documentate (audit indipendenti, informazioni supplementari, supporto ai fornitori)?", hint: "Le misure devono portare il rischio a livello 'nullo o trascurabile'. Senza attenuazione sufficiente non è possibile immettere il prodotto sul mercato.", ref: "Art. 11 EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "dilig_officer", text: "È stato designato un responsabile della conformità a livello dirigenziale e, per gli operatori non PMI, una funzione di audit indipendente del sistema di dovuta diligenza?", hint: "L'Art. 11 (2)(a)(b) richiede esplicitamente la nomina di un compliance officer a livello dirigenziale e una funzione di audit interno per gli operatori non PMI.", ref: "Art. 11 (2)(a)(b) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
    ],
  },
  {
    id: "dichiarazione", code: "C", title: "Dichiarazione di Dovuta Diligenza", subtitle: "Presentazione, conservazione e riferimenti della DDD",
    totalAttributes: 6,
    regulation: "Art. 4 (Obblighi operatore), Art. 5 (Obblighi commerciante), Art. 33 (Sistema informativo) EUDR",
    keyAttributes: [
      "DDD obbligatoria prima di ogni immissione/esportazione",
      "Presentazione tramite sistema informativo UE (online) — entro 30/12/2024",
      "Conservazione della copia per 5 anni",
      "Numero di riferimento DDD da comunicare a valle della catena",
      "PMI operatori: esenzione se DDD già presentata a monte (con numero di riferimento)",
    ],
    questions: [
      { id: "ddd_process", text: "L'azienda ha strutturato un processo per la presentazione della Dichiarazione di Dovuta Diligenza (DDD) attraverso il sistema informativo UE prima di ogni immissione o esportazione?", hint: "La DDD deve essere presentata elettronicamente al sistema di informazione della Commissione (Art. 33) prima di ogni operazione. Nessuna immissione senza DDD.", ref: "Art. 4 (2); Art. 33 EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "ddd_content", text: "La DDD include tutte le informazioni dell'Allegato II (nome operatore, codice SA, descrizione, quantità, paese, geolocalizzazione, dichiarazione di conformità, firma)?", hint: "L'Allegato II elenca tutte le informazioni obbligatorie. Mancanze formali possono comportare sanzioni anche in caso di prodotto conforme.", ref: "Art. 4 (2); Allegato II EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "ddd_conservation", text: "L'azienda conserva una copia di ogni DDD presentata per almeno 5 anni dalla data di presentazione?", hint: "L'obbligo di conservazione è esplicito (Art. 4, par. 3). I sistemi di archiviazione devono garantire accessibilità immediata su richiesta delle autorità.", ref: "Art. 4 (3) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "ddd_downstream", text: "L'azienda comunica ai commercianti/operatori a valle i numeri di riferimento delle DDD presentate per i prodotti ceduti?", hint: "Il numero di riferimento consente a valle della catena di richiamare la DDD esistente, evitando duplicazioni. È un obbligo esplicito (Art. 4, par. 7).", ref: "Art. 4 (7) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
    ],
  },
  {
    id: "filiera", code: "D", title: "Gestione della Filiera", subtitle: "Fornitori, contratti, tracciabilità e legalità del paese di produzione",
    totalAttributes: 8,
    regulation: "Art. 9 (1)(e)(f)(g)(h), Art. 10 (2), Art. 2 (40) EUDR — legalità e tracciabilità",
    keyAttributes: [
      "Conformità alla 'legislazione pertinente del paese di produzione' (Art. 2, punto 40)",
      "Diritti d'uso del suolo, tutela ambiente, norme forestali, diritti dei lavoratori",
      "Diritto umani, consenso libero previo e informato dei popoli indigeni",
      "Tracciabilità fino all'appezzamento (non solo al fornitore diretto)",
      "Certificazioni (FSC, RSPO, RTRS, FLEGT) utili ma non sostitutive della DD",
    ],
    questions: [
      { id: "fil_legality", text: "L'azienda verifica che le materie prime siano prodotte nel rispetto della legislazione pertinente del paese di produzione (uso suolo, ambiente, foreste, lavoro, diritti umani)?", hint: "Art. 2 (40) elenca 8 categorie di legislazione da rispettare. Non basta la conformità ambientale: occorre verificare anche aspetti fiscali, doganali e anti-corruzione.", ref: "Art. 2 (40); Art. 3 (b) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "fil_suppliers", text: "L'azienda raccoglie e conserva nome, indirizzo e contatti di tutti i fornitori e di tutti i clienti a cui cede prodotti interessati?", hint: "L'Art. 9 richiede di documentare l'intera catena: sia i fornitori che i clienti. Necessario per la tracciabilità bidirezionale.", ref: "Art. 9 (1)(e)(f) EUDR", mandatory: ["operator", "trader_large", "trader_sme"], voluntary: [] },
      { id: "fil_contracts", text: "I contratti con i fornitori di materie prime/prodotti interessati includono clausole EUDR (geolocalizzazione, prove deforestazione zero, rispetto legalità)?", hint: "Clausole contrattuali adeguate trasferiscono parte della responsabilità e garantiscono il flusso di informazioni necessarie per la dovuta diligenza.", ref: "Art. 9; Art. 10 EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "fil_indigenous", text: "La valutazione del rischio considera la presenza di popoli indigeni nell'area di produzione e il rispetto del principio di consenso libero, previo e informato?", hint: "Art. 10 (2)(c)(d)(e) richiede di valutare la presenza di popoli indigeni, la consultazione in buona fede e le segnalazioni motivate delle comunità indigene.", ref: "Art. 10 (2)(c)-(e); Art. 2 (40)(g) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "fil_certifications", text: "L'azienda utilizza certificazioni di terzi (FSC, RSPO, RTRS, FLEGT, Rainforest Alliance) come informazione complementare nella valutazione del rischio?", hint: "Le certificazioni non sostituiscono la dovuta diligenza ma possono essere usate come informazione supplementare (Art. 10 (2)(n)). La responsabilità rimane all'operatore.", ref: "Art. 10 (2)(n); Art. 10 (3) EUDR", mandatory: [], voluntary: ["operator", "trader_large", "trader_sme"] },
    ],
  },
  {
    id: "paesi", code: "E", title: "Classificazione Paesi & Rischio", subtitle: "Sistema a tre livelli, controlli rafforzati, rischio di elusione",
    totalAttributes: 5,
    regulation: "Art. 29 (Valutazione paesi), Art. 13 (DD semplificata), Art. 16 (Controlli) EUDR",
    keyAttributes: [
      "Tre livelli di rischio per paese: basso, standard, alto",
      "Paesi ad alto rischio: controlli rafforzati, 9% operatori + 9% volumi controllati",
      "Paesi a basso rischio: DD semplificata (esenzione Art. 10 e 11)",
      "Elenco paesi ad alto/basso rischio: pubblicazione entro 30/12/2024",
      "Attenzione al rischio di elusione (trasformazione in paese a basso rischio)",
    ],
    questions: [
      { id: "paesi_classification", text: "L'azienda monitora la classificazione di rischio EUDR dei paesi di produzione delle proprie materie prime (basso / standard / alto rischio)?", hint: "La Commissione pubblica l'elenco dei paesi a basso e alto rischio tramite atti di esecuzione. La classificazione influenza gli obblighi di DD e la frequenza dei controlli.", ref: "Art. 29 EUDR", mandatory: ["operator", "trader_large", "trader_sme"], voluntary: [] },
      { id: "paesi_simplified", text: "Per i prodotti provenienti da paesi a basso rischio, l'azienda ha valutato se applicare la procedura di DD semplificata (esenzione Art. 10 e 11)?", hint: "La DD semplificata è applicabile solo se si verifica l'assenza di rischio di elusione o commistione con prodotti da paesi a rischio standard/alto. Documentazione obbligatoria.", ref: "Art. 13 EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "paesi_evasion", text: "L'azienda ha valutato il rischio che materie prime prodotte in paesi ad alto rischio vengano trasformate in paesi a basso rischio per eludere il regolamento?", hint: "L'Art. 13 (3) obbliga le autorità e impone all'operatore di adottare la DD completa se vi sono indizi di elusione. Il rischio è esplicito per filiere complesse.", ref: "Art. 10 (2)(j); Art. 13 (2)(3) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "paesi_monitoring", text: "L'azienda ha procedure per monitorare variazioni nella classificazione dei paesi fornitori e aggiornare di conseguenza la valutazione del rischio?", hint: "La classificazione può cambiare. Le autorità competenti e la Commissione monitorano modifiche degli scambi commerciali che possono segnalare elusione.", ref: "Art. 15 (3); Art. 29 (2) EUDR", mandatory: ["operator", "trader_large"], voluntary: ["trader_sme"] },
    ],
  },
  {
    id: "dogane", code: "F", title: "Adempimenti Doganali & Import/Export", subtitle: "Interfaccia doganale, numero DDD, immissione in libera pratica",
    totalAttributes: 5,
    regulation: "Capo IV, Art. 26-28 EUDR — controlli prodotti in entrata e uscita dal mercato",
    keyAttributes: [
      "Numero di riferimento DDD obbligatorio prima dell'immissione in libera pratica o esportazione",
      "Interfaccia elettronica dogane-autorità competenti (entro 30/06/2028)",
      "Autorità doganali verificano lo status della DDD nel sistema informativo",
      "Sospensione automatica se prodotto identificato ad alto rischio",
      "Immissione in libera pratica NON è prova di conformità EUDR",
    ],
    questions: [
      { id: "dog_number", text: "L'azienda è in grado di mettere a disposizione delle autorità doganali il numero di riferimento della DDD prima dell'immissione in libera pratica o dell'esportazione?", hint: "Il numero di riferimento della DDD deve essere disponibile prima dello sdoganamento. La dichiarazione doganale deve includere questo riferimento.", ref: "Art. 26 (4) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "dog_system", text: "L'azienda è a conoscenza del sistema informativo EUDR della Commissione (Art. 33) e si sta attrezzando per la registrazione e la presentazione delle DDD in formato digitale?", hint: "Il sistema informativo è attivo dal 30/12/2024. La registrazione è il primo passo. Le DDD devono essere presentate esclusivamente tramite questo sistema.", ref: "Art. 33 EUDR — SCADENZA 30/12/2024", mandatory: ["operator", "trader_large"], voluntary: ["trader_sme"] },
      { id: "dog_suspension", text: "L'azienda è consapevole che le autorità doganali possono sospendere l'immissione in libera pratica o l'esportazione in caso di rischio elevato di non conformità?", hint: "La sospensione dura fino a 3 giorni lavorativi (72h per prodotti deperibili) prorogabili. Un prodotto sospeso può comportare costi logistici e reputazionali significativi.", ref: "Art. 17 (2)(3); Art. 26 (7) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "dog_eori", text: "Il profilo di registrazione nel sistema EUDR include il numero EORI dell'operatore, come richiesto per i prodotti soggetti a procedure doganali?", hint: "Il numero EORI (Economic Operators Registration and Identification) deve essere incluso nel profilo di registrazione per i prodotti che entrano o escono dal mercato UE.", ref: "Art. 33 (2)(a) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
    ],
  },
  {
    id: "governance", code: "G", title: "Governance & Conformità Operativa", subtitle: "Comunicazione, sanzioni, indicazioni comprovate, accesso alla giustizia",
    totalAttributes: 8,
    regulation: "Art. 12 (Relazione), Art. 22 (Comunicazione), Art. 25 (Sanzioni), Art. 31 (Indicazioni) EUDR",
    keyAttributes: [
      "Relazione annuale pubblica sul sistema di DD per operatori non PMI/microimprese",
      "Sanzione pecuniaria max: 4% fatturato annuo UE per persone giuridiche",
      "Confisca prodotti e proventi; esclusione da appalti pubblici fino a 12 mesi",
      "Obbligo di informare autorità e clienti a valle in caso di nuovi rischi",
      "Indicazioni comprovate: chiunque può segnalare alle autorità competenti",
      "Sentenze definitive pubblicate sul sito della Commissione (name & shame)",
    ],
    questions: [
      { id: "gov_report", text: "L'azienda (se operatore non PMI) elabora e pubblica annualmente una relazione sul proprio sistema di dovuta diligenza, comprese le misure adottate?", hint: "L'Art. 12 (3) richiede la pubblicazione più ampia possibile, anche sul web. Chi è soggetto ad altri obblighi di reporting (es. CSRD) può integrare le informazioni.", ref: "Art. 12 (3)(4) EUDR", mandatory: ["operator", "trader_large"], voluntary: [] },
      { id: "gov_alert", text: "L'azienda ha procedure per informare tempestivamente le autorità competenti e i clienti a valle qualora ottenga informazioni che indicano rischi di non conformità su prodotti già immessi?", hint: "L'Art. 4 (5) impone un obbligo immediato di notifica alle autorità e ai commercianti a valle. La mancata notifica è una violazione autonoma.", ref: "Art. 4 (5); Art. 5 (5) EUDR", mandatory: ["operator", "trader_large", "trader_sme"], voluntary: [] },
      { id: "gov_sanctions", text: "L'azienda ha valutato le sanzioni previste dall'Art. 25 (fino al 4% del fatturato annuo UE, confisca, esclusione da appalti) e le ha incluse nell'analisi del rischio legale?", hint: "Il 4% si applica al fatturato totale annuo a livello UE. Le sanzioni sono graduate in caso di recidiva. La pubblicazione delle condanne ('name and shame') ha impatto reputazionale.", ref: "Art. 25 EUDR", mandatory: ["operator", "trader_large", "trader_sme"], voluntary: [] },
      { id: "gov_roadmap", text: "L'azienda ha predisposto una roadmap con le principali scadenze EUDR e le azioni necessarie per adeguare processi, sistemi e contratti?", hint: "Scadenze chiave: 30/12/2024 (applicazione operatori/commercianti non PMI), 30/06/2025 (micro e piccole imprese), 30/12/2024 (sistema informativo attivo).", ref: "Art. 38 EUDR", mandatory: ["operator", "trader_large", "trader_sme"], voluntary: [] },
      { id: "gov_substantiated", text: "L'azienda ha procedure interne per gestire indicazioni comprovate di non conformità ricevute da terzi (ONG, lavoratori, comunità locali)?", hint: "Chiunque può presentare indicazioni comprovate alle autorità competenti. L'azienda può ricevere queste segnalazioni anche direttamente. Processi di risposta documentati riducono il rischio.", ref: "Art. 31 EUDR", mandatory: ["operator", "trader_large"], voluntary: ["trader_sme"] },
    ],
  },
];

// ─── LOGIC ───────────────────────────────────────────────────────────────────

const MATURITY = ["complete", "partial", "absent"];
const maturityConfig = {
  complete: { label: "Conforme",    points: 0, color: "#059669", bg: "#d1fae5" },
  partial:  { label: "Parziale",   points: 1, color: "#d97706", bg: "#fef3c7" },
  absent:   { label: "Non gestito", points: 2, color: "#dc2626", bg: "#fee2e2" },
};
const tagConfig = {
  mandatory: { label: "Obbligatorio",  bg: "#dbeafe", color: "#1d4ed8" },
  voluntary: { label: "Raccomandato", bg: "#f0fdf4", color: "#166534" },
};

function isQuestionVisible(q, profile) {
  const { role } = profile;
  if (q.mandatory.includes(role)) return { show: true, tag: "mandatory" };
  if (q.voluntary.includes(role))  return { show: true, tag: "voluntary" };
  return { show: false };
}
function getVisibleQuestions(cat, profile) {
  return cat.questions.map((q) => ({ q, ...isQuestionVisible(q, profile) })).filter((x) => x.show);
}
function computeScores(answers, profile) {
  const results = {};
  CATEGORIES.forEach((cat) => {
    const visible = getVisibleQuestions(cat, profile);
    let total = 0, answered = 0;
    visible.forEach(({ q }) => {
      const val = answers[q.id];
      if (val) { total += maturityConfig[val].points; answered++; }
    });
    const maxPossible = visible.length * 2;
    const pct = maxPossible > 0 ? Math.round((1 - total / maxPossible) * 100) : 100;
    results[cat.id] = { total, answered, maxPossible, pct, visibleCount: visible.length, label: pct >= 75 ? "Conforme" : pct >= 40 ? "Parziale" : "Critico" };
  });
  return results;
}
function overallScore(scores) {
  let sum = 0, max = 0;
  Object.values(scores).forEach((s) => { sum += s.total; max += s.maxPossible; });
  const pct = max > 0 ? Math.round((1 - sum / max) * 100) : 100;
  return { pct, label: pct >= 75 ? "Conforme" : pct >= 40 ? "Parziale" : "Critico" };
}
function badgeStyle(label) {
  if (label === "Conforme") return { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" };
  if (label === "Parziale")  return { background: "#fef3c7", color: "#78350f", border: "1px solid #fcd34d" };
  return { background: "#fee2e2", color: "#7f1d1d", border: "1px solid #fca5a5" };
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const INITIAL_PROFILE = { role: null, commodities: [] };

export default function EUDRScreening() {
  const [phase, setPhase]       = useState("intro");
  const [profile, setProfile]   = useState(INITIAL_PROFILE);
  const [catIndex, setCatIndex] = useState(0);
  const [answers, setAnswers]   = useState({});
  const [expandedGap, setExpandedGap] = useState(null);
  const [expandedCatGaps, setExpandedCatGaps] = useState({});

  const profileReady = profile.role !== null && profile.role !== "none";
  const scores  = useMemo(() => profileReady ? computeScores(answers, profile) : {}, [answers, profile, profileReady]);
  const overall = useMemo(() => overallScore(scores), [scores]);
  const currentCat = CATEGORIES[catIndex];
  const visibleQuestions = useMemo(
    () => profileReady ? getVisibleQuestions(currentCat, profile) : [],
    [currentCat, profile, profileReady]
  );

  function setAnswer(qId, val) { setAnswers((p) => ({ ...p, [qId]: val })); }
  function goNext() {
    if (catIndex < CATEGORIES.length - 1) { setCatIndex(catIndex + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else { setPhase("results"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }
  function goPrev() {
    if (catIndex > 0) { setCatIndex(catIndex - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else setPhase("onboarding");
  }
  function restart() { setAnswers({}); setCatIndex(0); setProfile(INITIAL_PROFILE); setPhase("intro"); setExpandedCatGaps({}); }
  function toggleCommodity(id) {
    setProfile((p) => {
      if (id === "none") return { ...p, commodities: ["none"] };
      const without = p.commodities.filter((c) => c !== "none");
      return { ...p, commodities: without.includes(id) ? without.filter((c) => c !== id) : [...without, id] };
    });
  }

  // ── INTRO ──
  if (phase === "intro") return (
    <div style={s.root}><div style={s.container}>
      <div style={s.badge}>EUDR · Reg. (UE) 2023/1115 · 9 giugno 2023</div>
      <div className="sm:text-right"><BackToHome /></div>
      <h1 style={s.introTitle}>EUDR Compliance<br />Screening Tool</h1>
      <p style={s.introSub}>Strumento di autovalutazione per compliance officer e team legale. Valuta l'impatto del Regolamento UE sulla deforestazione sulla tua azienda nelle 7 aree di rischio principali.</p>
      <div style={s.introGrid}>
        {CATEGORIES.map((cat) => (
          <div key={cat.id} style={s.introCard}>
            <div style={s.introCardCode}>{cat.code}</div>
            <div style={s.introCardTitle}>{cat.title}</div>
            <div style={s.introCardSub}>{cat.totalAttributes} prescrizioni</div>
          </div>
        ))}
      </div>
      <div style={s.chipRow}>
        <span style={s.chip}>7 aree di rischio</span>
        <span style={s.chip}>10–15 min</span>
        <span style={{ ...s.chip, background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>⚠ Scadenza: 30/12/2024 (operatori non PMI)</span>
        <span style={{ ...s.chip, background: "#fef3c7", color: "#78350f", border: "1px solid #fcd34d" }}>⚠ Scadenza: 30/06/2025 (micro/piccole imprese)</span>
      </div>
      <button style={s.startBtn} onClick={() => setPhase("onboarding")}>Configura e avvia →</button>
      <p style={s.disclaimer}>Screening preliminare basato su Reg. (UE) 2023/1115 (EUDR), GU UE del 9/06/2023. Non sostituisce consulenza legale o audit formali.</p>
    </div></div>
  );

  // ── ONBOARDING ──
  if (phase === "onboarding") {
    const canStart = profileReady;
    const hasLegno = profile.commodities.includes("legno");
    const hasBovini = profile.commodities.includes("bovini");
    return (
      <div style={s.root}><div style={{ ...s.container, maxWidth: 680 }}>
        <button style={s.backLink} onClick={() => setPhase("intro")}>← Torna all'inizio</button>
        <div style={s.badge}>Configurazione screening</div>
        <h2 style={s.onboardTitle}>Definisci il perimetro</h2>
        <p style={s.onboardSub}>Le risposte seguenti filtreranno le domande mostrando solo gli obblighi rilevanti per il tuo ruolo nella filiera.</p>

        <OnboardSection num="1" title="Ruolo principale dell'azienda" desc="Seleziona il ruolo che meglio descrive la posizione dell'azienda nella filiera rispetto al mercato UE.">
          <div style={s.optionGrid}>
            {COMPANY_ROLES.map((r) => (
              <OptionCard key={r.id} selected={profile.role === r.id} onClick={() => setProfile((p) => ({ ...p, role: r.id }))} label={r.label} desc={r.desc} accent="#0369a1" />
            ))}
          </div>
        </OnboardSection>

        <OnboardSection num="2" title="Materie prime / prodotti interessati" desc="Seleziona le materie prime presenti nella tua catena di approvvigionamento (selezione multipla).">
          <div style={s.optionGrid}>
            {COMMODITIES.map((c) => (
              <OptionCard key={c.id} selected={profile.commodities.includes(c.id)} onClick={() => toggleCommodity(c.id)} label={c.label} desc={c.desc} accent="#059669" />
            ))}
          </div>
          {hasLegno && (
            <div style={s.infoBox}><strong>📋 Legno rilevato:</strong> Il legno era già coperto dal Reg. (UE) n. 995/2010 (EUTR), ora abrogato dall'EUDR. Attenzione alla sovrapposizione normativa e alle disposizioni transitorie (Art. 37 EUDR).</div>
          )}
          {hasBovini && (
            <div style={{ ...s.infoBox, background: "#fef3c7", border: "1px solid #fcd34d", color: "#78350f", marginTop: 8 }}><strong>🐄 Bovini rilevati:</strong> Per i bovini la geolocalizzazione si riferisce agli stabilimenti di allevamento (non agli appezzamenti). Attenzione alle filiere di mangimi (Art. 39 EUDR).</div>
          )}
        </OnboardSection>

        {canStart && (
          <div style={s.onboardSummary}>
            <SummaryChip label="Ruolo" val={COMPANY_ROLES.find((r) => r.id === profile.role)?.label} />
            <SummaryChip label="Materie prime" val={profile.commodities.length > 0 && !profile.commodities.includes("none") ? profile.commodities.map((c) => COMMODITIES.find((x) => x.id === c)?.label).join(", ") : "Non specificate"} />
          </div>
        )}
        {profile.role === "none" && (
          <div style={{ ...s.infoBox, background: "#f0fdf4", border: "1px solid #86efac", color: "#166534" }}>
            <strong>✓ Probabilmente non impattata direttamente.</strong> Se la tua azienda non è operatore né commerciante, non ha obblighi diretti. Verifica però se i tuoi fornitori o clienti ti richiedono documentazione EUDR.
          </div>
        )}
        <button
          style={{ ...s.startBtn, opacity: canStart ? 1 : 0.4, cursor: canStart ? "pointer" : "not-allowed" }}
          onClick={() => canStart && setPhase("category")}
          disabled={!canStart}
        >
          Avvia screening →
        </button>
        {!canStart && profile.role !== "none" && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Seleziona il ruolo aziendale per procedere.</p>}
      </div></div>
    );
  }

  // ── RESULTS ──
  if (phase === "results") {
    const gapItems = [];
    CATEGORIES.forEach((cat) => {
      getVisibleQuestions(cat, profile).forEach(({ q, tag }) => {
        const val = answers[q.id];
        if (val === "partial" || val === "absent" || !val)
          gapItems.push({ cat: cat.title, catCode: cat.code, catId: cat.id, q, val: val || "absent", tag });
      });
    });
    const criticalGaps = gapItems.filter((g) => g.val === "absent");
    const partialGaps  = gapItems.filter((g) => g.val === "partial");
    const completeCount = Object.values(answers).filter((v) => v === "complete").length;

    return (
      <div style={s.root}><div style={s.container}>
        <div style={s.resultsHeader}>
          <div>
            <div style={s.badge}>Risultati screening EUDR</div>
            <h2 style={s.resultsTitle}>Gap Analysis — EUDR Compliance</h2>
            <div style={s.chipRow}>
              <span style={s.chip}>{COMPANY_ROLES.find((r) => r.id === profile.role)?.label}</span>
              {profile.commodities.filter((c) => c !== "none").map((c) => (
                <span key={c} style={s.chip}>{COMMODITIES.find((x) => x.id === c)?.label}</span>
              ))}
            </div>
          </div>
          <button style={s.restartBtn} onClick={restart}>← Nuovo screening</button>
        </div>

        <div style={s.overallCard}>
          <div>
            <div style={s.overallLabel}>Livello di conformità stimato</div>
            <div style={{ ...s.overallBadge, ...badgeStyle(overall.label) }}>{overall.label}</div>
            <div style={s.overallPct}>{overall.pct}%</div>
            <div style={s.overallSub}>degli obblighi presidiati</div>
          </div>
          <div style={s.overallStats}>
            <Stat num={criticalGaps.length} color="#dc2626" label="gap critici" />
            <Stat num={partialGaps.length}  color="#d97706" label="gap parziali" />
            <Stat num={completeCount}        color="#059669" label="aree conformi" />
          </div>
        </div>

        <div style={s.sectionTitle}>Conformità per area</div>
        <div style={s.catScoreGrid}>
          {CATEGORIES.map((cat) => {
            const sc = scores[cat.id];
            if (!sc || sc.visibleCount === 0) return null;
            const catGaps = gapItems.filter((g) => g.catId === cat.id);
            const catCritical = catGaps.filter((g) => g.val === "absent");
            const catPartial  = catGaps.filter((g) => g.val === "partial");
            const hasGaps = catGaps.length > 0;
            const isOpen = expandedCatGaps[cat.id];
            return (
              <div key={cat.id} style={s.catScoreCard}>
                <div style={s.catScoreTop}>
                  <span style={s.catCode2}>{cat.code}</span>
                  <span style={s.catName2}>{cat.title}</span>
                  <span style={{ ...s.catBadge, ...badgeStyle(sc.label) }}>{sc.label}</span>
                </div>
                <div style={s.barOuter}>
                  <div style={{ ...s.barInner, width: `${sc.pct}%`, background: sc.pct >= 75 ? "#059669" : sc.pct >= 40 ? "#d97706" : "#dc2626" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <div style={s.catScorePct}>{sc.pct}% · {sc.answered}/{sc.visibleCount} domande</div>
                  {hasGaps && (
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#0369a1", padding: 0, display: "flex", alignItems: "center", gap: 4 }}
                      onClick={() => setExpandedCatGaps((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                    >
                      {catCritical.length > 0 && <span style={{ color: "#dc2626", fontWeight: 700 }}>{catCritical.length} critico{catCritical.length > 1 ? "i" : ""}</span>}
                      {catCritical.length > 0 && catPartial.length > 0 && <span style={{ color: "#94a3b8", margin: "0 2px" }}>·</span>}
                      {catPartial.length > 0 && <span style={{ color: "#d97706", fontWeight: 700 }}>{catPartial.length} parzial{catPartial.length > 1 ? "i" : "e"}</span>}
                      <span style={{ color: "#94a3b8", marginLeft: 4 }}>{isOpen ? "▲" : "▼"}</span>
                    </button>
                  )}
                </div>
                {isOpen && hasGaps && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {catCritical.map((g, i) => (
                      <GapItem key={`cc_${cat.id}_${i}`} g={g} expanded={expandedGap === `cc_${cat.id}_${i}`} onToggle={() => setExpandedGap(expandedGap === `cc_${cat.id}_${i}` ? null : `cc_${cat.id}_${i}`)} color="#dc2626" bg="#fff5f5" />
                    ))}
                    {catPartial.map((g, i) => (
                      <GapItem key={`cp_${cat.id}_${i}`} g={g} expanded={expandedGap === `cp_${cat.id}_${i}`} onToggle={() => setExpandedGap(expandedGap === `cp_${cat.id}_${i}` ? null : `cp_${cat.id}_${i}`)} color="#d97706" bg="#fffbeb" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Key dates reminder */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 28px", marginTop: 24, marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", marginBottom: 14 }}>Date chiave del regolamento</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
            {[
              { date: "31 dic 2020", desc: "Data limite: terreni non deforestati dopo questa data", color: "#dc2626" },
              { date: "30 dic 2024", desc: "Applicazione obbligatoria per operatori e commercianti non PMI", color: "#d97706" },
              { date: "30 giu 2025", desc: "Applicazione per micro e piccole imprese", color: "#d97706" },
              { date: "30 giu 2028", desc: "Primo riesame generale del regolamento", color: "#059669" },
            ].map((item) => (
              <div key={item.date} style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: `3px solid ${item.color}`, borderRadius: "0 8px 8px 0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.date}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {gapItems.length === 0 && <div style={s.allGood}>✓ Nessun gap rilevato. Ottimo livello di presidio EUDR.</div>}
        <p style={{ ...s.disclaimer, marginTop: 24 }}>Screening basato su Reg. (UE) 2023/1115 (EUDR), GU UE del 9/06/2023. Non sostituisce consulenza legale o audit formali.</p>
      </div></div>
    );
  }

  // ── CATEGORY ──
  const progress = Math.round(((catIndex + 1) / CATEGORIES.length) * 100);
  const catAnswered = visibleQuestions.filter(({ q }) => answers[q.id]).length;

  return (
    <div style={s.root}><div style={s.container}>
      <div style={s.topBar}>
        <div>
          <div style={s.badge}>EUDR Compliance Screening</div>
          <div style={s.stepLabel}>Sezione {catIndex + 1} di {CATEGORIES.length} — {currentCat.title}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={s.progressPct}>{progress}%</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{COMPANY_ROLES.find((r) => r.id === profile.role)?.label}</div>
        </div>
      </div>
      <div style={s.progressOuter}><div style={{ ...s.progressInner, width: `${progress}%` }} /></div>
      <div style={s.stepTabs}>
        {CATEGORIES.map((cat, i) => (
          <div key={cat.id} style={{ ...s.stepTab, ...(i === catIndex ? s.stepTabActive : {}), ...(i < catIndex ? s.stepTabDone : {}) }} onClick={() => setCatIndex(i)}>{cat.code}</div>
        ))}
      </div>

      <div style={s.mainGrid}>
        <div>
          <div style={s.catHeader}>
            <div style={s.catCodeBox}>{currentCat.code}</div>
            <div>
              <div style={s.catTitle}>{currentCat.title}</div>
              <div style={s.catSubtitle}>{currentCat.subtitle}</div>
              <div style={s.catRegRef}>{currentCat.regulation}</div>
            </div>
          </div>

          {visibleQuestions.length === 0 ? (
            <div style={s.noQBox}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>—</div>
              Nessun obbligo applicabile in questa sezione per il ruolo selezionato.<br /><br />
              <button style={s.btnSecondary} onClick={goNext}>Avanti →</button>
            </div>
          ) : (
            <>
              <div style={s.keyAttrsBox}>
                <div style={s.keyAttrsTitle}>Prescrizioni chiave verificate</div>
                <ul style={s.keyAttrsList}>{currentCat.keyAttributes.map((a, i) => <li key={i} style={s.keyAttrItem}>{a}</li>)}</ul>
              </div>
              <div style={s.questionStack}>
                {visibleQuestions.map(({ q, tag }, qi) => (
                  <QuestionCard key={q.id} q={q} qi={qi} tag={tag} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
                ))}
              </div>
            </>
          )}

          <div style={s.navRow}>
            <button style={s.btnSecondary} onClick={goPrev}>← Indietro</button>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{catAnswered}/{visibleQuestions.length} domande</span>
            <button style={s.btnPrimary} onClick={goNext}>{catIndex < CATEGORIES.length - 1 ? "Avanti →" : "Vedi risultati →"}</button>
          </div>
        </div>

        <aside style={s.sidebar}>
          <div style={s.sideCard}>
            <div style={s.sideCardTitle}>Profilo selezionato</div>
            <div style={s.profileRow}><span style={s.profileLbl}>Ruolo</span><span style={s.profileVal}>{COMPANY_ROLES.find((r) => r.id === profile.role)?.label}</span></div>
            <div style={s.profileRow}><span style={s.profileLbl}>Materie prime</span><span style={s.profileVal}>{profile.commodities.filter((c) => c !== "none").map((c) => COMMODITIES.find((x) => x.id === c)?.label).join(", ") || "—"}</span></div>
            <button style={{ ...s.btnSecondary, width: "100%", marginTop: 12, fontSize: 12, padding: "8px 12px" }} onClick={() => setPhase("onboarding")}>Modifica profilo</button>
          </div>
          <div style={s.sideCard}>
            <div style={s.sideCardTitle}>Riepilogo live</div>
            {CATEGORIES.map((cat, i) => {
              const sc = scores[cat.id] || { label: "Critico" };
              return (
                <div key={cat.id} style={{ ...s.sideRow, ...(i === catIndex ? s.sideRowActive : {}) }} onClick={() => setCatIndex(i)}>
                  <span style={s.sideRowCode}>{cat.code}</span>
                  <span style={s.sideRowName}>{cat.title.split(" ")[0]}</span>
                  <span style={{ ...s.sideBadge, ...badgeStyle(sc.label) }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
          <button style={{ ...s.btnPrimary, width: "100%" }} onClick={() => { setPhase("results"); window.scrollTo({ top: 0 }); }}>Vedi risultati →</button>
        </aside>
      </div>
    </div></div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function OnboardSection({ num, title, desc, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{num}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</div>
      </div>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14, paddingLeft: 40, marginTop: 0 }}>{desc}</p>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, label, desc, accent }) {
  return (
    <button onClick={onClick} style={{ border: `2px solid ${selected ? accent : "#e2e8f0"}`, borderRadius: 10, padding: "14px 16px", background: selected ? `${accent}12` : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: selected ? accent : "#0f172a" }}>{label}</span>
        {selected && <span style={{ color: accent, fontSize: 16, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{desc}</div>
    </button>
  );
}

function SummaryChip({ label, val }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{val}</span>
    </div>
  );
}

function QuestionCard({ q, qi, tag, value, onChange }) {
  const [showHint, setShowHint] = useState(false);
  const tc = tagConfig[tag] || tagConfig.mandatory;
  return (
    <div style={{ ...s.qCard, ...(value ? s.qCardAnswered : {}) }}>
      <div style={s.qTop}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={s.qNum}>Q{qi + 1}</span>
          <span style={{ fontSize: 10, fontWeight: 700, background: tc.bg, color: tc.color, padding: "2px 8px", borderRadius: 4 }}>{tc.label}</span>
        </div>
        <span style={s.qRef}>{q.ref}</span>
      </div>
      <div style={s.qText}>{q.text}</div>
      <div style={s.triRow}>
        {MATURITY.map((m) => {
          const cfg = maturityConfig[m];
          const sel = value === m;
          return (
            <button key={m} onClick={() => onChange(m)} style={{ ...s.triBtn, ...(sel ? { borderColor: cfg.color, background: cfg.bg } : {}) }}>
              <div style={{ ...s.triBtnLabel, ...(sel ? { color: cfg.color } : {}) }}>{cfg.label}</div>
              <div style={s.triBtnHint}>{m === "complete" ? "Presidiato e documentato" : m === "partial" ? "Gestito, non sistematico" : "Non ancora affrontato"}</div>
            </button>
          );
        })}
      </div>
      <div style={s.hintToggle} onClick={() => setShowHint(!showHint)}>{showHint ? "▲ Nascondi nota" : "▼ Nota per il compliance officer"}</div>
      {showHint && <div style={s.hintBox}>{q.hint}</div>}
    </div>
  );
}

function GapItem({ g, expanded, onToggle, color, bg }) {
  const tc = tagConfig[g.tag] || tagConfig.mandatory;
  return (
    <div style={{ borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", background: bg, cursor: "pointer" }} onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0, marginTop: 1 }}>{g.catCode}</span>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, background: tc.bg, color: tc.color, padding: "1px 7px", borderRadius: 4, marginRight: 6 }}>{tc.label}</span>
            <span style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>{g.q.text}</span>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color, flexShrink: 0, whiteSpace: "nowrap" }}>{g.val === "absent" ? "Non gestito" : "Parziale"} {expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Area: {g.cat}</div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 6 }}><strong>Nota compliance:</strong> {g.q.hint}</div>
          <div style={{ fontSize: 11, color: "#0369a1" }}><strong>Rif. normativo:</strong> {g.q.ref}</div>
        </div>
      )}
    </div>
  );
}

function Stat({ num, color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 28, fontWeight: 800, color }}>{num}</span>
      <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = {
  root: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans','Helvetica Neue',sans-serif", color: "#0f172a" },
  container: { maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" },
  badge: { display: "inline-block", background: "#dcfce7", color: "#166534", border: "1px solid #86efac", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 10px", marginBottom: 16 },
  introTitle: { fontSize: 40, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 },
  introSub: { fontSize: 15, color: "#475569", lineHeight: 1.7, maxWidth: 600, marginBottom: 36 },
  introGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10, marginBottom: 28 },
  introCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" },
  introCardCode: { width: 26, height: 26, background: "#0f172a", color: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, marginBottom: 8 },
  introCardTitle: { fontSize: 12, fontWeight: 600, marginBottom: 3 },
  introCardSub: { fontSize: 11, color: "#94a3b8" },
  chipRow: { display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" },
  chip: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20, fontSize: 12, color: "#475569", padding: "4px 12px" },
  startBtn: { background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 20, display: "block" },
  disclaimer: { fontSize: 12, color: "#94a3b8", lineHeight: 1.6 },
  backLink: { background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 20, display: "block" },
  onboardTitle: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  onboardSub: { fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 32 },
  optionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 },
  infoBox: { marginTop: 12, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#78350f", lineHeight: 1.6 },
  onboardSummary: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 24px", marginBottom: 24, display: "flex", gap: 40, flexWrap: "wrap" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  stepLabel: { fontSize: 15, fontWeight: 600, marginTop: 8 },
  progressPct: { fontSize: 22, fontWeight: 700 },
  progressOuter: { height: 4, background: "#e2e8f0", borderRadius: 2, marginBottom: 20 },
  progressInner: { height: 4, background: "#0f172a", borderRadius: 2, transition: "width 0.3s" },
  stepTabs: { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  stepTab: { width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0", cursor: "pointer" },
  stepTabActive: { background: "#0f172a", color: "#fff", borderColor: "#0f172a" },
  stepTabDone: { background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 260px", gap: 24, alignItems: "start" },
  catHeader: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 },
  catCodeBox: { width: 44, height: 44, background: "#0f172a", color: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 },
  catTitle: { fontSize: 18, fontWeight: 700 },
  catSubtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
  catRegRef: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  keyAttrsBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", marginBottom: 20 },
  keyAttrsTitle: { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 },
  keyAttrsList: { margin: 0, paddingLeft: 18 },
  keyAttrItem: { fontSize: 12, color: "#475569", marginBottom: 3 },
  noQBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "40px 24px", textAlign: "center", color: "#64748b", fontSize: 14, lineHeight: 1.6 },
  questionStack: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 },
  qCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "18px 20px" },
  qCardAnswered: { borderColor: "#cbd5e1" },
  qTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 },
  qNum: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" },
  qRef: { fontSize: 10, color: "#94a3b8", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 },
  qText: { fontSize: 14, fontWeight: 500, lineHeight: 1.5, marginBottom: 14 },
  triRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 },
  triBtn: { border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", background: "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" },
  triBtnLabel: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 3 },
  triBtnHint: { fontSize: 11, color: "#94a3b8", lineHeight: 1.4 },
  hintToggle: { fontSize: 12, color: "#0369a1", cursor: "pointer", userSelect: "none" },
  hintBox: { marginTop: 10, background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#0c4a6e", lineHeight: 1.6 },
  navRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  btnPrimary: { background: "#0f172a", color: "#fff", border: "none", borderRadius: 7, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnSecondary: { background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, padding: "11px 22px", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  sidebar: { display: "flex", flexDirection: "column", gap: 16 },
  sideCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px" },
  sideCardTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 },
  profileRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f1f5f9" },
  profileLbl: { fontSize: 11, color: "#94a3b8" },
  profileVal: { fontSize: 12, fontWeight: 600 },
  sideRow: { display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 6, marginBottom: 2, cursor: "pointer" },
  sideRowActive: { background: "#f1f5f9" },
  sideRowCode: { fontSize: 11, fontWeight: 700, color: "#94a3b8", width: 14 },
  sideRowName: { fontSize: 12, color: "#475569", flex: 1 },
  sideBadge: { fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" },
  barOuter: { height: 4, background: "#e2e8f0", borderRadius: 2, marginTop: 8 },
  barInner: { height: 4, borderRadius: 2, transition: "width 0.4s" },
  resultsHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  resultsTitle: { fontSize: 28, fontWeight: 700, marginTop: 8, marginBottom: 8 },
  restartBtn: { background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 7, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  overallCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "28px 32px", display: "flex", gap: 48, alignItems: "center", marginBottom: 32, flexWrap: "wrap" },
  overallLabel: { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 },
  overallBadge: { display: "inline-flex", alignItems: "center", fontSize: 14, fontWeight: 700, padding: "6px 14px", borderRadius: 8, marginBottom: 8 },
  overallPct: { fontSize: 36, fontWeight: 800 },
  overallSub: { fontSize: 13, color: "#64748b" },
  overallStats: { display: "flex", flexDirection: "column", gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: 700, margin: "28px 0 14px", display: "flex", alignItems: "center", gap: 8 },
  catScoreGrid: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 },
  catScoreCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, padding: "14px 18px" },
  catScoreTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  catCode2: { fontSize: 12, fontWeight: 700, color: "#94a3b8", width: 16 },
  catName2: { flex: 1, fontSize: 14, fontWeight: 500 },
  catBadge: { fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 5 },
  catScorePct: { fontSize: 11, color: "#94a3b8", marginTop: 0 },
  allGood: { background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "16px 20px", fontSize: 14, color: "#065f46", fontWeight: 500 },
};