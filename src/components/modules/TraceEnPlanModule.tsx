import React, { useState } from 'react';
import { TraceEnPlanElement, RoadCategory } from '../../types/arp';
import { Route, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight, Eye } from 'lucide-react';

interface Props {
  category: RoadCategory;
  isInterurbaine110: boolean;
  data: {
    v85Kmh: number;
    elements: TraceEnPlanElement[];
  };
  onChange: (d: { v85Kmh: number; elements: TraceEnPlanElement[] }) => void;
}

export const TraceEnPlanModule: React.FC<Props> = ({
  category,
  isInterurbaine110,
  data,
  onChange
}) => {
  const Rdn = category === 'R1' ? (isInterurbaine110 ? 650 : 400) : 400;
  const Rm = category === 'R1' ? (isInterurbaine110 ? 400 : 240) : 125;
  const v85Ms = data.v85Kmh / 3.6;
  const minStraightDistSameDir = 3 * v85Ms; // 3 secondes à V85

  // Analysis of geometric sequence checks
  const sequenceChecks: {
    id: string;
    level: 'OK' | 'WARNING' | 'CRITICAL';
    title: string;
    details: string;
    ruleRef: string;
  }[] = [];

  const elements = data.elements;

  // Check 1: Progression of radii between successive curves
  for (let i = 0; i < elements.length - 1; i++) {
    const el1 = elements[i];
    const el2 = elements[i + 1];

    if (el1.type === 'COURBE' && el2.type === 'COURBE' && el1.radiusM && el2.radiusM) {
      const ratio = el1.radiusM / el2.radiusM;
      const requiresCheck = el1.radiusM < 1.5 * Rdn || el2.radiusM < 1.5 * Rdn;
      if (requiresCheck) {
        if (ratio <= 0.67 || ratio >= 1.5) {
          sequenceChecks.push({
            id: `prog-${i}`,
            level: 'CRITICAL',
            title: `Rupture de progressivité : Courbes ${i + 1} (${el1.radiusM} m) et ${i + 2} (${el2.radiusM} m)`,
            details: `Le rapport R/R' = ${ratio.toFixed(2)} est en dehors de la plage 0,67 < R/R' < 1,50. Risque de surprise dynamique de l’usager.`,
            ruleRef: 'Chapitre 4 §1.2, p. 57'
          });
        } else {
          sequenceChecks.push({
            id: `prog-${i}`,
            level: 'OK',
            title: `Progressivité conforme entre courbes ${i + 1} et ${i + 2}`,
            details: `Rapport R/R' = ${ratio.toFixed(2)} conforme à 0,67 < R/R' < 1,50.`,
            ruleRef: 'Chapitre 4 §1.2, p. 57'
          });
        }
      }
    }

    // Check 2: Minimum straight between curves of same direction
    if (el1.type === 'COURBE' && el2.type === 'ALIGNEMENT' && i + 2 < elements.length) {
      const el3 = elements[i + 2];
      if (el3.type === 'COURBE' && el1.direction === el3.direction) {
        if (el2.lengthM < minStraightDistSameDir) {
          sequenceChecks.push({
            id: `straight-${i}`,
            level: 'WARNING',
            title: `Alignement trop court entre deux courbes de même sens (${el2.lengthM} m)`,
            details: `L’alignement droit (${el2.lengthM} m) est inférieur au parcours pendant 3s à V85 (${minStraightDistSameDir.toFixed(0)} m à ${data.v85Kmh} km/h). Risque de configuration en ove ou en C (proscrites en Annexe E).`,
            ruleRef: 'Chapitre 4 §1.2, p. 58 & Annexe E'
          });
        }
      }
    }
  }

  // Check 3: Check individual curve radii vs Rm
  elements.forEach((el, idx) => {
    if (el.type === 'COURBE' && el.radiusM) {
      if (el.radiusM < Rm) {
        sequenceChecks.push({
          id: `rad-min-${idx}`,
          level: 'CRITICAL',
          title: `Élément ${idx + 1} : Rayon ${el.radiusM} m < Rm (${Rm} m)`,
          details: `Le rayon en plan est inférieur au minimum réglementaire pour la catégorie ${category}. Dérogation formelle ou reclassement requis.`,
          ruleRef: 'Tableau 10, p. 57'
        });
      }
    }
  });

  const handleAddElement = (type: 'ALIGNEMENT' | 'COURBE' | 'CLOTHOIDE') => {
    const lastEl = elements[elements.length - 1];
    const startPk = lastEl ? lastEl.cumulPkEnd : 0;
    const defLength = type === 'ALIGNEMENT' ? 300 : type === 'COURBE' ? 200 : 60;

    const newEl: TraceEnPlanElement = {
      id: `el-${Date.now()}`,
      type,
      lengthM: defLength,
      radiusM: type === 'COURBE' ? 350 : undefined,
      parameterA: type === 'CLOTHOIDE' ? 140 : undefined,
      direction: type === 'COURBE' ? 'DROITE' : undefined,
      cumulPkStart: startPk,
      cumulPkEnd: startPk + defLength
    };

    onChange({
      ...data,
      elements: [...elements, newEl]
    });
  };

  const handleRemoveElement = (id: string) => {
    const filtered = elements.filter(e => e.id !== id);
    // Recalculate PKs
    let currentPk = 0;
    const reindexed = filtered.map(e => {
      const start = currentPk;
      currentPk += e.lengthM;
      return { ...e, cumulPkStart: start, cumulPkEnd: currentPk };
    });
    onChange({ ...data, elements: reindexed });
  };

  const handleUpdateElement = (id: string, updates: Partial<TraceEnPlanElement>) => {
    let currentPk = 0;
    const updated = elements.map(e => {
      if (e.id === id) {
        const mod = { ...e, ...updates };
        const start = currentPk;
        currentPk += mod.lengthM;
        return { ...mod, cumulPkStart: start, cumulPkEnd: currentPk };
      }
      const start = currentPk;
      currentPk += e.lengthM;
      return { ...e, cumulPkStart: start, cumulPkEnd: currentPk };
    });
    onChange({ ...data, elements: updated });
  };

  const totalLength = elements.reduce((acc, cur) => acc + cur.lengthM, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-teal-800 mb-1">
            <span>Guide ARP 2022 · Chapitre 4 §1 (p.56-59) & Annexe E (p.119)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Route className="w-5 h-5 text-teal-900" />
            <span>Module 1 — Vérification Géométrique du Tracé en Plan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vérification de continuité de courbure, de progressivité des rayons (0,67 &lt; R/R' &lt; 1,5), distances de transition et filtrage des courbes proscrites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Vitesse V85 retenue</span>
            <span className="text-xs font-mono font-bold text-slate-800">{data.v85Kmh} km/h ({(v85Ms).toFixed(1)} m/s)</span>
          </div>
          <div className="text-right border-l border-slate-200 pl-3">
            <span className="text-[11px] text-slate-500 block">Linéaire tracé total</span>
            <span className="text-xs font-mono font-bold text-teal-900">{totalLength} m</span>
          </div>
        </div>
      </div>

      {/* Alignment elements manager */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Séquence Géométrique des Éléments d’Axe
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddElement('ALIGNEMENT')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Alignement
            </button>
            <button
              onClick={() => handleAddElement('CLOTHOIDE')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Clothoïde
            </button>
            <button
              onClick={() => handleAddElement('COURBE')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-teal-900 hover:bg-teal-800 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Arc de cercle
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">N°</th>
                <th className="py-2.5 px-3 font-semibold">Type d'élément</th>
                <th className="py-2.5 px-3 font-semibold">Longueur L (m)</th>
                <th className="py-2.5 px-3 font-semibold">Rayon R (m)</th>
                <th className="py-2.5 px-3 font-semibold">Direction / Param.</th>
                <th className="py-2.5 px-3 font-semibold font-mono">PK Début - Fin</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {elements.map((el, idx) => (
                <tr key={el.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                      el.type === 'COURBE'
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : el.type === 'CLOTHOIDE'
                        ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {el.type}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={el.lengthM}
                      onChange={(e) => handleUpdateElement(el.id, { lengthM: parseFloat(e.target.value) || 10 })}
                      className="w-20 text-xs font-mono border border-slate-200 rounded px-2 py-1 text-slate-900"
                    />
                  </td>
                  <td className="py-2 px-3 font-mono">
                    {el.type === 'COURBE' ? (
                      <input
                        type="number"
                        min="20"
                        step="10"
                        value={el.radiusM ?? 300}
                        onChange={(e) => handleUpdateElement(el.id, { radiusM: parseFloat(e.target.value) || 100 })}
                        className="w-20 text-xs font-mono border border-slate-200 rounded px-2 py-1 text-slate-900"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {el.type === 'COURBE' ? (
                      <select
                        value={el.direction}
                        onChange={(e) => handleUpdateElement(el.id, { direction: e.target.value as 'DROITE' | 'GAUCHE' })}
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-800"
                      >
                        <option value="DROITE">Droite</option>
                        <option value="GAUCHE">Gauche</option>
                      </select>
                    ) : el.type === 'CLOTHOIDE' ? (
                      <span className="font-mono text-slate-600 text-xs">
                        A &approx; {Math.round(Math.sqrt((elements[idx + 1]?.radiusM || elements[idx - 1]?.radiusM || 300) * el.lengthM))} m
                      </span>
                    ) : (
                      <span className="text-slate-400">Alignement droit</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600 text-xs">
                    PK {el.cumulPkStart} m &rarr; PK {el.cumulPkEnd} m
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleRemoveElement(el.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Supprimer cet élément"
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

      {/* Geometric Checks & ARP Compliance Feedback */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Eye className="w-4 h-4 text-teal-800" />
          <span>Diagnostic Automatique des Règles d’Enchaînement du Tracé</span>
        </h2>

        {sequenceChecks.length === 0 ? (
          <div className="p-3.5 bg-slate-50 rounded-lg text-xs text-slate-600">
            Ajoutez au moins 2 courbes pour évaluer la progressivité des rayons et les transitions.
          </div>
        ) : (
          <div className="space-y-2">
            {sequenceChecks.map((chk) => (
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
                  {chk.level === 'OK' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : chk.level === 'WARNING' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{chk.title}</div>
                    <div className="mt-0.5 leading-relaxed">{chk.details}</div>
                  </div>
                </div>

                <span className="font-mono text-[10px] text-slate-500 shrink-0">{chk.ruleRef}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proscribed Curves Warning (Annexe E) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-2">
          <span>Rappels du Guide ARP — Configurations du tracé en plan à proscrire (Annexe E, p.117)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <span className="font-semibold text-rose-800 block">1. Courbe en ove (interdite)</span>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              Raccordement par clothoïde de deux cercles intérieurs sans être concentriques.
            </span>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <span className="font-semibold text-rose-800 block">2. Courbe à sommet (interdite)</span>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              Courbe formée exclusivement de deux clothoïdes sans partie circulaire (l'arc circulaire doit représenter au moins 1/5 du développement total).
            </span>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <span className="font-semibold text-rose-800 block">3. Courbe en C (interdite)</span>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              Deux clothoïdes de même concavité connectées raccordant deux cercles sécants ou extérieurs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
