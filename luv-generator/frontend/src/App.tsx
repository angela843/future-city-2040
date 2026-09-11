import { useEffect, useState } from "react";
import { TestBanner } from "./components/TestBanner.js";
import { StepNav } from "./components/StepNav.js";
import { Step1BaseData } from "./components/steps/Step1BaseData.js";
import { Step2StartingSituation } from "./components/steps/Step2StartingSituation.js";
import { Step3Competences } from "./components/steps/Step3Competences.js";
import { Step4Career } from "./components/steps/Step4Career.js";
import { Step5Further } from "./components/steps/Step5Further.js";
import { Step6SupportNeeds } from "./components/steps/Step6SupportNeeds.js";
import { Step7Preview } from "./components/steps/Step7Preview.js";
import { api } from "./api/client.js";
import { CaseRecord } from "./types.js";

interface DemoInfo {
  key: string;
  label: string;
}

export default function App() {
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [step, setStep] = useState(1);
  const [demos, setDemos] = useState<DemoInfo[]>([]);

  useEffect(() => {
    api.get<DemoInfo[]>("/api/demo").then(setDemos).catch(() => setDemos([]));
  }, []);

  async function loadDemo(key: string) {
    const loaded = await api.post<CaseRecord>(`/api/demo/${key}/load`, {});
    setRecord(loaded);
    setStep(1);
  }

  function goto(next: number) {
    setStep(Math.min(7, Math.max(1, next)));
  }

  return (
    <div className="app-shell">
      <TestBanner />
      <header className="app-header">
        <h1>LUV-Generator – BvB 1/2/3 (Version 0.2)</h1>
        <p className="muted">
          Unterstützungswerkzeug für Start-, Verlaufs- und Abschluss-LUV. Keine Teilnehmerverwaltung, keine digitale
          Teilnehmerakte.
        </p>
      </header>

      {record && <StepNav current={step} onSelect={goto} />}

      {step === 1 && (
        <Step1BaseData
          record={record}
          demos={demos}
          onCreated={(r) => setRecord(r)}
          onUpdated={(r) => setRecord(r)}
          onLoadDemo={loadDemo}
          onNext={() => goto(2)}
        />
      )}
      {step === 2 && record && (
        <Step2StartingSituation record={record} onUpdated={setRecord} onNext={() => goto(3)} onBack={() => goto(1)} />
      )}
      {step === 3 && record && (
        <Step3Competences record={record} onUpdated={setRecord} onNext={() => goto(4)} onBack={() => goto(2)} />
      )}
      {step === 4 && record && (
        <Step4Career record={record} onUpdated={setRecord} onNext={() => goto(5)} onBack={() => goto(3)} />
      )}
      {step === 5 && record && (
        <Step5Further record={record} onUpdated={setRecord} onNext={() => goto(6)} onBack={() => goto(4)} />
      )}
      {step === 6 && record && (
        <Step6SupportNeeds record={record} onUpdated={setRecord} onNext={() => goto(7)} onBack={() => goto(5)} />
      )}
      {step === 7 && record && <Step7Preview record={record} onUpdated={setRecord} onBack={() => goto(6)} />}
    </div>
  );
}
