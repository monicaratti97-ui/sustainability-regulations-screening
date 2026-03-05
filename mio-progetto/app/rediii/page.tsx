"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackToHome from "../components/BackToHome";

/** Types */
type Maturity = "complete" | "partial" | "absent";

type Answers = {
  plantStatus: "operativo" | "sviluppo" | "revamping" | "altro";
  objective: string[];
  wantsGO: "si" | "no" | "non_so";
  feedstockDemonstrable: Maturity;
  feedstockTraceability: Maturity;
  hasLCA: Maturity;
  ghgThresholdConfirmed: "yes" | "unknown" | "no";
  certificationStatus: Maturity;
  massBalance: Maturity;
  methaneMonitoring: Maturity;
  confidence: "high" | "medium" | "low";
};

const STORAGE_KEY_LAST = "lastAssessment";

const initial: Answers = {
  plantStatus: "operativo",
  objective: [],
  wantsGO: "no",
  feedstockDemonstrable: "absent",
  feedstockTraceability: "absent",
  hasLCA: "absent",
  ghgThresholdConfirmed: "unknown",
  certificationStatus: "absent",
  massBalance: "absent",
  methaneMonitoring: "absent",
  confidence: "medium",
};

const articleMap = {
  plantStatus: "Contesto impianto (informativo)",
  objective: "Art. 29 (applicabilità requisiti) / Art. 19 (GO)",
  wantsGO: "Art. 19 (Garanzie di Origine)",
  feedstockDemonstrable: "Art. 29 (criteri di sostenibilità)",
  feedstockTraceability: "Art. 31-bis (tracciabilità, banca dati UE)",
  hasLCA: "Art. 29 (riduzione GHG, life-cycle)",
  ghgThresholdConfirmed: "Art. 29 (soglie minime GHG)",
  certificationStatus: "Art. 30 (verifica e certificazione)",
  massBalance: "Art. 31-bis (tracciabilità / mass balance)",
  methaneMonitoring: "Art. 29 (emissioni fuggitive / monitoraggio)",
  confidence: "Metodologia tool (affidabilità input)",
} as const;

/** Sezioni del questionario — usate nell'intro */
const SECTIONS = [
  { code: "A", title: "Profilo e obiettivo",        subtitle: "Contesto e finalità",              questions: 3 },
  { code: "B", title: "Feedstock",                  subtitle: "Sostenibilità e tracciabilità",     questions: 2 },
  { code: "C", title: "GHG / LCA",                  subtitle: "Calcolo soglie e life-cycle",       questions: 2 },
  { code: "D", title: "Certificazione",              subtitle: "Schema volontario e audit",         questions: 1 },
  { code: "E", title: "Tracciabilità e controllo",   subtitle: "Mass balance e metano",             questions: 2 },
  { code: "F", title: "Affidabilità e revisione",    subtitle: "Confidence e riepilogo",            questions: 1 },
];

function maturityToPoints(m: Maturity) {
  if (m === "complete") return 0;
  if (m === "partial") return 1;
  return 2;
}

function computeImpactNormative(a: Answers): "Basso" | "Medio" | "Alto" {
  if (a.objective.includes("incentives") || a.wantsGO === "si" || a.objective.includes("clienti")) return "Alto";
  if (a.objective.includes("vendita")) return "Medio";
  return "Basso";
}

function computeMaturity(a: Answers) {
  const sum =
    maturityToPoints(a.feedstockDemonstrable) +
    maturityToPoints(a.feedstockTraceability) +
    maturityToPoints(a.hasLCA) +
    maturityToPoints(a.certificationStatus) +
    maturityToPoints(a.massBalance) +
    maturityToPoints(a.methaneMonitoring);
  const label = sum <= 3 ? "Buona" : sum <= 7 ? "Intermedia" : "Critica";
  return { sum, label };
}

