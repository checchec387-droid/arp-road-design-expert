import React, { useState } from 'react';
import { FullProjectState } from '../../utils/storage';
import {
  calculateDeversNormal,
  calculateClothoideNormal,
  calculateDeversReliefDifficile,
  calculateClothoideReliefDifficile,
  calculateSurlargeurLacet,
  calculateLargeurRoulable,
  runGlobalProjectAudit
} from '../../utils/arpCalculations';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, CheckCircle2, Download, Filter } from 'lucide-react';
import { exportTableToCsv } from '../../utils/storage';

interface Props {
  projectState: FullProjectState;
  setActiveModule: (m: string) => void;
}

export const GlobalComplianceModule: React.FC<Props> = ({
  projectState,
  setActiveModule
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const { metadata, deversNormal, deversRD, clothoideNormal, clothoideRD, surlargeur, largeurRoulable, traceEnPlan, profilEnLong } = projectState;

  const resDeversNormal = calculateDeversNormal(deversNormal);
  const resDeversRD = calculateDeversReliefDifficile(deversRD);
  const resClothNormal = calculateClothoideNormal(clothoideNormal);
  const resClothRD = calculateClothoideReliefDifficile(clothoideRD);
  const resSurlargeur = calculateSurlargeurLacet(surlargeur);
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
    clothoideRDLength: clothoideRD.proposedReducedLength,
    minShiftRDLength: resClothRD.minShiftLength,
    tmja: metadata.tmja,
    plDaily: metadata.plDaily,
    traceElements: traceEnPlan.elements,
    profilElements: profilEnLong.elements
  });

  const criticalCount = alerts.filter(a => a.level === 'CRITIQUE').length;
  const majorCount = alerts.filter(a => a.level === 'MAJEUR').length;
  const warningCount = alerts.filter(a => a.level === 'AVERTISSEMENT').length;

  const filteredAlerts = alerts.filter(a => {
    if (filterLevel === 'ALL') return true;
    return a.level === filterLevel;
  });

  const handleExportCsv = () => {
    const headers = ['Niveau', 'Module', 'Titre de l’anomalie', 'Description', 'Préconisation technique', 'Référence ARP'];
    const rows = alerts.map(a => [
      a.level,
      a.module,
      a.title,
      a.message,
      a.remedy,
      a.ruleCitation
    ]);
    exportTableToCsv(`Audit_Conformite_ARP_${metadata.dossierNumber}`, headers, rows);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-800 mb-1">
            <span>Audit Réglementaire Général · Guide Cerema ARP (Août 2022)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-sky-900" />
            <span>Contrôle Global du Projet & Vérifications de Conformité</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Détection automatique multi-modules des incohérences, ruptures de normes géométriques et conditions d'application.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter l'Audit (CSV)</span>
        </button>
      </div>

      {/* Audit Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 uppercase tracking-wider block">Total Points Contrôlés</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            24 critères
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Sur 6 modules techniques</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-rose-600 uppercase tracking-wider font-semibold block">Anomalies Critiques</span>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
            {criticalCount}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Violation de seuil impératif</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-amber-600 uppercase tracking-wider font-semibold block">Écarts Majeurs</span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {majorCount}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Dépassement de recommandation</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-600 uppercase tracking-wider block">Points de Vigilance</span>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
            {warningCount}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">À documenter dans l'étude</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <span className="text-slate-500 flex items-center gap-1 font-medium mr-2">
          <Filter className="w-3.5 h-3.5" /> Filtrer :
        </span>
        {[
          { id: 'ALL', label: `Toutes les alertes (${alerts.length})` },
          { id: 'CRITIQUE', label: `Critiques (${criticalCount})` },
          { id: 'MAJEUR', label: `Majeures (${majorCount})` },
          { id: 'AVERTISSEMENT', label: `Avertissements (${warningCount})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterLevel(tab.id)}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterLevel === tab.id
                ? 'bg-sky-900 text-white font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Detailed List */}
      {filteredAlerts.length === 0 ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Conformité Globale Validée
          </h2>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            Aucun problème détecté pour ce filtre. L'ensemble des paramètres du projet est en accord avec les seuils vérifiés du Guide ARP du Cerema (2022).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alt => (
            <div
              key={alt.id}
              className={`bg-white border rounded-xl p-5 shadow-xs space-y-3 ${
                alt.level === 'CRITIQUE'
                  ? 'border-rose-200'
                  : alt.level === 'MAJEUR'
                  ? 'border-amber-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    alt.level === 'CRITIQUE'
                      ? 'bg-rose-100 text-rose-700'
                      : alt.level === 'MAJEUR'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {alt.module}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        alt.level === 'CRITIQUE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : alt.level === 'MAJEUR'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        {alt.level}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {alt.title}
                    </h3>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="font-mono text-xs text-slate-500 block">
                    {alt.ruleCitation}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed pl-11">
                {alt.message}
              </p>

              <div className="pl-11 pt-2 border-t border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-sky-950 font-medium">
                  <span className="text-slate-500 font-normal">Action recommandée : </span>
                  {alt.remedy}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
