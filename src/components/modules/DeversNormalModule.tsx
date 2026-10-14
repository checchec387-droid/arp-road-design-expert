import React from 'react';
import { RoadCategory } from '../../types/arp';
import { calculateDeversNormal } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Compass, CheckCircle2, AlertTriangle, ShieldAlert, Snowflake } from 'lucide-react';

interface Props {
  data: {
    category: RoadCategory;
    isInterurbaine110: boolean;
    radiusR: number;
  };
  onChange: (d: { category: RoadCategory; isInterurbaine110: boolean; radiusR: number }) => void;
  onRecordHistory?: (moduleName: string, summary: string, params: any, results: any) => void;
}

export const DeversNormalModule: React.FC<Props> = ({
  data,
  onChange,
  onRecordHistory
}) => {
  const result = calculateDeversNormal(data);

  const handleCategoryChange = (cat: 'R1' | 'R2') => {
    onChange({ ...data, category: cat });
  };

  const handleInterurbaineChange = (checked: boolean) => {
    onChange({ ...data, isInterurbaine110: checked });
  };

  const handleRadiusChange = (valStr: string) => {
    const parsed = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      onChange({ ...data, radiusR: parsed });
    }
  };

  // Generate curve points for SVG 1/R visualization
  const curvePoints = [];
  const minPlotR = data.category === 'R1' ? 200 : 100;
  const maxPlotR = 800;
  for (let r = minPlotR; r <= maxPlotR; r += 15) {
    const calc = calculateDeversNormal({ ...data, radiusR: r });
    curvePoints.push({ r, d: calc.calculatedDevers });
  }

  // SVG chart scaling
  const svgWidth = 600;
  const svgHeight = 200;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };
  const plotW = svgWidth - padding.left - padding.right;
  const plotH = svgHeight - padding.top - padding.bottom;

  const scaleX = (r: number) => padding.left + ((r - minPlotR) / (maxPlotR - minPlotR)) * plotW;
  const scaleY = (d: number) => padding.top + plotH - ((d - 2.0) / (7.5 - 2.0)) * plotH;

  const pathD = curvePoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(pt.r).toFixed(1)} ${scaleY(pt.d).toFixed(1)}`)
    .join(' ');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-800 mb-1">
            <span>Guide ARP 2022 · Chapitre 4 §1.1 (p.57) & Chapitre 3 §4.2 (p.45)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-sky-900" />
            <span>Calcul du Dévers — Cas Normal (Section Courante)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Détermination de la pente transversale en fonction de la catégorie, de la courbure 1/R et des seuils limites Rm et Rdn.
          </p>
        </div>
      </div>

      {/* Input Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Données d'Entrée Géométriques
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Catégorie de conception (Tableau 10)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('R1')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  data.category === 'R1'
                    ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Catégorie R1
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('R2')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  data.category === 'R2'
                    ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Catégorie R2
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {data.category === 'R1' ? 'R1 : Rm = 240 m, Rdn = 400 m' : 'R2 : Rm = 125 m, Rdn = 400 m'}
            </p>
          </div>

          {/* Interurbaine 110 option (only for R1) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Artère interurbaine limitée à 110 km/h ?
            </label>
            <div className="flex items-center h-9">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  disabled={data.category !== 'R1'}
                  checked={data.category === 'R1' && data.isInterurbaine110}
                  onChange={(e) => handleInterurbaineChange(e.target.checked)}
                  className="rounded border-slate-300 text-sky-900 focus:ring-sky-800"
                />
                <span className={data.category !== 'R1' ? 'text-slate-400' : 'font-medium'}>
                  Oui (Rm porté à 400 m, Rdn à 650 m)
                </span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Sur artère interurbaine type 3.1 à 110 km/h, les seuils sont majorés.
            </p>
          </div>

          {/* Radius R */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Rayon en plan R du projet
              </label>
              <span className="text-xs font-mono font-bold text-sky-900">
                {data.radiusR} m
              </span>
            </div>
            <input
              type="number"
              step="5"
              min="20"
              max="2000"
              value={data.radiusR}
              onChange={(e) => handleRadiusChange(e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800 mb-2"
            />
            <input
              type="range"
              min={data.category === 'R1' ? 200 : 100}
              max="800"
              step="5"
              value={data.radiusR}
              onChange={(e) => handleRadiusChange(e.target.value)}
              className="w-full accent-sky-900 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Results Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main Result Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs md:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Pente Transversale (Dévers) Calculée
              </span>
              <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1 flex items-baseline gap-2">
                <span>{result.calculatedDevers.toFixed(2)} %</span>
                <span className="text-xs font-sans font-normal text-slate-500">
                  {result.radiusR >= result.Rdn ? "(en toit vers l'extérieur)" : "(vers l'intérieur du virage)"}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                result.isRadiusValid
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {result.isRadiusValid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>R &ge; Rm ({result.Rm} m)</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Non-conforme : R &lt; Rm ({result.Rm} m)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Rayon minimal Rm</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{result.Rm} m</span>
            </div>
            <div>
              <span className="text-slate-500 block">Rayon dévers normal Rdn</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{result.Rdn} m</span>
            </div>
            <div>
              <span className="text-slate-500 block">Seuil clothoïde (1,5·Rdn)</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{result.thresholdClothoide} m</span>
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-700 flex items-center justify-between">
            <span className="font-medium">Raccordement progressif (clothoïde) requis :</span>
            <span className={`font-semibold font-mono ${result.isClothoideRequired ? 'text-sky-900' : 'text-slate-600'}`}>
              {result.isClothoideRequired ? 'OUI (R < 1,5·Rdn)' : 'NON (R >= 1,5·Rdn)'}
            </span>
          </div>

          {result.isIceLimitedPossible && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
              <Snowflake className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Option zone verglacée (Chapitre 3 §4.2, p.45) : </span>
                <span>
                  Ce rayon ({result.radiusR} m) entraîne un dévers calculé &gt; 5%. En secteur sujet à verglas fréquent ou pour raisons techniques, le guide ARP autorise un plafonnement exceptionnel à 5,00%.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cross-section visual schematic */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Schéma du Profil en Travers
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Orientation de la pente transversale au point de rotation de la chaussée.
            </p>
          </div>

          {/* SVG representation of the road cross fall */}
          <div className="py-4 flex justify-center items-center">
            <svg width="240" height="90" viewBox="0 0 240 90" className="overflow-visible">
              <line x1="20" y1="75" x2="220" y2="75" stroke="#cbd5e1" strokeDasharray="3 3" />
              <text x="20" y="87" fontSize="9" fill="#94a3b8" fontFamily="monospace">Horizontale</text>

              {result.radiusR >= result.Rdn ? (
                // Crowned roof profile: 2.5% each side
                <g>
                  <line x1="20" y1="55" x2="120" y2="35" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
                  <line x1="120" y1="35" x2="220" y2="55" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="120" cy="35" r="3.5" fill="#0369a1" />
                  <text x="50" y="30" fontSize="10" fill="#0369a1" fontWeight="bold">2.5% vers ext.</text>
                  <text x="135" y="30" fontSize="10" fill="#0369a1" fontWeight="bold">2.5% vers ext.</text>
                  <text x="105" y="16" fontSize="9" fill="#64748b" textAnchor="middle">Profil en toit</text>
                </g>
              ) : (
                // Superelevated profile banked toward inside
                <g>
                  {/* Roadway tilted */}
                  <line
                    x1="20"
                    y1={55 + Math.min(20, result.calculatedDevers * 2.5)}
                    x2="220"
                    y2={55 - Math.min(20, result.calculatedDevers * 2.5)}
                    stroke="#0284c7"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx="120" cy="55" r="3.5" fill="#0369a1" />
                  <text x="80" y="24" fontSize="11" fill="#0369a1" fontWeight="bold" fontFamily="monospace">
                    d = {result.calculatedDevers.toFixed(2)} %
                  </text>
                  <text x="25" y="70" fontSize="9" fill="#64748b">Intérieur virage</text>
                  <text x="175" y="70" fontSize="9" fill="#64748b">Extérieur</text>
                </g>
              )}
            </svg>
          </div>

          <div className="text-[11px] text-slate-500 font-mono text-center pt-2 border-t border-slate-100">
            Axe de rotation : Séparation des voies directes
          </div>
        </div>
      </div>

      {/* Curve 1/R Graphical Interactive Plot */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Évolution Continue du Dévers en Fonction du Rayon (Loi selon 1/R)
          </h3>
          <span className="text-xs font-mono text-slate-500">
            R = {data.radiusR} m → d = {result.calculatedDevers.toFixed(2)}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <svg width={svgWidth} height={svgHeight} className="mx-auto block text-xs">
            {/* Grid and Axis */}
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={svgHeight - padding.bottom} stroke="#e2e8f0" strokeWidth="1" />
            <line x1={padding.left} y1={svgHeight - padding.bottom} x2={svgWidth - padding.right} y2={svgHeight - padding.bottom} stroke="#e2e8f0" strokeWidth="1" />

            {/* Y axis ticks */}
            {[2.5, 4.0, 5.0, 7.0].map(val => (
              <g key={val}>
                <line x1={padding.left - 4} y1={scaleY(val)} x2={svgWidth - padding.right} y2={scaleY(val)} stroke="#f1f5f9" strokeDasharray="2 2" />
                <text x={padding.left - 8} y={scaleY(val) + 3} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                  {val.toFixed(1)}%
                </text>
              </g>
            ))}

            {/* X axis ticks */}
            {[minPlotR, result.Rm, result.Rdn, 600, maxPlotR].filter((v, i, a) => a.indexOf(v) === i).map(rVal => (
              <g key={rVal}>
                <line x1={scaleX(rVal)} y1={svgHeight - padding.bottom} x2={scaleX(rVal)} y2={svgHeight - padding.bottom + 4} stroke="#cbd5e1" />
                <text x={scaleX(rVal)} y={svgHeight - padding.bottom + 16} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
                  {rVal}
                </text>
              </g>
            ))}

            {/* Curve path */}
            <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="2.5" />

            {/* Current point */}
            {data.radiusR >= minPlotR && data.radiusR <= maxPlotR && (
              <g>
                <line
                  x1={scaleX(data.radiusR)}
                  y1={scaleY(result.calculatedDevers)}
                  x2={scaleX(data.radiusR)}
                  y2={svgHeight - padding.bottom}
                  stroke="#0369a1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={scaleX(data.radiusR)}
                  cy={scaleY(result.calculatedDevers)}
                  r="5"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={scaleX(data.radiusR)}
                  y={scaleY(result.calculatedDevers) - 9}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#0369a1"
                  fontFamily="monospace"
                >
                  {result.calculatedDevers.toFixed(2)}%
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Transparent Calculation Step Card */}
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={result.isRadiusValid}
      />
    </div>
  );
};