function riskBadgeClass(value: string) {
  if (value === "Alto" || value === "Critica") return "bg-red-50 text-red-700 border-red-200";
  if (value === "Medio" || value === "Intermedia") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function maturityLabel(m: Maturity) {
  if (m === "complete") return "Completo";
  if (m === "partial") return "Parziale";
  return "Assente";
}

type StepId = "A" | "B" | "C" | "D" | "E" | "F";
const steps: { id: StepId; title: string; subtitle: string }[] = [
  { id: "A", title: "Profilo e obiettivo",         subtitle: "Contesto e finalità (impatto normativo)" },
  { id: "B", title: "Feedstock",                   subtitle: "Sostenibilità e tracciabilità origine" },
  { id: "C", title: "GHG / LCA",                   subtitle: "Calcolo e confidenza sulle soglie" },
  { id: "D", title: "Certificazione",               subtitle: "Schema volontario e audit" },
  { id: "E", title: "Tracciabilità e controllo",    subtitle: "Mass balance e monitoraggio metano" },
  { id: "F", title: "Affidabilità e revisione",     subtitle: "Confidence + riepilogo prima del risultato" },
];

type Phase = "intro" | "screening";

export default function ScreeningPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState<StepId>("A");
  const [answers, setAnswers] = useState<Answers>(initial);

  const impact = useMemo(() => computeImpactNormative(answers), [answers]);
  const maturity = useMemo(() => computeMaturity(answers), [answers]);

  const progress = useMemo(() => {
    const idx = steps.findIndex((s) => s.id === step);
    return Math.round(((Math.max(idx, 0) + 1) / steps.length) * 100);
  }, [step]);

  function setField<K extends keyof Answers>(k: K, v: Answers[K]) {
    setAnswers((p) => ({ ...p, [k]: v }));
  }

  function toggleObjective(value: string) {
    setAnswers((p) => {
      const set = new Set(p.objective);
      if (set.has(value)) set.delete(value); else set.add(value);
      return { ...p, objective: Array.from(set) };
    });
  }

  function goNext() {
    const idx = steps.findIndex((s) => s.id === step);
    if (idx < 0) return setStep("A");
    if (idx === steps.length - 1) return;
    setStep(steps[idx + 1].id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    const idx = steps.findIndex((s) => s.id === step);
    if (idx <= 0) return;
    setStep(steps[idx - 1].id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveAsLastAndGoResult() {
    try { localStorage.setItem(STORAGE_KEY_LAST, JSON.stringify(answers)); } catch {}
    router.push(`/result?data=${encodeURIComponent(JSON.stringify(answers))}`);
  }

  const stepMeta = steps.find((s) => s.id === step) ?? steps[0];

  /* ─── INTRO ─── */
  if (phase === "intro") return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div className="mx-auto max-w-[960px] px-6 py-10">

        <div className="inline-block rounded bg-[#dcfce7] border border-[#86efac] px-[10px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#166534] mb-4">
          RED III · Direttiva (UE) 2023/2413
        </div>

        <div className="flex items-start justify-between gap-4 mb-2 ">
          <h1 className="text-[36px] font-bold tracking-tight leading-[1.15] ">
            RED III Compliance<br />Screening Tool
          </h1>
          <div className="shrink-0 pt-1">
            <BackToHome />
          </div>
        </div>

        <p className="text-[15px] text-slate-500 leading-relaxed max-w-[580px] mb-8">
          Strumento di autovalutazione per compliance officer e team legale. Valuta l'impatto normativo e la maturità alla compliance di un'azienda produttrice di biometano rispetto alla Direttiva RED III nelle 6 aree principali.
        </p>

        {/* Griglia sezioni — identica a PPWR */}
        <div className="grid gap-2.5 mb-7" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
          {SECTIONS.map((sec) => (
            <div key={sec.code} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="w-[26px] h-[26px] bg-slate-900 text-white rounded-md flex items-center justify-center text-[11px] font-bold mb-2">
                {sec.code}
              </div>
              <div className="text-[12px] font-semibold text-slate-900 mb-1">{sec.title}</div>
              <div className="text-[11px] text-slate-400">{sec.subtitle}</div>
              <div className="text-[11px] text-slate-400 mt-1">{sec.questions} domande</div>
            </div>
          ))}
        </div>

        {/* Chip info */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="bg-slate-100 border border-slate-200 rounded-full text-[12px] text-slate-500 px-3 py-1">6 aree di rischio</span>
          <span className="bg-slate-100 border border-slate-200 rounded-full text-[12px] text-slate-500 px-3 py-1">11 domande · 10–15 min</span>
          <span className="bg-slate-100 border border-slate-200 rounded-full text-[12px] text-slate-500 px-3 py-1">Biometano e gas rinnovabili</span>
          <span className="bg-[#fee2e2] border border-[#fca5a5] rounded-full text-[12px] text-[#991b1b] px-3 py-1 font-medium">
            ⚠ Soglie GHG obbligatorie dal 2026
          </span>
        </div>

        <button
          onClick={() => { setPhase("screening"); window.scrollTo({ top: 0 }); }}
          className="bg-slate-900 text-white rounded-lg px-8 py-3.5 text-[15px] font-semibold hover:bg-slate-800 transition-colors block mb-5"
        >
          Avvia screening →
        </button>

        <p className="text-[12px] text-slate-400 leading-relaxed max-w-[520px]">
          Screening preliminare basato su Direttiva (UE) 2023/2413 (RED III). Non sostituisce audit, certificazioni o consulenza legale.
        </p>
      </div>
    </div>
  );

  /* ─── SCREENING ─── */
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div className="mx-auto max-w-[960px] px-6 py-10">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <div className="inline-block rounded bg-[#dcfce7] border border-[#86efac] px-[10px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#166534] mb-3">
              RED III · Direttiva (UE) 2023/2413
            </div>
            <h1 className="text-[28px] font-bold tracking-tight leading-[1.15]">RED III – Pre-assessment</h1>
            <p className="mt-2 text-[14px] text-slate-500 leading-relaxed max-w-[520px]">
              Questionario per verificare l'impatto normativo e la maturità alla compliance di un'azienda produttrice di biometano.
            </p>
          </div>
          <div className="sm:text-right shrink-0 flex flex-col gap-2 items-end">
            <BackToHome />
            <button onClick={() => setPhase("intro")} className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">
              ← Torna all'intro
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[13px] mb-2">
            <span className="font-semibold text-slate-900">{stepMeta.title}</span>
            <span className="font-bold text-[18px] text-slate-900">{progress}%</span>
          </div>
          <div className="h-1 w-full rounded bg-slate-200">
            <div className="h-1 rounded bg-slate-900 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 text-[13px] text-slate-400">{stepMeta.subtitle}</div>
        </div>

        {/* Step tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {steps.map((s, i) => {
            const idx = steps.findIndex((x) => x.id === step);
            const isDone = i < idx;
            const isActive = s.id === step;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={[
                  "w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold border transition-colors",
                  isActive  ? "bg-slate-900 text-white border-slate-900"
                  : isDone  ? "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]"
                            : "bg-slate-100 text-slate-400 border-slate-200",
                ].join(" ")}
              >
                {s.id}
              </button>
            );
          })}
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Main wizard */}
          <div className="lg:col-span-2 space-y-3">

            {step === "A" && (
              <div className="space-y-3">
                <Card title="Q1 — Situazione impianto" article={articleMap.plantStatus}>
                  <Select value={answers.plantStatus} onChange={(v) => setField("plantStatus", v as Answers["plantStatus"])} options={[{ value: "operativo", label: "Operativo" }, { value: "sviluppo", label: "In sviluppo" }, { value: "revamping", label: "In revamping" }, { value: "altro", label: "Altro" }]} />
                </Card>
                <Card title="Q2 — Obiettivo principale (seleziona uno o più)" article={articleMap.objective}>
                  <CheckboxRow checked={answers.objective.includes("incentives")} onToggle={() => toggleObjective("incentives")} label="Accesso a incentivi pubblici" />
                  <CheckboxRow checked={answers.objective.includes("vendita")} onToggle={() => toggleObjective("vendita")} label="Vendita come biometano rinnovabile (mercato/contratti)" />
                  <CheckboxRow checked={answers.objective.includes("clienti")} onToggle={() => toggleObjective("clienti")} label="Clienti industriali / trasporti" />
                  <Hint>Se selezioni incentivi, GO o clienti industriali/trasporti, l'impatto normativo tende a essere più alto.</Hint>
                </Card>
                <Card title="Q3 — Prevedi di emettere o valorizzare GO?" article={articleMap.wantsGO}>
                  <RadioGroup name="wantsGO" value={answers.wantsGO} options={[{ value: "si", label: "Sì" }, { value: "no", label: "No" }, { value: "non_so", label: "Non so" }]} onChange={(v) => setField("wantsGO", v as Answers["wantsGO"])} />
                </Card>
              </div>
            )}

            {step === "B" && (
              <div className="space-y-3">
                <Card title="Q4 — Feedstock dimostrabile e sostenibile" article={articleMap.feedstockDemonstrable}>
                  <TriChoice name="feedstockDemonstrable" value={answers.feedstockDemonstrable} onChange={(v) => setField("feedstockDemonstrable", v)} />
                  <Evidence items={["Contratti fornitori e specifiche del feedstock", "Registri di conferimento/ritiro e lotti", "Dichiarazioni e evidenze su sostenibilità (quando applicabile)"]} />
                </Card>
                <Card title="Q5 — Tracciabilità dell'origine del feedstock" article={articleMap.feedstockTraceability}>
                  <TriChoice name="feedstockTraceability" value={answers.feedstockTraceability} onChange={(v) => setField("feedstockTraceability", v)} />
                  <Evidence items={["Registro lotti con provenienza", "Geolocalizzazione/identificazione origine", "Policy e controlli interni"]} />
                </Card>
              </div>
            )}

            {step === "C" && (
              <div className="space-y-3">
                <Card title="Q6 — Calcolo emissioni GHG / LCA del biometano" article={articleMap.hasLCA}>
                  <TriChoice name="hasLCA" value={answers.hasLCA} onChange={(v) => setField("hasLCA", v)} />
                  <Evidence items={["Dati consumi energia e ausiliari", "Dati trasporti feedstock/digestato", "Assunzioni e metodo LCA (preliminare o completo)"]} />
                </Card>
                <Card title="Q7 — Soglie GHG: sei ragionevolmente sicuro della conformità?" article={articleMap.ghgThresholdConfirmed}>
                  <RadioGroup name="ghgThresholdConfirmed" value={answers.ghgThresholdConfirmed} options={[{ value: "yes", label: "Sì" }, { value: "unknown", label: "Non ancora verificato" }, { value: "no", label: "No / non valutato" }]} onChange={(v) => setField("ghgThresholdConfirmed", v as Answers["ghgThresholdConfirmed"])} />
                  <Hint>Se non verificato, la roadmap suggerirà di completare LCA e includere dati (anche emissioni fuggitive).</Hint>
                </Card>
              </div>
            )}

            {step === "D" && (
              <div className="space-y-3">
                <Card title="Q8 — Stato certificazione / schema volontario" article={articleMap.certificationStatus}>
                  <TriChoice name="certificationStatus" value={answers.certificationStatus} onChange={(v) => setField("certificationStatus", v)} />
                  <Evidence items={["Schema scelto (es. ISCC / REDcert / 2BSvs / altri)", "Piano audit e gap analysis", "Evidenze e procedure interne"]} />
                </Card>
              </div>
            )}

            {step === "E" && (
              <div className="space-y-3">
                <Card title="Q9 — Sistema tracciabilità / mass balance" article={articleMap.massBalance}>
                  <TriChoice name="massBalance" value={answers.massBalance} onChange={(v) => setField("massBalance", v)} />
                  <Evidence items={["Registro movimentazioni e bilanci", "Controlli e riconciliazioni", "Audit trail (chi fa cosa, quando)"]} />
                </Card>
                <Card title="Q10 — Monitoraggio perdite metano (emissioni fuggitive)" article={articleMap.methaneMonitoring}>
                  <TriChoice name="methaneMonitoring" value={answers.methaneMonitoring} onChange={(v) => setField("methaneMonitoring", v)} />
                  <Evidence items={["Piano LDAR / campagne misure", "Sensori o ispezioni periodiche", "Report e integrazione nel calcolo GHG"]} />
                </Card>
              </div>
            )}

            {step === "F" && (
              <div className="space-y-3">
                <Card title="Q11 — Quanto sei sicuro delle risposte fornite?" article={articleMap.confidence}>
                  <RadioGroup name="confidence" value={answers.confidence} options={[{ value: "high", label: "Alta (documenti disponibili)" }, { value: "medium", label: "Media" }, { value: "low", label: "Bassa" }]} onChange={(v) => setField("confidence", v as Answers["confidence"])} />
                  <Hint>Se "bassa", il tool tenderà a essere più prudente nella valutazione del rischio.</Hint>
                </Card>
                <Card title="Revisione rapida" article="—">
                  <ul className="text-[13px] text-slate-600 space-y-2">
                    <li className="flex justify-between items-center">
                      <span>Impatto normativo</span>
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${riskBadgeClass(impact)}`}>{impact}</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Maturità</span>
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${riskBadgeClass(maturity.label)}`}>{maturity.label} (score {maturity.sum})</span>
                    </li>
                    <li className="text-[12px] text-slate-400 pt-1">Se ti sembra incoerente, torna indietro e rivedi le risposte.</li>
                  </ul>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={goPrev} disabled={step === "A"} className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                ← Indietro
              </button>
              <span className="text-[13px] text-slate-400">{steps.findIndex((s) => s.id === step) + 1} / {steps.length}</span>
              {step !== "F" ? (
                <button onClick={goNext} className="rounded-lg bg-slate-900 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-slate-800 transition-colors">Avanti →</button>
              ) : (
                <button onClick={saveAsLastAndGoResult} className="rounded-lg bg-slate-900 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-slate-800 transition-colors">Calcola risultato →</button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400 mb-3">Riepilogo live</div>
                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center justify-between gap-3 py-1 border-b border-slate-50">
                    <span className="text-slate-500">Impatto normativo</span>
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold ${riskBadgeClass(impact)}`}>{impact}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-1 border-b border-slate-50">
                    <span className="text-slate-500">Maturità compliance</span>
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold ${riskBadgeClass(maturity.label)}`}>{maturity.label}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="text-slate-500">Score</span>
                    <span className="font-bold text-slate-900">{maturity.sum}</span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[12px] text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700">Priorità tipiche: </span>
                  LCA, Mass balance, Certificazione.
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-2">
                <button onClick={saveAsLastAndGoResult} className="rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-slate-800 transition-colors w-full">Calcola risultato →</button>
                <Link href="/manuale" className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Vedi metodologia</Link>
                <Link href="/guida" className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Guida normativa</Link>
              </div>
            </div>
          </aside>
        </div>

        <p className="mt-8 text-[12px] text-slate-400 leading-relaxed">
          Screening preliminare basato su Direttiva (UE) 2023/2413 (RED III). Non sostituisce audit, certificazioni o consulenza legale.
        </p>
      </div>
    </main>
  );
}

/** UI atoms */
function Card({ title, article, children }: { title: string; article: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h2 className="text-[14px] font-bold text-slate-900 leading-snug">{title}</h2>
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 shrink-0">{article}</span>
      </div>
      {children}
    </section>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">{children}</p>;
}

function Evidence({ items }: { items: string[] }) {
  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500 mb-2">Evidenze utili (esempi)</div>
      <ul className="list-disc pl-4 text-[12px] text-slate-500 space-y-1 leading-relaxed">
        {items.map((x) => <li key={x}>{x}</li>)}
      </ul>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function CheckboxRow({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <label className="flex items-start gap-3 py-1.5 text-[13px] text-slate-700 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900" />
      <span>{label}</span>
    </label>
  );
}

function RadioGroup({ name, value, options, onChange }: { name: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <label key={o.value} className="flex items-start gap-3 text-[13px] text-slate-700 cursor-pointer">
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-0.5 h-4 w-4 border-slate-300 accent-slate-900" />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function TriChoice({ name, value, onChange }: { name: string; value: Maturity; onChange: (v: Maturity) => void }) {
  const options: { value: Maturity; label: string; hint: string }[] = [
    { value: "complete", label: "Completo", hint: "Evidenze pronte / processo strutturato" },
    { value: "partial",  label: "Parziale",  hint: "Alcuni elementi presenti, non sistematici" },
    { value: "absent",   label: "Assente",   hint: "Non disponibile o non dimostrabile" },
  ];
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={["rounded-lg border p-3 text-left text-[13px] transition-colors", value === o.value ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}>
          <div className="font-semibold text-slate-900">{o.label}</div>
          <div className="mt-1 text-[11px] text-slate-400 leading-relaxed">{o.hint}</div>
        </button>
      ))}
    </div>
  );
}