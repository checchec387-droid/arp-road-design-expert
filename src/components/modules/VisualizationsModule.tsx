import React, { useState } from 'react';
import { FullProjectState } from '../../utils/storage';
import { calculateDeversNormal, calculateClothoideNormal } from '../../utils/arpCalculations';
import { BarChart3, Compass, Spline, Layers, Activity } from 'lucide-react';

interface Props {
  projectState: FullProjectState;
}

export const VisualizationsModule: React.FC<Props> = ({ projectState }) => {
  const [activeTab, setActiveTab] = useState<'devers-profile' | 'clothoide' | 'cross-section' | 'profil-long'>('devers-profile');

  const { deversNormal, clothoideNormal, traceEnPlan, profilEnLong } = projectState;
  const resDevers = calculateDeversNormal(deversNormal);
  const resCloth = calculateClothoideNormal(clothoideNormal);

  const L = resCloth.lengthL;
  const targetDevers = resDevers.calculatedDevers;

  // Superelevation development profile along clothoid length s = 0 to L
  const deversProfileSteps = [];
  const numSteps = 20;
  for (let i = 0; i <= numSteps; i++) {
    const s = (i / numSteps) * L;
    // Outer edge tilts from -2.5% to +targetDevers
    // Inner edge remains -2.5% or tilts to -targetDevers
    const outerD = -2.5 + (targetDevers - (-2.5)) * (s / L);
    const innerD = -2.5 - (targetDevers - 2.5) * (s / L);
    deversProfileSteps.push({ s, outerD, innerD });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-800 mb-1">
            <span>Visualisations Numériques & Graphiques CAO</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-sky-900" />
            <span>Graphiques et Schémas Techniques du Projet</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Représentations géométriques dynamiques calculées exclusivement à partir des données réelles du projet.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('devers-profile')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'devers-profile' ? 'bg-sky-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Variation du Dévers (Figure 15)</span>
        </button>

        <button
          onClick={() => setActiveTab('clothoide')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'clothoide' ? 'bg-sky-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Spline className="w-4 h-4" />
          <span>Courbure de Clothoïde 1/r(s)</span>
        </button>

        <button
          onClick={() => setActiveTab('cross-section')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'cross-section' ? 'bg-sky-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Coupe en Travers & Pentes</span>
        </button>

        <button
          onClick={() => setActiveTab('profil-long')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'profil-long' ? 'bg-sky-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Ligne Rouge du Profil en Long</span>
        </button>
      </div>

      {/* Tab 1: Variation du Dévers en extrémité de courbe */}
      {activeTab === 'devers-profile' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Évolution du Dévers le Long du Raccordement Progressif (Figure 15, p.46)
            </h2>
            <span className="text-xs font-mono text-sky-900">
              L = {L.toFixed(2)} m · d_cible = {targetDevers.toFixed(2)}%
            </span>
          </div>

          <div className="overflow-x-auto py-4">
            <svg width="680" height="220" viewBox="0 0 680 220" className="mx-auto block text-xs">
              {/* Baseline 0% */}
              <line x1="50" y1="110" x2="630" y2="110" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
              <text x="40" y="113" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">0%</text>

              {/* Grid lines */}
              <line x1="50" y1="50" x2="630" y2="50" stroke="#f1f5f9" />
              <text x="40" y="53" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">+5%</text>
              <line x1="50" y1="170" x2="630" y2="170" stroke="#f1f5f9" />
              <text x="40" y="173" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">-5%</text>

              {/* Clothoid length limits */}
              <line x1="100" y1="30" x2="100" y2="190" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="550" y1="30" x2="550" y2="190" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <text x="100" y="200" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">Origine Clothoïde (s=0)</text>
              <text x="550" y="200" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">Fin Clothoïde (s={L.toFixed(0)}m)</text>

              {/* Bord extérieur (tilting from -2.5% to +targetDevers) */}
              <path
                d={`M 50 ${110 + 2.5 * 10} L 100 ${110 + 2.5 * 10} L 550 ${110 - targetDevers * 10} L 630 ${110 - targetDevers * 10}`}
                fill="none"
                stroke="#0284c7"
                strokeWidth="3"
              />
              {/* Zero crossing label */}
              <circle cx={100 + (2.5 / (targetDevers + 2.5)) * 450} cy={110} r="4" fill="#0284c7" />
              <text
                x={100 + (2.5 / (targetDevers + 2.5)) * 450}
                y={98}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#0369a1"
              >
                Dévers nul (point singulier)
              </text>

              {/* Bord intérieur */}
              <path
                d={`M 50 ${110 + 2.5 * 10} L 100 ${110 + 2.5 * 10} L 550 ${110 + targetDevers * 10} L 630 ${110 + targetDevers * 10}`}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />

              <text x="560" y={110 - targetDevers * 10 - 6} fontSize="10" fill="#0284c7" fontWeight="bold">
                Bord extérieur (+{targetDevers.toFixed(1)}%)
              </text>
              <text x="560" y={110 + targetDevers * 10 + 12} fontSize="10" fill="#64748b">
                Bord intérieur (-{targetDevers.toFixed(1)}%)
              </text>
            </svg>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed border border-slate-100">
            <strong>Règle de sécurité hydraulique (p.47) :</strong> Dans la zone de dévers nul (passage à 0%), une pente résultante minimale d'au moins <strong>1 %</strong> (ou 0,5% en cas de contrainte sévère) doit impérativement être assurée pour éviter l'aquaplanage et la stagnation d'eau par ruissellement gravitaire.
          </div>
        </div>
      )}

      {/* Tab 2: Clothoide Curvature */}
      {activeTab === 'clothoide' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Diagramme de Variation de Courbure 1/R
            </h2>
            <span className="text-xs font-mono text-indigo-900">
              Courbure maximale = {(1 / clothoideNormal.radiusR).toFixed(5)} m⁻¹
            </span>
          </div>

          <div className="overflow-x-auto py-4">
            <svg width="650" height="200" viewBox="0 0 650 200" className="mx-auto block text-xs">
              <line x1="60" y1="160" x2="580" y2="160" stroke="#94a3b8" strokeWidth="1" />
              <line x1="60" y1="160" x2="60" y2="30" stroke="#94a3b8" strokeWidth="1" />

              <text x="50" y="163" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">0</text>
              <text x="50" y="45" textAnchor="end" fontSize="10" fill="#4f46e5" fontFamily="monospace">1/R</text>

              {/* Linear slope of curvature */}
              <line x1="60" y1="160" x2="400" y2="40" stroke="#4f46e5" strokeWidth="3" />
              {/* Circular arc segment */}
              <line x1="400" y1="40" x2="580" y2="40" stroke="#4f46e5" strokeWidth="3" />

              <circle cx="60" cy="160" r="4" fill="#4f46e5" />
              <circle cx="400" cy="40" r="4" fill="#4f46e5" />

              <line x1="400" y1="40" x2="400" y2="160" stroke="#cbd5e1" strokeDasharray="3 3" />
              <text x="400" y="176" textAnchor="middle" fontSize="10" fill="#4f46e5" fontWeight="bold">
                Fin Clothoïde (s = {L.toFixed(1)} m)
              </text>
              <text x="230" y="176" textAnchor="middle" fontSize="10" fill="#64748b">
                Transition progressive
              </text>
              <text x="490" y="30" textAnchor="middle" fontSize="10" fill="#4f46e5" fontWeight="bold">
                Arc Circulaire Constant (R = {clothoideNormal.radiusR} m)
              </text>
            </svg>
          </div>

          <p className="text-xs text-slate-600">
            Équation fondamentale d'Euler : A² = R · L ⟹ A = {Math.sqrt(clothoideNormal.radiusR * L).toFixed(2)} m.
          </p>
        </div>
      )}

      {/* Tab 3: Cross Section */}
      {activeTab === 'cross-section' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Schéma Général du Profil en Travers Type
          </h2>
          <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-700">
            <p>
              Pour modifier la composition modulaire (voies, accotements, bermes, TPC), ouvrez le module <strong>12. Profil en travers</strong> dans la navigation latérale.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Profil en Long */}
      {activeTab === 'profil-long' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Ligne Rouge Altimétrique
          </h2>
          <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-700">
            <p>
              Consultez le module <strong>11. Profil en long</strong> pour paramétrer les rampes, pentes et paraboles saillantes / rentrantes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
