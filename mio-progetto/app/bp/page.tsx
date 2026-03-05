"use client";

import { useState, useMemo } from "react";
import BackToHome from "../components/BackToHome";
// ─── ONBOARDING CONFIG ────────────────────────────────────────────────────────

const BATTERY_TYPES = [
  { id: "EV",         label: "EV",         desc: "Veicoli elettrici (auto, furgoni, bus)" },
  { id: "LMT",        label: "LMT",         desc: "Light Means of Transport (bici, scooter, ecc.)" },
  { id: "Industrial", label: "Industrial",  desc: "Uso industriale, capacità >2 kWh" },
  { id: "Stationary", label: "Stationary",  desc: "Stoccaggio stazionario, capacità >2 kWh" },
];

const REGULATION_TYPES = [
  {
    id: "BattReg",
    label: "Battery Regulation",
    desc: "Reg. (UE) 2023/1542 — obblighi diretti per produttori e importatori di batterie",
    badge: "BattReg",
    color: "#0369a1",
    bg: "#e0f2fe",
  },
  {
    id: "ESPR",
    label: "ESPR",
    desc: "Reg. (UE) 2024/1781 — obblighi DPP da ecodesign, applicabili via JTC-24",
    badge: "ESPR",
    color: "#7c3aed",
    bg: "#ede9fe",
  },
];

// ─── CATEGORIES DATA ──────────────────────────────────────────────────────────
// Each question has:
//   mandatory: battery types for which it's mandatory under BattReg (x)
//   espr:      battery types for which it's mandatory under ESPR (x)
//   voluntary: battery types for which it's voluntary (o)

