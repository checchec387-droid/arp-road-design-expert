import React from 'react';
import { calculateSurlargeurLacet } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Maximize2, Truck, CheckCircle2, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface Props {
  data: {
    innerRadiusR: number;
    normalLaneWidth: number;
    isDifficultRelief: boolean;
  };
  onChange: (d: {
    innerRadiusR: number;
    normalLaneWidth: number;
    isDifficultRelief: boolean;
  }) => void;
}

export const SurlargeurLacetModule: React.FC<Props> = ({
  data,
  onChange
}) => {
  const result = calculateSurlargeurLacet(data);

  const handleRadiusChange = (valStr: string) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onChange({ ...data, innerRadiusR: val });
    }
  };

  const handleWidthChange = (w: number) => {
    onChange({ ...data, normalLaneWidth: w });
  };

  const handleReliefToggle = (checked: boolean) => {
    onChange({ ...data, isDifficultRelief: checked });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-800 mb-1">
            <span>Guide ARP 2022 · Chapitre 3 §2.3 (p.41) & Chapitre 6 §2.2-2.3 (p.90-91)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Maximize2 className="w-5 h-5 text-sky-900" />
            <span>Surlargeurs en Courbe et Rayons Internes en Lacet</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Calcul de la majoration de voie pour giration des poids lourds et autocars (cas normal et relief difficile).
          </p>
        </div>
      </div>

      {/* Input Parameters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Paramètres de la Courbe et Contexte
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Inner radius */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Rayon interne de la courbe R (m)
              </label>
              <span className="text-xs font-mono font-bold text-sky-900">
                {data.innerRadiusR} m
              </span>
            </div>
            <input
              type="number"
              step="5"
              min="5"
              max="600"
              value={data.innerRadiusR}
              onChange={(e) => handleRadiusChange(e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800 mb-2"
            />
            <input
              type="range"
              min="10"
              max="400"
              step="5"
              value={data.innerRadiusR}
              onChange={(e) => handleRadiusChange(e.target.value)}
              className="w-full accent-sky-900 cursor-pointer"
            />
          </div>

          {/* Lane normal width */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Largeur normale de voie en alignement
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3.00, 3.25, 3.50].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleWidthChange(w)}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    data.normalLaneWidth === w
                      ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {w.toFixed(2)} m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Issue du niveau de fonctions (Tableau 3).
            </p>
          </div>

          {/* Context Switch */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Règle technique de calcul
            </label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={data.isDifficultRelief}
                  onChange={(e) => handleReliefToggle(e.target.checked)}
                  className="rounded border-slate-300 text-sky-900 focus:ring-sky-800"
                />
                <span className="font-semibold">Relief difficile / site contraint</span>
              </label>
              <div className="text-[11px] text-slate-500">
                {data.isDifficultRelief
                  ? 'Formules Chapitre 6 : 3,50 + 25/R (50-200m) ou 3,50 + 30/R (<50m)'
                  : 'Formules Cas normal (Tableau 6) : 3,50 + 50/R (<200m)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Dimensionnement de la Surlargeur en Courbe
          </span>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block">Largeur de voie calculée</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {result.calculatedLaneWidth.toFixed(2)} m
              </div>
              <span className="text-[11px] text-slate-500">
                Surlargeur : +{result.wideningPerLane.toFixed(2)} m / voie
              </span>
            </div>

            <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
              <span className="text-xs text-sky-900 font-semibold block">Largeur totale chaussée (2 voies)</span>
              <div className="text-2xl font-bold font-mono text-sky-950 mt-0.5">
                {(result.calculatedLaneWidth * 2).toFixed(2)} m
              </div>
              <span className="text-[11px] text-sky-800">
                Surlargeur totale : +{result.totalRoadwayWidening.toFixed(2)} m
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className={`flex items-center gap-2 p-2.5 rounded-lg ${
              result.requiresSweptPathCheck ? 'bg-amber-50 text-amber-900 font-medium' : 'bg-slate-50 text-slate-700'
            }`}>
              {result.requiresSweptPathCheck ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              <span>
                {result.requiresSweptPathCheck
                  ? 'R < 125 m : Contrôle des conditions de giration par ÉPURES obligatoire (p.41 & p.90)'
                  : 'R >= 125 m : Surlargeur géométrique suffisante sans épures obligatoires'}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Longueur d'introduction minimale de la surlargeur : &ge; 20,00 m (hors partie circulaire).
              </span>
            </div>
          </div>
        </div>

        {/* Hairpins Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-900" />
              <span>Rayons Internes Minimaux en Lacet (Chapitre 6 §2.3, p.91)</span>
            </h3>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 font-semibold">Configuration</th>
                    <th className="py-2 px-2.5 font-semibold">Véhicule</th>
                    <th className="py-2 px-2.5 font-semibold">Rayon min.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5">Chaussée 8 m</td>
                    <td className="py-2 px-2.5 text-slate-600">Poids lourd (sort de sa voie)</td>
                    <td className="py-2 px-2.5 font-mono font-bold text-sky-900">6,50 m</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5">Voie 6 m</td>
                    <td className="py-2 px-2.5 text-slate-600">Semi-remorque</td>
                    <td className="py-2 px-2.5 font-mono font-bold text-sky-900">11,00 m</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5">Voie 6 m</td>
                    <td className="py-2 px-2.5 text-slate-600">Autocar</td>
                    <td className="py-2 px-2.5 font-mono font-bold text-sky-900">13,50 m</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5">Voie 5 m</td>
                    <td className="py-2 px-2.5 text-slate-600">Semi-remorque</td>
                    <td className="py-2 px-2.5 font-mono font-bold text-sky-900">17,00 m</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5">Voie 5 m</td>
                    <td className="py-2 px-2.5 text-slate-600">Autocar</td>
                    <td className="py-2 px-2.5 font-mono font-bold text-sky-900">21,00 m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Sur chaussée 8 m, le lacet est à éviter si le trafic lourd est non négligeable.
          </div>
        </div>
      </div>

      {/* Step card */}
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={!result.requiresSweptPathCheck || data.innerRadiusR >= 6.5}
      />
    </div>
  );
};
