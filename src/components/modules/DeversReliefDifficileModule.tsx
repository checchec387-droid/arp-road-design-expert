import React from 'react';
import { calculateDeversReliefDifficile } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Mountain, CheckCircle2, AlertTriangle, ShieldAlert, Snowflake, Info } from 'lucide-react';

interface Props {
  data: {
    radiusR: number;
    longitudinalSlopeP: number;
    hasSnowOrFrost: boolean;
    userReducedDevers?: number;
  };
  onChange: (d: {
    radiusR: number;
    longitudinalSlopeP: number;
    hasSnowOrFrost: boolean;
    userReducedDevers?: number;
  }) => void;
}

export const DeversReliefDifficileModule: React.FC<Props> = ({
  data,
  onChange
}) => {
  const result = calculateDeversReliefDifficile(data);

  const handleRadiusChange = (valStr: string) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onChange({ ...data, radiusR: val });
    }
  };

  const handleSlopeChange = (valStr: string) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val)) {
      onChange({ ...data, longitudinalSlopeP: val });
    }
  };

  const handleReducedDeversChange = (valStr: string) => {
    if (valStr.trim() === '') {
      onChange({ ...data, userReducedDevers: undefined });
      return;
    }
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val)) {
      onChange({ ...data, userReducedDevers: val });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 mb-1">
            <span>Guide ARP 2022 · Chapitre 6 §2.4 & §3.2 (p.91-92)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mountain className="w-5 h-5 text-emerald-800" />
            <span>Dévers — Routes en Relief Difficile ou Site Contraint</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestion des adaptations de dévers, réductions justifiées et vérification de la pente résultante cumulée (&le; 10%).
          </p>
        </div>
      </div>

      {/* Inputs Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Données d'Entrée & Hypothèses de Contraintes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Radius R */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Rayon en plan R (m)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-800">
                {data.radiusR} m
              </span>
            </div>
            <input
              type="number"
              step="5"
              min="20"
              max="1500"
              value={data.radiusR}
              onChange={(e) => handleRadiusChange(e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700 mb-2"
            />
            <input
              type="range"
              min="30"
              max="500"
              step="5"
              value={data.radiusR}
              onChange={(e) => handleRadiusChange(e.target.value)}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          {/* Longitudinal slope */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Déclivité profil en long |p| (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="15"
              value={data.longitudinalSlopeP}
              onChange={(e) => handleSlopeChange(e.target.value)}
              placeholder="Ex: 4.0"
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Pente longitudinale en valeur absolue (rampe ou descente).
            </p>
          </div>

          {/* User proposed reduced devers */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Dévers réduit proposé (%) <span className="text-slate-400 font-normal">(Optionnel)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="2.5"
              max="7.0"
              value={data.userReducedDevers ?? ''}
              onChange={(e) => handleReducedDeversChange(e.target.value)}
              placeholder={`Par défaut: ${result.baseDevers.toFixed(2)}%`}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Laisser vide pour conserver le dévers de base calculé.
            </p>
          </div>
        </div>

        {/* Snow / Frost condition checkbox */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-800">
            <input
              type="checkbox"
              checked={data.hasSnowOrFrost}
              onChange={(e) => onChange({ ...data, hasSnowOrFrost: e.target.checked })}
              className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
            />
            <span className="font-medium">Zone à enneigement ou verglas fréquent (motif légitime de réduction selon ARP §2.4)</span>
          </label>
        </div>
      </div>

      {/* Results Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Synthèse Dévers et Pente Résultante
          </span>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block">Dévers théorique de base</span>
              <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                {result.baseDevers.toFixed(2)} %
              </div>
              <span className="text-[11px] text-slate-500">Loi ARP selon 1/R</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-xs text-emerald-700 font-semibold block">Dévers retenu pour l’étude</span>
              <div className="text-xl font-bold font-mono text-emerald-900 mt-0.5">
                {result.adoptedDevers.toFixed(2)} %
              </div>
              <span className="text-[11px] text-emerald-700">
                {data.userReducedDevers !== undefined ? 'Valeur réduite' : 'Valeur de base'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-500">Pente résultante de la chaussée (d + |p|)</span>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${
                result.isResultantSlopeCompliant ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {result.resultantSlope.toFixed(2)} %
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Plafond admissible</span>
              <span className="text-xs font-mono font-bold text-slate-700">&le; 10,00 %</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
              result.isAdoptedValidFloor ? 'bg-slate-50 text-slate-700' : 'bg-rose-50 text-rose-800 font-semibold'
            }`}>
              {result.isAdoptedValidFloor ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>Plancher réglementaire : {result.adoptedDevers.toFixed(2)}% &ge; 2,50% {result.isAdoptedValidFloor ? '(OK)' : '(NON CONFORME)'}</span>
            </div>

            <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
              result.isResultantSlopeCompliant ? 'bg-slate-50 text-slate-700' : 'bg-rose-50 text-rose-800 font-semibold'
            }`}>
              {result.isResultantSlopeCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>Pente résultante : {result.resultantSlope.toFixed(2)}% &le; 10,00% {result.isResultantSlopeCompliant ? '(Conforme)' : '(VIOLATION ABSOLUE !)'}</span>
            </div>
          </div>
        </div>

        {/* Justification Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>Justification Technique de l'Adaptation</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              {result.justification}
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1.5 border border-slate-100">
              <div className="font-semibold text-slate-800">Motifs de réduction reconnus par le Cerema (p.91) :</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Forte déclivité longitudinale du profil en long (pour limiter la pente combinée).</li>
                <li>Sites avec enneigement ou verglas fréquent (stabilité des véhicules lents à l'arrêt).</li>
                <li>Nécessité géométrique de limiter la longueur de variation de dévers.</li>
                <li><strong>Interdiction absolue :</strong> descendre sous 2,5% vers l’intérieur de la courbe.</li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
            Source : Chapitre 6 §2.4 & §3.2 (p. 91-92)
          </div>
        </div>
      </div>

      {/* Calculation Step Card */}
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={result.isAdoptedValidFloor && result.isResultantSlopeCompliant}
      />
    </div>
  );
};
