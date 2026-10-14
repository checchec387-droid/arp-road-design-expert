import React from 'react';
import { CrossSectionType, RoadCategory } from '../../types/arp';
import { calculateClothoideNormal } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Spline, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  data: {
    crossSectionType: CrossSectionType;
    radiusR: number;
    widthL: number;
    deltaDevers: number;
    category: RoadCategory;
    isInterurbaine110: boolean;
  };
  onChange: (d: {
    crossSectionType: CrossSectionType;
    radiusR: number;
    widthL: number;
    deltaDevers: number;
    category: RoadCategory;
    isInterurbaine110: boolean;
  }) => void;
}

export const ClothoideNormalModule: React.FC<Props> = ({
  data,
  onChange
}) => {
  const result = calculateClothoideNormal(data);

  // Clothoid parameter A = sqrt(R * L)
  const paramA = Math.sqrt(data.radiusR * result.lengthL);

  const handleCrossSectionChange = (type: CrossSectionType) => {
    onChange({ ...data, crossSectionType: type });
  };

  const handleNumberChange = (field: 'radiusR' | 'widthL' | 'deltaDevers', valStr: string) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onChange({ ...data, [field]: val });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-800 mb-1">
            <span>Guide ARP 2022 · Chapitre 4 §1.3 (Tableau 11, p.58)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Spline className="w-5 h-5 text-indigo-900" />
            <span>Calcul des Clothoïdes (Raccordements Progressifs) — Cas Normal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dimensionnement de la longueur de clothoïde L = MAX(2·l·|Δd| ; k·R^0.4) selon le profil en travers.
          </p>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Données du Raccordement
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Profile type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Profil en travers (Tableau 11)
            </label>
            <div className="flex flex-col gap-1.5">
              {(['2 voies', '3 voies', '2x2 voies'] as CrossSectionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleCrossSectionChange(t)}
                  className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border text-left transition-all ${
                    data.crossSectionType === t
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t} (k = {t === '2 voies' ? 6 : 12})
                </button>
              ))}
            </div>
          </div>

          {/* Radius R */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Rayon de la courbe R (m)
            </label>
            <input
              type="number"
              step="5"
              min="20"
              max="2000"
              value={data.radiusR}
              onChange={(e) => handleNumberChange('radiusR', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-800 mb-2"
            />
            <input
              type="range"
              min="100"
              max="800"
              step="5"
              value={data.radiusR}
              onChange={(e) => handleNumberChange('radiusR', e.target.value)}
              className="w-full accent-indigo-900 cursor-pointer"
            />
          </div>

          {/* Width of tilted lanes l */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Largeur totale l à basculer (m)
            </label>
            <input
              type="number"
              step="0.25"
              min="2.5"
              max="20"
              value={data.widthL}
              onChange={(e) => handleNumberChange('widthL', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-800"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Largeur de la ou des voies qui basculent (ex : 7,00 m pour 2 voies de 3,50 m).
            </p>
          </div>

          {/* Delta devers */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Différence de dévers |Δd| (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="15"
              value={data.deltaDevers}
              onChange={(e) => handleNumberChange('deltaDevers', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-800"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Écart des pentes transversales raccordées (ex : -2,5% à +2,0% =&gt; Δd = 4,5%).
            </p>
          </div>
        </div>
      </div>

      {/* Results and Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Dimensioning Result */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs md:col-span-2 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Longueur de Clothoïde Retenue L
              </span>
              <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1 flex items-baseline gap-2">
                <span>{result.lengthL.toFixed(2)} m</span>
                <span className="text-xs font-sans font-normal text-slate-500">
                  (Arrondi technique préconisé : {Math.ceil(result.lengthL)} m)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-100 font-semibold">
                Paramètre A = {paramA.toFixed(1)} m
              </span>
            </div>
          </div>

          {/* Two competitive terms breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className={`p-3 rounded-lg border text-xs ${
              result.governingTerm === 'GEOMETRIQUE'
                ? 'bg-indigo-50/70 border-indigo-200'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700">Terme Géométrique</span>
                {result.governingTerm === 'GEOMETRIQUE' && (
                  <span className="text-[10px] uppercase font-bold text-indigo-900">GOUVERNANT</span>
                )}
              </div>
              <div className="font-mono text-base font-bold text-slate-900">
                {result.geometricTerm.toFixed(2)} m
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                k·R^0.4 = {result.kCoeff} × {result.rExp04.toFixed(2)}
              </div>
            </div>

            <div className={`p-3 rounded-lg border text-xs ${
              result.governingTerm === 'GAUCHISSEMENT'
                ? 'bg-indigo-50/70 border-indigo-200'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700">Terme de Gauchissement</span>
                {result.governingTerm === 'GAUCHISSEMENT' && (
                  <span className="text-[10px] uppercase font-bold text-indigo-900">GOUVERNANT</span>
                )}
              </div>
              <div className="font-mono text-base font-bold text-slate-900">
                {result.warpingTerm.toFixed(2)} m
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                2·l·|Δd| = 2 × {data.widthL} × {data.deltaDevers}
              </div>
            </div>
          </div>

          {/* Obligation Check */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs">
            <span className="text-slate-700 font-medium">
              Contrôle du seuil réglementaire d'obligation (1,5·Rdn = {result.thresholdClothoide} m) :
            </span>
            <span className={`font-semibold font-mono ${result.isClothoideMandatory ? 'text-indigo-900' : 'text-slate-600'}`}>
              {result.isClothoideMandatory
                ? 'CLOTHOÏDE OBLIGATOIRE (R < 1,5·Rdn)'
                : 'CLOTHOÏDE FACULTATIVE (R >= 1,5·Rdn)'}
            </span>
          </div>
        </div>

        {/* Curvature & Superelevation transition diagram */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Diagramme de Transition de Courbure
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Progression linéaire de courbure de 0 (alignement) à 1/R (cercle).
            </p>
          </div>

          {/* SVG Diagram */}
          <div className="py-2 flex justify-center">
            <svg width="220" height="110" viewBox="0 0 220 110" className="text-xs font-mono">
              <line x1="25" y1="90" x2="195" y2="90" stroke="#94a3b8" strokeWidth="1" />
              <line x1="25" y1="90" x2="25" y2="20" stroke="#94a3b8" strokeWidth="1" />

              {/* Linear curvature progression */}
              <line x1="25" y1="90" x2="150" y2="30" stroke="#4f46e5" strokeWidth="2.5" />
              <line x1="150" y1="30" x2="195" y2="30" stroke="#4f46e5" strokeWidth="2.5" strokeDasharray="3 3" />

              {/* Labels */}
              <text x="25" y="102" fontSize="9" fill="#64748b" textAnchor="middle">s=0</text>
              <text x="150" y="102" fontSize="9" fill="#4f46e5" fontWeight="bold" textAnchor="middle">s=L ({result.lengthL.toFixed(0)}m)</text>
              <text x="15" y="32" fontSize="9" fill="#4f46e5" textAnchor="end">1/R</text>
              <text x="15" y="93" fontSize="9" fill="#64748b" textAnchor="end">0</text>

              <circle cx="25" cy="90" r="3" fill="#4f46e5" />
              <circle cx="150" cy="30" r="3" fill="#4f46e5" />
            </svg>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Formule mathématique : 1/r(s) = s / (R · L)
          </div>
        </div>
      </div>

      {/* Step card */}
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={true}
      />
    </div>
  );
};
