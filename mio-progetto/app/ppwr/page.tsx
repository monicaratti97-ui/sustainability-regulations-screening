"use client";
import { useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import BackToHome from "../components/BackToHome";

const COMPANY_ROLES = [
  { id: "manufacturer", label: "Fabbricante",  desc: "Produce imballaggi vuoti o prodotti già imballati con proprio marchio" },
  { id: "importer",     label: "Importatore",  desc: "Importa prodotti imballati da paesi extra-UE e li immette sul mercato UE" },
  { id: "distributor",  label: "Distributore", desc: "Distributore finale: vende direttamente a consumatori o utenti professionali" },
  { id: "horeca",       label: "HoReCa",       desc: "Opera nel settore alberghiero, ristorazione, catering, take-away" },
];
const PACKAGING_MATERIALS = [
  { id: "plastic", label: "Plastica",      desc: "Imballaggi in plastica monouso o riutilizzabili" },
  { id: "paper",   label: "Carta/Cartone", desc: "Imballaggi in carta, cartone, cartoncino" },
  { id: "glass",   label: "Vetro",         desc: "Bottiglie, vasetti, contenitori in vetro" },
  { id: "metal",   label: "Metallo",       desc: "Alluminio, acciaio (lattine, contenitori, fusti)" },
];
const CATEGORIES = [
  {
    id:"scope",code:"A",title:"Perimetro & Ruolo nella Filiera",subtitle:"Identificazione del ruolo aziendale e degli obblighi applicabili",totalAttributes:8,
    regulation:"Art. 2, Art. 3 - Definizioni e ambito d'applicazione PPWR",
    keyAttributes:["Definizione di 'produttore' ai fini EPR (Art. 3, punto 15)","Tipologia imballaggi immessi sul mercato","Presenza di imballaggi da asporto / di servizio","Imballaggi per e-commerce","Ruolo: fabbricante, importatore, distributore"],
    questions:[
      {id:"scope_role",text:"L'azienda ha identificato con precisione il proprio ruolo ai fini PPWR (fabbricante, importatore, distributore, produttore)?",hint:"Il ruolo di 'produttore' ai sensi dell'Art. 3, punto 15 attiva gli obblighi EPR. Un'azienda puo' avere piu' ruoli contemporaneamente.",ref:"Art. 3 (12-21) PPWR",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"scope_types",text:"L'azienda ha censito e classificato tutte le tipologie di imballaggio che utilizza o immette sul mercato (primari, secondari, terziari, servizio, e-commerce)?",hint:"La classificazione corretta e' fondamentale per determinare gli obblighi applicabili. Gli imballaggi da asporto e di servizio hanno obblighi specifici di riutilizzo.",ref:"Art. 3 (1-11) PPWR; Allegato I",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"scope_market",text:"L'azienda sa con precisione in quali Stati membri UE immette sul mercato imballaggi o prodotti imballati?",hint:"Necessario per identificare le obbligazioni EPR Stato per Stato, i sistemi DRS locali e le eventuali prescrizioni nazionali aggiuntive.",ref:"Art. 3 (15); Capo VIII PPWR",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"scope_volumes",text:"L'azienda dispone di dati sui volumi di imballaggi immessi sul mercato (peso per materiale e per Stato membro)?",hint:"I dati di volume sono obbligatori per il calcolo dei contributi EPR e per la rendicontazione verso le autorita' competenti.",ref:"Art. 44; Capo VIII PPWR",mandatory:["manufacturer","importer","distributor"],voluntary:["horeca"]},
    ],
  },
  {
    id:"sustainability",code:"B",title:"Prescrizioni di Sostenibilita'",subtitle:"Sostanze pericolose, riciclabilita', contenuto riciclato",totalAttributes:14,
    regulation:"Art. 5 (sostanze), Art. 6 (riciclabilita'), Art. 7 (contenuto riciclato) PPWR",
    keyAttributes:["Limite metalli pesanti: Pb+Cd+Hg+Cr(VI) <= 100 mg/kg","Divieto PFAS in imballaggi food-contact (dal 12/08/2026)","Riciclabilita' obbligatoria di tutti gli imballaggi (dal 2030)","Criteri di 'design for recycling' per categoria","Contenuto riciclato minimo in plastica (dal 2030)","Documentazione tecnica obbligatoria (Allegato VII)"],
    questions:[
      {id:"sust_metals",text:"L'azienda verifica che la somma di piombo, cadmio, mercurio e cromo esavalente negli imballaggi sia inferiore a 100 mg/kg?",hint:"Il limite si applica a tutti gli imballaggi e componenti. Deve essere dimostrato tramite documentazione tecnica (Allegato VII). I fornitori devono fornire certificazioni adeguate.",ref:"Art. 5 (4) PPWR",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"sust_pfas",text:"Gli imballaggi a contatto con alimenti sono stati analizzati per la presenza di PFAS? E' noto se superano le soglie (25 ppb singola PFAS; 250 ppb somma PFAS)?",hint:"Dal 12 agosto 2026 sono vietati gli imballaggi food-contact con PFAS sopra soglia. Le PFAS sono usate come trattamento antigrasso in carta e cartoni per alimenti. Azione urgente.",ref:"Art. 5 (5) PPWR - SCADENZA 12/08/2026",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"sust_recyclability",text:"Tutti gli imballaggi in uso sono stati valutati per la riciclabilita' secondo i criteri di 'design for recycling' dell'UE?",hint:"Dal 2030 tutti gli imballaggi devono essere riciclabili. I criteri dettagliati sono definiti per categoria di materiale. Verificare se i fornitori hanno gia' effettuato tale valutazione.",ref:"Art. 6 PPWR - scadenza 2030",mandatory:["manufacturer","importer"],voluntary:["distributor","horeca"]},
      {id:"sust_recycled",text:"Gli imballaggi in plastica contengono materiale riciclato post-consumo (PCR)? L'azienda conosce le percentuali obbligatorie dal 2030?",hint:"Dal 2030 scattano le prime soglie minime di contenuto riciclato per gli imballaggi in plastica, con valori differenziati per tipologia.",ref:"Art. 7 PPWR - scadenza 2030",mandatory:["manufacturer","importer"],voluntary:["distributor","horeca"]},
      {id:"sust_techDoc",text:"Esiste documentazione tecnica che dimostra la conformita' alle prescrizioni di sostenibilita' (sostanze, riciclabilita', contenuto riciclato)?",hint:"La documentazione tecnica (Allegato VII) e' obbligatoria per immettere imballaggi sul mercato UE. Deve essere conservata e messa a disposizione su richiesta delle autorita'.",ref:"Art. 5 (6); Art. 6 (7); Allegato VII PPWR",mandatory:["manufacturer","importer"],voluntary:["distributor"]},
    ],
  },
  {
    id:"reuse",code:"C",title:"Riutilizzo & Ricarica",subtitle:"Obiettivi di riutilizzo, sistemi di reuse, stazioni di ricarica",totalAttributes:10,
    regulation:"Art. 10-14, Art. 22-27 PPWR - obiettivi vincolanti al 2030",
    keyAttributes:["Obiettivi di riutilizzo per HoReCa (bevande, pasti take-away)","Obiettivi di riutilizzo per e-commerce","Obiettivi di riutilizzo per imballaggi di trasporto B2B","Obbligo di accettare contenitori del consumatore (ricarica)","Sistemi di riutilizzo: deposito cauzionale, circuito chiuso"],
    questions:[
      {id:"reuse_horeca",text:"L'azienda opera nel settore HoReCa e fornisce bevande o alimenti in imballaggi monouso da asporto? E' a conoscenza degli obiettivi di riutilizzo al 2030?",hint:"Il PPWR fissa target obbligatori di riutilizzo per il settore HoReCa (% di bevande servite in contenitori riutilizzabili). I distributori finali sono direttamente impattati.",ref:"Art. 22-24 PPWR - scadenza 2030",mandatory:["horeca","distributor"],voluntary:["manufacturer"]},
      {id:"reuse_refill",text:"L'azienda e' in grado di accettare contenitori portati dal consumatore per la ricarica di prodotti (stazione di ricarica)?",hint:"I distributori finali di determinati prodotti (es. detergenti, bevande) devono offrire la possibilita' di ricarica con contenitore proprio.",ref:"Art. 13-14 PPWR",mandatory:["distributor","horeca"],voluntary:["manufacturer"]},
      {id:"reuse_b2b",text:"L'azienda effettua consegne B2B regolari allo stesso cliente con imballaggi di trasporto (pallet, casse, contenitori)? Esistono gia' sistemi di restituzione?",hint:"Gli imballaggi di trasporto usati in forniture B2B ripetute sono soggetti a obiettivi di riutilizzo. Sistemi esistenti di ritiro/restituzione sono un vantaggio competitivo.",ref:"Art. 25-27 PPWR",mandatory:["manufacturer","importer","distributor"],voluntary:[]},
      {id:"reuse_ecommerce",text:"L'azienda vende tramite e-commerce con consegna a domicilio? Ha valutato gli obiettivi PPWR sugli imballaggi per e-commerce riutilizzabili?",hint:"Il PPWR introduce specifici obiettivi di riutilizzo per gli imballaggi per il commercio elettronico (imballaggi di trasporto per consegne dirette al consumatore).",ref:"Art. 26 PPWR",mandatory:["manufacturer","importer","distributor"],voluntary:["horeca"]},
    ],
  },
  {
    id:"labelling",code:"D",title:"Etichettatura & Informazione",subtitle:"Etichettatura armonizzata UE, QR code, istruzioni raccolta differenziata",totalAttributes:7,
    regulation:"Art. 12 PPWR - etichettatura obbligatoria armonizzata",
    keyAttributes:["Etichettatura armonizzata UE con materiale e istruzioni raccolta","QR code / supporto dati digitale","Indicazione 'riutilizzabile' per imballaggi riutilizzabili","Indicazione del sistema DRS (deposito cauzionale)","Rimozione loghi non conformi agli standard UE (es. Green Dot)"],
    questions:[
      {id:"label_materials",text:"Gli imballaggi riportano informazioni chiare e standardizzate sul materiale (conforme agli standard UE armonizzati)?",hint:"Il PPWR introduce un sistema di etichettatura armonizzato a livello UE. I loghi attuali (es. Punto Verde, simboli non standardizzati) potrebbero dover essere aggiornati o rimossi.",ref:"Art. 12 (1-4) PPWR",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"label_sorting",text:"Sugli imballaggi sono presenti istruzioni comprensibili per la raccolta differenziata (in quale raccolta va conferito)?",hint:"Le istruzioni devono essere chiare per il consumatore finale, nel rispetto degli schemi di raccolta differenziata dello Stato membro in cui il prodotto e' venduto.",ref:"Art. 12 (2) PPWR",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"label_reusable",text:"Gli imballaggi riutilizzabili sono chiaramente identificati come tali (etichettatura dedicata)?",hint:"Gli imballaggi riutilizzabili devono recare una marcatura che li identifichi come tali per permettere ai consumatori e agli operatori di gestirli correttamente.",ref:"Art. 12 (5) PPWR",mandatory:["manufacturer","importer"],voluntary:["distributor","horeca"]},
      {id:"label_digital",text:"L'azienda ha valutato l'implementazione di un supporto dati digitale (QR code) sull'imballaggio per fornire informazioni estese?",hint:"Il PPWR prevede la possibilita' di integrare le informazioni tramite supporto digitale (QR code, NFC). Alcune informazioni potranno essere rese disponibili solo digitalmente.",ref:"Art. 12 (7-8) PPWR",mandatory:[],voluntary:["manufacturer","importer","distributor","horeca"]},
    ],
  },
  {
    id:"epr",code:"E",title:"Responsabilita' Estesa del Produttore (EPR)",subtitle:"Obblighi di registrazione, contribuzione e rendicontazione",totalAttributes:12,
    regulation:"Capo VIII, Art. 40-55 PPWR - obblighi per tutti i 'produttori'",
    keyAttributes:["Registrazione obbligatoria nel registro EPR per ogni Stato membro","Adesione a un'organizzazione PRO","Contributi finanziari modulati per eco-modulation","Rendicontazione annuale dei volumi immessi","Nomina rappresentante EPR per vendite transfrontaliere"],
    questions:[
      {id:"epr_producer",text:"L'azienda ha verificato se rientra nella definizione di 'produttore' ai sensi dell'Art. 3, punto 15 PPWR, con conseguente obbligo di registrazione EPR?",hint:"La definizione e' molto ampia: include fabbricanti, importatori, distributori che mettono a disposizione imballaggi per la prima volta in uno Stato membro. Anche le vendite e-commerce dirette attivano l'obbligo.",ref:"Art. 3 (15); Art. 40 PPWR",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"epr_registration",text:"L'azienda e' gia' registrata in un sistema EPR in tutti gli Stati membri UE in cui immette sul mercato imballaggi?",hint:"La registrazione e' obbligatoria Stato per Stato. Il PPWR armonizza le regole ma non crea un registro unico UE. La mancata registrazione puo' comportare sanzioni.",ref:"Art. 40-43 PPWR",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"epr_pro",text:"L'azienda versa contributi a un'organizzazione PRO per la gestione dei rifiuti di imballaggio?",hint:"L'adesione a un PRO e' la modalita' piu' comune per adempiere agli obblighi EPR. I contributi saranno modulati in base alla riciclabilita', al contenuto riciclato e altri criteri ambientali.",ref:"Art. 44-48 PPWR",mandatory:["manufacturer","importer","distributor"],voluntary:["horeca"]},
      {id:"epr_reporting",text:"L'azienda dispone di sistemi per rendicontare annualmente i volumi di imballaggi immessi per tipologia di materiale e per Stato membro?",hint:"La rendicontazione e' obbligatoria e deve essere accurata. I dati di volume per materiale sono la base per il calcolo dei contributi EPR.",ref:"Art. 50; Art. 56 PPWR",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"epr_representative",text:"Se l'azienda e' stabilita fuori UE o vende da altro Stato membro, ha nominato un rappresentante autorizzato EPR in ogni Stato membro interessato?",hint:"I produttori non stabiliti nello Stato membro in cui vendono devono nominare un rappresentante autorizzato EPR. La mancata nomina impedisce la vendita in quel mercato.",ref:"Art. 3 (20) PPWR",mandatory:["manufacturer","importer"],voluntary:[]},
    ],
  },
  {
    id:"drs",code:"F",title:"Sistemi di Deposito Cauzionale (DRS)",subtitle:"Obblighi per bottiglie e lattine, contrassegni, adesione ai sistemi",totalAttributes:6,
    regulation:"Art. 44 PPWR - DRS obbligatorio per bottiglie e lattine bevande",
    keyAttributes:["Bottiglie di plastica monouso per bevande (fino a 3L) -> DRS","Lattine in metallo per bevande (fino a 3L) -> DRS","Contrassegno DRS obbligatorio sull'imballaggio","Adesione al sistema DRS del Paese di vendita","Tracciabilita' volumi immessi per rimborso deposito"],
    questions:[
      {id:"drs_scope",text:"L'azienda immette sul mercato bottiglie di plastica monouso o lattine in metallo per bevande (fino a 3 litri)?",hint:"Questi prodotti sono soggetti a sistemi di deposito cauzionale e restituzione (DRS) obbligatori. Verificare quali Stati membri hanno gia' attivato il DRS.",ref:"Art. 44 (1) PPWR",mandatory:["manufacturer","importer","distributor"],voluntary:[]},
      {id:"drs_marking",text:"Gli imballaggi soggetti al DRS riportano il contrassegno obbligatorio (logo DRS dello Stato membro)?",hint:"Il contrassegno e' obbligatorio e deve essere presente sull'imballaggio prima dell'immissione sul mercato. Ogni Stato membro puo' avere un logo specifico.",ref:"Art. 44 (4) PPWR",mandatory:["manufacturer","importer"],voluntary:["distributor"]},
      {id:"drs_adherence",text:"L'azienda ha verificato i sistemi DRS attivi nei Paesi in cui vende prodotti soggetti a DRS e ha avviato la procedura di adesione?",hint:"I sistemi DRS variano per Paese. L'adesione richiede contratti con il gestore del sistema DRS.",ref:"Art. 44 PPWR",mandatory:["manufacturer","importer","distributor"],voluntary:[]},
      {id:"drs_traceability",text:"I sistemi informativi aziendali sono in grado di tracciare separatamente i volumi immessi per gli imballaggi soggetti a DRS?",hint:"La tracciabilita' e' necessaria per il calcolo del deposito cauzionale, la riconciliazione con i resi e la rendicontazione verso il gestore del sistema DRS.",ref:"Art. 44; Art. 56 PPWR",mandatory:["manufacturer","importer"],voluntary:["distributor"]},
    ],
  },
  {
    id:"operations",code:"G",title:"Conformita' Operativa & Governance",subtitle:"Vigilanza del mercato, contratti di filiera, sanzioni e readiness",totalAttributes:9,
    regulation:"Art. 58-62 (vigilanza mercato); Art. 63-67 (attuazione) PPWR",
    keyAttributes:["Clausole contrattuali PPWR con fornitori di imballaggi","Presidio delle scadenze normative (2026, 2030, 2040)","Piano di transizione verso imballaggi conformi","Responsabile interno PPWR designato","Procedure di ritiro dal mercato in caso di non conformita'"],
    questions:[
      {id:"ops_contracts",text:"I contratti con i fornitori di imballaggi includono clausole di conformita' PPWR (riciclabilita', assenza PFAS, sostanze pericolose, documentazione tecnica)?",hint:"Il rischio di non conformita' si origina spesso nella supply chain. Clausole contrattuali adeguate trasferiscono la responsabilita' al fornitore e garantiscono la documentazione necessaria.",ref:"Art. 5-7 PPWR",mandatory:["manufacturer","importer","distributor"],voluntary:["horeca"]},
      {id:"ops_roadmap",text:"L'azienda ha predisposto una roadmap interna con le principali scadenze PPWR e le azioni necessarie per adeguare il portfolio di imballaggi?",hint:"Scadenze chiave: 12/08/2026 (PFAS food-contact), 2030 (riciclabilita' totale, contenuto riciclato, obiettivi riutilizzo), 2040 (obiettivi piu' ambiziosi).",ref:"Art. 5 (5); Art. 6; Art. 7; Art. 22-27 PPWR",mandatory:["manufacturer","importer","distributor","horeca"],voluntary:[]},
      {id:"ops_owner",text:"E' stato designato un responsabile interno (o consulente esterno) per il presidio della conformita' PPWR?",hint:"Data la complessita' del regolamento, e' fortemente consigliabile designare un owner interno o avvalersi di supporto specializzato.",ref:"Best practice compliance",mandatory:[],voluntary:["manufacturer","importer","distributor","horeca"]},
      {id:"ops_marketwatch",text:"L'azienda ha procedure per rilevare, gestire e comunicare alle autorita' eventuali non conformita' degli imballaggi (ritiro/richiamo dal mercato)?",hint:"Le autorita' di vigilanza del mercato possono ordinare il ritiro di imballaggi non conformi. Procedure interne documentate riducono i tempi di risposta.",ref:"Art. 58-62 PPWR",mandatory:["manufacturer","importer"],voluntary:["distributor","horeca"]},
      {id:"ops_procurement",text:"L'azienda partecipa ad appalti pubblici? Ha verificato i requisiti PPWR per gli imballaggi negli appalti pubblici UE?",hint:"Il PPWR introduce criteri minimi obbligatori per gli imballaggi negli appalti pubblici (green public procurement).",ref:"Art. 62 PPWR",mandatory:[],voluntary:["manufacturer","importer","distributor"]},
    ],
  },
];

const MATURITY=["complete","partial","absent"];
const maturityConfig={complete:{label:"Conforme",points:0,color:"#059669",bg:"#d1fae5"},partial:{label:"Parziale",points:1,color:"#d97706",bg:"#fef3c7"},absent:{label:"Non gestito",points:2,color:"#dc2626",bg:"#fee2e2"}};
const tagConfig={mandatory:{label:"Obbligatorio",bg:"#dbeafe",color:"#1d4ed8"},voluntary:{label:"Raccomandato",bg:"#f0fdf4",color:"#166534"}};

function isQuestionVisible(q,profile){const{role}=profile;if(q.mandatory.includes(role))return{show:true,tag:"mandatory"};if(q.voluntary.includes(role))return{show:true,tag:"voluntary"};return{show:false};}
function getVisibleQuestions(cat,profile){return cat.questions.map((q)=>({q,...isQuestionVisible(q,profile)})).filter((x)=>x.show);}
function computeScores(answers,profile){const results={};CATEGORIES.forEach((cat)=>{const visible=getVisibleQuestions(cat,profile);let total=0,answered=0;visible.forEach(({q})=>{const val=answers[q.id];if(val){total+=maturityConfig[val].points;answered++;}});const maxPossible=visible.length*2;const pct=maxPossible>0?Math.round((1-total/maxPossible)*100):100;results[cat.id]={total,answered,maxPossible,pct,visibleCount:visible.length,label:pct>=75?"Conforme":pct>=40?"Parziale":"Critico"};});return results;}
function overallScore(scores){let sum=0,max=0;Object.values(scores).forEach((s)=>{sum+=s.total;max+=s.maxPossible;});const pct=max>0?Math.round((1-sum/max)*100):100;return{pct,label:pct>=75?"Conforme":pct>=40?"Parziale":"Critico"};}
function badgeStyle(label){if(label==="Conforme")return{background:"#d1fae5",color:"#065f46",border:"1px solid #6ee7b7"};if(label==="Parziale")return{background:"#fef3c7",color:"#78350f",border:"1px solid #fcd34d"};return{background:"#fee2e2",color:"#7f1d1d",border:"1px solid #fca5a5"};}

// ─── PDF GENERATION ──────────────────────────────────────────────────────────
function generatePDF(profile, answers, scores, overall) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210;
  const PH = 297;
  const ML = 18;
  const MR = 18;
  const CW = PW - ML - MR;
  let y = 0;

  const roleName = COMPANY_ROLES.find(r => r.id === profile.role)?.label || "";
  const materialNames = profile.materials.map(m => PACKAGING_MATERIALS.find(x => x.id === m)?.label).join(", ") || "Non specificati";
  const dateStr = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });

  const newPage = () => {
    doc.addPage();
    y = 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("PPWR Compliance Screening - Reg. (UE) 2025/40 - Documento riservato - Non sostituisce consulenza legale", ML, PH - 8);
    doc.setTextColor(0);
  };

  const checkPageBreak = (needed = 10) => {
    if (y + needed > PH - 16) newPage();
  };

  const wrapText = (text, maxWidth, fontSize) => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(String(text), maxWidth);
  };

  // ── COVER PAGE ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PW, 58, "F");
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 58, PW, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("REG. (UE) 2025/40 - PPWR", ML, 22);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("PPWR Compliance", ML, 34);
  doc.text("Screening Report", ML, 44);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Gap Analysis - Documento di autovalutazione", ML, 53);

  doc.setTextColor(0);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(ML, 70, CW, 38, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(ML, 70, CW, 38, 3, 3, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("RUOLO AZIENDALE", ML + 6, 79);
  doc.text("MATERIALI", ML + 6, 91);
  doc.text("DATA SCREENING", ML + 6, 103);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(roleName, ML + 48, 79);
  doc.text(materialNames, ML + 48, 91);
  doc.text(dateStr, ML + 48, 103);

  const scoreColor = overall.pct >= 75 ? [5,150,105] : overall.pct >= 40 ? [217,119,6] : [220,38,38];
  doc.setFillColor(...scoreColor);
  doc.roundedRect(ML, 118, CW, 32, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("LIVELLO DI CONFORMITA' STIMATO", ML + 6, 127);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text(`${overall.pct}%`, ML + 6, 141);
  doc.setFontSize(13);
  doc.text(overall.label.toUpperCase(), ML + 32, 141);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Screening preliminare basato su Reg. (UE) 2025/40. Non sostituisce consulenza legale o audit formali.", ML, PH - 14, { maxWidth: CW });

  // ── PAGE 2: SCORES SUMMARY ──
  newPage();

  doc.setFillColor(15, 23, 42);
  doc.rect(ML, y, CW, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RIEPILOGO CONFORMITA' PER AREA", ML + 4, y + 6.2);
  doc.setTextColor(0);
  y += 14;

  CATEGORIES.forEach((cat) => {
    const sc = scores[cat.id];
    if (!sc || sc.visibleCount === 0) return;
    checkPageBreak(22);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(ML, y, CW, 18, 2, 2, "FD");

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(ML + 3, y + 3, 10, 10, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(cat.code, ML + 5.8, y + 9.5);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(cat.title, ML + 17, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(cat.regulation, ML + 17, y + 12.5);

    const bColor = sc.pct >= 75 ? [5,150,105] : sc.pct >= 40 ? [217,119,6] : [220,38,38];
    doc.setFillColor(...bColor);
    doc.roundedRect(PW - MR - 30, y + 3, 28, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const badgeText = `${sc.pct}% - ${sc.label}`;
    const bw = doc.getTextWidth(badgeText);
    doc.text(badgeText, PW - MR - 30 + (28 - bw) / 2, y + 9.5);

    const barX = ML + 17;
    const barW = CW - 17 - 32;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, y + 14, barW, 2, 1, 1, "F");
    doc.setFillColor(...bColor);
    doc.roundedRect(barX, y + 14, barW * sc.pct / 100, 2, 1, 1, "F");

    y += 21;
  });

  // ── DETAILED ANSWERS ──
  newPage();

  doc.setFillColor(15, 23, 42);
  doc.rect(ML, y, CW, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RISPOSTE DETTAGLIATE PER AREA", ML + 4, y + 6.2);
  doc.setTextColor(0);
  y += 14;

  CATEGORIES.forEach((cat) => {
    const visibleQs = getVisibleQuestions(cat, profile);
    if (visibleQs.length === 0) return;

    checkPageBreak(18);

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(ML, y, CW, 12, 2, 2, "FD");
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(ML + 3, y + 2, 8, 8, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(cat.code, ML + 5.2, y + 7.2);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(cat.title, ML + 15, y + 7.2);
    y += 16;

    visibleQs.forEach(({ q, tag }, qi) => {
      const val = answers[q.id] || "absent";
      const cfg = maturityConfig[val];
      const tc = tagConfig[tag] || tagConfig.mandatory;

      const qLines = wrapText(q.text, CW - 28, 8.5);
      const refLines = wrapText("Rif.: " + q.ref, CW - 28, 7);
      const cardH = 8 + qLines.length * 4.5 + 3 + refLines.length * 3.5 + 5;

      checkPageBreak(cardH + 4);

      const answerBg = val === "complete" ? [240,253,244] : val === "partial" ? [255,251,235] : [255,245,245];
      doc.setFillColor(...answerBg);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(ML, y, CW, cardH, 2, 2, "FD");

      const accentRgb = val === "complete" ? [5,150,105] : val === "partial" ? [217,119,6] : [220,38,38];
      doc.setFillColor(...accentRgb);
      doc.roundedRect(ML, y, 3, cardH, 1, 1, "F");

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`Q${qi + 1}`, ML + 6, y + 5.5);

      const tagRgb = tag === "mandatory" ? [219,234,254] : [240,253,244];
      const tagTextRgb = tag === "mandatory" ? [29,78,216] : [22,101,52];
      doc.setFillColor(...tagRgb);
      doc.roundedRect(ML + 14, y + 2, tag === "mandatory" ? 20 : 22, 5, 1, 1, "F");
      doc.setTextColor(...tagTextRgb);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text(tc.label, ML + 15.5, y + 5.7);

      doc.setFillColor(...accentRgb);
      const badgeW = 22;
      doc.roundedRect(PW - MR - badgeW, y + 2, badgeW, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      const bw2 = doc.getTextWidth(cfg.label);
      doc.text(cfg.label, PW - MR - badgeW + (badgeW - bw2) / 2, y + 5.7);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(qLines, ML + 6, y + 11);

      const afterQ = y + 11 + qLines.length * 4.5;
      doc.setFontSize(7);
      doc.setTextColor(3, 105, 161);
      doc.setFont("helvetica", "italic");
      doc.text(refLines, ML + 6, afterQ + 2);

      y += cardH + 3;
    });

    y += 4;
  });

  // ── GAPS SUMMARY ──
  newPage();

  doc.setFillColor(220, 38, 38);
  doc.rect(ML, y, CW, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("GAP CRITICI E PARZIALI - AZIONI RICHIESTE", ML + 4, y + 6.2);
  doc.setTextColor(0);
  y += 14;

  let hasGaps = false;

  ["absent", "partial"].forEach((severity) => {
    const color = severity === "absent" ? [220,38,38] : [217,119,6];
    const label = severity === "absent" ? "GAP CRITICI - Non gestito" : "GAP PARZIALI - Da strutturare";
    const bgCard = severity === "absent" ? [255,245,245] : [255,251,235];

    const gapsOfType = [];
    CATEGORIES.forEach((cat) => {
      getVisibleQuestions(cat, profile).forEach(({ q, tag }) => {
        const val = answers[q.id] || "absent";
        if (val === severity) gapsOfType.push({ cat, q, tag });
      });
    });

    if (gapsOfType.length === 0) return;
    hasGaps = true;

    checkPageBreak(14);
    doc.setFillColor(...color);
    doc.roundedRect(ML, y, CW, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(label, ML + 4, y + 5.5);
    doc.setTextColor(0);
    y += 11;

    gapsOfType.forEach(({ cat, q, tag }) => {
      const tc = tagConfig[tag] || tagConfig.mandatory;
      const qLines = wrapText(q.text, CW - 20, 8.5);
      const hintLines = wrapText(q.hint, CW - 20, 7.5);
      const refLines = wrapText("Rif. normativo: " + q.ref, CW - 20, 7);
      const cardH = 7 + qLines.length * 4.5 + 2 + hintLines.length * 4 + 2 + refLines.length * 3.5 + 5;

      checkPageBreak(cardH + 4);

      doc.setFillColor(...bgCard);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(ML, y, CW, cardH, 2, 2, "FD");
      doc.setFillColor(...color);
      doc.roundedRect(ML, y, 3, cardH, 1, 1, "F");

      doc.setFillColor(15, 23, 42);
      doc.roundedRect(ML + 5, y + 2, 7, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(cat.code, ML + 6.5, y + 5.7);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(cat.title, ML + 15, y + 5.7);

      const tagRgb = tag === "mandatory" ? [219,234,254] : [240,253,244];
      const tagTextRgb = tag === "mandatory" ? [29,78,216] : [22,101,52];
      doc.setFillColor(...tagRgb);
      const tagX = PW - MR - (tag === "mandatory" ? 22 : 24);
      doc.roundedRect(tagX, y + 2, tag === "mandatory" ? 20 : 22, 5, 1, 1, "F");
      doc.setTextColor(...tagTextRgb);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text(tc.label, tagX + 2, y + 5.7);

      let lineY = y + 10;

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(qLines, ML + 6, lineY);
      lineY += qLines.length * 4.5 + 2;

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(hintLines, ML + 6, lineY);
      lineY += hintLines.length * 4 + 2;

      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(3, 105, 161);
      doc.text(refLines, ML + 6, lineY);

      y += cardH + 3;
    });

    y += 6;
  });

  if (!hasGaps) {
    doc.setFillColor(209, 250, 229);
    doc.setDrawColor(110, 231, 183);
    doc.roundedRect(ML, y, CW, 14, 2, 2, "FD");
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Nessun gap rilevato. Ottimo livello di presidio PPWR.", ML + 6, y + 9);
  }

  const fileName = `PPWR_Screening_${roleName}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_PROFILE={role:null,materials:[]};

export default function PPWRScreening(){
  const[phase,setPhase]=useState("intro");
  const[profile,setProfile]=useState(INITIAL_PROFILE);
  const[catIndex,setCatIndex]=useState(0);
  const[answers,setAnswers]=useState({});
  const[expandedGap,setExpandedGap]=useState(null);
  const[expandedCatGaps,setExpandedCatGaps]=useState({});
  const[pdfLoading,setPdfLoading]=useState(false);
  const profileReady=profile.role!==null;
  const scores=useMemo(()=>profileReady?computeScores(answers,profile):{},[answers,profile,profileReady]);
  const overall=useMemo(()=>overallScore(scores),[scores]);
  const currentCat=CATEGORIES[catIndex];
  const visibleQuestions=useMemo(()=>profileReady?getVisibleQuestions(currentCat,profile):[],[currentCat,profile,profileReady]);
  function setAnswer(qId,val){setAnswers((p)=>({...p,[qId]:val}));}
  function goNext(){if(catIndex<CATEGORIES.length-1){setCatIndex(catIndex+1);window.scrollTo({top:0,behavior:"smooth"});}else{setPhase("results");window.scrollTo({top:0,behavior:"smooth"});}}
  function goPrev(){if(catIndex>0){setCatIndex(catIndex-1);window.scrollTo({top:0,behavior:"smooth"});}else setPhase("onboarding");}
  function restart(){setAnswers({});setCatIndex(0);setProfile(INITIAL_PROFILE);setPhase("intro");setExpandedCatGaps({});}
  function toggleMaterial(id){setProfile((p)=>({...p,materials:p.materials.includes(id)?p.materials.filter((m)=>m!==id):[...p.materials,id]}));}

  function handleDownloadPDF(){
    setPdfLoading(true);
    try { generatePDF(profile, answers, scores, overall); }
    catch(e){ console.error(e); alert("Errore nella generazione del PDF. Riprova."); }
    finally { setPdfLoading(false); }
  }

  if(phase==="intro")return(<div style={s.root}><div style={s.container}>
    <div style={s.badge}>PPWR · Reg. (UE) 2025/40 · 22 gennaio 2025</div>
    <div className="sm:text-right"><BackToHome /></div>
    <h1 style={s.introTitle}>PPWR Compliance<br/>Screening Tool</h1>
    <p style={s.introSub}>Strumento di autovalutazione per compliance officer e team legale. Valuta l'impatto del Regolamento Europeo Imballaggi sulla tua azienda nelle 7 aree di rischio principali.</p>
    <div style={s.introGrid}>{CATEGORIES.map((cat)=>(<div key={cat.id} style={s.introCard}><div style={s.introCardCode}>{cat.code}</div><div style={s.introCardTitle}>{cat.title}</div><div style={s.introCardSub}>{cat.totalAttributes} prescrizioni</div></div>))}</div>
    <div style={s.chipRow}><span style={s.chip}>7 aree di rischio</span><span style={s.chip}>10–15 min</span><span style={{...s.chip,background:"#fee2e2",color:"#991b1b",border:"1px solid #fca5a5"}}>⚠ Scadenza urgente: 12/08/2026 (PFAS)</span></div>
    <button style={s.startBtn} onClick={()=>setPhase("onboarding")}>Configura e avvia →</button>
    <p style={s.disclaimer}>Screening preliminare basato su Reg. (UE) 2025/40. Non sostituisce consulenza legale o audit formali.</p>
  </div></div>);

  if(phase==="onboarding"){const canStart=profileReady;return(<div style={s.root}><div style={{...s.container,maxWidth:680}}>
    <button style={s.backLink} onClick={()=>setPhase("intro")}>← Torna all'inizio</button>
    <div style={s.badge}>Configurazione screening</div>
    <h2 style={s.onboardTitle}>Definisci il perimetro</h2>
    <p style={s.onboardSub}>Le risposte seguenti filtreranno le domande mostrando solo gli obblighi rilevanti per il tuo ruolo nella filiera.</p>
    <OnboardSection num="1" title="Ruolo principale dell'azienda" desc="Seleziona il ruolo che meglio descrive la posizione dell'azienda nella filiera.">
      <div style={s.optionGrid}>{COMPANY_ROLES.map((r)=>(<OptionCard key={r.id} selected={profile.role===r.id} onClick={()=>setProfile((p)=>({...p,role:r.id}))} label={r.label} desc={r.desc} accent="#0369a1"/>))}</div>
    </OnboardSection>
    <OnboardSection num="2" title="Materiali di imballaggio principali" desc="Seleziona i materiali degli imballaggi utilizzati (selezione multipla).">
      <div style={s.optionGrid}>{PACKAGING_MATERIALS.map((m)=>(<OptionCard key={m.id} selected={profile.materials.includes(m.id)} onClick={()=>toggleMaterial(m.id)} label={m.label} desc={m.desc} accent="#059669"/>))}</div>
      {profile.materials.includes("plastic")&&(<div style={s.infoBox}><strong>⚠ Plastica rilevata:</strong> Gli imballaggi in plastica sono soggetti agli obblighi più stringenti: divieto PFAS (2026), contenuto riciclato minimo (2030) e riciclabilità obbligatoria. Priorità alta.</div>)}
    </OnboardSection>
    {canStart&&(<div style={s.onboardSummary}><SummaryChip label="Ruolo" val={COMPANY_ROLES.find(r=>r.id===profile.role)?.label}/><SummaryChip label="Materiali" val={profile.materials.length>0?profile.materials.map(m=>PACKAGING_MATERIALS.find(x=>x.id===m)?.label).join(", "):"Non specificati"}/></div>)}
    <button style={{...s.startBtn,opacity:canStart?1:0.4,cursor:canStart?"pointer":"not-allowed"}} onClick={()=>canStart&&setPhase("category")} disabled={!canStart}>Avvia screening →</button>
    {!canStart&&<p style={{fontSize:12,color:"#94a3b8",marginTop:8}}>Seleziona il ruolo aziendale per procedere.</p>}
  </div></div>);}

  if(phase==="results"){
    const gapItems=[];
    CATEGORIES.forEach((cat)=>{getVisibleQuestions(cat,profile).forEach(({q,tag})=>{const val=answers[q.id];if(val==="partial"||val==="absent"||!val)gapItems.push({cat:cat.title,catCode:cat.code,catId:cat.id,q,val:val||"absent",tag});});});
    const criticalGaps=gapItems.filter((g)=>g.val==="absent");
    const partialGaps=gapItems.filter((g)=>g.val==="partial");
    const completeCount=Object.values(answers).filter((v)=>v==="complete").length;
    return(<div style={s.root}><div style={s.container}>
      <div style={s.resultsHeader}>
        <div><div style={s.badge}>Risultati screening PPWR</div><h2 style={s.resultsTitle}>Gap Analysis — PPWR Compliance</h2>
          <div style={s.chipRow}><span style={s.chip}>{COMPANY_ROLES.find(r=>r.id===profile.role)?.label}</span>{profile.materials.map(m=><span key={m} style={s.chip}>{PACKAGING_MATERIALS.find(x=>x.id===m)?.label}</span>)}</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
          <button
            style={{...s.downloadBtn,opacity:pdfLoading?0.7:1,cursor:pdfLoading?"not-allowed":"pointer"}}
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading?"Generazione…":"⬇ Scarica report PDF"}
          </button>
          <button style={s.restartBtn} onClick={restart}>← Nuovo screening</button>
        </div>
      </div>
      <div style={s.overallCard}>
        <div><div style={s.overallLabel}>Livello di conformità stimato</div><div style={{...s.overallBadge,...badgeStyle(overall.label)}}>{overall.label}</div><div style={s.overallPct}>{overall.pct}%</div><div style={s.overallSub}>degli obblighi presidiati</div></div>
        <div style={s.overallStats}><Stat num={criticalGaps.length} color="#dc2626" label="gap critici"/><Stat num={partialGaps.length} color="#d97706" label="gap parziali"/><Stat num={completeCount} color="#059669" label="aree conformi"/></div>
      </div>
      <div style={s.sectionTitle}>Conformità per area</div>
      <div style={s.catScoreGrid}>
        {CATEGORIES.map((cat)=>{
          const sc=scores[cat.id];
          if(!sc||sc.visibleCount===0)return null;
          const catGaps=gapItems.filter((g)=>g.catId===cat.id);
          const catCritical=catGaps.filter((g)=>g.val==="absent");
          const catPartial=catGaps.filter((g)=>g.val==="partial");
          const hasGaps=catGaps.length>0;
          const isOpen=expandedCatGaps[cat.id];
          return(
            <div key={cat.id} style={s.catScoreCard}>
              <div style={s.catScoreTop}>
                <span style={s.catCode2}>{cat.code}</span>
                <span style={s.catName2}>{cat.title}</span>
                <span style={{...s.catBadge,...badgeStyle(sc.label)}}>{sc.label}</span>
              </div>
              <div style={s.barOuter}>
                <div style={{...s.barInner,width:`${sc.pct}%`,background:sc.pct>=75?"#059669":sc.pct>=40?"#d97706":"#dc2626"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                <div style={s.catScorePct}>{sc.pct}% · {sc.answered}/{sc.visibleCount} domande</div>
                {hasGaps&&(
                  <button
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#0369a1",padding:0,display:"flex",alignItems:"center",gap:4}}
                    onClick={()=>setExpandedCatGaps((prev)=>({...prev,[cat.id]:!prev[cat.id]}))}
                  >
                    {catCritical.length>0&&<span style={{color:"#dc2626",fontWeight:700}}>{catCritical.length} critico{catCritical.length>1?"i":""}</span>}
                    {catCritical.length>0&&catPartial.length>0&&<span style={{color:"#94a3b8",margin:"0 2px"}}>·</span>}
                    {catPartial.length>0&&<span style={{color:"#d97706",fontWeight:700}}>{catPartial.length} parzial{catPartial.length>1?"i":"e"}</span>}
                    <span style={{color:"#94a3b8",marginLeft:4}}>{isOpen?"▲":"▼"}</span>
                  </button>
                )}
              </div>
              {isOpen&&hasGaps&&(
                <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
                  {catCritical.map((g,i)=>(
                    <GapItem key={`cc_${cat.id}_${i}`} g={g} expanded={expandedGap===`cc_${cat.id}_${i}`} onToggle={()=>setExpandedGap(expandedGap===`cc_${cat.id}_${i}`?null:`cc_${cat.id}_${i}`)} color="#dc2626" bg="#fff5f5"/>
                  ))}
                  {catPartial.map((g,i)=>(
                    <GapItem key={`cp_${cat.id}_${i}`} g={g} expanded={expandedGap===`cp_${cat.id}_${i}`} onToggle={()=>setExpandedGap(expandedGap===`cp_${cat.id}_${i}`?null:`cp_${cat.id}_${i}`)} color="#d97706" bg="#fffbeb"/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {gapItems.length===0&&<div style={s.allGood}>✓ Nessun gap rilevato. Ottimo livello di presidio PPWR.</div>}
      <p style={{...s.disclaimer,marginTop:32}}>Screening basato su Reg. (UE) 2025/40 (PPWR), GU UE del 22/01/2025. Non sostituisce consulenza legale o audit formali.</p>
    </div></div>);}

  const progress=Math.round(((catIndex+1)/CATEGORIES.length)*100);
  const catAnswered=visibleQuestions.filter(({q})=>answers[q.id]).length;
  return(<div style={s.root}><div style={s.container}>
    <div style={s.topBar}>
      <div><div style={s.badge}>PPWR Compliance Screening</div><div style={s.stepLabel}>Sezione {catIndex+1} di {CATEGORIES.length} — {currentCat.title}</div></div>
      <div style={{textAlign:"right"}}><div style={s.progressPct}>{progress}%</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{COMPANY_ROLES.find(r=>r.id===profile.role)?.label}</div></div>
    </div>
    <div style={s.progressOuter}><div style={{...s.progressInner,width:`${progress}%`}}/></div>
    <div style={s.stepTabs}>{CATEGORIES.map((cat,i)=>(<div key={cat.id} style={{...s.stepTab,...(i===catIndex?s.stepTabActive:{}),...(i<catIndex?s.stepTabDone:{})}} onClick={()=>setCatIndex(i)}>{cat.code}</div>))}</div>
    <div style={s.mainGrid}>
      <div>
        <div style={s.catHeader}><div style={s.catCodeBox}>{currentCat.code}</div><div><div style={s.catTitle}>{currentCat.title}</div><div style={s.catSubtitle}>{currentCat.subtitle}</div><div style={s.catRegRef}>{currentCat.regulation}</div></div></div>
        {visibleQuestions.length===0?(<div style={s.noQBox}><div style={{fontSize:32,marginBottom:12}}>—</div>Nessun obbligo applicabile in questa sezione per il ruolo selezionato.<br/><br/><button style={s.btnSecondary} onClick={goNext}>Avanti →</button></div>):(<>
          <div style={s.keyAttrsBox}><div style={s.keyAttrsTitle}>Prescrizioni chiave verificate</div><ul style={s.keyAttrsList}>{currentCat.keyAttributes.map((a,i)=><li key={i} style={s.keyAttrItem}>{a}</li>)}</ul></div>
          <div style={s.questionStack}>{visibleQuestions.map(({q,tag},qi)=>(<QuestionCard key={q.id} q={q} qi={qi} tag={tag} value={answers[q.id]} onChange={(v)=>setAnswer(q.id,v)}/>))}</div>
        </>)}
        <div style={s.navRow}><button style={s.btnSecondary} onClick={goPrev}>← Indietro</button><span style={{fontSize:13,color:"#94a3b8"}}>{catAnswered}/{visibleQuestions.length} domande</span><button style={s.btnPrimary} onClick={goNext}>{catIndex<CATEGORIES.length-1?"Avanti →":"Vedi risultati →"}</button></div>
      </div>
      <aside style={s.sidebar}>
        <div style={s.sideCard}>
          <div style={s.sideCardTitle}>Profilo selezionato</div>
          <div style={s.profileRow}><span style={s.profileLbl}>Ruolo</span><span style={s.profileVal}>{COMPANY_ROLES.find(r=>r.id===profile.role)?.label}</span></div>
          <div style={s.profileRow}><span style={s.profileLbl}>Materiali</span><span style={s.profileVal}>{profile.materials.length>0?profile.materials.map(m=>PACKAGING_MATERIALS.find(x=>x.id===m)?.label).join(", "):"—"}</span></div>
          <button style={{...s.btnSecondary,width:"100%",marginTop:12,fontSize:12,padding:"8px 12px"}} onClick={()=>setPhase("onboarding")}>Modifica profilo</button>
        </div>
        <div style={s.sideCard}>
          <div style={s.sideCardTitle}>Riepilogo live</div>
          {CATEGORIES.map((cat,i)=>{const sc=scores[cat.id]||{label:"Critico"};return(<div key={cat.id} style={{...s.sideRow,...(i===catIndex?s.sideRowActive:{})}} onClick={()=>setCatIndex(i)}><span style={s.sideRowCode}>{cat.code}</span><span style={s.sideRowName}>{cat.title.split(" ")[0]}</span><span style={{...s.sideBadge,...badgeStyle(sc.label)}}>{sc.label}</span></div>);})}
        </div>
        <button style={{...s.btnPrimary,width:"100%"}} onClick={()=>{setPhase("results");window.scrollTo({top:0});}}>Vedi risultati →</button>
      </aside>
    </div>
  </div></div>);
}

function OnboardSection({num,title,desc,children}){return(<div style={{marginBottom:36}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}><div style={{width:28,height:28,borderRadius:"50%",background:"#0f172a",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{num}</div><div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>{title}</div></div><p style={{fontSize:13,color:"#64748b",marginBottom:14,paddingLeft:40,marginTop:0}}>{desc}</p>{children}</div>);}
function OptionCard({selected,onClick,label,desc,accent}){return(<button onClick={onClick} style={{border:`2px solid ${selected?accent:"#e2e8f0"}`,borderRadius:10,padding:"14px 16px",background:selected?`${accent}12`:"#fff",cursor:"pointer",textAlign:"left",transition:"all 0.15s",width:"100%"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:14,fontWeight:700,color:selected?accent:"#0f172a"}}>{label}</span>{selected&&<span style={{color:accent,fontSize:16,fontWeight:700}}>✓</span>}</div><div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>{desc}</div></button>);}
function SummaryChip({label,val}){return(<div style={{display:"flex",flexDirection:"column",gap:2}}><span style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</span><span style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{val}</span></div>);}
function QuestionCard({q,qi,tag,value,onChange}){const[showHint,setShowHint]=useState(false);const tc=tagConfig[tag]||tagConfig.mandatory;return(<div style={{...s.qCard,...(value?s.qCardAnswered:{})}}><div style={s.qTop}><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={s.qNum}>Q{qi+1}</span><span style={{fontSize:10,fontWeight:700,background:tc.bg,color:tc.color,padding:"2px 8px",borderRadius:4}}>{tc.label}</span></div><span style={s.qRef}>{q.ref}</span></div><div style={s.qText}>{q.text}</div><div style={s.triRow}>{MATURITY.map((m)=>{const cfg=maturityConfig[m];const sel=value===m;return(<button key={m} onClick={()=>onChange(m)} style={{...s.triBtn,...(sel?{borderColor:cfg.color,background:cfg.bg}:{})}}><div style={{...s.triBtnLabel,...(sel?{color:cfg.color}:{})}}>{cfg.label}</div><div style={s.triBtnHint}>{m==="complete"?"Presidiato e documentato":m==="partial"?"Gestito, non sistematico":"Non ancora affrontato"}</div></button>);})}</div><div style={s.hintToggle} onClick={()=>setShowHint(!showHint)}>{showHint?"▲ Nascondi nota":"▼ Nota per il compliance officer"}</div>{showHint&&<div style={s.hintBox}>{q.hint}</div>}</div>);}
function GapItem({g,expanded,onToggle,color,bg}){const tc=tagConfig[g.tag]||tagConfig.mandatory;return(<div style={{borderLeft:`3px solid ${color}`,borderRadius:"0 8px 8px 0",padding:"12px 16px",background:bg,cursor:"pointer"}} onClick={onToggle}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}><div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1}}><span style={{fontSize:12,fontWeight:700,color,flexShrink:0,marginTop:1}}>{g.catCode}</span><div><span style={{fontSize:10,fontWeight:700,background:tc.bg,color:tc.color,padding:"1px 7px",borderRadius:4,marginRight:6}}>{tc.label}</span><span style={{fontSize:13,color:"#1e293b",lineHeight:1.5}}>{g.q.text}</span></div></div><span style={{fontSize:11,fontWeight:600,color,flexShrink:0,whiteSpace:"nowrap"}}>{g.val==="absent"?"Non gestito":"Parziale"} {expanded?"▲":"▼"}</span></div>{expanded&&(<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #e2e8f0"}}><div style={{fontSize:11,color:"#94a3b8",marginBottom:6}}>Area: {g.cat}</div><div style={{fontSize:12,color:"#475569",lineHeight:1.6,marginBottom:6}}><strong>Nota compliance:</strong> {g.q.hint}</div><div style={{fontSize:11,color:"#0369a1"}}><strong>Rif. normativo:</strong> {g.q.ref}</div></div>)}</div>);}
function Stat({num,color,label}){return(<div style={{display:"flex",alignItems:"baseline",gap:8}}><span style={{fontSize:28,fontWeight:800,color}}>{num}</span><span style={{fontSize:13,color:"#64748b"}}>{label}</span></div>);}

const s={
  root:{minHeight:"100vh",background:"#f8fafc",fontFamily:"'DM Sans','Helvetica Neue',sans-serif",color:"#0f172a"},
  container:{maxWidth:960,margin:"0 auto",padding:"40px 24px 80px"},
  badge:{display:"inline-block",background:"#dcfce7",color:"#166534",border:"1px solid #86efac",borderRadius:6,fontSize:11,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",padding:"3px 10px",marginBottom:16},
  introTitle:{fontSize:40,fontWeight:700,lineHeight:1.15,letterSpacing:"-0.02em",marginBottom:16},
  introSub:{fontSize:15,color:"#475569",lineHeight:1.7,maxWidth:600,marginBottom:36},
  introGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10,marginBottom:28},
  introCard:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 16px"},
  introCardCode:{width:26,height:26,background:"#0f172a",color:"#fff",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,marginBottom:8},
  introCardTitle:{fontSize:12,fontWeight:600,marginBottom:3},
  introCardSub:{fontSize:11,color:"#94a3b8"},
  chipRow:{display:"flex",gap:8,marginBottom:28,flexWrap:"wrap"},
  chip:{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:20,fontSize:12,color:"#475569",padding:"4px 12px"},
  startBtn:{background:"#0f172a",color:"#fff",border:"none",borderRadius:8,padding:"14px 32px",fontSize:15,fontWeight:600,cursor:"pointer",marginBottom:20,display:"block"},
  disclaimer:{fontSize:12,color:"#94a3b8",lineHeight:1.6},
  backLink:{background:"none",border:"none",color:"#64748b",fontSize:13,cursor:"pointer",padding:0,marginBottom:20,display:"block"},
  onboardTitle:{fontSize:28,fontWeight:700,marginBottom:8},
  onboardSub:{fontSize:14,color:"#475569",lineHeight:1.6,marginBottom:32},
  optionGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10},
  infoBox:{marginTop:12,background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#78350f",lineHeight:1.6},
  onboardSummary:{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"16px 24px",marginBottom:24,display:"flex",gap:40,flexWrap:"wrap"},
  topBar:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12},
  stepLabel:{fontSize:15,fontWeight:600,marginTop:8},
  progressPct:{fontSize:22,fontWeight:700},
  progressOuter:{height:4,background:"#e2e8f0",borderRadius:2,marginBottom:20},
  progressInner:{height:4,background:"#0f172a",borderRadius:2,transition:"width 0.3s"},
  stepTabs:{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"},
  stepTab:{width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,background:"#f1f5f9",color:"#94a3b8",border:"1px solid #e2e8f0",cursor:"pointer"},
  stepTabActive:{background:"#0f172a",color:"#fff",borderColor:"#0f172a"},
  stepTabDone:{background:"#dcfce7",color:"#166534",borderColor:"#bbf7d0"},
  mainGrid:{display:"grid",gridTemplateColumns:"1fr 260px",gap:24,alignItems:"start"},
  catHeader:{display:"flex",gap:14,alignItems:"flex-start",marginBottom:16},
  catCodeBox:{width:44,height:44,background:"#0f172a",color:"#fff",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,flexShrink:0},
  catTitle:{fontSize:18,fontWeight:700},
  catSubtitle:{fontSize:13,color:"#64748b",marginTop:2},
  catRegRef:{fontSize:11,color:"#94a3b8",marginTop:4},
  keyAttrsBox:{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"12px 16px",marginBottom:20},
  keyAttrsTitle:{fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8},
  keyAttrsList:{margin:0,paddingLeft:18},
  keyAttrItem:{fontSize:12,color:"#475569",marginBottom:3},
  noQBox:{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"40px 24px",textAlign:"center",color:"#64748b",fontSize:14,lineHeight:1.6},
  questionStack:{display:"flex",flexDirection:"column",gap:16,marginBottom:24},
  qCard:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"18px 20px"},
  qCardAnswered:{borderColor:"#cbd5e1"},
  qTop:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6},
  qNum:{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em"},
  qRef:{fontSize:10,color:"#94a3b8",background:"#f1f5f9",padding:"2px 8px",borderRadius:4},
  qText:{fontSize:14,fontWeight:500,lineHeight:1.5,marginBottom:14},
  triRow:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12},
  triBtn:{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 12px",background:"#fff",cursor:"pointer",textAlign:"left",transition:"all 0.15s"},
  triBtnLabel:{fontSize:13,fontWeight:600,color:"#0f172a",marginBottom:3},
  triBtnHint:{fontSize:11,color:"#94a3b8",lineHeight:1.4},
  hintToggle:{fontSize:12,color:"#0369a1",cursor:"pointer",userSelect:"none"},
  hintBox:{marginTop:10,background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,padding:"10px 14px",fontSize:12,color:"#0c4a6e",lineHeight:1.6},
  navRow:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8},
  btnPrimary:{background:"#0f172a",color:"#fff",border:"none",borderRadius:7,padding:"11px 22px",fontSize:14,fontWeight:600,cursor:"pointer"},
  btnSecondary:{background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:7,padding:"11px 22px",fontSize:14,fontWeight:500,cursor:"pointer"},
  downloadBtn:{background:"#059669",color:"#fff",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6},
  sidebar:{display:"flex",flexDirection:"column",gap:16},
  sideCard:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"16px"},
  sideCardTitle:{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12},
  profileRow:{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f1f5f9"},
  profileLbl:{fontSize:11,color:"#94a3b8"},
  profileVal:{fontSize:12,fontWeight:600},
  sideRow:{display:"flex",alignItems:"center",gap:8,padding:"5px 6px",borderRadius:6,marginBottom:2,cursor:"pointer"},
  sideRowActive:{background:"#f1f5f9"},
  sideRowCode:{fontSize:11,fontWeight:700,color:"#94a3b8",width:14},
  sideRowName:{fontSize:12,color:"#475569",flex:1},
  sideBadge:{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:4,whiteSpace:"nowrap"},
  barOuter:{height:4,background:"#e2e8f0",borderRadius:2,marginTop:8},
  barInner:{height:4,borderRadius:2,transition:"width 0.4s"},
  resultsHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28},
  resultsTitle:{fontSize:28,fontWeight:700,marginTop:8,marginBottom:8},
  restartBtn:{background:"#fff",color:"#475569",border:"1px solid #e2e8f0",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:500,cursor:"pointer"},
  overallCard:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"28px 32px",display:"flex",gap:48,alignItems:"center",marginBottom:32,flexWrap:"wrap"},
  overallLabel:{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8},
  overallBadge:{display:"inline-flex",alignItems:"center",fontSize:14,fontWeight:700,padding:"6px 14px",borderRadius:8,marginBottom:8},
  overallPct:{fontSize:36,fontWeight:800},
  overallSub:{fontSize:13,color:"#64748b"},
  overallStats:{display:"flex",flexDirection:"column",gap:14},
  sectionTitle:{fontSize:15,fontWeight:700,margin:"28px 0 14px",display:"flex",alignItems:"center",gap:8},
  catScoreGrid:{display:"flex",flexDirection:"column",gap:10,marginBottom:8},
  catScoreCard:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:9,padding:"14px 18px"},
  catScoreTop:{display:"flex",alignItems:"center",gap:10,marginBottom:8},
  catCode2:{fontSize:12,fontWeight:700,color:"#94a3b8",width:16},
  catName2:{flex:1,fontSize:14,fontWeight:500},
  catBadge:{fontSize:11,fontWeight:600,padding:"2px 9px",borderRadius:5},
  catScorePct:{fontSize:11,color:"#94a3b8",marginTop:0},
  gapList:{display:"flex",flexDirection:"column",gap:8,marginBottom:8},
  allGood:{background:"#d1fae5",border:"1px solid #6ee7b7",borderRadius:8,padding:"16px 20px",fontSize:14,color:"#065f46",fontWeight:500},
};