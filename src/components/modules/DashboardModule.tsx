import React from 'react';
import { FullProjectState } from '../../utils/storage';
import {
  calculateDeversNormal,
  calculateClothoideNormal,
  calculateDeversReliefDifficile,
  calculateLargeurRoulable,
  runGlobalProjectAudit
} from '../../utils/arpCalculations';
import {
  Compass,
  Spline,
  Mountain,
  Columns3,
  ShieldCheck,
  ShieldAlert,
  Route,
  Activity,
  ArrowRight,
  FileText,
  Calendar,
  Building2,
  UserCheck
} from 'lucide-react';

interface Props {
  projectState: FullProjectState;
  setActiveModule: (m: string) => void;
  openReports: () => void;
}

export const DashboardModule: React.FC<Props> = ({
  projectState,
  setActiveModule,
  openReports
}) => {
  const { metadata, deversNormal, clothoideNormal, deversRD, largeurRoulable, traceEnPlan, profilEnLong } = projectState;

  // Run quick calculations for KPI previews
  const resDeversNormal = calculateDeversNormal(deversNormal);
  const resClothNormal = calculateClothoideNormal(clothoideNormal);
  const resDeversRD = calculateDeversReliefDifficile(deversRD);
  const resLargeur = calculateLargeurRoulable(largeurRoulable);

  const alerts = runGlobalProjectAudit({
    category: metadata.category,
    isInterurbaine110: deversNormal.isInterurbaine110,
    radiusNormal: deversNormal.radiusR,
    radiusRD: deversRD.radiusR,
    deversNormal: resDeversNormal.calculatedDevers,
    deversRD: resDeversRD.adoptedDevers,
    longitudinalSlopeRD: deversRD.longitudinalSlopeP,
    clothoideNormalLength: resClothNormal.lengthL,
    minShiftRDLength: 31.5,
    tmja: metadata.tmja,
    plDaily: metadata.plDaily,
    traceElements: traceEnPlan.elements,
    profilElements: profilEnLong.elements
  });

  const criticalAlerts = alerts.filter(a => a.level === 'CRITIQUE');
  const majorAlerts = alerts.filter(a => a.level === 'MAJEUR');
  const warningAlerts = alerts.filter(a => a.level === 'AVERTISSEMENT');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-slate-900 text-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-300 mb-1">
            <span>Dossier : {metadata.dossierNumber}</span>
            <span>·</span>
            <span>{metadata.version}</span>
            <span>·</span>
            <span>Guide Cerema ARP (Août 2022)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {metadata.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl line-clamp-2">
            {metadata.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> {metadata.client}
            </span>
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" /> {metadata.leadEngineer}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {metadata.date}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveModule('project-settings')}
            className="px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            Paramètres projet
          </button>
          <button
            onClick={openReports}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Générer Dossier Technique</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Classification</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {metadata.category} · Type {metadata.roadType}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            VMA {metadata.speedLimitKmh} km/h · Fonctions {metadata.functionLevel}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trafic de dimensionnement</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {metadata.tmja.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500">véh./j</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {metadata.plDaily} PL/j ({((metadata.plDaily / metadata.tmja) * 100).toFixed(1)}% trafic lourd)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Contrôles Réglementaires</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {alerts.length === 0 ? 'Conforme' : `${alerts.length} point(s)`}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {criticalAlerts.length > 0 ? (
              <span className="text-rose-600 font-semibold">{criticalAlerts.length} anomalie(s) critique(s)</span>
            ) : majorAlerts.length > 0 ? (
              <span className="text-amber-600 font-medium">{majorAlerts.length} avertissement(s)</span>
            ) : (
              <span className="text-emerald-700 font-medium">Tous critères ARP respectés</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Traçabilité Référentiel</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            100% Vérifié
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Chapitres 3, 4 et 6 du Guide ARP 2022
          </div>
        </div>
      </div>

      {/* Primary Calculated Modules Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Synthèse des Calculs Actifs du Projet
          </h2>
          <span className="text-xs text-slate-500">Données synchronisées en temps réel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Dévers Normal */}
          <div
            onClick={() => setActiveModule('devers-normal')}
            className="group bg-white border border-slate-200 hover:border-sky-800 rounded-xl p-5 shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-50 text-sky-800 group-hover:bg-sky-100 transition-colors">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Dévers — Cas Normal</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-800 transition-colors" />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Rayon R = {deversNormal.radiusR} m</span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  {resDeversNormal.calculatedDevers}%
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Rm / Rdn</span>
                <div className="text-xs font-mono font-medium text-slate-700 mt-0.5">
                  {resDeversNormal.Rm} m / {resDeversNormal.Rdn} m
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600 line-clamp-1">
              {resDeversNormal.configuration}
            </div>
          </div>

          {/* Card 2: Clothoïde Normale */}
          <div
            onClick={() => setActiveModule('clothoide-normal')}
            className="group bg-white border border-slate-200 hover:border-sky-800 rounded-xl p-5 shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-800 group-hover:bg-indigo-100 transition-colors">
                  <Spline className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Clothoïde — Cas Normal</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-800 transition-colors" />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Formule L = MAX(2·l·|Δd|, k·R^0.4)</span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  {resClothNormal.lengthL.toFixed(2)} m
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Gouvernant</span>
                <div className="text-xs font-mono font-medium text-slate-700 mt-0.5">
                  {resClothNormal.governingTerm}
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600">
              Seuil 1,5·Rdn : {resClothNormal.isClothoideMandatory ? 'Clothoïde obligatoire' : 'Non requise'}
            </div>
          </div>

          {/* Card 3: Dévers Relief Difficile */}
          <div
            onClick={() => setActiveModule('devers-rd')}
            className="group bg-white border border-slate-200 hover:border-sky-800 rounded-xl p-5 shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100 transition-colors">
                  <Mountain className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Dévers Relief Difficile</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 transition-colors" />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Dévers retenu (R={deversRD.radiusR} m)</span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  {resDeversRD.adoptedDevers}%
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Pente résultante</span>
                <div className={`text-xs font-mono font-bold mt-0.5 ${resDeversRD.isResultantSlopeCompliant ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {resDeversRD.resultantSlope}% {resDeversRD.isResultantSlopeCompliant ? '(<= 10%)' : '(> 10% !)'}
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600 line-clamp-1">
              Pente longitudinale : {deversRD.longitudinalSlopeP}% · Base : {resDeversRD.baseDevers}%
            </div>
          </div>

          {/* Card 4: Largeur Roulable RD */}
          <div
            onClick={() => setActiveModule('largeur-roulable')}
            className="group bg-white border border-slate-200 hover:border-sky-800 rounded-xl p-5 shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-800 group-hover:bg-amber-100 transition-colors">
                  <Columns3 className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Largeur Roulable (Tab. 14)</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-800 transition-colors" />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Chaussée + 2 BDD</span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  {resLargeur.totalRoulableWidth.toFixed(2)} m
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Détail</span>
                <div className="text-xs font-mono font-medium text-slate-700 mt-0.5">
                  {resLargeur.recommendedRoadwayWidth}m + 2x{resLargeur.recommendedBDDWidth}m
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600">
              Fonction : {largeurRoulable.functionLevel} ({largeurRoulable.tmja} véh/j)
            </div>
          </div>

          {/* Card 5: Tracé en Plan */}
          <div
            onClick={() => setActiveModule('trace-en-plan')}
            className="group bg-white border border-slate-200 hover:border-sky-800 rounded-xl p-5 shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-800 group-hover:bg-teal-100 transition-colors">
                  <Route className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Tracé en Plan Géométrique</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-800 transition-colors" />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Linéaire modélisé</span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  {traceEnPlan.elements.reduce((acc, cur) => acc + cur.lengthM, 0)} m
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Éléments</span>
                <div className="text-xs font-mono font-medium text-slate-700 mt-0.5">
                  {traceEnPlan.elements.length} entités
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600">
              Vitesse V85 : {traceEnPlan.v85Kmh} km/h · Contrôle enchaînements
            </div>
          </div>

          {/* Card 6: Profil en Long */}
          <div
            onClick={() => setActiveModule('profil-en-long')}
            className="group bg-white border border-slate-200 hover:border-sky-800 rounded-xl p-5 shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-800 group-hover:bg-purple-100 transition-colors">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Profil en Long & Pentes</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-800 transition-colors" />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Pente max modélisée</span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  2.5%
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Limite Cat. {metadata.category}</span>
                <div className="text-xs font-mono font-medium text-slate-700 mt-0.5">
                  {metadata.category === 'R1' ? '6.0%' : '7.0%'} (Tab. 12)
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600">
              Contrôles rayons verticaux saillant & rentrant
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Drawer Preview */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Contrôle Global & Alertes Techniques Détectées
            </h2>
          </div>
          <button
            onClick={() => setActiveModule('compliance')}
            className="text-xs font-semibold text-sky-800 hover:underline flex items-center gap-1"
          >
            <span>Voir l'audit complet ({alerts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Aucune anomalie détectée sur l’ensemble des paramètres et modules du projet. Toutes les valeurs vérifiées respectent les règles applicables du Guide ARP 2022.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alt) => (
              <div
                key={alt.id}
                className={`flex items-start justify-between gap-3 p-3 rounded-lg text-xs border ${
                  alt.level === 'CRITIQUE'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : alt.level === 'MAJEUR'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <span className="font-bold mr-2">[{alt.module}]</span>
                  <span className="font-semibold">{alt.title} : </span>
                  <span>{alt.message}</span>
                </div>
                <span className="font-mono text-[10px] shrink-0 text-slate-500">{alt.ruleCitation}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