const CATEGORIES = [
  {
    id: "identifiers",
    code: "A",
    title: "Identifiers & Product Data",
    subtitle: "Identificatori, DPP, informazioni su produttore e operatore",
    totalAttributes: 19,
    regulation: "Art. 77(3) BattReg; ESPR Art. 12; JTC-24 prEN_18222/18223",
    keyAttributes: [
      "Battery Passport Identifier (univoco, URI/URL-based)",
      "Battery Identifier (conforme ISO/IEC 15459)",
      "Manufacturer Identifier + informazioni complete",
      "Economic Operator Identifier",
      "Facility Identifier (luogo di produzione)",
      "Battery Status (Active/Archived)",
      "DPP Schema Version e Granularity",
      "Battery Model Identifier",
      "Date/time ultimo aggiornamento DPP",
    ],
    questions: [
      {
        id: "id_passport",
        text: "Il Battery Passport Identifier è presente e globalmente univoco (URI/URL-based)?",
        hint: "Deve essere conforme a JTC-24 prEN_18222. Verificare che sia serializzato a livello di singola batteria.",
        ref: "Art. 77(3); JTC-24 prEN_18222 (4.2)",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: ["EV", "LMT", "Industrial", "Stationary"],
        voluntary: [],
      },
      {
        id: "id_battery",
        text: "Il Battery Identifier è conforme agli standard ISO/IEC 15459 e presente sull'etichetta fisica?",
        hint: "Include serial number, batch o product number. Deve comparire sull'etichetta o imballaggio se la dimensione non lo consente sulla batteria.",
        ref: "Art. 77(3); Art. 3(66)",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "id_manufacturer",
        text: "Le informazioni sul produttore sono complete (nome, indirizzo, web, email)?",
        hint: "Includono ragione sociale, trademark registrato, indirizzo postale, contatti. Devono essere in lingua comprensibile all'utente finale.",
        ref: "Annex VI Part A (1); Art. 38(7)",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "id_operator",
        text: "È presente l'Economic Operator Identifier (se diverso dal produttore)?",
        hint: "Obbligatorio per ESPR se diverso dal manufacturer. Se non disponibile, deve essere richiesto dall'operatore.",
        ref: "ESPR Art. 12(2); Art. 3(22)",
        mandatory: [],
        espr: ["EV", "LMT", "Industrial", "Stationary"],
        voluntary: ["EV", "LMT", "Industrial", "Stationary"],
      },
      {
        id: "id_facility",
        text: "È presente il Facility Identifier univoco per il sito di produzione?",
        hint: "Identifica univocamente il luogo di produzione secondo JTC-24 prEN_18219.",
        ref: "JTC-24 prEN_18219 (3.20)",
        mandatory: [],
        espr: ["EV", "LMT", "Industrial", "Stationary"],
        voluntary: ["EV", "LMT", "Industrial", "Stationary"],
      },
      {
        id: "id_model",
        text: "È presente il Battery Model Identifier univoco?",
        hint: "Identifica il modello di batteria. Richiesto dalla CF Declaration IA. Può essere parte del Battery Identifier se distinguibile.",
        ref: "Art. 3(19); CF declaration IA, Annex (draft)",
        mandatory: [],
        espr: [],
        voluntary: ["EV", "LMT", "Industrial", "Stationary"],
      },
      {
        id: "id_status",
        text: "Il Battery Status è aggiornato e accessibile (Active, Archived, ecc.)?",
        hint: "Attributo dinamico aggiornato ad ogni cambio di stato. Esempio: 'Active', 'Archived', 'Waste'.",
        ref: "JTC-24 prEN_18223 (4.1.3.1 Table 1)",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: ["EV", "LMT", "Industrial", "Stationary"],
        voluntary: [],
      },
    ],
  },
  {
    id: "performance",
    code: "B",
    title: "Performance & Durability",
    subtitle: "Capacità, energia, resistenza, lifetime, temperatura, eventi negativi",
    totalAttributes: 42,
    regulation: "Annex IV BattReg; Delegated Acts (in definizione)",
    keyAttributes: [
      "Capacità nominale e minima garantita (Ah)",
      "Energia nominale (Wh)",
      "State of Health (SoH)",
      "State of Charge (SoC) — dinamico",
      "Remaining Capacity — dinamico",
      "Resistenza interna originale e attuale",
      "Round-trip energy efficiency",
      "Numero cicli di carica/scarica",
      "Temperatura operativa (min/max)",
      "Deep discharge & overcharge events",
    ],
    questions: [
      {
        id: "perf_capacity",
        text: "Sono documentati capacità nominale (Ah), energia nominale (Wh) e tensione (V) con valori certificati?",
        hint: "Inclusi valori minimi garantiti e metodologia di misura. Attributi statici, a livello di modello.",
        ref: "Annex IV; IEC 62619",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "perf_soh",
        text: "Esiste un sistema per calcolare e aggiornare State of Health (SoH) e Remaining Capacity?",
        hint: "Sono attributi dinamici. La frequenza di aggiornamento sarà definita da Delegated Act. Verificare presenza di BMS o equivalente.",
        ref: "Annex IV; Delegated Act (in def.)",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "perf_resistance",
        text: "È documentata la resistenza interna (originale + attuale) con metodo di misura?",
        hint: "La resistenza interna originale è statica; quella attuale è dinamica. Entrambe obbligatorie per EV.",
        ref: "Annex IV BattReg",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "perf_lifetime",
        text: "Sono tracciati i dati di lifetime: cicli, energy throughput, capacity throughput?",
        hint: "Attributi dinamici critici. Includono numero di cicli completi, throughput totale di energia e capacità.",
        ref: "Annex IV; Delegated Act",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "perf_temperature",
        text: "Sono monitorate le condizioni di temperatura (range operativo + eventi estremi)?",
        hint: "Include range nominale, tempo trascorso sopra/sotto soglia, tempo di ricarica in temperature estreme.",
        ref: "Annex IV BattReg",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "perf_events",
        text: "Vengono registrati e documentati gli eventi negativi (deep discharge, overcharge, incidenti)?",
        hint: "Numero eventi di scarica profonda, sovraccarica, e informazioni su incidenti. Tutti dinamici.",
        ref: "Annex IV BattReg",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "perf_power",
        text: "Sono documentate la potenza nominale e la power capability (cold crank, peak)?",
        hint: "Include potenza nominale, potenza massima, cold crank power (per EV). Attributi statici a livello modello.",
        ref: "Annex IV BattReg",
        mandatory: ["EV"],
        espr: [],
        voluntary: ["LMT", "Industrial", "Stationary"],
      },
    ],
  },
  {
    id: "carbon",
    code: "C",
    title: "Battery Carbon Footprint",
    subtitle: "Impronta carbonica del ciclo di vita e soglie GHG",
    totalAttributes: 8,
    regulation: "Art. 7 BattReg; Reg. (UE) 2023/1542; DA Carbon Footprint",
    keyAttributes: [
      "Carbon footprint totale (kg CO₂eq / kWh)",
      "Dichiarazione di carbon footprint (Battery CF Declaration)",
      "Classe di performance carbon footprint",
      "Soglia massima carbon footprint (threshold)",
      "Carbon footprint per fase del ciclo di vita",
      "Share di energia rinnovabile nel processo",
    ],
    questions: [
      {
        id: "cf_declaration",
        text: "È stata preparata o è in corso la Battery Carbon Footprint Declaration secondo l'Art. 7?",
        hint: "Obbligatoria per EV. Include la CF totale in kg CO₂eq/kWh e la CF per fase del ciclo di vita (estrazione, produzione, fine vita).",
        ref: "Art. 7 BattReg; Annex II",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "cf_class",
        text: "È stata calcolata la classe di performance della carbon footprint (A–E)?",
        hint: "Le classi saranno definite da Delegated Act. Verificare se l'azienda ha già una stima comparativa.",
        ref: "Art. 7(1)(d); DA CF",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "cf_lifecycle",
        text: "Esiste un LCA completo con dettaglio per fase (raw material, manufacturing, use, EoL)?",
        hint: "Necessario per il calcolo disaggregato della CF. Deve seguire la metodologia definita dal DA.",
        ref: "Art. 7; DA Metodologia LCA",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "cf_renewable",
        text: "È documentata e verificabile la quota di energia rinnovabile usata nel processo produttivo?",
        hint: "Influenza direttamente il valore di carbon footprint. Deve essere dimostrabile con evidenze (GO, contratti energia).",
        ref: "Art. 7 BattReg",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
    ],
  },
  {
    id: "materials",
    code: "D",
    title: "Battery Materials & Composition",
    subtitle: "Sostanze pericolose, materiali critici, composizione chimica",
    totalAttributes: 5,
    regulation: "Art. 13 BattReg; REACH; RoHS",
    keyAttributes: [
      "Composizione chimica della batteria (catodo, anodo, elettrolita)",
      "Sostanze pericolose presenti (> soglie REACH)",
      "Materiali critici (litio, cobalto, nichel, manganese)",
      "Tipo di chimica: LFP, NMC, NCA, LTO ecc.",
    ],
    questions: [
      {
        id: "mat_chemistry",
        text: "È documentata la composizione chimica dettagliata (catodo, anodo, elettrolita, involucro)?",
        hint: "Include il tipo di chimica (NMC, LFP, NCA, ecc.) e le percentuali in peso dei materiali principali.",
        ref: "Art. 13 BattReg; Annex VI",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "mat_hazardous",
        text: "Sono identificate e dichiarate tutte le sostanze pericolose presenti sopra le soglie REACH/RoHS?",
        hint: "Include metalli pesanti, solventi dell'elettrolita, additivi. Verifica SVHC list ECHA.",
        ref: "Art. 13(4); REACH Art. 59",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "mat_critical",
        text: "Sono tracciate e documentate le quantità di materiali critici (Li, Co, Ni, Mn, grafite)?",
        hint: "Necessario anche per il calcolo del contenuto riciclato (sezione Circularity). Devono essere indicati in % peso.",
        ref: "Art. 13 BattReg; EU CRM List",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
    ],
  },
  {
    id: "circularity",
    code: "E",
    title: "Circularity & Resource Efficiency",
    subtitle: "Contenuto riciclato, design for disassembly, fine vita",
    totalAttributes: 15,
    regulation: "Art. 8, 11, 60-76 BattReg; End-of-Life DA",
    keyAttributes: [
      "Contenuto riciclato di Co, Li, Ni, Pb (% in peso)",
      "Contenuto rinnovabile",
      "Design for disassembly (istruzioni smontaggio)",
      "Istruzioni raccolta e preparazione second life",
      "Rimovibilità e sostituibilità",
      "Informazioni su trattamento a fine vita",
      "Parts availability (spare parts)",
    ],
    questions: [
      {
        id: "circ_recycled",
        text: "È documentato e verificabile il contenuto riciclato di cobalto, litio, nichel e piombo (% in peso)?",
        hint: "Soglie minime obbligatorie definite dall'Art. 8: Co ≥16%, Li ≥6%, Ni ≥6% dal 2031. Devono essere calcolate secondo metodologia DA.",
        ref: "Art. 8 BattReg; DA Recycled Content",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "circ_disassembly",
        text: "Esistono istruzioni di disassemblaggio per riutilizzo, rigenerazione e riciclo?",
        hint: "Devono coprire pack, moduli e celle. Includono sequenza operativa, utensili necessari, rischi di sicurezza.",
        ref: "Art. 11 BattReg; Annex XIII",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "circ_secondlife",
        text: "Sono disponibili informazioni per il second life (SoH attuale, capacità residua, test necessari)?",
        hint: "Include stato di salute attuale, capacity residua, procedure per test pre-second-life. Attributi dinamici.",
        ref: "Art. 60-76 BattReg",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "circ_eol",
        text: "Sono documentate le istruzioni per la raccolta, il trattamento e il riciclo a fine vita?",
        hint: "Incluse istruzioni per utenti finali (consumer), istruzioni per impianti di trattamento, obiettivi di recupero.",
        ref: "Art. 60(2); Annex XIII",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "circ_renewable",
        text: "È documentato il contenuto di materiali rinnovabili nella batteria?",
        hint: "Attributo volontario ma sempre più richiesto dai clienti OEM. Include biomateriali e polimeri bio-based.",
        ref: "BatteryPass-Ready v1.3",
        mandatory: [],
        espr: [],
        voluntary: ["EV", "LMT", "Industrial", "Stationary"],
      },
    ],
  },
  {
    id: "supplychain",
    code: "F",
    title: "Supply Chain Due Diligence",
    subtitle: "Tracciabilità catena di fornitura e materiali critici",
    totalAttributes: 3,
    regulation: "Art. 48-52 BattReg; OECD DD Guidelines",
    keyAttributes: [
      "Supply chain due diligence report",
      "Politica aziendale di due diligence",
      "Identificazione e gestione dei rischi nella supply chain",
    ],
    questions: [
      {
        id: "sc_policy",
        text: "L'azienda ha adottato una politica formale di supply chain due diligence per i materiali critici?",
        hint: "Deve coprire almeno Li, Co, Ni, Mn, grafite naturale. Allineata alle OECD DD Guidelines.",
        ref: "Art. 48 BattReg; OECD Guidelines",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "sc_report",
        text: "Viene redatto e reso disponibile un report annuale di supply chain due diligence?",
        hint: "Include mappatura fornitori, valutazione dei rischi (conflitto, diritti umani, ambiente), misure di mitigazione adottate.",
        ref: "Art. 52 BattReg",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "sc_traceability",
        text: "È tracciabile l'origine dei materiali critici fino al sito di estrazione/lavorazione primaria?",
        hint: "Livello di tracciabilità richiesto: almeno fino al primo fornitore diretto, con audit o certificazioni di terza parte.",
        ref: "Art. 48-52 BattReg",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
    ],
  },
  {
    id: "labels",
    code: "G",
    title: "Symbols, Labels & Conformity",
    subtitle: "Etichettatura, QR code, marcatura CE e dichiarazioni",
    totalAttributes: 7,
    regulation: "Art. 13, 14, 38-40 BattReg; Annex VI/VII",
    keyAttributes: [
      "QR code con link al Battery Passport",
      "Marcatura CE",
      "Simbolo 'separate collection' (bidone barrato)",
      "Dichiarazione di conformità (DoC)",
      "Capacità (Wh) sull'etichetta",
      "Codice colore per hazardous substances",
    ],
    questions: [
      {
        id: "lab_qr",
        text: "Il QR code è presente sulla batteria (o imballaggio) e collega al Battery Passport con accesso pubblico?",
        hint: "Obbligatorio. Il QR deve essere leggibile per tutta la vita utile della batteria. Deve linkare a un URL persistente.",
        ref: "Art. 13(3); Art. 77(3)",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "lab_ce",
        text: "La marcatura CE è presente e la Dichiarazione di Conformità (DoC) è disponibile?",
        hint: "La DoC deve essere aggiornata e accessibile. Include riferimenti alle norme armonizzate applicabili.",
        ref: "Art. 38-40 BattReg; Annex VII",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
      {
        id: "lab_symbols",
        text: "Sono presenti tutti i simboli obbligatori (bidone barrato, capacità Wh, codice chimica, hazardous symbols)?",
        hint: "Verificare dimensioni minime simboli (Annex VI), leggibilità, permanenza sull'etichetta per tutta la vita utile.",
        ref: "Art. 13; Annex VI BattReg",
        mandatory: ["EV", "LMT", "Industrial", "Stationary"],
        espr: [],
        voluntary: [],
      },
    ],
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MATURITY = ["complete", "partial", "absent"];

const maturityConfig = {
  complete: { label: "Completo", points: 0, color: "#059669", bg: "#d1fae5" },
  partial:  { label: "Parziale", points: 1, color: "#d97706", bg: "#fef3c7" },
  absent:   { label: "Assente",  points: 2, color: "#dc2626", bg: "#fee2e2" },
};

const tagConfig = {
  mandatory: { label: "Obbligatorio", bg: "#dbeafe", color: "#1d4ed8" },
  espr:      { label: "ESPR",         bg: "#ede9fe", color: "#7c3aed" },
  voluntary: { label: "Volontario",   bg: "#f0fdf4", color: "#166534" },
};

function isQuestionVisible(q, profile) {
  const { batteryType, regulation, includeVoluntary } = profile;
  if (regulation === "BattReg") {
    if (q.mandatory.includes(batteryType)) return { show: true, tag: "mandatory" };
    if (includeVoluntary && q.voluntary.includes(batteryType)) return { show: true, tag: "voluntary" };
    return { show: false };
  }
  if (regulation === "ESPR") {
    if (q.espr.includes(batteryType)) return { show: true, tag: "espr" };
    return { show: false };
  }
  return { show: false };
}

function getVisibleQuestions(cat, profile) {
  return cat.questions
    .map((q) => ({ q, ...isQuestionVisible(q, profile) }))
    .filter((x) => x.show);
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
    results[cat.id] = {
      total, answered, maxPossible, pct, visibleCount: visible.length,
      label: pct >= 75 ? "Buona" : pct >= 40 ? "Intermedia" : "Critica",
    };
  });
  return results;
}

function overallScore(scores) {
  let sum = 0, max = 0;
  Object.values(scores).forEach((s) => { sum += s.total; max += s.maxPossible; });
  const pct = max > 0 ? Math.round((1 - sum / max) * 100) : 100;
  return { pct, label: pct >= 75 ? "Buona" : pct >= 40 ? "Intermedia" : "Critica" };
}

function badgeStyle(label) {
  if (label === "Buona")      return { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" };
  if (label === "Intermedia") return { background: "#fef3c7", color: "#78350f", border: "1px solid #fcd34d" };
  return                             { background: "#fee2e2", color: "#7f1d1d", border: "1px solid #fca5a5" };
}

const INITIAL_PROFILE = { batteryType: null, regulation: null, includeVoluntary: null };

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function BatteryPassportScreening() {
  const [phase, setPhase] = useState("intro");
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [catIndex, setCatIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [expandedGap, setExpandedGap] = useState(null);

  const profileReady = profile.batteryType && profile.regulation && profile.includeVoluntary !== null;

  const scores = useMemo(
    () => profileReady ? computeScores(answers, profile) : {},
    [answers, profile, profileReady]
  );
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

  function restart() { setAnswers({}); setCatIndex(0); setProfile(INITIAL_PROFILE); setPhase("intro"); }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <div style={s.root}>
      <div style={s.container}>
        <div style={s.badge}>Battery Passport EU · BattReg 2023/1542</div>
        <div className="sm:text-right"><BackToHome /></div>
        <h1 style={s.introTitle}>Battery Passport<br />Readiness Screening</h1>
        <p style={s.introSub}>
          Strumento di pre-assessment per consulenti e auditor. Valuta la maturità di un'azienda
          rispetto agli obblighi del Battery Passport EU, organizzato nelle 7 macro-categorie
          del Data Attribute Longlist (BatteryPass-Ready v1.3, dicembre 2025).
        </p>

        

        <div style={s.introGrid}>
          {CATEGORIES.map((cat) => (
            <div key={cat.id} style={s.introCard}>
              <div style={s.introCardCode}>{cat.code}</div>
              <div style={s.introCardTitle}>{cat.title}</div>
              <div style={s.introCardSub}>{cat.totalAttributes} attributi</div>
            </div>
          ))}
        </div>
        <div style={s.chipRow}>
          <span style={s.chip}>99 attributi totali</span>
          <span style={s.chip}>7 macro-categorie</span>
          <span style={s.chip}>10–15 min</span>
        </div>
        <button style={s.startBtn} onClick={() => setPhase("onboarding")}>Configura e avvia →</button>
        <p style={s.disclaimer}>Screening preliminare. Non sostituisce audit formali, certificazioni o consulenza legale.</p>
      </div>
    </div>

    
  );

  
        

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  if (phase === "onboarding") {
    const canStart = profileReady;
    return (
      <div style={s.root}>
        <div style={{ ...s.container, maxWidth: 680 }}>
          <button style={s.backLink} onClick={() => setPhase("intro")}>← Torna all'inizio</button>
          <div style={s.badge}>Configurazione screening</div>
          <h2 style={s.onboardTitle}>Definisci il perimetro</h2>
          <p style={s.onboardSub}>
            Le tre risposte seguenti filtreranno le domande mostrando solo gli attributi
            rilevanti per il contesto specifico dell'azienda valutata.
          </p>

          {/* Q1 */}
          <OnboardSection num="1" title="Tipo di batteria" desc="Seleziona la categoria di batteria da valutare. In questa versione è possibile selezionarne una alla volta.">
            <div style={s.optionGrid}>
              {BATTERY_TYPES.map((bt) => (
                <OptionCard key={bt.id} selected={profile.batteryType === bt.id}
                  onClick={() => setProfile((p) => ({ ...p, batteryType: bt.id }))}
                  label={bt.label} desc={bt.desc} accent="#0369a1" />
              ))}
            </div>
          </OnboardSection>

          {/* Q2 */}
          <OnboardSection num="2" title="Quadro normativo di riferimento" desc="Influenza quali attributi vengono mostrati. BattReg mostra gli obblighi diretti; ESPR mostra solo gli attributi con flag (x) da JTC-24.">
            <div style={s.optionGrid2}>
              {REGULATION_TYPES.map((reg) => (
                <OptionCard key={reg.id} selected={profile.regulation === reg.id}
                  onClick={() => setProfile((p) => ({ ...p, regulation: reg.id }))}
                  label={reg.label} desc={reg.desc} accent={reg.color}
                  badgeLabel={reg.badge} badgeBg={reg.bg} badgeColor={reg.color} />
              ))}
            </div>
            {profile.regulation === "ESPR" && (
              <div style={s.infoBox}>
                <strong>Nota ESPR:</strong> Lo screening mostrerà solo gli attributi con flag (x) da ESPR / JTC-24.
                Gli attributi obbligatori esclusivamente da BattReg saranno nascosti.
              </div>
            )}
          </OnboardSection>

          {/* Q3 */}
          <OnboardSection num="3" title="Includere data point volontari?" desc="Gli attributi volontari (flag 'o' nel Data Attribute Longlist) non sono obbligatori ma possono essere richiesti da clienti OEM o da future revisioni normative.">
            <div style={s.optionGrid2}>
              <OptionCard selected={profile.includeVoluntary === true}
                onClick={() => setProfile((p) => ({ ...p, includeVoluntary: true }))}
                label="Sì, includi" desc="Mostra anche gli attributi volontari, marcati con badge verde distinto" accent="#059669" />
              <OptionCard selected={profile.includeVoluntary === false}
                onClick={() => setProfile((p) => ({ ...p, includeVoluntary: false }))}
                label="No, solo obbligatori" desc="Mostra solo gli attributi obbligatori per il quadro normativo selezionato" accent="#64748b" />
            </div>
          </OnboardSection>

          {canStart && (
            <div style={s.onboardSummary}>
              <SummaryChip label="Batteria" val={BATTERY_TYPES.find(b => b.id === profile.batteryType)?.label} />
              <SummaryChip label="Normativa" val={REGULATION_TYPES.find(r => r.id === profile.regulation)?.label} />
              <SummaryChip label="Volontari" val={profile.includeVoluntary ? "Inclusi" : "Esclusi"} />
            </div>
          )}

          <button
            style={{ ...s.startBtn, opacity: canStart ? 1 : 0.4, cursor: canStart ? "pointer" : "not-allowed" }}
            onClick={() => canStart && setPhase("category")} disabled={!canStart}
          >
            Avvia screening →
          </button>
          {!canStart && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Completa tutte e 3 le selezioni per procedere.</p>}
        </div>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (phase === "results") {
    const gapItems = [];
    CATEGORIES.forEach((cat) => {
      getVisibleQuestions(cat, profile).forEach(({ q, tag }) => {
        const val = answers[q.id];
        if (val === "partial" || val === "absent" || !val)
          gapItems.push({ cat: cat.title, catCode: cat.code, q, val: val || "absent", tag });
      });
    });
    const criticalGaps = gapItems.filter((g) => g.val === "absent");
    const partialGaps  = gapItems.filter((g) => g.val === "partial");
    const completeCount = Object.values(answers).filter((v) => v === "complete").length;

    return (
      <div style={s.root}>
        <div style={s.container}>
          <div style={s.resultsHeader}>
            <div>
              <div style={s.badge}>Risultati screening</div>
              <h2 style={s.resultsTitle}>Gap Analysis — Battery Passport</h2>
              <div style={s.chipRow}>
                <span style={s.chip}>{BATTERY_TYPES.find(b => b.id === profile.batteryType)?.label}</span>
                <span style={s.chip}>{REGULATION_TYPES.find(r => r.id === profile.regulation)?.label}</span>
                {profile.includeVoluntary && <span style={s.chip}>+ Volontari</span>}
              </div>
            </div>
            <button style={s.restartBtn} onClick={restart}>← Nuovo screening</button>
          </div>

          <div style={s.overallCard}>
            <div>
              <div style={s.overallLabel}>Maturità complessiva</div>
              <div style={{ ...s.overallBadge, ...badgeStyle(overall.label) }}>{overall.label}</div>
              <div style={s.overallPct}>{overall.pct}%</div>
              <div style={s.overallSub}>degli attributi coperti</div>
            </div>
            <div style={s.overallStats}>
              <Stat num={criticalGaps.length} color="#dc2626" label="gap critici" />
              <Stat num={partialGaps.length}  color="#d97706" label="gap parziali" />
              <Stat num={completeCount}        color="#059669" label="aree conformi" />
            </div>
          </div>

          <div style={s.sectionTitle}>Maturità per categoria</div>
          <div style={s.catScoreGrid}>
            {CATEGORIES.map((cat) => {
              const sc = scores[cat.id];
              if (!sc || sc.visibleCount === 0) return null;
              return (
                <div key={cat.id} style={s.catScoreCard}>
                  <div style={s.catScoreTop}>
                    <span style={s.catCode2}>{cat.code}</span>
                    <span style={s.catName2}>{cat.title}</span>
                    <span style={{ ...s.catBadge, ...badgeStyle(sc.label) }}>{sc.label}</span>
                  </div>
                  <div style={s.barOuter}><div style={{ ...s.barInner, width: `${sc.pct}%`, background: sc.pct >= 75 ? "#059669" : sc.pct >= 40 ? "#d97706" : "#dc2626" }} /></div>
                  <div style={s.catScorePct}>{sc.pct}% · {sc.answered}/{sc.visibleCount} domande</div>
                </div>
              );
            })}
          </div>

          {criticalGaps.length > 0 && <>
            <div style={s.sectionTitle}><span style={{ color: "#dc2626" }}>●</span> Gap critici — priorità alta</div>
            <div style={s.gapList}>
              {criticalGaps.map((g, i) => (
                <GapItem key={i} g={g} expanded={expandedGap === `c${i}`} onToggle={() => setExpandedGap(expandedGap === `c${i}` ? null : `c${i}`)} color="#dc2626" bg="#fff5f5" />
              ))}
            </div>
          </>}

          {partialGaps.length > 0 && <>
            <div style={s.sectionTitle}><span style={{ color: "#d97706" }}>●</span> Gap parziali — da strutturare</div>
            <div style={s.gapList}>
              {partialGaps.map((g, i) => (
                <GapItem key={i} g={g} expanded={expandedGap === `p${i}`} onToggle={() => setExpandedGap(expandedGap === `p${i}` ? null : `p${i}`)} color="#d97706" bg="#fffbeb" />
              ))}
            </div>
          </>}

          {gapItems.length === 0 && <div style={s.allGood}>✓ Nessun gap rilevato per il perimetro selezionato.</div>}

          <p style={{ ...s.disclaimer, marginTop: 32 }}>
            Screening basato su BattReg (UE) 2023/1542, ESPR (UE) 2024/1781 e draft JTC-24 (dicembre 2025).
            Non sostituisce audit formali, certificazioni di terza parte o consulenza legale.
          </p>
        </div>
      </div>
    );
  }

  // ── CATEGORY STEP ──────────────────────────────────────────────────────────
  const progress = Math.round(((catIndex + 1) / CATEGORIES.length) * 100);
  const catAnswered = visibleQuestions.filter(({ q }) => answers[q.id]).length;

  return (
    <div style={s.root}>
      <div style={s.container}>
        <div style={s.topBar}>
          <div>
            <div style={s.badge}>Battery Passport Screening</div>
            <div style={s.stepLabel}>Sezione {catIndex + 1} di {CATEGORIES.length} — {currentCat.title}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={s.progressPct}>{progress}%</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {BATTERY_TYPES.find(b => b.id === profile.batteryType)?.label} · {profile.regulation}
              {profile.includeVoluntary ? " · +Vol" : ""}
            </div>
          </div>
        </div>

        <div style={s.progressOuter}><div style={{ ...s.progressInner, width: `${progress}%` }} /></div>

        <div style={s.stepTabs}>
          {CATEGORIES.map((cat, i) => (
            <div key={cat.id} style={{ ...s.stepTab, ...(i === catIndex ? s.stepTabActive : {}), ...(i < catIndex ? s.stepTabDone : {}) }} onClick={() => setCatIndex(i)}>
              {cat.code}
            </div>
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
                Nessun attributo applicabile in questa categoria per il profilo selezionato.
                <br /><br />
                <button style={s.btnSecondary} onClick={goNext}>Avanti →</button>
              </div>
            ) : (
              <>
                <div style={s.keyAttrsBox}>
                  <div style={s.keyAttrsTitle}>Attributi chiave coperti</div>
                  <ul style={s.keyAttrsList}>
                    {currentCat.keyAttributes.map((a, i) => <li key={i} style={s.keyAttrItem}>{a}</li>)}
                  </ul>
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
              <button style={s.btnPrimary} onClick={goNext}>
                {catIndex < CATEGORIES.length - 1 ? "Avanti →" : "Vedi risultati →"}
              </button>
            </div>
          </div>

          <aside style={s.sidebar}>
            <div style={s.sideCard}>
              <div style={s.sideCardTitle}>Profilo selezionato</div>
              <div style={s.profileRow}><span style={s.profileLbl}>Batteria</span><span style={s.profileVal}>{BATTERY_TYPES.find(b => b.id === profile.batteryType)?.label}</span></div>
              <div style={s.profileRow}><span style={s.profileLbl}>Normativa</span><span style={s.profileVal}>{profile.regulation}</span></div>
              <div style={s.profileRow}><span style={s.profileLbl}>Volontari</span><span style={s.profileVal}>{profile.includeVoluntary ? "Inclusi" : "Esclusi"}</span></div>
              <button style={{ ...s.btnSecondary, width: "100%", marginTop: 12, fontSize: 12, padding: "8px 12px" }} onClick={() => setPhase("onboarding")}>
                Modifica profilo
              </button>
            </div>

            <div style={s.sideCard}>
              <div style={s.sideCardTitle}>Riepilogo live</div>
              {CATEGORIES.map((cat, i) => {
                const sc = scores[cat.id] || { label: "Critica" };
                return (
                  <div key={cat.id} style={{ ...s.sideRow, ...(i === catIndex ? s.sideRowActive : {}) }} onClick={() => setCatIndex(i)}>
                    <span style={s.sideRowCode}>{cat.code}</span>
                    <span style={s.sideRowName}>{cat.title.split(" ")[0]}</span>
                    <span style={{ ...s.sideBadge, ...badgeStyle(sc.label) }}>{sc.label}</span>
                  </div>
                );
              })}
            </div>

            <button style={{ ...s.btnPrimary, width: "100%" }} onClick={() => { setPhase("results"); window.scrollTo({ top: 0 }); }}>
              Vedi risultati →
            </button>
          </aside>
        </div>
      </div>
    </div>
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

function OptionCard({ selected, onClick, label, desc, accent, badgeLabel, badgeBg, badgeColor }) {
  return (
    <button onClick={onClick} style={{ border: `2px solid ${selected ? accent : "#e2e8f0"}`, borderRadius: 10, padding: "14px 16px", background: selected ? `${accent}12` : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: selected ? accent : "#0f172a" }}>{label}</span>
        {badgeLabel
          ? <span style={{ fontSize: 10, fontWeight: 700, background: badgeBg, color: badgeColor, padding: "2px 8px", borderRadius: 4 }}>{badgeLabel}</span>
          : selected && <span style={{ color: accent, fontSize: 16, fontWeight: 700 }}>✓</span>}
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
            <button key={m} onClick={() => onChange(m)} style={{ ...s.triBtn, ...(sel ? { borderColor: cfg.color, background: cfg.bg, color: cfg.color } : {}) }}>
              <div style={s.triBtnLabel}>{cfg.label}</div>
              <div style={s.triBtnHint}>{m === "complete" ? "Strutturato e documentato" : m === "partial" ? "Presente, non sistematico" : "Non disponibile"}</div>
            </button>
          );
        })}
      </div>
      <div style={s.hintToggle} onClick={() => setShowHint(!showHint)}>
        {showHint ? "▲ Nascondi nota" : "▼ Nota per l'auditor"}
      </div>
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
        <span style={{ fontSize: 11, fontWeight: 600, color, flexShrink: 0, whiteSpace: "nowrap" }}>{g.val === "absent" ? "Assente" : "Parziale"} {expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Categoria: {g.cat}</div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 6 }}><strong>Nota auditor:</strong> {g.q.hint}</div>
          <div style={{ fontSize: 11, color: "#0369a1" }}><strong>Riferimento:</strong> {g.q.ref}</div>
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
  badge: { display: "inline-block", background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 10px", marginBottom: 16 },
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
  optionGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  infoBox: { marginTop: 12, background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#4c1d95", lineHeight: 1.6 },
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
  catScorePct: { fontSize: 11, color: "#94a3b8", marginTop: 6 },
  gapList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 },
  allGood: { background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "16px 20px", fontSize: 14, color: "#065f46", fontWeight: 500 },
};
