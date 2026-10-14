import React, { useState } from 'react';
import { ProfilEnLongElement, RoadCategory } from '../../types/arp';
import { Activity, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldAlert, TrendingUp } from 'lucide-react';

interface Props {
  category: RoadCategory;
  isInterurbaine110: boolean;
  data: {
    v85Kmh: number;
    elements: ProfilEnLongElement[];
  };
  onChange: (d: { v85Kmh: number; elements: ProfilEnLongElement[] }) => void;
  radiusHorizontalContext?: number; // Rh du tracé en plan pour le contrôle Rv > 6 Rh
}

export const ProfilEnLongModule: React.FC<Props> = ({
  category,
  isInterurbaine110,
  data,
  onChange,
  radiusHorizontalContext = 300
}) => {
  const maxDeclivite = category === 'R1' ? 6.0 : 7.0;
  const minSaillant = category === 'R1' ? (isInterurbaine110 ? 5200 : 3100) : 1300;
  const minRentrant = category === 'R1' ? (isInterurbaine110 ? 3000 : 2100) : 1300;

  const elements = data.elements;

  const checks: {
    id: string;
    level: 'OK' | 'WARNING' | 'CRITICAL';
    title: string;
    details: string;
    ruleRef: string;
  }[] = [];

  // Check 1: Declivity limits
  elements.forEach((el, idx) => {
    if (el.type === 'DECLIVITE' && el.slopePercent !== undefined) {
      const absSlope = Math.abs(el.slopePercent);
      if (absSlope > maxDeclivite) {
        checks.push({
          id: `dec-${idx}`,
          level: 'CRITICAL',
          title: `Élément ${idx + 1} : Déclivité ${absSlope}% > Seuil admissible (${maxDeclivite}%)`,
          details: `La rampe/pente dépasse la déclivité maximale autorisée par le Tableau 12 pour la catégorie ${category}.`,
          ruleRef: 'Tableau 12, p. 60'
        });
      } else if (absSlope > 6.0 && category === 'R2') {
        checks.push({
          id: `dec-warn-${idx}`,
          level: 'WARNING',
          title: `Élément ${idx + 1} : Déclivité ${absSlope}% comprise entre 6% et 7%`,
          details: 'Le guide ARP précise qu’une déclivité > 6% n’est à utiliser qu’en cas de stricte nécessité topographique.',
          ruleRef: 'Tableau 12 note 101, p. 60'
        });
      }
    }

    if (el.type === 'RACCORDEMENT_SAILLANT' && el.verticalRadiusM !== undefined) {
      if (el.verticalRadiusM < minSaillant) {
        checks.push({
          id: `sail-${idx}`,
          level: 'CRITICAL',
          title: `Élément ${idx + 1} : Rayon en angle saillant ${el.verticalRadiusM} m < ${minSaillant} m`,
          details: `Rayon saillant insuffisant au regard du Tableau 12 (catégorie ${category}). Risque de perte de visibilité sur obstacle ou sur virage.`,
          ruleRef: 'Tableau 12, p. 60'
        });
      }
      // Coordination Rv > 6 Rh
      if (radiusHorizontalContext < 1500 && el.verticalRadiusM <= 6 * radiusHorizontalContext) {
        checks.push({
          id: `coord-sail-${idx}`,
          level: 'WARNING',
          title: `Coordination Tracé/Profil : Rv (${el.verticalRadiusM} m) <= 6 · Rh (${6 * radiusHorizontalContext} m)`,
          details: `Pour Rh = ${radiusHorizontalContext} m (< 1500 m), le ratio recommandé est Rv > 6 · Rh. Risque de déformation de la perception visuelle du tracé.`,
          ruleRef: 'Chapitre 4 §3, p. 61'
        });
      }
    }

    if (el.type === 'RACCORDEMENT_RENTRANT' && el.verticalRadiusM !== undefined) {
      if (el.verticalRadiusM < minRentrant) {
        checks.push({
          id: `rent-${idx}`,
          level: 'CRITICAL',
          title: `Élément ${idx + 1} : Rayon en angle rentrant ${el.verticalRadiusM} m < ${minRentrant} m`,
          details: `Rayon rentrant insuffisant pour le confort vertical et l'éclairage de nuit par feux de croisement.`,
          ruleRef: 'Tableau 12, p. 60'
        });
      }
    }
  });

  const handleAddElement = (type: ProfilEnLongElement['type']) => {
    const lastEl = elements[elements.length - 1];
    const startPk = lastEl ? lastEl.cumulPkEnd : 0;
    const startZ = lastEl ? lastEl.endZ : 100.0;
    const defLen = type === 'DECLIVITE' ? 300 : 150;
    const endZ = type === 'DECLIVITE' ? startZ + (defLen * 0.02) : startZ + 1.0;

    const newEl: ProfilEnLongElement = {
      id: `pl-${Date.now()}`,
      type,
      lengthM: defLen,
      slopePercent: type === 'DECLIVITE' ? 2.0 : undefined,
      verticalRadiusM: type === 'RACCORDEMENT_SAILLANT' ? 3500 : type === 'RACCORDEMENT_RENTRANT' ? 2500 : undefined,
      startZ,
      endZ,
      cumulPkStart: startPk,
      cumulPkEnd: startPk + defLen
    };

    onChange({
      ...data,
      elements: [...elements, newEl]
    });
  };

  const handleRemoveElement = (id: string) => {
    const filtered = elements.filter(e => e.id !== id);
    onChange({ ...data, elements: filtered });
  };

  const handleUpdateElement = (id: string, updates: Partial<ProfilEnLongElement>) => {
    const updated = elements.map(e => e.id === id ? { ...e, ...updates } : e);
    onChange({ ...data, elements: updated });
  };

  // SVG profile graphic
  const totalPk = elements.reduce((acc, cur) => Math.max(acc, cur.cumulPkEnd), 1000);
  const minZ = Math.min(...elements.map(e => Math.min(e.startZ, e.endZ))) - 2;
  const maxZ = Math.max(...elements.map(e => Math.max(e.startZ, e.endZ))) + 4;
  const rangeZ = Math.max(10, maxZ - minZ);

  const svgW = 600;
  const svgH = 180;
  const pad = { top: 20, right: 30, bottom: 30, left: 45 };
  const pW = svgW - pad.left - pad.right;
  const pH = svgH - pad.top - pad.bottom;

  const getX = (pk: number) => pad.left + (pk / totalPk) * pW;
  const getY = (z: number) => pad.top + pH - ((z - minZ) / rangeZ) * pH;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-800 mb-1">
            <span>Guide ARP 2022 · Chapitre 4 §2 (Tableau 12, p.60) & §3 (p.61)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-purple-900" />
            <span>Module 2 — Profil en Long & Raccordements Verticaux</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Modélisation des rampes, pentes et paraboles saillantes / rentrantes selon les seuils du Tableau 12 et coordination Rv &gt; 6·Rh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddElement('DECLIVITE')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Déclivité
          </button>
          <button
            onClick={() => handleAddElement('RACCORDEMENT_SAILLANT')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-purple-900 hover:bg-purple-800 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Parabole Saillante
          </button>
          <button
            onClick={() => handleAddElement('RACCORDEMENT_RENTRANT')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-purple-900 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Parabole Rentrante
          </button>
        </div>
      </div>

      {/* Thresholds banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs">
        <div className="p-3 bg-slate-50 rounded-lg">
          <span className="text-slate-500 block">Déclivité maximale (p_max)</span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-0.5">{maxDeclivite.toFixed(1)} %</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Catégorie {category} (Tableau 12)</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <span className="text-slate-500 block">Rayon min angle saillant (bosse)</span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-0.5">{minSaillant.toLocaleString('fr-FR')} m</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Visibilité d'arrêt & confort</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <span className="text-slate-500 block">Rayon min angle rentrant (creux)</span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-0.5">{minRentrant.toLocaleString('fr-FR')} m</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Portée des phares & accélération</span>
        </div>
      </div>

      {/* SVG Elevation Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Ligne Rouge du Profil en Long (Altitudes Z vs Chaînage PK)
        </h3>
        <div className="overflow-x-auto">
          <svg width={svgW} height={svgH} className="mx-auto block text-xs">
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={svgH - pad.bottom} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={pad.left} y1={svgH - pad.bottom} x2={svgW - pad.right} y2={svgH - pad.bottom} stroke="#cbd5e1" strokeWidth="1" />

            {/* Grid labels */}
            <text x={pad.left - 6} y={getY(minZ + 2)} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
              {(minZ + 2).toFixed(1)}m
            </text>
            <text x={pad.left - 6} y={getY(maxZ - 2)} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
              {(maxZ - 2).toFixed(1)}m
            </text>
            <text x={pad.left} y={svgH - 8} fontSize="9" fill="#64748b" fontFamily="monospace">PK 0</text>
            <text x={svgW - pad.right} y={svgH - 8} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">PK {totalPk} m</text>

            {/* Draw elements */}
            {elements.map((el, i) => {
              const x1 = getX(el.cumulPkStart);
              const y1 = getY(el.startZ);
              const x2 = getX(el.cumulPkEnd);
              const y2 = getY(el.endZ);

              return (
                <g key={el.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={el.type === 'DECLIVITE' ? '#9333ea' : '#7e22ce'}
                    strokeWidth={el.type === 'DECLIVITE' ? '2.5' : '3.5'}
                    strokeDasharray={el.type !== 'DECLIVITE' ? '4 2' : undefined}
                  />
                  <circle cx={x1} cy={y1} r="3" fill="#9333ea" />
                  <circle cx={x2} cy={y2} r="3" fill="#9333ea" />
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#7e22ce" fontFamily="monospace">
                    {el.type === 'DECLIVITE' ? `${el.slopePercent}%` : `R=${el.verticalRadiusM}m`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Elements Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Éléments Altimétriques Saisis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">N°</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Longueur (m)</th>
                <th className="py-2.5 px-3 font-semibold">Pente (%)</th>
                <th className="py-2.5 px-3 font-semibold">Rayon Rv (m)</th>
                <th className="py-2.5 px-3 font-semibold font-mono">Z début - fin (m)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {elements.map((el, idx) => (
                <tr key={el.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-900 border border-purple-200">
                      {el.type === 'DECLIVITE' ? 'Déclivité' : el.type === 'RACCORDEMENT_SAILLANT' ? 'Parabole Saillante' : 'Parabole Rentrante'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={el.lengthM}
                      onChange={(e) => handleUpdateElement(el.id, { lengthM: parseFloat(e.target.value) || 10 })}
                      className="w-20 text-xs font-mono border border-slate-200 rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2 px-3 font-mono">
                    {el.type === 'DECLIVITE' ? (
                      <input
                        type="number"
                        step="0.1"
                        value={el.slopePercent ?? 0}
                        onChange={(e) => handleUpdateElement(el.id, { slopePercent: parseFloat(e.target.value) || 0 })}
                        className="w-20 text-xs font-mono border border-slate-200 rounded px-2 py-1"
                      />
                    ) : '—'}
                  </td>
                  <td className="py-2 px-3 font-mono">
                    {el.type !== 'DECLIVITE' ? (
                      <input
                        type="number"
                        step="100"
                        value={el.verticalRadiusM ?? 3000}
                        onChange={(e) => handleUpdateElement(el.id, { verticalRadiusM: parseFloat(e.target.value) || 1000 })}
                        className="w-24 text-xs font-mono border border-slate-200 rounded px-2 py-1"
                      />
                    ) : '—'}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">
                    {el.startZ.toFixed(2)} m &rarr; {el.endZ.toFixed(2)} m
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleRemoveElement(el.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance alerts */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Contrôles Réglementaires du Profil en Long (Tableau 12 & §3)
        </h3>
        {checks.map((chk) => (
          <div
            key={chk.id}
            className={`p-3 rounded-lg text-xs border flex items-start justify-between gap-3 ${
              chk.level === 'CRITICAL'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : chk.level === 'WARNING'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {chk.level === 'CRITICAL' ? (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold">{chk.title} : </span>
                <span>{chk.details}</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-slate-500 shrink-0">{chk.ruleRef}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
