import React, { useState } from 'react';
import { RoadType, FunctionLevel } from '../../types/arp';
import { Layers, CheckCircle2, AlertTriangle, ShieldCheck, Ruler } from 'lucide-react';

interface Props {
  roadType: RoadType;
  functionLevel: FunctionLevel;
}

export const ProfilEnTraversModule: React.FC<Props> = ({
  roadType,
  functionLevel
}) => {
  const [laneWidth, setLaneWidth] = useState<number>(functionLevel === 'eleve' ? 3.50 : functionLevel === 'intermediaire' ? 3.25 : 3.00);
  const [numLanes, setNumLanes] = useState<number>(roadType === '3.1' ? 4 : roadType === '4.2' ? 3 : 2);
  const [bddWidth, setBddWidth] = useState<number>(2.00);
  const [isBddPaved, setIsBddPaved] = useState<boolean>(true);
  const [bermeWidth, setBermeWidth] = useState<number>(1.00);
  const [hasGuardrail, setHasGuardrail] = useState<boolean>(true);
  const [isCrowned, setIsCrowned] = useState<boolean>(true); // Toit 2.5% ou déversé unique
  const [deversLeftPercent, setDeversLeftPercent] = useState<number>(2.5);
  const [deversRightPercent, setDeversRightPercent] = useState<number>(2.5);
  const [hasBME, setHasBME] = useState<boolean>(false);
  const [bmeWidth, setBmeWidth] = useState<number>(1.00);

  // Computations
  const roadwayWidth = laneWidth * numLanes + (hasBME ? bmeWidth : 0);
  const totalBddWidth = bddWidth * 2;
  const totalBermeWidth = bermeWidth * 2;
  const totalPlateformeWidth = roadwayWidth + totalBddWidth + totalBermeWidth;
  const totalRoulableWidth = roadwayWidth + totalBddWidth;

  // Validation checks against Chapter 3
  const isBermeCompliant = hasGuardrail ? bermeWidth >= 1.00 : bermeWidth >= 0.75;
  const isBddCompliant = bddWidth >= 1.00;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-800 mb-1">
            <span>Guide ARP 2022 · Chapitre 3 (p.33-54)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-sky-900" />
            <span>Module 3 — Modélisation du Profil en Travers Type</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Composition modulaire des voies, surlargeur structurelle (S=0,25 m), BDD revêtue, berme et zone de sécurité.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-500 block">Largeur Plate-forme Totale</span>
          <span className="text-lg font-bold font-mono text-sky-950">{totalPlateformeWidth.toFixed(2)} m</span>
        </div>
      </div>

      {/* Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Roadway & Lanes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Chaussée & Voies de Circulation
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nombre de voies de circulation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumLanes(n)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                    numLanes === n
                      ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {n} voies
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Largeur unitaire de voie (Tableau 3, 4, 5)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3.00, 3.25, 3.50].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setLaneWidth(w)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                    laneWidth === w
                      ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {w.toFixed(2)} m
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBME}
                onChange={(e) => setHasBME(e.target.checked)}
                className="rounded border-slate-300 text-sky-900 focus:ring-sky-800"
              />
              <span className="font-medium">Bande médiane équipée (BME / TPC)</span>
            </label>
            {hasBME && (
              <div className="mt-2">
                <label className="block text-[11px] text-slate-600 mb-1">Largeur BME (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.7"
                  max="3.0"
                  value={bmeWidth}
                  onChange={(e) => setBmeWidth(parseFloat(e.target.value) || 1.0)}
                  className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* Shoulders (Accotements) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            2. Accotements (BDD & Bermes)
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Largeur BDD droite et gauche (m)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1.00, 1.50, 1.75, 2.00].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setBddWidth(w)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                    bddWidth === w
                      ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {w.toFixed(2)}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Recommandation normale : 2,00 m (recouvrement zone de récupération).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Largeur Berme engazonnée (m)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.5"
              max="3"
              value={bermeWidth}
              onChange={(e) => setBermeWidth(parseFloat(e.target.value) || 0.75)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Minimum 0,75 m ; au moins 1,00 m si glissière de sécurité.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isBddPaved}
                onChange={(e) => setIsBddPaved(e.target.checked)}
                className="rounded border-slate-300 text-sky-900 focus:ring-sky-800"
              />
              <span className="font-medium">BDD uniformément revêtue</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={hasGuardrail}
                onChange={(e) => setHasGuardrail(e.target.checked)}
                className="rounded border-slate-300 text-sky-900 focus:ring-sky-800"
              />
              <span className="font-medium">Présence de dispositif de retenue (glissière)</span>
            </label>
          </div>
        </div>

        {/* Cross Slopes (Pentes transversales) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            3. Pentes Transversales (Tableau 8)
          </h2>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="crowned"
                checked={isCrowned}
                onChange={() => setIsCrowned(true)}
                className="text-sky-900"
              />
              <span>Configuration en toit (2,5% vers l'extérieur dans chaque sens)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="crowned"
                checked={!isCrowned}
                onChange={() => setIsCrowned(false)}
                className="text-sky-900"
              />
              <span>Courbe déversée uniforme (vers un seul côté)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Pente versant G (%)</label>
              <input
                type="number"
                step="0.1"
                value={deversLeftPercent}
                onChange={(e) => setDeversLeftPercent(parseFloat(e.target.value) || 2.5)}
                className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Pente versant D (%)</label>
              <input
                type="number"
                step="0.1"
                value={deversRightPercent}
                onChange={(e) => setDeversRightPercent(parseFloat(e.target.value) || 2.5)}
                className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100">
            Pente transversale de la berme : <strong>8 %</strong> orientée vers l'extérieur (ou jusqu’à 25% si fossé/assainissement).
          </div>
        </div>
      </div>

      {/* SVG Cross Section Diagram */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Coupe Transversale Proportionnelle du Profil
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
            <span>Chaussée : {roadwayWidth.toFixed(2)} m</span>
            <span>·</span>
            <span>Largeur roulable : {totalRoulableWidth.toFixed(2)} m</span>
            <span>·</span>
            <span>Plateforme : {totalPlateformeWidth.toFixed(2)} m</span>
          </div>
        </div>

        <div className="py-6 overflow-x-auto">
          <svg width="780" height="150" viewBox="0 0 780 150" className="mx-auto block text-xs">
            {/* Ground / embankment baseline */}
            <line x1="30" y1="120" x2="750" y2="120" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

            {/* Berme Left */}
            <rect x="50" y="80" width="70" height="20" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
            <text x="85" y="93" fontSize="9" textAnchor="middle" fill="#166534" fontWeight="bold">Berme {bermeWidth}m</text>

            {/* BDD Left */}
            <rect x="120" y="80" width="110" height="20" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" />
            <text x="175" y="93" fontSize="9" textAnchor="middle" fill="#0369a1" fontWeight="bold">BDD {bddWidth}m</text>

            {/* Roadway (Chaussée) */}
            <rect x="230" y="75" width="320" height="25" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
            {/* Lane separation line */}
            <line x1="390" y1="75" x2="390" y2="100" stroke="#f8fafc" strokeWidth="2" strokeDasharray="4 4" />
            <text x="310" y="91" fontSize="10" textAnchor="middle" fill="#f8fafc" fontWeight="bold">Voie 1 ({laneWidth}m)</text>
            <text x="470" y="91" fontSize="10" textAnchor="middle" fill="#f8fafc" fontWeight="bold">Voie 2 ({laneWidth}m)</text>

            {/* BDD Right */}
            <rect x="550" y="80" width="110" height="20" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" />
            <text x="605" y="93" fontSize="9" textAnchor="middle" fill="#0369a1" fontWeight="bold">BDD {bddWidth}m</text>

            {/* Berme Right */}
            <rect x="660" y="80" width="70" height="20" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
            <text x="695" y="93" fontSize="9" textAnchor="middle" fill="#166534" fontWeight="bold">Berme {bermeWidth}m</text>

            {/* Dimension Lines */}
            {/* Plateforme total */}
            <line x1="50" y1="40" x2="730" y2="40" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="50" y1="35" x2="50" y2="45" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="730" y1="35" x2="730" y2="45" stroke="#0f172a" strokeWidth="1.5" />
            <text x="390" y="34" fontSize="11" textAnchor="middle" fill="#0f172a" fontWeight="bold" fontFamily="monospace">
              Plate-forme totale : {totalPlateformeWidth.toFixed(2)} m
            </text>

            {/* Slope arrows */}
            {isCrowned ? (
              <g>
                <text x="310" y="65" fontSize="9" fill="#0284c7" textAnchor="middle">&larr; {deversLeftPercent}%</text>
                <text x="470" y="65" fontSize="9" fill="#0284c7" textAnchor="middle">{deversRightPercent}% &rarr;</text>
              </g>
            ) : (
              <text x="390" y="65" fontSize="9" fill="#0284c7" textAnchor="middle">&rarr; {deversRightPercent}% (Uniforme)</text>
            )}
          </svg>
        </div>
      </div>

      {/* Compliance summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Contrôles de Sécurité & Conformité du Profil en Travers
        </h3>

        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
          isBermeCompliant ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
        }`}>
          {isBermeCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>
            Berme ({bermeWidth} m) : {isBermeCompliant ? 'Conforme aux exigences d’implantation' : `Insuffisante (au moins 1,00 m requis en présence de glissière)`}.
          </span>
        </div>

        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
          isBddCompliant ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
        }`}>
          {isBddCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>
            Bande dérasée de droite ({bddWidth} m) : {isBddCompliant ? 'Permet la récupération et la circulation des cyclistes en largeur roulable' : 'Inférieure au minimum de 1,00 m pour points durs'}.
          </span>
        </div>
      </div>
    </div>
  );
};
