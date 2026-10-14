import React from 'react';
import { CrossSectionType } from '../../types/arp';
import { calculateClothoideReliefDifficile } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { GitCommit, CheckCircle2, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface Props {
  data: {
    crossSectionType: CrossSectionType;
    radiusR: number;
    widthL: number;
    deltaDevers: number;
    proposedReducedLength?: number;
    exactLg?: number;
    deversAtPoint: number;
    longitudinalSlope: number;
  };
  onChange: (d: {
    crossSectionType: CrossSectionType;
    radiusR: number;
    widthL: number;
    deltaDevers: number;
    proposedReducedLength?: number;
    exactLg?: number;
    deversAtPoint: number;
    longitudinalSlope: number;
  }) => void;
}

export const ClothoideReliefDifficileModule: React.FC<Props> = ({
  data,
  onChange
}) => {
  const result = calculateClothoideReliefDifficile(data);

  const handleCrossSectionChange = (type: CrossSectionType) => {
    onChange({ ...data, crossSectionType: type });
  };

  const handleNumberChange = (field: keyof typeof data, valStr: string) => {
    if (field === 'proposedReducedLength' || field === 'exactLg') {
      if (valStr.trim() === '') {
        onChange({ ...data, [field]: undefined });
        return;
      }
      const val = parseFloat(valStr.replace(',', '.'));
      if (!isNaN(val)) {
        onChange({ ...data, [field]: val });
      }
      return;
    }

    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val)) {
      onChange({ ...data, [field]: val });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 mb-1">
            <span>Guide ARP 2022 · Chapitre 6 §3.2 (p.92)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GitCommit className="w-5 h-5 text-emerald-800" />
            <span>Clothoïdes en Relief Difficile ou Site Contraint</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Réduction ou suppression de raccordement progressif, contrôle du seuil de basculement Lg/2 et pente résultante &le; 10%.
          </p>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Données Géométriques du Projet en Relief Difficile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Profil en travers
            </label>
            <select
              value={data.crossSectionType}
              onChange={(e) => handleCrossSectionChange(e.target.value as CrossSectionType)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700 bg-white"
            >
              <option value="2 voies">2 voies (k = 6)</option>
              <option value="3 voies">3 voies (k = 12)</option>
              <option value="2x2 voies">2x2 voies (k = 12)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Rayon R de la courbe (m)
            </label>
            <input
              type="number"
              step="5"
              min="20"
              max="1500"
              value={data.radiusR}
              onChange={(e) => handleNumberChange('radiusR', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Largeur l à basculer (m)
            </label>
            <input
              type="number"
              step="0.25"
              min="2.5"
              max="20"
              value={data.widthL}
              onChange={(e) => handleNumberChange('widthL', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Différence dévers |Δd| (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="15"
              value={data.deltaDevers}
              onChange={(e) => handleNumberChange('deltaDevers', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700"
            />
          </div>
        </div>

        {/* Second Row of Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Longueur réduite proposée (m)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="500"
              value={data.proposedReducedLength ?? ''}
              onChange={(e) => handleNumberChange('proposedReducedLength', e.target.value)}
              placeholder="0 pour suppression"
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              0 = suppression totale de clothoïde.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Lg exacte (§4.3) si connue (m)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="200"
              value={data.exactLg ?? ''}
              onChange={(e) => handleNumberChange('exactLg', e.target.value)}
              placeholder={`Estimée: ${result.estimatedLg.toFixed(0)}m`}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Laisser vide pour calcul automatique.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Dévers au point considéré (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={data.deversAtPoint}
              onChange={(e) => handleNumberChange('deversAtPoint', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pente longitudinale |p| (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="15"
              value={data.longitudinalSlope}
              onChange={(e) => handleNumberChange('longitudinalSlope', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* Results and Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Dimensions Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs md:col-span-2 space-y-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Contrôles Géométriques du Raccordement Réduit
          </span>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block">Longueur normale réf.</span>
              <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                {result.normalLength.toFixed(2)} m
              </div>
              <span className="text-[11px] text-slate-500">Tableau 11</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-xs text-emerald-800 font-semibold block">Seuil minimal basculement</span>
              <div className="text-lg font-bold font-mono text-emerald-950 mt-0.5">
                {result.minShiftLength.toFixed(2)} m
              </div>
              <span className="text-[11px] text-emerald-700">Lg / 2 (p.92)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block">Longueur réduite projet</span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {data.proposedReducedLength !== undefined ? `${data.proposedReducedLength.toFixed(1)} m` : 'Non renseignée'}
              </div>
              <span className="text-[11px] text-slate-500">
                {result.reductionRate !== undefined ? `Taux : -${result.reductionRate}%` : 'Valeur normale par défaut'}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-500">Pente résultante dans la zone de transition</span>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${
                result.isResultantSlopeCompliant ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {result.resultantSlope.toFixed(2)} %
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Limite absolue ARP</span>
              <span className="text-xs font-mono font-bold text-slate-800">&le; 10,00 %</span>
            </div>
          </div>

          {/* Validation Checks */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
              result.allowsMinShift ? 'bg-slate-50 text-slate-700' : 'bg-rose-50 text-rose-800 font-semibold'
            }`}>
              {result.allowsMinShift ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>
                {data.proposedReducedLength === undefined
                  ? 'Renseigner une longueur réduite pour contrôler la condition L >= Lg/2'
                  : result.allowsMinShift
                  ? `La longueur réduite (${data.proposedReducedLength} m) respecte le seuil minimal de basculement (${result.minShiftLength} m).`
                  : `Clothoïde insuffisante : ${data.proposedReducedLength} m < Lg/2 (${result.minShiftLength} m) !`}
              </span>
            </div>

            <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
              result.isResultantSlopeCompliant ? 'bg-slate-50 text-slate-700' : 'bg-rose-50 text-rose-800 font-semibold'
            }`}>
              {result.isResultantSlopeCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>
                Pente résultante : {result.resultantSlope.toFixed(2)}% &le; 10,00% {result.isResultantSlopeCompliant ? '(Conforme)' : '(DÉPASSEMENT CRITIQUE)'}
              </span>
            </div>
          </div>
        </div>

        {/* Technical Guidelines Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>Règles d'Exécution du Basculement (p.92)</span>
            </h3>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>1. Anticipation :</strong> Le basculement de dévers peut commencer avant le début de la clothoïde.
              </p>
              <p>
                <strong>2. Suppression :</strong> Lorsque la clothoïde est totalement supprimée, le basculement s'effectue entièrement dans l'alignement précédant la courbe.
              </p>
              <p className="text-rose-700 font-semibold">
                <strong>3. Règle stricte :</strong> Le basculement de dévers ne doit JAMAIS s'organiser dans la partie circulaire de la courbe.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
            Contrainte gouvernante : {result.governingConstraint}
          </div>
        </div>
      </div>

      {/* Step card */}
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={result.allowsMinShift && result.isResultantSlopeCompliant}
      />
    </div>
  );
};
