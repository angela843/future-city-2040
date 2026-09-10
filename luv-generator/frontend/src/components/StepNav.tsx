const STEPS = [
  "Grunddaten",
  "Ausgangslage",
  "Kompetenzen",
  "Beruf & Praxis",
  "Weitere Erkenntnisse",
  "Förderbedarf & Ziele",
  "LUV-Vorschau"
];

export function StepNav({ current, onSelect }: { current: number; onSelect: (step: number) => void }) {
  return (
    <nav className="step-nav">
      {STEPS.map((label, idx) => {
        const step = idx + 1;
        const cls = ["step-pill", step === current ? "active" : "", step < current ? "done" : ""].join(" ").trim();
        return (
          <button key={step} type="button" className={cls} onClick={() => onSelect(step)}>
            {step}. {label}
          </button>
        );
      })}
    </nav>
  );
}
